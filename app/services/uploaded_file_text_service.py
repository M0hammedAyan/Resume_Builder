"""Utilities for extracting text from uploaded support documents."""

from __future__ import annotations

import io
import logging
import re
from pathlib import Path

from docx import Document
from pdfminer.high_level import extract_text as pdfminer_extract_text

try:
    import fitz
except Exception:  # noqa: BLE001
    fitz = None

try:
    import pdfplumber
except Exception:  # noqa: BLE001
    pdfplumber = None

try:
    import pytesseract
    from PIL import Image
except Exception:  # noqa: BLE001
    pytesseract = None
    Image = None

logger = logging.getLogger(__name__)


class UploadedFileTextService:
    """Extract text from PDF, DOCX, and image files for Gemini context."""

    IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}
    TABLE_HEADER_HINTS = {
        "degree",
        "institution",
        "college",
        "university",
        "cgpa",
        "gpa",
        "year",
        "duration",
        "title",
        "company",
        "project",
        "skills",
    }

    def extract_text(self, file_content: bytes, filename: str) -> str:
        ext = Path(filename).suffix.lower()

        if ext == ".pdf":
            return self._extract_pdf_text(file_content)
        if ext in {".docx", ".doc"}:
            return self._extract_docx_text(file_content)
        if ext in self.IMAGE_EXTENSIONS:
            return self._extract_image_text(file_content)
        if ext == ".txt":
            return file_content.decode("utf-8", errors="ignore")

        raise ValueError(f"Unsupported uploaded file format: {ext}")

    def _extract_pdf_text(self, file_content: bytes) -> str:
        parts: list[str] = []

        block_text = self._extract_pdf_blocks(file_content)
        if block_text.strip():
            parts.append(block_text)

        table_text = self._extract_pdf_tables(file_content)
        if table_text.strip():
            parts.append(table_text)

        with io.BytesIO(file_content) as buffer:
            miner_text = pdfminer_extract_text(buffer) or ""
        if miner_text.strip():
            parts.append(miner_text)

        combined = "\n\n".join(part for part in parts if part and part.strip())
        normalized = self._normalize_layout_text(combined)

        if len(normalized.strip()) >= 150:
            return normalized

        # OCR fallback for scanned certificates.
        ocr_text = self._ocr_pdf(file_content)
        return self._normalize_layout_text(normalized + "\n" + ocr_text)

    def _extract_pdf_blocks(self, file_content: bytes) -> str:
        if fitz is None:
            return ""

        page_texts: list[str] = []
        try:
            with fitz.open(stream=file_content, filetype="pdf") as document:  # type: ignore[union-attr]
                for page in document:
                    blocks = page.get_text("blocks")
                    sorted_blocks = sorted(blocks, key=lambda block: (block[1], block[0]))
                    page_lines = [str(block[4]).strip() for block in sorted_blocks if str(block[4]).strip()]
                    if page_lines:
                        page_texts.append("\n".join(page_lines))
        except Exception:  # noqa: BLE001
            logger.warning("Failed block-based extraction with PyMuPDF", exc_info=True)

        return "\n\n".join(page_texts)

    def _extract_pdf_tables(self, file_content: bytes) -> str:
        if pdfplumber is None:
            return ""

        rows: list[str] = []
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    for table in page.extract_tables() or []:
                        for row in table or []:
                            if not row:
                                continue
                            cells = [self._clean_inline(cell or "") for cell in row]
                            if any(cells):
                                rows.append("  ".join(cells))
        except Exception:  # noqa: BLE001
            logger.warning("Failed table extraction with pdfplumber", exc_info=True)

        return "\n".join(rows)

    def _clean_inline(self, text: str) -> str:
        return re.sub(r"\s+", " ", text.replace("\u00a0", " ")).strip()

    def _is_table_like(self, line: str) -> bool:
        if not line.strip():
            return False
        # Hidden-table signals: aligned columns or repeated separators.
        return ("  " in line and len(line.split()) > 3) or ("|" in line and len(line.split("|")) > 2)

    def _normalize_table_like_lines(self, text: str) -> str:
        normalized: list[str] = []
        current_headers: list[str] | None = None

        for raw_line in text.splitlines():
            line = raw_line.rstrip()
            if not line.strip():
                current_headers = None
                normalized.append("")
                continue

            if not self._is_table_like(line):
                normalized.append(self._clean_inline(line))
                continue

            cols = [self._clean_inline(part) for part in re.split(r"\s{2,}|\s*\|\s*", line) if self._clean_inline(part)]
            if len(cols) < 2:
                normalized.append(self._clean_inline(line))
                continue

            header_candidate = all(re.match(r"^[A-Za-z][A-Za-z /-]*$", col) for col in cols)
            if header_candidate and any(col.lower() in self.TABLE_HEADER_HINTS for col in cols):
                current_headers = cols
                normalized.append(" | ".join(cols))
                continue

            if current_headers and len(cols) >= 2 and abs(len(cols) - len(current_headers)) <= 1:
                pairs = []
                for idx, value in enumerate(cols[: len(current_headers)]):
                    header = current_headers[idx].strip().title()
                    pairs.append(f"{header}: {value}")
                normalized.append("; ".join(pairs))
                continue

            normalized.append("; ".join(cols))

        return "\n".join(normalized)

    def _normalize_layout_text(self, text: str) -> str:
        text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\t", " ")
        text = re.sub(r"[\x0b\x0c]", "\n", text)
        text = self._normalize_table_like_lines(text)

        cleaned_lines = []
        for line in text.splitlines():
            line = re.sub(r"[ ]{2,}", " ", line).strip()
            cleaned_lines.append(line)

        collapsed = "\n".join(cleaned_lines)
        collapsed = re.sub(r"\n{3,}", "\n\n", collapsed)
        return collapsed.strip()

    def _extract_docx_text(self, file_content: bytes) -> str:
        document = Document(io.BytesIO(file_content))
        paragraphs = [p.text.strip() for p in document.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)

    def _extract_image_text(self, file_content: bytes) -> str:
        if pytesseract is None or Image is None:
            logger.warning("pytesseract/Pillow not installed; skipping image OCR")
            return ""

        try:
            image = Image.open(io.BytesIO(file_content))
            return pytesseract.image_to_string(image)
        except Exception:  # noqa: BLE001
            logger.warning("Failed OCR on image upload", exc_info=True)
            return ""

    def _ocr_pdf(self, file_content: bytes) -> str:
        if fitz is None or pytesseract is None or Image is None:
            return ""

        text_parts: list[str] = []

        try:
            with fitz.open(stream=file_content, filetype="pdf") as document:  # type: ignore[union-attr]
                for page in document:
                    pix = page.get_pixmap(dpi=220)
                    image = Image.open(io.BytesIO(pix.tobytes("png")))
                    text_parts.append(pytesseract.image_to_string(image))
        except Exception:  # noqa: BLE001
            logger.warning("Failed OCR fallback on PDF upload", exc_info=True)

        return "\n".join(text_parts)

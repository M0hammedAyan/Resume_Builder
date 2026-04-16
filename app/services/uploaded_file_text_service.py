"""Utilities for extracting text from uploaded support documents."""

from __future__ import annotations

import io
import logging
from pathlib import Path

from docx import Document
from pdfminer.high_level import extract_text as pdfminer_extract_text

try:
    import fitz
except Exception:  # noqa: BLE001
    fitz = None

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
        with io.BytesIO(file_content) as buffer:
            text = pdfminer_extract_text(buffer) or ""

        if len(text.strip()) >= 150:
            return text

        # OCR fallback for scanned certificates.
        return text + "\n" + self._ocr_pdf(file_content)

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

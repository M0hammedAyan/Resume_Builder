from __future__ import annotations


class ATSCompatibilityChecker:
    """Check resume traits that commonly reduce ATS compatibility."""

    SAFE_FONT_HINTS = ("arial", "calibri", "times", "helvetica", "georgia", "cambria")

    def check(self, metadata: dict, structured_resume: dict) -> list[str]:
        issues: list[str] = []

        if metadata.get("pdf_has_tables"):
            issues.append("Resume appears to contain tables. ATS parsers may miss table-embedded content.")

        if metadata.get("pdf_has_images"):
            issues.append("Resume includes images, which ATS tools often ignore.")

        fonts = [font.lower() for font in metadata.get("pdf_fonts", [])]
        if fonts and not all(any(hint in font for hint in self.SAFE_FONT_HINTS) for font in fonts):
            issues.append("Unusual font families detected; use standard fonts like Arial, Calibri, or Times New Roman.")

        missing_sections = [
            section
            for section in ("experience", "education", "skills")
            if not structured_resume.get(section)
        ]
        if missing_sections:
            issues.append(f"Missing key sections for ATS: {', '.join(missing_sections)}.")

        return issues

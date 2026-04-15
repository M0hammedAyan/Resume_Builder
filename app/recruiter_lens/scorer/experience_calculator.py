from __future__ import annotations

import calendar
import re
from datetime import date, datetime

from dateutil import parser as date_parser

RANGE_RE = re.compile(
    r"(?P<start>(?:[A-Za-z]{3,9}\s+)?\d{4})\s*(?:-|to|–|—)\s*(?P<end>present|current|now|(?:[A-Za-z]{3,9}\s+)?\d{4})",
    re.IGNORECASE,
)


class ExperienceCalculator:
    """Compute total experience years from extracted date ranges."""

    def total_years(self, experience_lines: list[str]) -> float:
        total_months = 0
        for line in experience_lines:
            for match in RANGE_RE.finditer(line):
                start = self._parse_to_date(match.group("start"), end_of_month=False)
                end = self._parse_to_date(match.group("end"), end_of_month=True)
                if start and end and end >= start:
                    months = (end.year - start.year) * 12 + (end.month - start.month) + 1
                    total_months += max(0, months)

        return round(total_months / 12.0, 2)

    def experience_match(self, resume_years: float, required_years: int) -> float:
        if required_years <= 0:
            return 100.0
        ratio = min(1.0, resume_years / required_years)
        return round(ratio * 100, 2)

    def _parse_to_date(self, text: str, end_of_month: bool) -> date | None:
        normalized = text.strip().lower()
        if normalized in {"present", "current", "now"}:
            return datetime.utcnow().date()

        try:
            dt = date_parser.parse(text, default=datetime(1900, 1, 1))
            if end_of_month:
                last_day = calendar.monthrange(dt.year, dt.month)[1]
                return date(dt.year, dt.month, last_day)
            return date(dt.year, dt.month, 1)
        except Exception:  # noqa: BLE001
            return None

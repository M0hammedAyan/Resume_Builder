from __future__ import annotations

from app.recruiter_lens import RecruiterLensPipeline


class RecruiterLensService:
    """Service wrapper for production-grade Recruiter Lens analysis."""

    _pipeline: RecruiterLensPipeline | None = None

    def __init__(self) -> None:
        if RecruiterLensService._pipeline is None:
            RecruiterLensService._pipeline = RecruiterLensPipeline()
        self.pipeline = RecruiterLensService._pipeline

    def analyze_resume(self, resume_bytes: bytes, filename: str, job_description: str) -> dict:
        return self.pipeline.analyze(
            resume_bytes=resume_bytes,
            filename=filename,
            job_description=job_description,
        )

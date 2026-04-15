from __future__ import annotations

from app.recruiter_lens.extractor import JobDescriptionExtractor, StructuredResumeExtractor
from app.recruiter_lens.extractor.preprocessor import preprocess_text
from app.recruiter_lens.feedback import ATSCompatibilityChecker, FeedbackEngine
from app.recruiter_lens.matcher import SemanticMatcher
from app.recruiter_lens.matcher.skill_normalizer import normalize_skills
from app.recruiter_lens.parser import DocumentParser
from app.recruiter_lens.scorer import ExperienceCalculator, ScoringEngine


class RecruiterLensPipeline:
    """End-to-end pipeline for resume-vs-JD recruiter analysis."""

    def __init__(self) -> None:
        self.parser = DocumentParser()
        self.resume_extractor = StructuredResumeExtractor()
        self.jd_extractor = JobDescriptionExtractor()
        self.matcher = SemanticMatcher(model_name="all-MiniLM-L6-v2")
        self.experience = ExperienceCalculator()
        self.scoring = ScoringEngine()
        self.ats_checker = ATSCompatibilityChecker()
        self.feedback = FeedbackEngine()

    def analyze(self, resume_bytes: bytes, filename: str, job_description: str) -> dict:
        parsed = self.parser.parse(resume_bytes, filename)

        structured_resume = self.resume_extractor.extract(parsed.text)
        jd_structured = self.jd_extractor.extract(job_description)

        resume_skills = normalize_skills(structured_resume.get("skills", []))
        required_skills = normalize_skills(jd_structured.get("required_skills", []))
        preferred_skills = normalize_skills(jd_structured.get("preferred_skills", []))

        hard_match, hard_pairs, missing_required = self.matcher.match_skills(resume_skills, required_skills)
        preferred_match, preferred_pairs, missing_preferred = self.matcher.match_skills(resume_skills, preferred_skills)

        context_similarity = self.matcher.keyword_context_similarity(
            preprocess_text(parsed.text),
            preprocess_text(job_description),
        )
        context_score = round(context_similarity * 100, 2)

        resume_years = self.experience.total_years(structured_resume.get("experience", []))
        experience_score = self.experience.experience_match(
            resume_years=resume_years,
            required_years=jd_structured.get("experience_required_years", 0),
        )

        final_score = self.scoring.final_score(
            hard_skills_match=hard_match,
            preferred_skills_match=preferred_match,
            experience_match=experience_score,
            context_match=context_score,
        )

        all_missing = list(dict.fromkeys(missing_required + missing_preferred))
        ats_issues = self.ats_checker.check(parsed.metadata, structured_resume)
        suggestions = self.feedback.build_feedback(
            missing_skills=all_missing,
            experience_lines=structured_resume.get("experience", []),
        )

        return {
            "score": final_score,
            "skill_match": hard_match,
            "preferred_skill_match": preferred_match,
            "experience_match": experience_score,
            "keyword_context_match": context_score,
            "missing_skills": all_missing,
            "suggestions": suggestions,
            "ats_issues": ats_issues,
            "structured_resume": structured_resume,
            "structured_jd": jd_structured,
            "match_details": {
                "required_pairs": hard_pairs,
                "preferred_pairs": preferred_pairs,
            },
            "metadata": {
                "parser_used": parsed.metadata.get("parser_used"),
                "ocr_used": parsed.metadata.get("ocr_used", False),
                "resume_experience_years": resume_years,
                "required_experience_years": jd_structured.get("experience_required_years", 0),
            },
        }

"""Service for parsing and analyzing uploaded resume files."""
import io
import re
from typing import Optional, TYPE_CHECKING
from pathlib import Path

if TYPE_CHECKING:
    from PyPDF2 import PdfReader
    from docx import Document

# Runtime imports with fallback
try:
    from PyPDF2 import PdfReader
    HAS_PDF = True
except (ImportError, ModuleNotFoundError):
    HAS_PDF = False
    PdfReader = None  # type: ignore

try:
    from docx import Document
    HAS_DOCX = True
except (ImportError, ModuleNotFoundError):
    HAS_DOCX = False
    Document = None  # type: ignore

class ResumeParsingService:
    """Service for parsing and analyzing uploaded resume files."""
    
    SECTION_KEYWORDS = {
        "experience": ["experience", "professional experience", "work experience", "employment"],
        "education": ["education", "academic", "degree", "certification"],
        "skills": ["skills", "technical skills", "technical competencies", "languages"],
        "projects": ["projects", "portfolio", "notable projects"],
        "summary": ["summary", "professional summary", "objective", "profile"],
    }
    
    def parse_uploaded_file(self, file_content: bytes, filename: str) -> dict:
        """
        Parse uploaded resume file (PDF, DOCX, or TXT).
        
        Args:
            file_content: Raw file bytes
            filename: Original filename with extension
            
        Returns:
            Dictionary with parsed resume content
        """
        file_ext = Path(filename).suffix.lower()
        
        if file_ext == ".pdf":
            raw_text = self._parse_pdf(file_content)
        elif file_ext in [".docx", ".doc"]:
            raw_text = self._parse_docx(file_content)
        elif file_ext == ".txt":
            raw_text = file_content.decode("utf-8", errors="ignore")
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        # Parse the text content
        parsed = self._parse_resume_text(raw_text)
        parsed["raw_text"] = raw_text
        
        return parsed
    
    def _parse_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file."""
        if not HAS_PDF:
            raise RuntimeError("PyPDF2 not available. Install with: pip install PyPDF2")
        
        try:
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
    
    def _parse_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file."""
        if not HAS_DOCX:
            raise RuntimeError("python-docx not available. Install with: pip install python-docx")
        
        try:
            docx_file = io.BytesIO(file_content)
            doc = Document(docx_file)
            text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
            return text
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")
    
    def _parse_resume_text(self, text: str) -> dict:
        """
        Parse resume text and extract sections.
        Uses pattern matching and optional Ollama for better extraction.
        """
        # Clean text
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        full_text = "\n".join(lines)
        
        # Try to extract contact info (name, email, phone)
        name = self._extract_name(lines)
        email = self._extract_email(full_text)
        phone = self._extract_phone(full_text)
        
        # Extract sections by keywords
        sections = self._extract_sections(full_text)
        
        return {
            "name": name,
            "email": email,
            "phone": phone,
            "summary": sections.get("summary", ""),
            "experience": sections.get("experience", []),
            "education": sections.get("education", []),
            "skills": sections.get("skills", []),
            "projects": sections.get("projects", []),
        }
    
    def _extract_name(self, lines: list[str]) -> Optional[str]:
        """Extract name from first non-empty line or use Ollama."""
        if lines and len(lines[0]) > 0 and len(lines[0]) < 100:
            first_line = lines[0]
            # Skip if it looks like a URL, email, or phone
            if "@" not in first_line and "http" not in first_line:
                # Remove common titles
                name = re.sub(r"(Resume|CV|Curriculum)", "", first_line, flags=re.IGNORECASE).strip()
                if name and len(name) > 2:
                    return name
        return None
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email address from text."""
        emails = re.findall(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        return emails[0] if emails else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text."""
        # Match various phone formats
        phones = re.findall(
            r"(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})",
            text
        )
        if phones:
            p = phones[0]
            return f"({p[0]}) {p[1]}-{p[2]}"
        return None
    
    def _extract_sections(self, text: str) -> dict:
        """Extract resume sections by finding keywords."""
        sections = {
            "summary": "",
            "experience": [],
            "education": [],
            "skills": [],
            "projects": [],
        }
        
        # Split into paragraphs
        paragraphs = text.split("\n\n")
        
        current_section = None
        section_content = []
        
        for para in paragraphs:
            para_lower = para.lower()
            
            # Check if this is a section header
            detected_section = self._detect_section(para_lower)
            
            if detected_section:
                # Save previous section
                if current_section and section_content:
                    sections[current_section] = self._format_section(
                        current_section, section_content
                    )
                
                current_section = detected_section
                section_content = []
            else:
                # Add to current section
                if current_section and para.strip():
                    section_content.append(para.strip())
        
        # Save last section
        if current_section and section_content:
            sections[current_section] = self._format_section(current_section, section_content)
        
        return sections
    
    def _detect_section(self, text: str) -> Optional[str]:
        """Detect what section a line header belongs to."""
        for section, keywords in self.SECTION_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    return section
        return None
    
    def _format_section(self, section_type: str, content: list[str]) -> list[str]:
        """Format section content into bullet points."""
        bullets = []
        
        if section_type == "skills":
            # Skills might be comma-separated
            for item in content:
                skills = [s.strip() for s in item.split(",") if s.strip()]
                bullets.extend(skills)
        else:
            # Other sections: use each paragraph/line as a bullet
            for item in content:
                lines = item.split("\n")
                for line in lines:
                    line = line.strip()
                    if line and len(line) > 5:  # Ignore very short lines
                        # Remove common bullet markers
                        line = re.sub(r"^[•\-\*]\s+", "", line)
                        if line:
                            bullets.append(line)
        
        return bullets


class ResumeAnalysisService:
    """Service for analyzing and suggesting improvements to resumes."""
    
    def analyze_and_improve(
        self,
        resume_content: dict,
        target_job_description: Optional[str] = None,
    ) -> dict:
        """
        Analyze resume and provide improvement suggestions.
        
        Args:
            resume_content: Parsed resume content
            target_job_description: Optional JD to tailor suggestions
            
        Returns:
            Analysis with suggestions
        """
        # Calculate overall score
        overall_score = self._calculate_resume_score(resume_content)
        
        # Identify strengths and areas for improvement
        strengths = self._identify_strengths(resume_content)
        improvements = self._identify_improvements(resume_content)
        
        # Generate specific suggestions
        suggestions = self._generate_suggestions(resume_content, target_job_description)
        
        # Create summary
        summary = self._create_summary(overall_score, strengths, improvements)
        
        return {
            "overall_score": overall_score,
            "strength_areas": strengths,
            "improvement_areas": improvements,
            "suggestions": suggestions,
            "summary": summary,
        }
    
    def _calculate_resume_score(self, resume: dict) -> float:
        """Calculate resume quality score (0-100)."""
        score = 0
        max_points = 100
        
        # Contact info (10 points)
        if resume.get("email"):
            score += 3
        if resume.get("phone"):
            score += 3
        if resume.get("name"):
            score += 4
        
        # Have content in each section (60 points)
        if resume.get("experience"):
            score += 20
        if resume.get("education"):
            score += 15
        if resume.get("skills"):
            score += 15
        if resume.get("projects"):
            score += 10
        
        # Quality indicators (30 points)
        exp_quality = sum(1 for e in resume.get("experience", []) if len(e) > 50) * 5
        score += min(exp_quality, 15)
        
        skills_count = len(resume.get("skills", []))
        score += min(skills_count, 15)
        
        return min(score, 100)
    
    def _identify_strengths(self, resume: dict) -> list[str]:
        """Identify resume strengths."""
        strengths = []
        
        if resume.get("experience") and len(resume["experience"]) >= 3:
            strengths.append("Strong work experience section with multiple entries")
        
        if resume.get("skills") and len(resume["skills"]) >= 10:
            strengths.append("Comprehensive skills list")
        
        if resume.get("education"):
            strengths.append("Includes education credentials")
        
        if resume.get("projects"):
            strengths.append("Highlights relevant projects")
        
        # Check for quantifiable achievements
        exp_bullets = resume.get("experience", [])
        quantifiable = sum(1 for e in exp_bullets if any(c.isdigit() for c in e))
        if quantifiable >= len(exp_bullets) * 0.5:
            strengths.append("Uses quantifiable metrics in achievements")
        
        return strengths or ["Resume has basic structure"]
    
    def _identify_improvements(self, resume: dict) -> list[str]:
        """Identify areas for improvement."""
        improvements = []
        
        if not resume.get("experience"):
            improvements.append("Add work experience section")
        elif len(resume["experience"]) < 3:
            improvements.append("Add more work experience entries")
        
        if not resume.get("skills"):
            improvements.append("Add technical skills section")
        elif len(resume["skills"]) < 5:
            improvements.append("Expand skills section with more relevant technologies")
        
        if not resume.get("education"):
            improvements.append("Add education section")
        
        if not resume.get("projects"):
            improvements.append("Add notable projects to showcase expertise")
        
        # Check for action verbs
        exp_text = " ".join(resume.get("experience", []))
        if exp_text and not any(
            verb in exp_text.lower()
            for verb in ["led", "developed", "implemented", "designed", "architected"]
        ):
            improvements.append("Use stronger action verbs in achievement descriptions")
        
        return improvements or ["Resume is well-structured"]
    
    def _generate_suggestions(
        self,
        resume: dict,
        target_job: Optional[str],
    ) -> list[dict]:
        """Generate specific improvement suggestions."""
        suggestions = []
        
        # Suggestion 1: Enhance experience with metrics
        if resume.get("experience"):
            for i, exp in enumerate(resume["experience"][:2]):
                if len(exp) < 100:
                    suggestions.append({
                        "section": "experience",
                        "current_bullet": exp,
                        "suggestion": f"Expand this bullet with more context and measurable impact. Example: '{exp} resulting in X% improvement' or 'Led a team of N engineers...'",
                        "reason": "Longer, quantified achievements are more impactful to recruiters",
                        "impact": "high",
                    })
        
        # Suggestion 2: Action verb improvement
        weak_verbs = ["worked", "helped", "did", "responsible for"]
        strong_verbs = ["led", "architected", "implemented", "designed", "optimized"]
        
        if resume.get("experience"):
            for exp in resume["experience"][:2]:
                if any(verb in exp.lower() for verb in weak_verbs):
                    suggestions.append({
                        "section": "experience",
                        "current_bullet": exp,
                        "suggestion": f"Replace weak verbs with action-oriented ones: {', '.join(strong_verbs[:3])}. Example: 'Architected...' instead of 'Worked on...'",
                        "reason": "Action verbs make achievements sound more impactful",
                        "impact": "high",
                    })
        
        # Suggestion 3: Add missing skills
        if target_job and len(resume.get("skills", [])) < 10:
            suggestions.append({
                "section": "skills",
                "suggestion": "Review the target job description and add relevant technical skills you possess",
                "reason": "Matching job description keywords improves ATS score and recruiter match",
                "impact": "high",
            })
        
        # Suggestion 4: Projects section
        if not resume.get("projects") or len(resume["projects"]) < 2:
            suggestions.append({
                "section": "projects",
                "suggestion": "Add 2-3 significant projects with technologies used and measurable outcomes",
                "reason": "Projects demonstrate practical experience and portfolio-worthy work",
                "impact": "medium",
            })
        
        # Suggestion 5: Professional summary
        if not resume.get("summary"):
            suggestions.append({
                "section": "experience",
                "suggestion": "Add a professional summary (2-3 lines) highlighting your key strengths and career focus",
                "reason": "Summary helps recruiters quickly understand your value proposition",
                "impact": "medium",
            })
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def _create_summary(self, score: float, strengths: list[str], improvements: list[str]) -> str:
        """Create a natural language summary of the analysis."""
        if score >= 80:
            summary = "Your resume is well-structured with strong fundamentals."
        elif score >= 60:
            summary = "Your resume covers the basics but has room for improvement."
        else:
            summary = "Your resume needs significant enhancement to stand out."
        
        if strengths:
            summary += f" Your key strengths include {', '.join(strengths[:2])}."
        
        if improvements:
            summary += f" To improve, consider {improvements[0]}."
        
        summary += " Use the suggestions below to make your resume more compelling to recruiters."
        
        return summary

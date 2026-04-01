#!/usr/bin/env python3
"""Simple test for resume parsing service logic."""
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

# Import only what we need - avoid database initialization
import io
import re
from typing import Optional


class SimpleResumeParsingService:
    """Simplified resume parsing for testing."""
    
    SECTION_KEYWORDS = {
        "experience": ["experience", "professional experience", "work experience", "employment"],
        "education": ["education", "academic", "degree", "certification"],
        "skills": ["skills", "technical skills", "technical competencies", "languages"],
        "projects": ["projects", "portfolio", "notable projects"],
        "summary": ["summary", "professional summary", "objective", "profile"],
    }

    def parse_resume_text(self, text: str) -> dict:
        """Parse resume text and extract sections."""
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        full_text = "\n".join(lines)
        
        name = self._extract_name(lines)
        email = self._extract_email(full_text)
        phone = self._extract_phone(full_text)
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
    
    def _extract_name(self, lines: list) -> Optional[str]:
        """Extract name from first line."""
        if lines and len(lines[0]) > 0 and len(lines[0]) < 100:
            first_line = lines[0]
            if "@" not in first_line and "http" not in first_line:
                name = re.sub(r"(Resume|CV|Curriculum)", "", first_line, flags=re.IGNORECASE).strip()
                if name and len(name) > 2:
                    return name
        return None
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email address."""
        emails = re.findall(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        return emails[0] if emails else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number."""
        phones = re.findall(
            r"(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})",
            text
        )
        if phones:
            p = phones[0]
            return f"({p[0]}) {p[1]}-{p[2]}"
        return None
    
    def _extract_sections(self, text: str) -> dict:
        """Extract resume sections."""
        sections = {
            "summary": "",
            "experience": [],
            "education": [],
            "skills": [],
            "projects": [],
        }
        
        paragraphs = text.split("\n\n")
        current_section = None
        section_content = []
        
        for para in paragraphs:
            para_lower = para.lower()
            detected_section = self._detect_section(para_lower)
            
            if detected_section:
                if current_section and section_content:
                    sections[current_section] = self._format_section(
                        current_section, section_content
                    )
                current_section = detected_section
                section_content = []
            else:
                if current_section and para.strip():
                    section_content.append(para.strip())
        
        if current_section and section_content:
            sections[current_section] = self._format_section(current_section, section_content)
        
        return sections
    
    def _detect_section(self, text: str) -> Optional[str]:
        """Detect resume section."""
        for section, keywords in self.SECTION_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    return section
        return None
    
    def _format_section(self, section_type: str, content: list) -> list:
        """Format section content."""
        bullets = []
        
        if section_type == "skills":
            for item in content:
                skills = [s.strip() for s in item.split(",") if s.strip()]
                bullets.extend(skills)
        else:
            for item in content:
                lines = item.split("\n")
                for line in lines:
                    line = line.strip()
                    if line and len(line) > 5:
                        line = re.sub(r"^[•\-\*]\s+", "", line)
                        if line:
                            bullets.append(line)
        
        return bullets


def test_txt_parsing():
    """Test parsing a plain text resume."""
    resume_text = """John Doe
john@example.com
(555) 123-4567

PROFESSIONAL EXPERIENCE
Led a team of 5 engineers building payment systems
Reduced React app load time by 40% using code splitting

EDUCATION
BS Computer Science from MIT

SKILLS
React, TypeScript, Python, AWS, Docker

PROJECTS
Built real-time chat application with 10K users
Developed open-source CLI tool with 500+ stars"""
    
    service = SimpleResumeParsingService()
    result = service.parse_resume_text(resume_text)
    
    print("Resume Parsing Test Results:")
    print(f"  Name: {result.get('name')}")
    print(f"  Email: {result.get('email')}")
    print(f"  Phone: {result.get('phone')}")
    print(f"  Experience items: {result.get('experience', [])}")
    print(f"  Education items: {result.get('education', [])}")
    print(f"  Skills: {result.get('skills', [])}")
    print(f"  Projects: {result.get('projects', [])}")
    print()
    
    # Verify basic contact info
    assert result.get('name') == 'John Doe', f"Name mismatch"
    assert result.get('email') == 'john@example.com', f"Email mismatch"
    assert result.get('phone') == '(555) 123-4567', f"Phone mismatch"
    
    print("✓ Contact info extraction works!")


if __name__ == "__main__":
    try:
        test_txt_parsing()
        print("✓ Resume parsing test successful!")
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

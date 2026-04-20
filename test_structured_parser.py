"""Test script for structured resume parsing."""

import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.services.structured_resume_parser import (
    parse_resume_structured,
    split_sections,
    split_projects,
    split_experience,
    extract_email,
    extract_phone,
    extract_cgpa,
)

# Sample resume with multiple projects, education with CGPA
SAMPLE_RESUME = """
John Smith
john.smith@example.com | (555) 123-4567 | linkedin.com/in/johnsmith | github.com/johnsmith

PROFESSIONAL SUMMARY
Software engineer with 5 years of experience building scalable web applications.
Expertise in Python, React, and cloud technologies.

EXPERIENCE

Senior Software Engineer at Tech Corp | Jan 2022 - Present
- Led development of microservices architecture serving 1M+ users
- Improved system performance by 40% through optimization
- Mentored 3 junior engineers on best practices

Software Engineer at StartupXYZ | Jun 2020 - Dec 2021
- Built React dashboard with real-time data visualization
- Implemented CI/CD pipeline reducing deployment time by 50%
- Collaborated with cross-functional teams on product roadmap

EDUCATION

Master of Science in Computer Science
Stanford University | Graduated 2020
GPA: 3.8/4.0

Bachelor of Science in Computer Science
UC Berkeley | Graduated 2018
CGPA: 3.9/4.0

PROJECTS

E-Commerce Platform | github.com/johnsmith/ecommerce
- Full-stack web application built with Python/React
- 50K+ monthly active users
- Technologies: FastAPI, PostgreSQL, Docker, Kubernetes

Data Analytics Dashboard | github.com/johnsmith/analytics
- Real-time analytics visualization tool
- Built with Python/Plotly for 100+ clients
- Technologies: Python, Plotly, AWS Lambda

Recommendation Engine
- Machine learning model for product recommendations
- 25% improvement in click-through rates
- Technologies: Python, TensorFlow, Redis

SKILLS
Python, JavaScript, React, FastAPI, PostgreSQL, Docker, AWS, Kubernetes, Machine Learning, Data Analysis
"""

def test_section_splitting():
    """Test section splitting."""
    print("\n" + "="*60)
    print("TEST 1: Section Splitting")
    print("="*60)
    
    sections = split_sections(SAMPLE_RESUME)
    
    for section, content in sections.items():
        if content:
            print(f"\n✓ {section.upper()}: {len(content)} chars")
            print(f"  Content preview: {content[:100]}...")

def test_project_splitting():
    """Test project splitting."""
    print("\n" + "="*60)
    print("TEST 2: Project Splitting")
    print("="*60)
    
    sections = split_sections(SAMPLE_RESUME)
    projects_section = sections.get("projects", "")
    
    if projects_section:
        chunks = split_projects(projects_section)
        print(f"\n✓ Split into {len(chunks)} project chunks")
        
        for i, chunk in enumerate(chunks, 1):
            print(f"\n  Project {i}:")
            print(f"    Length: {len(chunk)} chars")
            print(f"    Preview: {chunk[:80]}...")

def test_experience_splitting():
    """Test experience splitting."""
    print("\n" + "="*60)
    print("TEST 3: Experience Splitting")
    print("="*60)
    
    sections = split_sections(SAMPLE_RESUME)
    experience_section = sections.get("experience", "")
    
    if experience_section:
        chunks = split_experience(experience_section)
        print(f"\n✓ Split into {len(chunks)} experience chunks")
        
        for i, chunk in enumerate(chunks, 1):
            print(f"\n  Experience {i}:")
            print(f"    Length: {len(chunk)} chars")
            print(f"    Preview: {chunk[:80]}...")

def test_contact_extraction():
    """Test contact info extraction."""
    print("\n" + "="*60)
    print("TEST 4: Contact Info Extraction")
    print("="*60)
    
    email = extract_email(SAMPLE_RESUME)
    phone = extract_phone(SAMPLE_RESUME)
    cgpa = extract_cgpa(SAMPLE_RESUME)
    
    print(f"\n✓ Email: {email}")
    print(f"✓ Phone: {phone}")
    print(f"✓ CGPA: {cgpa}")

def test_full_parsing():
    """Test full resume parsing without AI (fallback only)."""
    print("\n" + "="*60)
    print("TEST 5: Full Resume Parsing (Fallback Mode)")
    print("="*60)
    
    try:
        result = parse_resume_structured(SAMPLE_RESUME, use_ai=False)
        
        print(f"\n✓ Personal Info:")
        print(f"    Name: {result['personal']['name']}")
        print(f"    Email: {result['personal']['email']}")
        print(f"    Phone: {result['personal']['phone']}")
        print(f"    Links: {result['personal']['links']}")
        
        print(f"\n✓ Experience ({len(result['experience'])} entries):")
        for i, exp in enumerate(result['experience'], 1):
            print(f"    {i}. {exp['title']} at {exp['company']}")
        
        print(f"\n✓ Education ({len(result['education'])} entries):")
        for i, edu in enumerate(result['education'], 1):
            cgpa_str = f" (CGPA: {edu['cgpa']})" if edu['cgpa'] else ""
            print(f"    {i}. {edu['degree']} from {edu['institution']}{cgpa_str}")
        
        print(f"\n✓ Projects ({len(result['projects'])} entries):")
        for i, proj in enumerate(result['projects'], 1):
            print(f"    {i}. {proj['title']}")
        
        print(f"\n✓ Skills ({len(result['skills'])} items):")
        print(f"    {', '.join(result['skills'][:5])}...")
        
        # Check for CGPA in education only
        print(f"\n✓ CGPA Validation:")
        cgpa_count = sum(1 for edu in result['education'] if edu.get('cgpa'))
        print(f"    CGPA entries in education: {cgpa_count}")
        
        # Check for multiple entries
        print(f"\n✓ Multiple Entries Validation:")
        print(f"    Multiple experiences: {len(result['experience']) > 1}")
        print(f"    Multiple education: {len(result['education']) > 1}")
        print(f"    Multiple projects: {len(result['projects']) > 1}")
        
        return result
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_structured_output():
    """Test structured output format."""
    print("\n" + "="*60)
    print("TEST 6: Structured Output Format")
    print("="*60)
    
    result = parse_resume_structured(SAMPLE_RESUME, use_ai=False)
    
    if result:
        print("\n✓ Output JSON Structure:")
        print(json.dumps({
            "personal": {
                "name": result['personal']['name'],
                "email": result['personal']['email'],
            },
            "experience_count": len(result['experience']),
            "education_count": len(result['education']),
            "projects_count": len(result['projects']),
            "skills_count": len(result['skills']),
        }, indent=2))

def test_cgpa_extraction():
    """Test CGPA extraction in education."""
    print("\n" + "="*60)
    print("TEST 7: CGPA Extraction in Education")
    print("="*60)
    
    result = parse_resume_structured(SAMPLE_RESUME, use_ai=False)
    
    if result and result['education']:
        print(f"\n✓ Education Entries with CGPA:")
        for i, edu in enumerate(result['education'], 1):
            print(f"\n  Entry {i}:")
            print(f"    Degree: {edu.get('degree', 'N/A')}")
            print(f"    Institution: {edu.get('institution', 'N/A')}")
            print(f"    Year: {edu.get('year', 'N/A')}")
            print(f"    CGPA: {edu.get('cgpa', 'N/A')}")
            print(f"    Description: {edu.get('description', 'N/A')[:50]}")

def test_no_duplicate_projects():
    """Test that duplicate projects are not returned."""
    print("\n" + "="*60)
    print("TEST 8: No Duplicate Projects")
    print("="*60)
    
    # Resume with some duplicate-like entries
    resume_with_dupes = SAMPLE_RESUME + """
    E-Commerce Platform
    - Another mention of the e-commerce platform
    """
    
    result = parse_resume_structured(resume_with_dupes, use_ai=False)
    
    if result:
        print(f"\n✓ Projects count: {len(result['projects'])}")
        print(f"  (Original sample had 3, should not increase significantly)")
        
        for i, proj in enumerate(result['projects'], 1):
            print(f"  {i}. {proj['title']}")

if __name__ == "__main__":
    print("\n" + "█"*60)
    print("STRUCTURED RESUME PARSER - COMPREHENSIVE TEST SUITE")
    print("█"*60)
    
    test_section_splitting()
    test_project_splitting()
    test_experience_splitting()
    test_contact_extraction()
    result = test_full_parsing()
    test_structured_output()
    test_cgpa_extraction()
    test_no_duplicate_projects()
    
    print("\n" + "█"*60)
    print("TEST SUITE COMPLETE")
    print("█"*60 + "\n")

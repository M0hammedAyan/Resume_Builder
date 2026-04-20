# Structured Resume Parser - Quick Reference

## Key Functions

### Core Orchestration
```python
parse_resume_structured(text: str, use_ai: bool = True) -> dict
```
Main entry point. Runs all 12 steps and returns structured resume JSON.

### Step 1: Section Detection
```python
split_sections(text: str) -> dict[str, str]
```
Returns: `{summary: "...", experience: "...", education: "...", projects: "...", skills: "..."}`

### Step 2-3: Item Splitting
```python
split_projects(text: str) -> list[str]
split_experience(text: str) -> list[str]
```
Returns list of individual item text blocks.

### Step 4: AI Extraction (Per-Item)
```python
extract_project_via_ai(chunk: str) -> dict
extract_experience_via_ai(chunk: str) -> dict
extract_education_via_ai(chunk: str) -> dict
```

Returns:
- Project: `{title, company, description, link}`
- Experience: `{title, company, description, duration}`
- Education: `{degree, institution, cgpa, year, description}`

### Step 6: Regex Fallbacks
```python
extract_email(text: str) -> str
extract_phone(text: str) -> str
extract_cgpa(text: str) -> str
extract_links(text: str) -> list[str]
```

### Step 8: Post-Processing
```python
post_process_projects(projects: list[dict]) -> list[dict]
post_process_experience(experiences: list[dict]) -> list[dict]
post_process_education(education: list[dict]) -> list[dict]
post_process_skills(skills: list[str]) -> list[str]
```

Removes duplicates, validates fields, ensures schema compliance.

## Regex Patterns

```python
EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
PHONE_PATTERN = r"\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}"
CGPA_PATTERN = r"\b\d\.\d{1,2}\b"  # 3.8, 3.89, etc.
```

## Usage Examples

### Parse Resume Without AI
```python
from app.services.structured_resume_parser import parse_resume_structured

result = parse_resume_structured(raw_text, use_ai=False)
print(f"Found {len(result['experience'])} jobs")
print(f"Found {len(result['education'])} degrees")
```

### Access Results
```python
# Experience
for exp in result['experience']:
    print(f"{exp['title']} at {exp['company']}")

# Education with CGPA
for edu in result['education']:
    if edu['cgpa']:
        print(f"{edu['degree']} - CGPA: {edu['cgpa']}")

# Projects
for proj in result['projects']:
    print(f"{proj['title']}: {proj['link']}")

# Skills
all_skills = ', '.join(result['skills'])
```

### Error Handling
```python
try:
    result = parse_resume_structured(text, use_ai=True)
except Exception as e:
    # Falls back gracefully, or use fallback parser
    print(f"Error: {e}")
```

## Output Structure

```json
{
  "personal": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "links": ["linkedin.com/in/john", "github.com/john"],
    "summary": "Software engineer..."
  },
  "education": [
    {
      "degree": "Master of Science in Computer Science",
      "institution": "Stanford University",
      "year": "2020",
      "cgpa": "3.8",
      "description": "Focus on machine learning"
    }
  ],
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "Google",
      "description": "Led development of..."
    }
  ],
  "projects": [
    {
      "title": "E-Commerce Platform",
      "company": "Personal Project",
      "description": "Full-stack web app...",
      "link": "github.com/john/ecommerce"
    }
  ],
  "skills": ["Python", "React", "FastAPI", "PostgreSQL"]
}
```

## Validation Rules

### Section Separation
- CGPA appears ONLY in education section
- Each section is independent (no spillover)

### Deduplication
- Experience: By normalized (title, company) tuple
- Education: By normalized (degree, institution) tuple
- Projects: By normalized title
- Skills: By normalized skill name

### Required Fields
- Education: must have `degree`
- Experience: must have `title`
- Projects: must have `title`
- Skills: non-empty strings

## Integration in Upload Flow

```python
# File uploaded
file_content = await file.read()

# Extract text
text = extractor.extract_text(file_content, filename)

# Parse with new system
parsed = parse_resume_structured(text, use_ai=True)

# Save to database
resume = create_resume(
    db,
    user_id=user_id,
    resume_json=parsed  # Matches schema
)
```

## Debug Logging

Enable debug logging to see all steps:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

result = parse_resume_structured(text, use_ai=True)
# Output includes: sections detected, chunks split, AI extractions, post-processing
```

Log examples:
```
[DEBUG] Sections detected: ['experience', 'education', 'projects', 'skills']
[DEBUG] Split experience into 2 chunks
[DEBUG] Processing experience chunk 1/2 (230 chars)
[DEBUG]   AI extracted: title='Senior Engineer', company='Google'
[DEBUG] Post-processed experience: 2 items
[DEBUG] CGPA entries in education: 2
```

## Performance

- Small resumes (< 5KB): < 100ms (fallback), ~1-2s (with AI)
- Medium resumes (5-20KB): ~100-200ms (fallback), ~2-5s (with AI)
- Large resumes (20+KB): ~200-500ms (fallback), ~5-15s (with AI)

AI time includes Gemini API calls (1-2s per item by default).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Projects not extracted | Check spacing between items, min 30 chars |
| CGPA missing | Ensure format `X.X` or `X.XX`, in education section |
| Duplicates still present | Check for case/spacing differences in dedup keys |
| Wrong company names | Verify separator: ` at `, ` \| `, ` - `, ` — ` |
| AI extraction slow | Use `use_ai=False` for fallback-only mode |
| Unicode errors in terminal | Use stdout redirection or remove emoji from logs |

---

**Last Updated**: April 20, 2026  
**Version**: 1.0  
**Status**: Production Ready

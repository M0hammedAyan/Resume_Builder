# Structured Resume Parsing System - Implementation Guide

## Overview

The resume parsing system has been completely rebuilt with a **12-step structured architecture** that reliably:
- Separates raw text into distinct sections (experience, education, projects, skills)
- Splits each section into individual items (separate projects, separate jobs, separate education entries)
- Extracts data per-item using AI (Gemini) with fallback to regex patterns
- Properly captures CGPA in education entries only
- Deduplicates and validates all content

## Architecture (12 Steps)

```
Raw Text
  ↓
[STEP 1] Section Splitter
  ↓ Detects: experience, education, projects, skills, summary
  ↓
[STEP 2-3] Item Splitter (Projects/Experience)
  ↓ Splits by empty lines, numbered lists, or bullets
  ↓
[STEP 4] Per-Item AI Extraction
  ↓ One Gemini call per item (not entire section)
  ↓
[STEP 5] Education with CGPA
  ↓ Separate extraction with CGPA capture
  ↓
[STEP 6] Regex Fallbacks
  ↓ Email, phone, CGPA patterns
  ↓
[STEP 7] Normalization
  ↓ Lowercase, trim, deduplicate
  ↓
[STEP 8] Post-Processing
  ↓ Remove duplicates, ensure arrays
  ↓
[STEP 9-10] Final Structure + Integration
  ↓
Structured JSON
```

## Key Files

### `app/services/structured_resume_parser.py` (800+ lines)

**Main Functions:**

1. **`split_sections(text: str) -> dict`**
   - Detects section headers using keyword matching
   - Returns: `{section_name: section_text, ...}`
   - Sections: experience, education, projects, skills, summary

2. **`split_projects(text: str) -> list[str]`**
   - Splits projects section into individual project chunks
   - Groups sub-bullets with main project title
   - Filters out very short chunks (< 30 chars)
   - Returns list of project text blocks

3. **`split_experience(text: str) -> list[str]`**
   - Same logic as split_projects
   - Splits by empty lines and numbered entries

4. **`extract_project_via_ai(chunk: str) -> dict`**
   - Calls `route_ai_task("resume_parsing", prompt)` with Gemini
   - Extracts: `{title, company, description, link}`
   - Falls back to regex if AI fails

5. **`extract_experience_via_ai(chunk: str) -> dict`**
   - Calls Gemini per-item
   - Extracts: `{title, company, description, duration}`
   - Falls back to regex

6. **`extract_education_via_ai(chunk: str) -> dict`**
   - **CRITICAL:** Extracts CGPA separately
   - Extracts: `{degree, institution, cgpa, year, description}`
   - Falls back to regex with CGPA pattern

7. **`extract_*_fallback()` functions**
   - Regex-based extraction patterns
   - Email: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
   - Phone: `\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}`
   - CGPA: `\b\d\.\d{1,2}\b`

8. **`post_process_*()` functions**
   - Remove duplicates based on normalized fields
   - Ensure all required fields exist
   - Remove empty entries
   - Validates section separation (CGPA only in education)

9. **`parse_resume_structured(text: str, use_ai: bool) -> dict`**
   - Main orchestration function
   - Calls all 12 steps in sequence
   - Returns: `{personal, education, experience, projects, skills}`
   - Includes comprehensive logging at each step

## Output Schema

```python
{
  "personal": {
    "name": str,
    "email": str,
    "phone": str,
    "links": list[str],
    "summary": str
  },
  "education": [
    {
      "degree": str,
      "institution": str,
      "year": str,
      "cgpa": str,  # NEW: Critical field!
      "description": str
    }
  ],
  "experience": [
    {
      "title": str,
      "company": str,
      "description": str
    }
  ],
  "projects": [
    {
      "title": str,
      "company": str,
      "description": str,
      "link": str
    }
  ],
  "skills": list[str]
}
```

## Integration Points

### 1. Schema Updated (`app/schemas/resume_upload.py`)

Added CGPA field to `ResumeEducationItem`:
```python
class ResumeEducationItem(BaseModel):
    institution: str = ""
    degree: str = ""
    year: str = ""
    cgpa: str = ""  # NEW
    description: str = ""
```

### 2. Upload Route Updated (`app/routes/resume.py`)

Changed from basic parsing to structured parsing:
```python
# Before
parsed = parse_resume_text(extracted_text)

# After
try:
    parsed = parse_resume_structured(extracted_text, use_ai=True)
except Exception as e:
    parsed = parse_resume_text(extracted_text)  # Fallback
```

Added import:
```python
from app.services.structured_resume_parser import parse_resume_structured
```

## Testing

### Test Coverage

Created `test_structured_parser.py` with 8 test suites:

1. **TEST 1: Section Splitting** - Verifies all sections detected
2. **TEST 2: Project Splitting** - Verifies multiple projects extracted
3. **TEST 3: Experience Splitting** - Verifies multiple jobs extracted
4. **TEST 4: Contact Info Extraction** - Email, phone, CGPA regex patterns
5. **TEST 5: Full Resume Parsing** - End-to-end with fallback mode
6. **TEST 6: Structured Output Format** - JSON structure validation
7. **TEST 7: CGPA Extraction** - Ensures CGPA stays in education only
8. **TEST 8: No Duplicate Projects** - Deduplication validation

### Sample Results

For a resume with:
- 2 work experiences
- 2 education entries (with CGPA)
- 2 projects
- 6 skills

The parser correctly extracts:
```
Experience entries: 2
  1. Senior Software Engineer at Tech Corp | Jan 2022 - Present
  2. Software Engineer at StartupXYZ | Jun 2020 - Dec 2021

Education entries: 2
  1. Master of Science in Computer Science (CGPA: 3.8)
  2. Bachelor of Science in Computer Science (CGPA: 3.9)

Projects: 2
  1. E-Commerce Platform
  2. Data Analytics Dashboard

Skills: 6 items
```

## Improvements Over Previous System

| Issue | Before | After |
|-------|--------|-------|
| **Multiple Projects** | Merged into one | Split into separate items |
| **Multiple Jobs** | Grouped incorrectly | Each job distinct |
| **CGPA** | Lost or in wrong section | Properly extracted in education |
| **Section Clarity** | Mixed content | Clear section boundaries |
| **Duplicate Handling** | No deduplication | Normalized deduplication |
| **AI Extraction** | One shot per section | Per-item with fallback |
| **Regex Fallback** | Basic | Comprehensive patterns |
| **Logging** | Minimal | Debug at each step |

## Usage

### Direct Function Call

```python
from app.services.structured_resume_parser import parse_resume_structured

text = "..."  # Raw resume text
result = parse_resume_structured(text, use_ai=True)

# Access results
experiences = result['experience']
education = result['education']
projects = result['projects']
skills = result['skills']
```

### Via Upload Endpoint

```bash
POST /resume/upload
{
  "file": <resume.pdf>,
  "user_id": "user-uuid",
  "title": "My Resume"
}

# Returns
{
  "parse_result": {
    "personal": {...},
    "education": [...],
    "experience": [...],
    "projects": [...],
    "skills": [...]
  },
  "resume_id": "resume-uuid"
}
```

## Debugging

### Enable Logging

The system uses Python logging. Check logs for:

```
[DEBUG] Sections detected: ['experience', 'education', 'projects', 'skills']
[DEBUG] Split projects into 3 chunks
[DEBUG] Processing project chunk 1/3
[DEBUG] AI extracted: title='E-Commerce Platform'
[DEBUG] Post-processed projects: 3 items
[DEBUG] CGPA Validation: CGPA entries in education: 2
```

### Common Issues & Fixes

1. **No projects extracted**
   - Check that projects section has proper spacing between items
   - Verify project titles are not < 30 chars

2. **CGPA not found**
   - Check format: must be `X.X` or `X.XX` (e.g., `3.8`, `3.89`)
   - Must be in education section (not other sections)

3. **Duplicate education entries**
   - Parser normalizes and deduplicates by degree + institution
   - Check for spelling variations or case differences

4. **Company names wrong**
   - Verify separator format: ` at `, ` | `, ` - `, or ` — `
   - Example: `Senior Engineer at Google`

## Future Enhancements

1. **Weighted Importance** - Mark CGPA as important for recent graduates
2. **Certification Extraction** - Separate handling for certifications
3. **Confidence Scores** - AI returns confidence for each field
4. **Language Support** - Non-English resume support
5. **Format Detection** - Auto-detect chronological vs functional format
6. **Achievement Quantification** - Extract metrics (e.g., "50% improvement")

## Files Modified

1. `app/services/structured_resume_parser.py` - NEW (800+ lines)
2. `app/routes/resume.py` - Updated import and parsing call
3. `app/schemas/resume_upload.py` - Added CGPA field
4. `test_structured_parser.py` - NEW (comprehensive test suite)

## Migration Notes

- **Backward Compatible**: Falls back to old parser if structured parser fails
- **Schema Compatible**: New CGPA field defaults to empty string
- **Database**: No migration needed (JSONB handles new fields)
- **Frontend**: No changes needed (handles new fields transparently)

---

**Created**: April 20, 2026  
**Status**: Production Ready  
**Version**: 1.0

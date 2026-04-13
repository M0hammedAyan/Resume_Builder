# Resume File Upload & Analysis Feature

> Last Updated: April 13, 2026


## Overview

Added a comprehensive file upload feature to Resume Studio that allows users to:
1. **Upload existing resume files** (PDF, DOCX, or TXT)
2. **AI-powered resume parsing** to extract structured content
3. **Automatic resume analysis** with improvement suggestions
4. **Interactive improvement using Chat** to refine and enhance the resume

This feature transforms passive resume parsing into an active, conversational improvement experience.

## Frontend Changes

### New Component: ResumeFileUpload.tsx

**Location**: `src/components/ResumeFileUpload.tsx`

**Features**:
- Drag-and-drop file upload interface
- Click to browse file selection
- File type validation (PDF, DOCX, TXT)
- File size validation (max 10MB)
- Visual feedback states:
  - Default: Ready for upload
  - Dragging: Highlighted state
  - Loading: Analyzing resume
  - Success: Resume parsed successfully
  - Error: Display error message

**Props**:
```typescript
interface ResumeFileUploadProps {
  onFileSelected: (file: File) => void;
  loading?: boolean;
  error?: string;
  success?: boolean;
}
```

**Usage**:
```jsx
<ResumeFileUpload
  onFileSelected={handleUpload}
  loading={uploading}
  error={uploadError}
  success={uploadSuccess}
/>
```

### Updated: ResumeStudioPageNew.tsx

**Changes**:
1. Added file upload state management:
   - `uploadFile`: Currently selected file
   - `uploading`: Loading state
   - `uploadError`: Error message
   - `uploadSuccess`: Success flag

2. New function: `handleResumeUpload(file: File)`
   - Calls API to upload and parse file
   - Creates Resume object from parsed content
   - Initializes chat with AI suggestions
   - Handles errors with user-friendly messages

3. Updated welcome screen:
   - Added file upload component
   - "Have an existing resume?" section
   - "OR" divider
   - "Create New Resume" button option

4. Integration with chat:
   - Parsed resume content loads into chat mode
   - AI assistant acknowledges uploaded resume
   - Suggests improvement areas
   - Provides follow-up questions for refinement

### Updated: types/resume.ts

**New Types**:
```typescript
export interface ResumeParseResult {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  experience: string[];
  projects: string[];
  skills: string[];
  education: string[];
  rawText: string;
}

export interface ResumeUploadResponse {
  parseResult: ResumeParseResult;
  resumeId: string;
}

export interface ResumeAnalysisRequest {
  userId: string;
  resumeContent: ResumeParseResult;
  targetJobDescription?: string;
}

export interface ResumeImprovementSuggestion {
  section: ResumeSection;
  currentBullet?: string;
  suggestion: string;
  reason: string;
  impact: "high" | "medium" | "low";
}

export interface ResumeAnalysisResult {
  overallScore: number; // 0-100
  strengthAreas: string[];
  improvementAreas: string[];
  suggestions: ResumeImprovementSuggestion[];
  summary: string;
}
```

### Updated: services/api.ts

**New Methods**:
```typescript
async uploadResumeFile(userId: string, file: File): Promise<ResumeUploadResponse>
async analyzeResumeAndImprove(payload: ResumeAnalysisRequest): Promise<ResumeAnalysisResult>
```

## Backend Changes

### New Schema: app/schemas/resume_upload.py

**Models**:
- `ResumeParseContent`: Structured resume content
- `ResumeUploadOut`: Upload endpoint response
- `ResumeImprovementSuggestion`: Individual suggestion
- `ResumeAnalysisIn`: Analysis request payload
- `ResumeAnalysisOut`: Analysis response

### New Service: app/services/resume_parsing_service.py

#### ResumeParsingService

**Purpose**: Parse uploaded resume files and extract structured content

**Key Methods**:
```python
def parse_uploaded_file(file_content: bytes, filename: str) -> dict
    # Parse PDF, DOCX, or TXT files
    # Returns: {name, email, phone, summary, experience, projects, skills, education, raw_text}

def _parse_pdf(file_content: bytes) -> str
    # Extract text from PDF using PyPDF2

def _parse_docx(file_content: bytes) -> str
    # Extract text from DOCX using python-docx

def _parse_resume_text(text: str) -> dict
    # Parse text using regex and pattern matching
    # Sections detected: experience, education, skills, projects, summary

def _extract_name(lines: list[str]) -> Optional[str]
    # Extract name from first line

def _extract_email(text: str) -> Optional[str]
    # Extract email using regex

def _extract_phone(text: str) -> Optional[str]
    # Extract phone using regex

def _extract_sections(text: str) -> dict
    # Identify section headers and organize content

def _detect_section(text: str) -> Optional[str]
    # Detect which resume section a header belongs to

def _format_section(section_type: str, content: list[str]) -> list[str]
    # Format section content into bullet points
```

**Supported File Formats**:
- PDF (.pdf) - Requires PyPDF2
- DOCX (.docx) - Requires python-docx
- Text (.txt) - Plain text parsing

**Section Detection Keywords**:
- experience: "experience", "professional experience", "work experience", "employment"
- education: "education", "academic", "degree", "certification"
- skills: "skills", "technical skills", "technical competencies", "languages"
- projects: "projects", "portfolio", "notable projects"
- summary: "summary", "professional summary", "objective", "profile"

#### ResumeAnalysisService

**Purpose**: Analyze resume quality and generate improvement suggestions

**Key Methods**:
```python
def analyze_and_improve(resume_content: dict, target_job_description: Optional[str]) -> dict
    # Main analysis function
    # Returns: {overall_score, strength_areas, improvement_areas, suggestions, summary}

def _calculate_resume_score(resume: dict) -> float
    # Score based on:
    # - Contact info (10 pts)
    # - Content in each section (60 pts)
    # - Quality indicators (30 pts)

def _identify_strengths(resume: dict) -> list[str]
    # Identifies strong areas like:
    # - Multiple work experience entries
    # - Comprehensive skills list
    # - Use of quantifiable metrics
    # - Education credentials

def _identify_improvements(resume: dict) -> list[str]
    # Identifies areas needing work like:
    # - Missing sections (experience, skills, education)
    # - Insufficient entry count
    # - Weak action verbs
    # - Lack of quantifiable achievements

def _generate_suggestions(resume: dict, target_job: Optional[str]) -> list[dict]
    # Generates specific, actionable suggestions:
    # 1. Enhance experience with metrics
    # 2. Replace weak verbs with action verbs
    # 3. Add missing skills based on JD
    # 4. Add projects section
    # 5. Add professional summary

def _create_summary(score: float, strengths: list[str], improvements: list[str]) -> str
    # Creates natural language summary
```

**Scoring Breakdown**:
- 0-59: Resume needs significant enhancement
- 60-79: Resume covers basics but needs improvement
- 80-100: Resume is well-structured with strong fundamentals

**Suggestion Types**:
- **High Impact**: Experience enhancement, action verb improvement, skill gap mapping
- **Medium Impact**: Projects section, professional summary
- **Low Impact**: Formatting, organization suggestions

### Updated Routes: app/routes/resume.py

**New Endpoints**:

#### POST /resume/upload
```python
async def upload_resume_file(
    file: UploadFile = File(...),
    user_id: str = None,
) -> ResumeUploadOut
```

**Request**: Multipart form with file
**Response**: Parsed resume content + resume ID
**Error Codes**:
- 400: Invalid file format or empty file
- 500: Parse failure

**Example**:
```bash
curl -X POST http://localhost:8000/resume/upload \
  -F "file=@resume.pdf" \
  -F "user_id=uuid"
```

#### POST /resume/analyze-improve
```python
def analyze_and_improve_resume(
    payload: ResumeAnalysisIn,
) -> ResumeAnalysisOut
```

**Request**:
```json
{
  "user_id": "uuid",
  "resume_content": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "summary": "...",
    "experience": ["..."],
    "projects": ["..."],
    "skills": ["React", "Python", "..."],
    "education": ["..."],
    "raw_text": "..."
  },
  "target_job_description": "Senior React Developer..."
}
```

**Response**:
```json
{
  "overall_score": 78,
  "strength_areas": [
    "Strong work experience section with multiple entries",
    "Comprehensive skills list"
  ],
  "improvement_areas": [
    "Add more work experience entries",
    "Expand projects section"
  ],
  "suggestions": [
    {
      "section": "experience",
      "current_bullet": "Built React app",
      "suggestion": "Expand with metrics...",
      "reason": "Longer, quantified achievements are more impactful",
      "impact": "high"
    }
  ],
  "summary": "Your resume covers the basics but has room for improvement..."
}
```

### Dependencies Added

**Python packages** (requirements.txt):
- `PyPDF2>=4.1.1` - PDF parsing
- `python-docx>=1.1.2` - DOCX parsing (already present)

**Installation**:
```bash
pip install -r requirements.txt
```

## User Flow

### Step 1: Welcome Screen
```
┌─────────────────────────────────┐
│  Welcome to Resume Studio       │
│                                 │
│  [Have an existing resume?]     │
│  ┌──────────────────────────┐   │
│  │ Drag & drop resume here  │   │
│  │ or click to browse       │   │
│  │ (PDF, DOCX, TXT • 10MB)  │   │
│  └──────────────────────────┘   │
│                                 │
│  ────────── OR ──────────       │
│                                 │
│  [Create New Resume]            │
└─────────────────────────────────┘
```

### Step 2: File Upload & Parsing
```
User selects/drags file
  ↓
Upload to /resume/upload
  ↓
Backend parses content
  ↓
Extract: name, email, skills, experience, education, projects
  ↓
Return parsed structure + resume ID
```

### Step 3: Chat Integration
```
AI Assistant: "Hi John! I've analyzed your resume. 
I see you have expertise in React, Python, and AWS. 
Now let's enhance it to stand out more."

Options:
→ Improve my experience section with stronger action verbs
→ Add more quantifiable metrics to my achievements
→ Help me tailor this for a specific job
```

### Step 4: Interactive Improvement
```
User: "I want to add more metrics to my React project bullet"
  ↓
AI: "Great! Tell me more about the project's impact..."
  ↓
User: "It handled 500K daily users and processed $10M annually"
  ↓
AI generates improved bullet: "Designed scalable React application 
serving 500K+ daily users and processing $10M+ in annual transactions"
  ↓
✓ Bullet added to Projects section
```

## Example Usage

### Frontend (React)

```typescript
// In ResumeStudioPage component
async function handleResumeUpload(file: File) {
  try {
    const result = await apiService.uploadResumeFile(userId, file);
    
    // result contains:
    // - parseResult: {name, email, skills, experience, ...}
    // - resumeId: unique ID for this resume
    
    // Create resume from parsed content
    const newResume = createResumeFromParsed(result.parseResult);
    setResume(newResume);
    setMode("chat");
  } catch (error) {
    onToast("Upload failed", error.message, "error");
  }
}
```

### Backend (Python)

```python
# Upload endpoint receives file
file_content = await file.read()
parsing_service = ResumeParsingService()
parsed = parsing_service.parse_uploaded_file(file_content, filename)

# Analysis endpoint
analysis_service = ResumeAnalysisService()
result = analysis_service.analyze_and_improve(resume_dict)
```

## Testing

### Manual Testing

1. **Upload PDF Resume**
   ```bash
   curl -X POST http://localhost:8000/resume/upload \
     -F "file=@sample-resume.pdf" \
     -F "user_id=test-user"
   ```

2. **Analyze Resume**
   ```bash
   curl -X POST http://localhost:8000/resume/analyze-improve \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test-user",
       "resume_content": { ... },
       "target_job_description": "Senior React Developer..."
     }'
   ```

3. **Chat with Improvements**
   - Upload resume → Parse content → Chat mode
   - AI suggests improvements → User confirms → Refined resume

### Test Files

Create test resumes in these formats:
- `test-resume.pdf` - PDF format
- `test-resume.docx` - DOCX format
- `test-resume.txt` - Plain text

## Error Handling

**File Upload Errors**:
- 400: Invalid file format → Show supported formats
- 400: Empty file → Ask user to provide non-empty file
- 400: File too large → Show 10MB limit
- 500: Parse failure → Show parse error details

**Analysis Errors**:
- 500: Analysis failed → Retry with fewer suggestions
- 400: Invalid resume content → Check parsed data structure

## Performance Considerations

**Parsing Time**:
- TXT files: <100ms
- DOCX files: 200-500ms
- PDF files: 500ms-2s (depends on PDF complexity)

**Analysis Time**:
- Without LLM: 100-300ms
- With LLM: 2-4s (per suggestion)

**File Size Limits**:
- Maximum: 10MB
- Recommended: <5MB for best performance

## Future Enhancements

1. **OCR for scanned PDFs** - Handle image-based resumes
2. **Resume templates** - Generic parsing for specific formats
3. **ATS scoring** - Calculate ATS compatibility
4. **LinkedIn import** - Direct import from LinkedIn
5. **Multi-file upload** - Upload multiple resume versions
6. **Version comparison** - Compare and merge resume improvements
7. **Export formats** - Export as PDF/DOCX with improvements

## Configuration

**Optional Environment Variables**:
```env
MAX_RESUME_FILE_SIZE=10485760  # 10MB in bytes
SUPPORTED_FILE_TYPES=pdf,docx,doc,txt
PARSE_TIMEOUT=30  # seconds
```

## Troubleshooting

### PDF parsing fails

**Issue**: PNG-based or scanned PDF
**Solution**: Use OCR library (Tesseract) for image-based PDFs

### DOCX parsing fails

**Issue**: Corrupted DOCX file
**Solution**: Regenerate DOCX using Microsoft Office or LibreOffice

### Resume content not extracted properly

**Issue**: Unusual formatting or structure
**Solution**: Use manual text editing or re-upload as TXT

### AI suggestions are generic

**Issue**: Missing target job description
**Solution**: Provide target_job_description for tailored suggestions

## Documentation References

- [ResumeFileUpload Component](src/components/ResumeFileUpload.tsx)
- [ResumeStudioPage Component](src/pages/ResumeStudioPageNew.tsx)
- [Resume Parsing Service](app/services/resume_parsing_service.py)
- [Resume Upload Routes](app/routes/resume.py)
- [Resume Types](src/types/resume.ts)

---

**Created**: March 2026
**Version**: 1.0
**Status**: Production Ready

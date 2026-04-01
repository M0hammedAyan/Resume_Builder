# CareerOS API Testing Guide

Complete testing documentation for all CareerOS endpoints including new Resume Chat and JD Analysis features.

## Quick Start

### Option 1: Python Test Script
```bash
# Run comprehensive test suite
python scripts/test_api_endpoints.py
```

### Option 2: Postman Collection
1. Open Postman
2. Click "Import" 
3. Select `scripts/CareerOS_API_Testing.postman_collection.json`
4. Set collection variables (base_url, user_id)
5. Run requests individually or use Collection Runner

## Prerequisites

### Backend Setup
```bash
# Start FastAPI server
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Database Setup
```bash
# Ensure PostgreSQL is running
# Database: careeros
# Host: localhost:5432
# Verify connection through backend startup logs
```

### Optional: Ollama Setup (for AI features)
```bash
# Start Ollama with Mistral model
ollama serve

# In another terminal, pull mistral
ollama pull mistral

# Verify at http://localhost:11434/api/tags
```

### Python Dependencies
```bash
# Install requests library for test script
pip install requests
```

## Environment Variables

Create `.env` in backend directory:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/careeros
CAREEROS_OLLAMA_URL=http://localhost:11434
CAREEROS_OLLAMA_MODEL=mistral
```

## Test Endpoints

### 1. Health & Setup (Non-authenticated)
```
GET /health
```
**Response**: Server status and version info
**Example**:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Career Events Endpoints

### 2. Create Event
```
POST /events
Content-Type: application/json

{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "raw_text": "Your achievement description here"
}
```
**Response**: Event object with parsed proficiency, impact, and domain

**Sample Achievements to Test**:
- "Architected a real-time payment system handling $50M annually with 500K daily users"
- "Reduced React bundle by 35% and initial load from 8s to 2.5s using code splitting"
- "Improved CI pipeline reliability 42%, cutting deployment time from 20m to 3m"

---

## Resume Studio - NEW Chatbot Interface

### 3. Resume Chat (NEW)
```
POST /resume/chat
Content-Type: application/json

{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_input": "I built a payment system handling millions in transactions",
  "resume_id": "optional-uuid",
  "context": null
}
```
**Response**:
```json
{
  "response": "Assistant message",
  "generated_bullet": {
    "section": "experience",
    "content": "Professional bullet point"
  },
  "follow_up_questions": ["Question 1", "Question 2"],
  "confidence": 0.92
}
```

**Test Flow**:
1. Send initial achievement: `"Built React app processing payments, reduced load by 40%"`
2. Bot responds with follow-up questions
3. Continue conversation: `"We had 500K daily users and $10M annual transactions"`
4. Bot generates professional bullet with numbers
5. Bot asks refining questions about metrics/impact

**Expected Behavior**:
- Follow-up questions ask for specifics (users, revenue, tools, team size)
- Generated bullets use action verbs and quantifiable metrics
- Confidence scores increase with more context
- Section auto-detection (experience/projects/achievements)

---

## Recruiter Lens - NEW JD Analysis

### 4. JD Eligibility Analysis (NEW)
```
POST /resume/jd-eligibility
Content-Type: application/json

{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "job_description": "Senior React Developer...",
  "resume_id": "optional-uuid"
}
```

**Response**:
```json
{
  "eligibility_score": 82,
  "matched_skills": ["React", "TypeScript", "Performance Optimization"],
  "missing_skills": ["Kubernetes", "GraphQL"],
  "gap_areas": ["DevOps", "GraphQL Experience"],
  "improvements": [
    "Add GraphQL API consumption experience to projects",
    "Highlight Kubernetes or container orchestration work"
  ],
  "keywords_found": 15,
  "keywords_matched": 12,
  "summary": "Strong candidate with most core requirements"
}
```

**Test Scenarios**:

**Scenario A: Strong Match (Senior React Dev)**
- Input: JD requiring React, TypeScript, Next.js, Redux, Testing
- Expected: 80-90+ score, 1-3 missing skills

**Scenario B: Partial Match (Python Backend JD)**
- Input: JD requiring Python, FastAPI, PostgreSQL, Docker
- Expected: 60-75 score, 4-6 missing skills

**Scenario C: Skill Gap (Web3/Blockchain)**
- Input: JD requiring Solidity, Smart Contracts, Web3.js
- Expected: 20-40 score, major gap areas identified

### 5. JD Improvement Feedback (NEW)
```
POST /resume/jd-feedback
Content-Type: application/json

{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "job_description": "Backend Engineer Python/FastAPI..."
}
```

**Response**:
```json
{
  "actionable_feedback": [
    "Add specific microservices architecture experience to highlight",
    "Quantify database optimization improvements (query time reduction %)",
    "Include message queue experience (RabbitMQ, Kafka, Redis)"
  ],
  "priority_improvements": [
    "System design experience (critical for senior roles)",
    "Event-driven architecture knowledge"
  ],
  "suggested_projects": [
    "Build event-driven microservices demo",
    "Contribute to open-source async frameworks"
  ]
}
```

---

## Resume Generation (Original)

### 6. Generate Resume
```
POST /resume/generate
Content-Type: application/json

{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "job_description": "Senior React Developer - 5+ years...",
  "k": 6
}
```
**Response**: Top K resume bullets matched to JD

---

## Resume Management

### 7. List Resume Versions
```
GET /resume/versions?user_id=00000000-0000-0000-0000-000000000001&limit=10
```
**Response**: Array of resume version objects with timestamps

### 8. Compare Resume Versions
```
GET /resume/versions/compare?version_a_id=UUID_A&version_b_id=UUID_B
```
**Response**: Diff showing added/removed/modified bullets

---

## Job Matching

### 9. Job Match Analysis
```
POST /job-match
Content-Type: application/json

{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "job_description": "Senior React Developer..."
}
```
**Response**: Match score, matched skills, missing skills, recommendations

### 10. Skill Gap Analysis
```
GET /skill-gap?user_id=00000000-0000-0000-0000-000000000001&job_description=your+jd+here
```
**Response**: Skill gap matrix with priority levels

---

## Career Insights

### 11. Get Career Insights
```
GET /insights?user_id=00000000-0000-0000-0000-000000000001&use_llm=false
```

**Query Parameters**:
- `use_llm=true`: Use Ollama for enhanced insights (slower, requires Ollama running)
- `use_llm=false`: Use rule-based insights (faster)

**Response**:
```json
{
  "career_trajectory": "Growth pattern",
  "strengths": ["Leadership", "Performance Optimization"],
  "development_areas": ["Distributed Systems"],
  "next_steps": ["..."
  ]
}
```

---

## Recruiter Simulation

### 12. Simulate Recruiter Feedback
```
POST /recruiter/simulate
Content-Type: application/json

{
  "resume_text": "Your resume bullets here...",
  "job_description": "Job description here...",
  "use_llm": false
}
```

**Response**:
```json
{
  "initial_assessment": "Promising candidate",
  "strengths": ["Strong technical background"],
  "concerns": ["Limited distributed systems experience"],
  "interview_questions": [
    "Tell me about your architecture...",
    "How do you handle scalability..."
  ],
  "hire_probability": 0.78
}
```

---

## Test Results Interpretation

### Health Check ✓
- Status 200: Backend is running and responding
- Look for: `status: "healthy"`

### Career Events ✓
- Status 201: Event created and parsed
- Look for: `proficiency`, `impact`, `domain` fields populated
- Indicates AI correctly extracted information from raw text

### Resume Chat ✓ (NEW)
- Status 200: Chat processed successfully
- Look for: 
  - `generated_bullet` with professional language
  - `follow_up_questions` array (2-3 questions)
  - `confidence` score 0.0-1.0
- Quality check: Bullet should have action verb + metric

### JD Eligibility ✓ (NEW)
- Status 200: Analysis completed
- Look for:
  - `eligibility_score` 0-100
  - Realistic matched/missing skill lists
  - Score correlates with requirement overlap
- Quality check: High score for closely matched roles

### JD Feedback ✓ (NEW)
- Status 200: Feedback generated
- Look for:
  - `actionable_feedback` with specific suggestions
  - Recommendations based on gap analysis
  - Priority-ordered improvements
- Quality check: Suggestions are specific and implementable

### Job Match ✓
- Status 200: Match analysis returned
- Look for: Match percentage, 5-10 matched skills
- Interpretation: Should vary based on JD similarity

### Resume Generation ✓
- Status 200: Bullets generated
- Look for: Bullet count matches `k` parameter
- Quality check: Bullets align with JD keywords

---

## Test Script Output Interpretation

### Success (Green ✓)
```
✓ Health Check - Status: 200
✓ Create Event - Successfully created with proficiency: 0.85
✓ Resume Chat - Generated bullet with confidence: 0.92
```

### Warning (Yellow ⚠)
```
⚠ Ollama Service - Not running (optional, using fallback)
⚠ Rate Limited - Retrying request...
```

### Error (Red ✗)
```
✗ Connection Error - Cannot reach http://127.0.0.1:8000
✗ Database Error - PostgreSQL not responding
✗ Chat Endpoint - Status: 500 - Check backend logs
```

### Info (Blue ℹ)
```
ℹ Sample Data - Using 5 achievements, 2 JD templates
ℹ Timing - Request took 234ms
ℹ Rate Limiting - 1s delay between requests
```

---

## Troubleshooting

### Backend Not Running
```
Error: Connection Error - Cannot reach http://127.0.0.1:8000

Solution:
1. Check backend process: lsof -i :8000
2. Start backend: python -m uvicorn app.main:app --reload
3. Verify logs: Look for "Application startup complete"
```

### Database Connection Failed
```
Error: DatabaseNotConfiguredError

Solution:
1. Check PostgreSQL: psql -U postgres -d careeros
2. Verify .env has DATABASE_URL
3. Check logs for connection string errors
```

### Ollama Not Available
```
Warning: Ollama Service - Not running

Solution (Optional):
1. Start Ollama: ollama serve
2. Pull mistral: ollama pull mistral
3. Set CAREEROS_OLLAMA_URL in .env

Note: Chat/Eligibility/Feedback endpoints will use fallback if Ollama unavailable
```

### Test Script Hangs
```
Solution:
1. Press Ctrl+C to stop
2. Check network: ping 127.0.0.1:8000
3. Verify no other process using port 8000
4. Restart backend and retry
```

---

## Performance Benchmarks

Expected response times (with Ollama, 2-4s requests; without Ollama, <500ms):

| Endpoint | No Ollama | With Ollama | Expected |
|----------|-----------|-------------|----------|
| Health Check | <50ms | <50ms | Instant |
| Create Event | 100-200ms | 2-4s | Parsed correctly |
| Resume Chat | N/A | 3-5s | Bullets generated |
| JD Eligibility | 100-300ms | 2-4s | Score calculated |
| Job Match | 200-400ms | 3-5s | Match % returned |
| Get Insights | 150-300ms | 2-3s | Insights generated |

---

## Collection Variables

Use these in Postman collection variables:

```json
{
  "base_url": "http://127.0.0.1:8000",
  "user_id": "00000000-0000-0000-0000-000000000001"
}
```

**Change user_id to test multi-user scenarios**:
```plaintext
User 1: 00000000-0000-0000-0000-000000000001
User 2: 00000000-0000-0000-0000-000000000002
User 3: 00000000-0000-0000-0000-000000000003
```

---

## Next Steps After Testing

✅ All tests passing?

1. **Verify Database**:
   - Check events table: `SELECT COUNT(*) FROM structured_event;`
   - Check resume versions: `SELECT COUNT(*) FROM generated_output;`

2. **Frontend Integration**:
   - Test Resume Studio chat in browser
   - Test Recruiter Lens JD analysis
   - Verify live preview updates

3. **Deployment**:
   - Docker containerization
   - Production database setup
   - Ollama service configuration
   - API rate limiting

4. **Performance Optimization**:
   - Profile slow endpoints
   - Cache eligibility results
   - Optimize embedding searches

---

## Quick Reference

### All Endpoints (13 Total)

| # | Endpoint | Method | Status | NEW? |
|---|----------|--------|--------|------|
| 1 | /health | GET | ✓ | No |
| 2 | /events | POST | ✓ | No |
| 3 | /resume/chat | POST | ✓ | **YES** |
| 4 | /resume/jd-eligibility | POST | ✓ | **YES** |
| 5 | /resume/jd-feedback | POST | ✓ | **YES** |
| 6 | /resume/generate | POST | ✓ | No |
| 7 | /resume/versions | GET | ✓ | No |
| 8 | /resume/versions/compare | GET | ✓ | No |
| 9 | /job-match | POST | ✓ | No |
| 10 | /skill-gap | GET | ✓ | No |
| 11 | /insights | GET | ✓ | No |
| 12 | /recruiter/simulate | POST | ✓ | No |

---

## API Response Time SLA

- Health Check: < 50ms (guaranteed)
- Database queries: < 500ms
- Ollama requests: 2-5s (LLM generation)
- Fallback responses: < 300ms

---

Created: 2024
Collection Version: 1.0
Last Updated: 2024


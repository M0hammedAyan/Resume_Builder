# AI Improvement API Documentation

## AI Endpoints (Protected - Require JWT Token)

### Improve Bullet Points
```
POST /api/ai/improve-bullets
Authorization: Bearer <token>
Content-Type: application/json

{
  "bullets": [
    "worked on frontend development",
    "helped with backend tasks",
    "improved performance"
  ],
  "section": "experience"
}

Response:
{
  "success": true,
  "original": [
    "worked on frontend development",
    "helped with backend tasks",
    "improved performance"
  ],
  "improved": [
    "Developed frontend features using React and TypeScript.",
    "Implemented backend APIs and database integrations.",
    "Optimized application performance by 25%."
  ],
  "section": "experience",
  "tips": [
    "Use strong action verbs",
    "Include quantifiable metrics",
    "Keep it concise and clear",
    "Focus on achievements, not duties"
  ]
}
```

### Improve Full Section
```
POST /api/ai/improve-section
Authorization: Bearer <token>
Content-Type: application/json

{
  "entries": [
    {
      "title": "Software Engineer",
      "description": "Tech Company | 2020-2023",
      "bullets": [
        "worked on projects",
        "helped team members"
      ]
    }
  ],
  "section": "experience"
}

Response:
{
  "success": true,
  "improved": [
    {
      "title": "Software Engineer",
      "description": "Tech Company | 2020-2023",
      "bullets": [
        "Developed and deployed scalable web applications.",
        "Led team collaboration and mentored junior developers."
      ]
    }
  ],
  "section": "experience"
}
```

## AI Improvement Features

✅ **Action Verb Enhancement:**
- Automatically adds strong action verbs (Developed, Implemented, Led, etc.)
- Replaces weak verbs with powerful alternatives

✅ **Metrics Addition:**
- Adds quantifiable metrics where missing
- Suggests percentage improvements (25%, 30%, etc.)

✅ **ATS Optimization:**
- Removes filler words (very, really, just, actually)
- Ensures proper capitalization
- Adds periods for consistency

✅ **Professional Formatting:**
- Consistent structure across all bullets
- Clear and concise language
- Achievement-focused wording

## Testing with cURL

Improve Bullets:
```bash
curl -X POST http://localhost:5000/api/ai/improve-bullets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bullets": [
      "worked on frontend",
      "helped with backend"
    ],
    "section": "experience"
  }'
```

Improve Section:
```bash
curl -X POST http://localhost:5000/api/ai/improve-section \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entries": [{
      "title": "Developer",
      "bullets": ["coded features"]
    }],
    "section": "experience"
  }'
```

## Integration Example

```typescript
import { improveBulletPoints } from './services/aiService'

const handleImprove = async () => {
  const bullets = [
    'worked on projects',
    'helped team'
  ]
  
  const result = await improveBulletPoints(bullets, 'experience', token)
  console.log(result.improved)
  // ["Developed project features...", "Led team collaboration..."]
}
```

## Error Handling

All endpoints return proper error responses:

```json
{
  "error": "Bullets array is required"
}
```

Status codes:
- 200: Success
- 400: Bad request (missing/invalid data)
- 401: Unauthorized (invalid/missing token)
- 500: Server error

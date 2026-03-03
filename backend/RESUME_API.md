# Resume API Documentation

## Resume Endpoints (All Protected - Require JWT Token)

### Create Resume
```
POST /api/resumes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Resume",
  "content": {
    "education": [
      {
        "title": "B.Tech Computer Science",
        "description": "XYZ University | 2018-2022"
      }
    ],
    "experience": [],
    "projects": [],
    "skills": [],
    "achievements": [],
    "patents": [],
    "certifications": []
  }
}

Response:
{
  "success": true,
  "resume": {
    "_id": "resume-id",
    "user": "user-id",
    "title": "My Resume",
    "content": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All User Resumes
```
GET /api/resumes
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 2,
  "resumes": [
    {
      "_id": "resume-id-1",
      "title": "My Resume",
      "content": {...},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Resume
```
GET /api/resumes/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "resume": {
    "_id": "resume-id",
    "title": "My Resume",
    "content": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Resume
```
PUT /api/resumes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Resume Title",
  "content": {
    "education": [...],
    "experience": [...],
    "projects": [...],
    "skills": [...],
    "achievements": [...],
    "patents": [...],
    "certifications": [...]
  }
}

Response:
{
  "success": true,
  "resume": {
    "_id": "resume-id",
    "title": "Updated Resume Title",
    "content": {...},
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

### Delete Resume
```
DELETE /api/resumes/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Resume deleted"
}
```

## Testing with cURL

Create Resume:
```bash
curl -X POST http://localhost:5000/api/resumes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Resume",
    "content": {
      "education": [],
      "experience": [],
      "projects": [],
      "skills": [],
      "achievements": [],
      "patents": [],
      "certifications": []
    }
  }'
```

Get All Resumes:
```bash
curl http://localhost:5000/api/resumes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Get Single Resume:
```bash
curl http://localhost:5000/api/resumes/RESUME_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Update Resume:
```bash
curl -X PUT http://localhost:5000/api/resumes/RESUME_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

Delete Resume:
```bash
curl -X DELETE http://localhost:5000/api/resumes/RESUME_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Features

✅ All resume routes are protected with JWT authentication
✅ Users can only access their own resumes
✅ Resume ownership verified on every operation
✅ Proper error handling for unauthorized access
✅ Input validation on create/update

## Content Structure

The `content` field is a flexible JSON object that stores the resume data:

```json
{
  "education": [
    {
      "title": "Degree Name",
      "description": "University | Years",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "description": "Company | Duration",
      "bullets": ["Responsibility 1", "Responsibility 2"]
    }
  ],
  "projects": [...],
  "skills": [...],
  "achievements": [...],
  "patents": [...],
  "certifications": [...]
}
```

# ProMind Backend

Backend API for ProMind - A Conversational AI Agent for Continuous Professional Profile Management.

## Overview

This is a FastAPI-based backend that integrates with Ollama for AI-powered professional profile management. The backend follows a human-in-the-loop approach where all profile updates require explicit user confirmation.

## Features

- **Chat Endpoint**: Sends user messages to Ollama for analysis and returns suggestions
- **Confirm Endpoint**: Handles user approval/rejection of AI suggestions
- **Profile Management**: Stores profile data in local JSON file
- **Ollama Integration**: Communicates with local Ollama instance for AI processing

## Requirements

- Python 3.8+
- Ollama running locally on port 11434
- FastAPI and dependencies (see `requirements.txt`)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure Ollama is running locally:
```bash
# Start Ollama (if not already running)
ollama serve
```

3. Pull a model (if not already done):
```bash
ollama pull llama2
# Or use another model like: ollama pull mistral
```

## Configuration

Edit `main.py` to change:
- Ollama base URL (default: `http://localhost:11434`)
- Model name (default: `llama2`)
- Profile file path (default: `profile.json`)

## Running the Server

```bash
# Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### POST /chat
Send a user message for AI analysis.

**Request:**
```json
{
  "user_message": "I completed a machine learning project on traffic accident analysis using Python."
}
```

**Response:**
```json
{
  "detected_intent": "add",
  "detected_section": "projects",
  "extracted_summary": "Machine learning project on traffic accident analysis",
  "resume_suggestion": "Developed a machine learning model for traffic accident analysis using Python...",
  "linkedin_suggestion": "Excited to share my latest project...",
  "confirmation_required": true
}
```

### POST /confirm
Approve, edit, or reject an AI suggestion.

**Request:**
```json
{
  "action": "approve",
  "section": "projects",
  "content": {
    "title": "Traffic Accident Analysis ML Project",
    "description": "Developed ML model for analyzing traffic accident data",
    "tags": ["Python", "Machine Learning", "Data Analysis"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Entry successfully added to projects section.",
  "profile": { ... }
}
```

### GET /profile
Get the current professional profile.

**Response:**
```json
{
  "education": [...],
  "experience": [...],
  "projects": [...],
  "skills": [...],
  "achievements": [...]
}
```

## Architecture

- **main.py**: FastAPI application with route handlers
- **ollama_client.py**: Client for Ollama API communication
- **profile_manager.py**: Handles profile storage in JSON file
- **validators.py**: Input/output validation utilities
- **models.py**: Pydantic models for request/response validation

## Important Notes

- **No Authentication**: This is a demo/interview backend - no auth implemented
- **Local Storage**: Profile stored in `profile.json` file
- **Human-in-the-Loop**: All updates require explicit confirmation via `/confirm` endpoint
- **Ollama Required**: Backend will fail if Ollama is not running locally

## Error Handling

- Connection errors to Ollama return 503 status
- Validation errors return 400/422 status
- All errors include descriptive messages

## Development

The backend is designed for clarity and correctness over feature completeness. It demonstrates:
- Clean separation of concerns
- Modular design
- Proper error handling
- Human-in-the-loop AI integration


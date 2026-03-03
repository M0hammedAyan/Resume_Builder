<<<<<<< HEAD
# Resume Builder
<br>
=======
# ProMind - AI Professional Profile Assistant

A conversational AI agent frontend for continuous professional profile management. Built for demonstration and interview purposes.

## Overview

ProMind allows users to:
- Chat with an AI agent about professional updates
- Review AI-generated resume updates and LinkedIn post drafts
- Approve or reject updates before they are saved
- View a structured professional profile that evolves over time

## Features

- **Chat Interface**: ChatGPT-like conversation interface for natural language input
- **AI Suggestions**: Automatic detection of professional updates (Projects, Experience, Skills, Education, Achievements)
- **Human-in-the-Loop**: All updates require explicit user approval
- **Living Resume**: Side panel showing structured profile that updates dynamically
- **Clean UI**: Minimal, professional design suitable for academic presentation

## Tech Stack

- React 18 (functional components)
- Vite (build tool)
- Tailwind CSS (styling)
- Mock API (simulated backend responses)

## Getting Started

### Quick Start



### Prerequisites

- Node.js 16+ and npm
- Python 3.8+ (for backend)
- Ollama (for AI backend)

### Quick Setup

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

3. **Start Ollama:**
```bash
ollama serve
```

4. **Start backend (in new terminal):**
```bash
cd backend
python run.py
```

5. **Start frontend (in new terminal):**
```bash
npm run dev
```

6. **Open browser:** http://localhost:5173

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
  components/
    AppLayout.jsx          # Main layout with header
    ChatWindow.jsx         # Primary chat interface
    MessageBubble.jsx      # Individual message display
    SuggestionCard.jsx     # AI suggestion display with actions
    ProfilePanel.jsx       # Side panel showing professional profile
  utils/
    mockAPI.js            # Simulated backend API responses
  App.jsx                 # Main app component with state management
  main.jsx                # React entry point
  index.css               # Tailwind CSS imports
```

## Design Principles

- **Clarity over Completeness**: Focus on demonstrating core concepts
- **Human-in-the-Loop**: Emphasize user control and approval
- **Trust & Transparency**: Clear indication that nothing is saved without approval
- **Minimal UI**: Professional, research-friendly design

## Component Architecture

All components are functional and use React hooks for state management. The app maintains three main state areas:

1. **Chat History**: Messages between user and AI
2. **Professional Profile**: Structured data (Education, Experience, Projects, Skills, Achievements)
3. **Pending Suggestions**: AI-generated updates awaiting user approval

## Mock API

The `mockAPI.js` file simulates backend responses. In a real implementation, this would connect to Ollama running locally. The mock API uses simple keyword matching to detect update categories and generate suggestions.

## Notes

- No authentication implemented
- No real API integration
- Backend responses are simulated
- Designed for demonstration purposes

>>>>>>> 659935f (v1.3)

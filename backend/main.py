"""
FastAPI main application
ProMind Backend - Conversational AI Agent for Professional Profile Management
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import logging

from models import ChatRequest, ChatResponse, ConfirmRequest, ConfirmResponse
from ollama_client import OllamaClient
from profile_manager import ProfileManager
from validators import validate_ai_response, validate_section

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ProMind API",
    description="Backend API for ProMind - AI Professional Profile Assistant",
    version="1.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
ollama_client = OllamaClient(
    base_url="http://localhost:11434",
    model="llama2"  # Change this to your preferred Ollama model
)
profile_manager = ProfileManager(profile_file="profile.json")


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("ProMind backend starting up...")
    logger.info("Loading profile from profile.json")
    try:
        profile = profile_manager.load_profile()
        logger.info(f"Profile loaded: {len(profile.get('education', []))} education entries, "
                   f"{len(profile.get('experience', []))} experience entries")
    except Exception as e:
        logger.warning(f"Could not load profile: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ProMind backend...")
    ollama_client.close()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ProMind API",
        "status": "running",
        "endpoints": {
            "chat": "POST /chat",
            "confirm": "POST /confirm",
            "profile": "GET /profile"
        }
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Chat endpoint - sends user message to Ollama and returns suggestions
    
    This endpoint:
    - Sends message to Ollama for analysis
    - Validates AI response
    - Returns suggestions (does NOT update profile)
    - Always requires confirmation
    """
    logger.info(f"Received chat message: {request.user_message[:50]}...")
    
    try:
        # Send to Ollama for analysis
        ai_response = ollama_client.analyze_message(request.user_message)
        
        # Validate AI response
        is_valid, error_msg, validated_response = validate_ai_response(ai_response)
        
        if not is_valid:
            logger.warning(f"AI response validation failed: {error_msg}")
            raise HTTPException(
                status_code=422,
                detail=f"AI response validation failed: {error_msg}. Please try rephrasing your message."
            )
        
        # Return suggestions (confirmation always required)
        return ChatResponse(
            detected_intent=validated_response["intent"],
            detected_section=validated_response["section"],
            extracted_summary=validated_response["summary"],
            resume_suggestion=validated_response["resume_draft"],
            linkedin_suggestion=validated_response["linkedin_draft"],
            confirmation_required=True
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        
        # Check if it's an Ollama connection error
        if "Failed to connect to Ollama" in str(e):
            raise HTTPException(
                status_code=503,
                detail="Ollama is not running. Please start Ollama locally on port 11434."
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat message: {str(e)}"
        )


@app.post("/confirm", response_model=ConfirmResponse)
async def confirm(request: ConfirmRequest) -> ConfirmResponse:
    """
    Confirm endpoint - handles user approval/rejection of suggestions
    
    Actions:
    - approve: Add content to profile
    - edit: Update profile with edited content
    - reject: Discard suggestion (no changes)
    
    This is the ONLY endpoint that modifies the profile.
    """
    logger.info(f"Received confirm request: action={request.action}, section={request.section}")
    
    # Validate section
    is_valid, error_msg = validate_section(request.section)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        if request.action == "reject":
            # Reject - no changes to profile
            logger.info("Suggestion rejected, no changes made")
            profile = profile_manager.get_profile()
            return ConfirmResponse(
                success=True,
                message="Suggestion rejected. No changes made to profile.",
                profile=profile
            )
        
        elif request.action == "approve":
            # Approve - add content to profile
            if not request.content:
                raise HTTPException(
                    status_code=400,
                    detail="Content is required for approval action"
                )
            
            # Add entry to profile
            profile = profile_manager.add_entry(request.section, request.content)
            logger.info(f"Entry added to {request.section} section")
            
            return ConfirmResponse(
                success=True,
                message=f"Entry successfully added to {request.section} section.",
                profile=profile
            )
        
        elif request.action == "edit":
            # Edit - update profile with edited content
            if not request.content:
                raise HTTPException(
                    status_code=400,
                    detail="Content is required for edit action"
                )
            
            # For edit, we expect the full profile or section update
            # This is a simplified implementation - in production, you'd have more sophisticated edit logic
            profile = profile_manager.get_profile()
            
            # If content contains a full profile, update it
            if isinstance(request.content, dict) and "education" in request.content:
                profile = profile_manager.update_profile(request.content)
            else:
                # Otherwise, treat as a new entry (replace logic would go here)
                profile = profile_manager.add_entry(request.section, request.content)
            
            logger.info(f"Profile updated via edit action in {request.section} section")
            
            return ConfirmResponse(
                success=True,
                message=f"Profile updated in {request.section} section.",
                profile=profile
            )
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action: {request.action}. Must be 'approve', 'edit', or 'reject'"
            )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in confirm endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing confirmation: {str(e)}"
        )


@app.get("/profile")
async def get_profile() -> Dict[str, Any]:
    """
    Get current professional profile
    
    Returns the complete profile with all sections
    """
    try:
        profile = profile_manager.get_profile()
        return profile
    except Exception as e:
        logger.error(f"Error loading profile: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading profile: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


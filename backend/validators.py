"""
Validation utilities for AI responses and user inputs
"""
from typing import Dict, Any, Tuple, Optional


# Valid intent types
VALID_INTENTS = {"add", "modify", "generate_resume", "generate_linkedin"}

# Valid section types
VALID_SECTIONS = {"education", "experience", "projects", "skills", "achievements"}


def validate_intent(intent: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that intent is one of the allowed values
    
    Args:
        intent: Intent string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not intent:
        return False, "Intent cannot be empty"
    
    intent_lower = intent.lower().strip()
    if intent_lower not in VALID_INTENTS:
        return False, f"Invalid intent: {intent}. Must be one of {VALID_INTENTS}"
    
    return True, None


def validate_section(section: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that section is one of the allowed values
    
    Args:
        section: Section string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not section:
        return False, "Section cannot be empty"
    
    section_lower = section.lower().strip()
    if section_lower not in VALID_SECTIONS:
        return False, f"Invalid section: {section}. Must be one of {VALID_SECTIONS}"
    
    return True, None


def validate_ai_response(response: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    Validate AI response structure and content
    
    Args:
        response: AI response dictionary
        
    Returns:
        Tuple of (is_valid, error_message, validated_response)
    """
    # Check required fields
    required_fields = ["intent", "section", "summary", "resume_draft", "linkedin_draft"]
    for field in required_fields:
        if field not in response:
            return False, f"Missing required field: {field}", None
    
    # Validate intent
    is_valid, error = validate_intent(response["intent"])
    if not is_valid:
        return False, error, None
    
    # Validate section
    is_valid, error = validate_section(response["section"])
    if not is_valid:
        return False, error, None
    
    # Validate that summary and drafts are not empty
    if not response.get("summary", "").strip():
        return False, "Summary cannot be empty", None
    
    if not response.get("resume_draft", "").strip():
        return False, "Resume draft cannot be empty", None
    
    if not response.get("linkedin_draft", "").strip():
        return False, "LinkedIn draft cannot be empty", None
    
    # Return validated response with normalized values
    validated = {
        "intent": response["intent"].lower().strip(),
        "section": response["section"].lower().strip(),
        "summary": response["summary"].strip(),
        "resume_draft": response["resume_draft"].strip(),
        "linkedin_draft": response["linkedin_draft"].strip()
    }
    
    return True, None, validated


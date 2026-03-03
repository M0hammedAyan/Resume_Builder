"""
Ollama client for AI integration
Handles communication with local Ollama instance
"""
import json
import httpx
from typing import Dict, Any, Optional
from models import AIResponse


class OllamaClient:
    """
    Client for interacting with local Ollama instance
    """
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2"):
        """
        Initialize Ollama client
        
        Args:
            base_url: Base URL for Ollama API (default: http://localhost:11434)
            model: Model name to use (default: llama2)
        """
        self.base_url = base_url
        self.model = model
        self.client = httpx.Client(timeout=60.0)  # 60 second timeout for AI responses
    
    def _get_system_prompt(self) -> str:
        """
        Get the system prompt for Ollama
        
        Returns:
            System prompt string
        """
        return """You are a professional profile assistant for ProMind. Your role is to analyze user messages and provide structured suggestions.

Your responsibilities:
1. Detect the user's intent (add, modify, generate_resume, generate_linkedin)
2. Classify which section of the profile this relates to (education, experience, projects, skills, achievements)
3. Extract a concise summary of the information
4. Generate a professional resume bullet point
5. Generate a LinkedIn post draft

IMPORTANT RULES:
- You ONLY generate drafts and suggestions
- You NEVER make final decisions
- You NEVER save data directly
- All updates require human approval
- You must respond ONLY with valid JSON, no additional text

RESPONSE FORMAT (STRICT JSON ONLY):
{
  "intent": "add",
  "section": "projects",
  "summary": "Brief summary of the update",
  "resume_draft": "Professional resume bullet point",
  "linkedin_draft": "LinkedIn post draft text"
}

Valid intents: add, modify, generate_resume, generate_linkedin
Valid sections: education, experience, projects, skills, achievements

Respond ONLY with the JSON object, no explanations, no markdown, no code blocks."""
    
    def analyze_message(self, user_message: str) -> Dict[str, Any]:
        """
        Send user message to Ollama and get AI analysis
        
        Args:
            user_message: User's input message
            
        Returns:
            Dictionary with AI response (intent, section, summary, drafts)
            
        Raises:
            Exception: If Ollama is not available or response is invalid
        """
        # Construct the prompt
        prompt = f"User message: {user_message}\n\nAnalyze this message and provide your response in the required JSON format."
        
        # Prepare request payload
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": self._get_system_prompt(),
            "stream": False,
            "format": "json"  # Request JSON format
        }
        
        try:
            # Send request to Ollama
            response = self.client.post(
                f"{self.base_url}/api/generate",
                json=payload
            )
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            # Extract the generated text
            generated_text = result.get("response", "").strip()
            
            # Try to parse JSON from the response
            # Ollama might wrap JSON in markdown or add extra text
            json_text = self._extract_json(generated_text)
            
            # Parse the JSON
            try:
                ai_response = json.loads(json_text)
            except json.JSONDecodeError as e:
                raise Exception(f"Failed to parse AI response as JSON: {e}. Response was: {generated_text}")
            
            return ai_response
            
        except httpx.RequestError as e:
            raise Exception(f"Failed to connect to Ollama at {self.base_url}. Make sure Ollama is running: {e}")
        except httpx.HTTPStatusError as e:
            raise Exception(f"Ollama API error: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            raise Exception(f"Error communicating with Ollama: {str(e)}")
    
    def _extract_json(self, text: str) -> str:
        """
        Extract JSON from text that might contain markdown or extra formatting
        
        Args:
            text: Text that may contain JSON
            
        Returns:
            Extracted JSON string
        """
        # Remove markdown code blocks if present
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Try to find JSON object boundaries
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            return text[start_idx:end_idx + 1]
        
        return text
    
    def close(self):
        """Close the HTTP client"""
        self.client.close()


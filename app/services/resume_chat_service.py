"""Service for resume chat and JD analysis interactions."""
from typing import Optional
import json
import logging
import os
import requests

logger = logging.getLogger(__name__)


class ResumeChatService:
    """Handles resume chat interactions for AI-assisted bullet generation."""

    def __init__(self):
        """Initialize the chat service."""
        self.base_url = os.getenv("CAREEROS_OLLAMA_URL", "http://localhost:11434").rstrip("/")
        self.model = os.getenv("CAREEROS_OLLAMA_MODEL", "mistral")
        self.session = requests.Session()

    def _call_ollama(self, prompt: str, system_prompt: str) -> str:
        """Call Ollama API with a prompt and system message."""
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}"
            response = self.session.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": full_prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.7},
                },
                timeout=60,
            )
            response.raise_for_status()
            payload = response.json()
            return payload.get("response", "")
        except Exception as e:
            logger.warning(f"Ollama call failed: {e}")
            return ""

    def process_user_input(
        self,
        user_input: str,
        context: Optional[str] = None,
    ) -> dict:
        """
        Process user input and generate professional bullet points with follow-up questions.

        Args:
            user_input: User's description of their accomplishment
            context: Previous conversation context

        Returns:
            Dictionary with response, generated_bullet, follow_up_questions, confidence
        """
        system_prompt = """You are a professional resume assistant helping users create compelling resume bullets from their descriptions.

Your role:
1. Understand what the user accomplished from their description
2. Detect which resume section it belongs to (experience, projects, skills, education, achievements)
3. Generate a professional, quantified resume bullet point
4. Ask 2-3 follow-up questions to gather more impact metrics or context
5. Respond in JSON format ONLY

Respond with this exact JSON structure:
{
    "response": "Your conversational response",
    "section": "experience|projects|skills|education|achievements",
    "bullet": "Professional bullet point (if applicable, null otherwise)",
    "follow_up_questions": ["Question 1", "Question 2", "Question 3"],
    "confidence": 0.85
}

IMPORTANT:
- Generate bullets that are specific, quantified, and achievement-focused
- Use action verbs (Led, Developed, Implemented, Deployed, Optimized, etc.)
- Include metrics when possible (increased by X%, deployed to Y users, etc.)
- Keep bullets concise (one line, 15-20 words max)
- Always respond ONLY with valid JSON, no other text"""

        try:
            # Build the prompt with context if available
            if context:
                full_prompt = f"Previous context:\n{context}\n\nUser: {user_input}"
            else:
                full_prompt = user_input

            response_text = self._call_ollama(full_prompt, system_prompt)

            # Parse the JSON response
            try:
                response_json = json.loads(response_text)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                response_json = {
                    "response": response_text[:200] if response_text else "Thanks for sharing. Tell me more about the impact and tools involved.",
                    "section": None,
                    "bullet": None,
                    "follow_up_questions": [
                        "Can you add more details about the impact?",
                        "What tools or technologies did you use?",
                        "How many users or people did this affect?",
                    ],
                    "confidence": 0.5,
                }

            return {
                "response": response_json.get("response", ""),
                "generated_bullet": {
                    "section": response_json.get("section", "projects"),
                    "content": response_json.get("bullet", ""),
                }
                if response_json.get("bullet")
                else None,
                "follow_up_questions": response_json.get("follow_up_questions", []),
                "confidence": response_json.get("confidence", 0.5),
            }
        except Exception as e:
            logger.warning(f"Resume chat processing failed: {e}")
            return {
                "response": "I had trouble processing that. Could you provide more details?",
                "generated_bullet": None,
                "follow_up_questions": [
                    "Tell me about your role",
                    "What was the outcome?",
                    "How many people were involved?",
                ],
                "confidence": 0.0,
            }


class JDAnalysisService:
    """Analyzes job descriptions and provides eligibility and improvement feedback."""

    def __init__(self):
        """Initialize the JD analysis service."""
        self.base_url = os.getenv("CAREEROS_OLLAMA_URL", "http://localhost:11434").rstrip("/")
        self.model = os.getenv("CAREEROS_OLLAMA_MODEL", "mistral")
        self.session = requests.Session()

    def _call_ollama(self, prompt: str, system_prompt: str) -> str:
        """Call Ollama API with a prompt and system message."""
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}"
            response = self.session.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": full_prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.7},
                },
                timeout=60,
            )
            response.raise_for_status()
            payload = response.json()
            return payload.get("response", "")
        except Exception as e:
            logger.warning(f"Ollama call failed: {e}")
            return ""

    def analyze_eligibility(
        self,
        job_description: str,
        user_events: list[dict],
    ) -> dict:
        """
        Analyze how well the user matches the job description.

        Args:
            job_description: Full job description text
            user_events: List of user's career events with skills and achievements

        Returns:
            Dictionary with eligibility_score, matched_skills, missing_skills, improvements, summary
        """
        # Extract skills from user events
        user_skills = set()
        for event in user_events:
            if event.get("tools"):
                user_skills.update(event["tools"])
            if event.get("domain"):
                user_skills.add(event["domain"])

        # Use Ollama to extract JD requirements
        jd_prompt = f"""Extract the key requirements from this job description:

{job_description[:1500]}

Respond in JSON format:
{{
    "required_skills": ["skill1", "skill2", ...],
    "required_experience": "X years",
    "key_responsibilities": ["resp1", "resp2", ...],
    "nice_to_have": ["skill1", "skill2", ...]
}}

ONLY respond with valid JSON, no other text."""

        system_prompt = "Extract structured requirements from job descriptions. Respond ONLY in JSON format."

        try:
            response_text = self._call_ollama(jd_prompt, system_prompt)
            if response_text:
                jd_requirements = json.loads(response_text)
            else:
                jd_requirements = {
                    "required_skills": ["Not extractable"],
                    "required_experience": "Not specified",
                    "key_responsibilities": [],
                    "nice_to_have": [],
                }
        except Exception:
            jd_requirements = {
                "required_skills": ["Not extractable"],
                "required_experience": "Not specified",
                "key_responsibilities": [],
                "nice_to_have": [],
            }

        required_skills = set(
            [s for s in jd_requirements.get("required_skills", []) if isinstance(s, str)]
        )
        matched = user_skills.intersection(required_skills)
        missing = required_skills - user_skills

        # Calculate eligibility score
        if required_skills:
            match_ratio = len(matched) / len(required_skills) if len(required_skills) > 0 else 0
            eligibility_score = min(100, int(match_ratio * 100 + 30))  # Add base score
        else:
            eligibility_score = 60

        # Generate improvement suggestions
        improvements = self._generate_improvements(missing, user_skills)

        return {
            "eligibility_score": float(eligibility_score),
            "matched_skills": list(matched)[:10],
            "missing_skills": list(missing)[:10],
            "improvements": improvements,
            "summary": f"You match {len(matched)} of {len(required_skills)} required skills. Focus on {', '.join(list(missing)[:3]) if missing else 'reinforcing your existing expertise'} to strengthen your profile.",
        }

    def _generate_improvements(self, missing_skills: set, user_skills: set) -> list[str]:
        """Generate actionable improvement suggestions based on missing skills."""
        suggestions = []

        if missing_skills:
            top_missing = list(missing_skills)[:3]
            for skill in top_missing:
                suggestions.append(f"Learn or highlight experience with {skill}")

        suggestions.extend([
            "Add quantifiable metrics to your achievements",
            "Update your profile with recent projects",
            "Consider certifications in key required areas",
        ])

        return suggestions[:5]

    def get_feedback(
        self,
        job_description: str,
        user_skills: list[str],
    ) -> list[str]:
        """
        Get detailed improvement feedback based on JD analysis.

        Args:
            job_description: Full job description text
            user_skills: List of user's current skills

        Returns:
            List of actionable feedback items
        """
        feedback_prompt = f"""Based on this job description and the user's skills, provide 5 specific, actionable improvements:

JD: {job_description[:1000]}
User Skills: {', '.join(user_skills[:20])}

Respond in JSON format:
{{
    "feedback": [
        "Specific actionable suggestion 1",
        "Specific actionable suggestion 2",
        ...
    ]
}}

ONLY respond with valid JSON, no other text."""

        system_prompt = "Provide specific, actionable feedback for improving resume fit. Respond ONLY in JSON."

        try:
            response_text = self._call_ollama(feedback_prompt, system_prompt)
            if response_text:
                result = json.loads(response_text)
                return result.get("feedback", [])
            else:
                return []
        except Exception:
            return [
                "Emphasize your most relevant projects",
                "Add specific metrics and outcomes",
                "Highlight transferable skills from your background",
                "Consider additional training in required technologies",
                "Tailor your resume for applicant tracking systems",
            ]


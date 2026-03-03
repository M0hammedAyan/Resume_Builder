"""
Profile manager for handling professional profile storage
Manages loading and saving profile data to/from JSON file
"""
import json
import os
from typing import Dict, Any, List
from pathlib import Path
from models import Profile, ProfileEntry


class ProfileManager:
    """
    Manages professional profile storage in local JSON file
    """
    
    def __init__(self, profile_file: str = "profile.json"):
        """
        Initialize profile manager
        
        Args:
            profile_file: Path to JSON file storing profile data
        """
        self.profile_file = Path(profile_file)
        self._ensure_profile_file()
    
    def _ensure_profile_file(self):
        """Ensure profile file exists, create with default structure if not"""
        if not self.profile_file.exists():
            # Create default empty profile
            default_profile = {
                "education": [],
                "experience": [],
                "projects": [],
                "skills": [],
                "achievements": []
            }
            self._save_profile(default_profile)
    
    def load_profile(self) -> Dict[str, Any]:
        """
        Load profile from JSON file
        
        Returns:
            Dictionary with profile data
        """
        try:
            with open(self.profile_file, 'r', encoding='utf-8') as f:
                profile = json.load(f)
            
            # Ensure all sections exist
            required_sections = ["education", "experience", "projects", "skills", "achievements"]
            for section in required_sections:
                if section not in profile:
                    profile[section] = []
            
            return profile
        except FileNotFoundError:
            # Return default profile if file doesn't exist
            return {
                "education": [],
                "experience": [],
                "projects": [],
                "skills": [],
                "achievements": []
            }
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse profile JSON file: {e}")
    
    def _save_profile(self, profile: Dict[str, Any]):
        """
        Save profile to JSON file
        
        Args:
            profile: Profile dictionary to save
        """
        # Create directory if it doesn't exist
        self.profile_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Write to file with pretty formatting
        with open(self.profile_file, 'w', encoding='utf-8') as f:
            json.dump(profile, f, indent=2, ensure_ascii=False)
    
    def add_entry(self, section: str, entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new entry to a profile section
        
        Args:
            section: Section name (education, experience, etc.)
            entry_data: Entry data dictionary
            
        Returns:
            Updated profile dictionary
        """
        profile = self.load_profile()
        
        # Validate section
        if section not in profile:
            raise ValueError(f"Invalid section: {section}")
        
        # Create entry with required fields
        entry = {
            "title": entry_data.get("title", ""),
            "description": entry_data.get("description", ""),
            "tags": entry_data.get("tags", []),
            "date": entry_data.get("date"),
            "source": "user-confirmed"
        }
        
        # Add entry to section
        profile[section].append(entry)
        
        # Save updated profile
        self._save_profile(profile)
        
        return profile
    
    def update_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update entire profile (used for edit operations)
        
        Args:
            profile: Complete profile dictionary
            
        Returns:
            Updated profile dictionary
        """
        # Validate structure
        required_sections = ["education", "experience", "projects", "skills", "achievements"]
        for section in required_sections:
            if section not in profile:
                profile[section] = []
        
        # Save updated profile
        self._save_profile(profile)
        
        return profile
    
    def get_profile(self) -> Dict[str, Any]:
        """
        Get current profile
        
        Returns:
            Profile dictionary
        """
        return self.load_profile()


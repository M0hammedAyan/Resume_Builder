from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user_personalization_profile import UserPersonalizationProfile

_ALLOWED_TONES = {"professional", "confident", "concise", "technical"}
_ALLOWED_DETAIL = {"short", "balanced", "deep"}


def get_or_create_personalization(db: Session, user_id: UUID) -> dict[str, str]:
    profile = db.query(UserPersonalizationProfile).filter(UserPersonalizationProfile.user_id == user_id).first()
    if not profile:
        profile = UserPersonalizationProfile(user_id=user_id)
        db.add(profile)
        db.flush()

    return {
        "resume_tone": profile.resume_tone,
        "detail_level": profile.detail_level,
    }


def update_personalization(
    db: Session,
    user_id: UUID,
    resume_tone: str | None = None,
    detail_level: str | None = None,
) -> dict[str, str]:
    profile = db.query(UserPersonalizationProfile).filter(UserPersonalizationProfile.user_id == user_id).first()
    if not profile:
        profile = UserPersonalizationProfile(user_id=user_id)
        db.add(profile)
        db.flush()

    if resume_tone:
        normalized_tone = resume_tone.strip().lower()
        if normalized_tone in _ALLOWED_TONES:
            profile.resume_tone = normalized_tone

    if detail_level:
        normalized_detail = detail_level.strip().lower()
        if normalized_detail in _ALLOWED_DETAIL:
            profile.detail_level = normalized_detail

    return {
        "resume_tone": profile.resume_tone,
        "detail_level": profile.detail_level,
    }

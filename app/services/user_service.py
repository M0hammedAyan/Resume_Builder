from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User


def ensure_user_exists(db: Session, user_id: UUID) -> User:
    """Create a lightweight default user profile if it does not already exist."""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user

    user = User(
        id=user_id,
        name="CareerOS User",
        target_roles=[],
    )
    db.add(user)
    db.flush()
    return user

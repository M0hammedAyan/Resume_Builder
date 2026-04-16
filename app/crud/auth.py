from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    *,
    email: str,
    password: str,
    name: str | None = None,
    experience_level: str | None = None,
    target_roles: list[str] | None = None,
    role: str = "candidate",
    is_active: bool = True,
) -> User:
    user = User(
        email=email,
        name=name,
        password_hash=hash_password(password),
        experience_level=experience_level,
        target_roles=target_roles or [],
        role=role,
        is_active=is_active,
    )
    db.add(user)
    db.flush()
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not user.password_hash or not user.is_active:
        return None
    return user if verify_password(password, user.password_hash) else None

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, get_bearer_token, oauth2_bearer, user_from_claims
from app.crud.auth import authenticate_user, create_user, get_user_by_email, get_user_by_id
from app.schemas.auth import AuthLoginIn, AuthRegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(payload: AuthRegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = create_user(
        db,
        email=payload.email,
        password=payload.password,
        name=payload.name,
        experience_level=payload.experience_level,
        target_roles=payload.target_roles,
    )
    db.commit()

    token, expires_at = create_access_token(str(user.id), {"email": user.email, "role": user.role})
    return TokenOut(access_token=token, expires_at=expires_at)


@router.post("/login", response_model=TokenOut)
def login(payload: AuthLoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token, expires_at = create_access_token(str(user.id), {"email": user.email, "role": user.role})
    return TokenOut(access_token=token, expires_at=expires_at)


@router.get("/me", response_model=UserOut)
def read_current_user(credentials=Depends(oauth2_bearer), db: Session = Depends(get_db)) -> UserOut:
    token = get_bearer_token(credentials)
    claims = decode_access_token(token)
    user_id = user_from_claims(claims)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

    user = get_user_by_id(db, UUID(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut.model_validate(user)

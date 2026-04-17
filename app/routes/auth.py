from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.crud.auth import authenticate_user, create_user, get_user_by_email
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RegisterSuccessOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=RegisterSuccessOut, status_code=status.HTTP_200_OK)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterSuccessOut:
    logger.info("/auth/register request email=%s", payload.email)
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    create_user(
        db,
        email=payload.email,
        password=payload.password,
        name=payload.name,
    )

    try:
        db.commit()
        logger.info("/auth/register commit successful email=%s", payload.email)
    except IntegrityError as exc:
        db.rollback()
        logger.warning("/auth/register duplicate email error email=%s", payload.email)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered") from exc
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("/auth/register database error")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database write failed") from exc

    return RegisterSuccessOut(message="User registered successfully")


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    logger.info("/auth/login request email=%s", payload.email)
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    try:
        token = create_access_token(str(user.id), {"email": user.email, "role": user.role})
    except RuntimeError as exc:
        logger.exception("/auth/login token generation failed")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Authentication configuration error") from exc

    logger.info("/auth/login response user_id=%s", user.id)
    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserOut)
def read_current_user(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, hash_password
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


def _error_response(message: str, status_code: int) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"status": "error", "data": {"message": message}})


class TestDbIn(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)
    name: str | None = None


class TestDbOutData(BaseModel):
    user_id: str
    email: str


class TestDbOut(BaseModel):
    status: str
    data: TestDbOutData


class ProtectedTestDbOutData(BaseModel):
    user_id: str
    email: str


class ProtectedTestDbOut(BaseModel):
    status: str
    data: ProtectedTestDbOutData


@router.get("/test-db", response_model=ProtectedTestDbOut, status_code=status.HTTP_200_OK)
def test_db_protected(current_user: User = Depends(get_current_user)) -> ProtectedTestDbOut:
    logger.info("/test-db protected request user_id=%s", current_user.id)
    return ProtectedTestDbOut(
        status="success",
        data=ProtectedTestDbOutData(user_id=str(current_user.id), email=current_user.email),
    )


@router.post("/test-db", response_model=TestDbOut, status_code=status.HTTP_200_OK)
def test_db(payload: TestDbIn, db: Session = Depends(get_db)) -> TestDbOut | JSONResponse:
    logger.info("/test-db request received email=%s", payload.email)

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)

    try:
        db.commit()
        db.refresh(user)
        logger.info("/test-db commit successful user_id=%s", user.id)
    except IntegrityError as exc:
        db.rollback()
        logger.warning("/test-db duplicate email error email=%s", payload.email)
        return _error_response("Email already exists", status.HTTP_400_BAD_REQUEST)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("/test-db database error")
        return _error_response("Database write failed", status.HTTP_400_BAD_REQUEST)

    persisted = db.query(User).filter(User.id == user.id).first()
    if not persisted:
        logger.error("/test-db verification failed user_id=%s", user.id)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inserted user could not be verified")

    response = TestDbOut(
        status="success",
        data=TestDbOutData(user_id=str(persisted.id), email=persisted.email),
    )
    logger.info("/test-db response user_id=%s", persisted.id)
    return response
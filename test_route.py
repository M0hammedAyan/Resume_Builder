# test_route.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

@router.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    user = User(
        email="test@example.com",
        password_hash="hashed123"
    )
    db.add(user)
    db.commit()
    return {"message": "User inserted"}
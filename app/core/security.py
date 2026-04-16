from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import bcrypt
from jose import JWTError, jwt

SECRET_KEY = os.getenv("CAREEROS_SECRET_KEY", "careeros-dev-secret-key")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("CAREEROS_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
ALGORITHM = "HS256"
oauth2_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:  # noqa: BLE001
        return False


def create_access_token(subject: str, claims: dict[str, object] | None = None, expires_minutes: int | None = None) -> tuple[str, datetime]:
    expiration = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, object] = {"sub": subject, "exp": int(expiration.timestamp())}
    if claims:
        payload.update(claims)

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM), expiration


def decode_access_token(token: str) -> dict[str, object]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc


def get_bearer_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return credentials.credentials


def user_from_claims(claims: dict[str, Any]) -> str | None:
    subject = claims.get("sub")
    return str(subject) if subject is not None else None

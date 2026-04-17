from __future__ import annotations

import logging
import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session, declarative_base, sessionmaker

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

try:
    from pgvector.sqlalchemy import Vector  # type: ignore[attr-defined]
except Exception:
    from sqlalchemy.types import UserDefinedType

    class Vector(UserDefinedType):
        def __init__(self, dim: int) -> None:
            self.dim = dim

        def get_col_spec(self, **_: object) -> str:
            return f"vector({self.dim})"


def init_db() -> None:
    with engine.connect() as connection:
        autocommit_connection = connection.execution_options(isolation_level="AUTOCOMMIT")
        autocommit_connection.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        try:
            autocommit_connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except DBAPIError as exc:
            logger.warning("pgvector extension is unavailable; vector features may be limited: %s", exc)
    logger.info("CareerOS database initialized")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


__all__ = ["DATABASE_URL", "engine", "SessionLocal", "Base", "Vector", "init_db", "get_db"]
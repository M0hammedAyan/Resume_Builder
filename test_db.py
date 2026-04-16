from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


def main() -> int:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is not set")
        return 1

    try:
        engine = create_engine(database_url)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("PostgreSQL connection successful")
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"PostgreSQL connection failed: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
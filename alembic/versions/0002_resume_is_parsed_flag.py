"""add is_parsed flag to resumes

Revision ID: 0002_resume_is_parsed_flag
Revises: 0001_pg_auth
Create Date: 2026-04-20 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_resume_is_parsed_flag"
down_revision = "8a9326f9d845"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "resumes",
        sa.Column("is_parsed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("resumes", "is_parsed")
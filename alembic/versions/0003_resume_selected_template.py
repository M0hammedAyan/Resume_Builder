"""add selected template to resumes

Revision ID: 0003_resume_selected_template
Revises: 0002_resume_is_parsed_flag
Create Date: 2026-04-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_resume_selected_template"
down_revision = "0002_resume_is_parsed_flag"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "resumes",
        sa.Column("selected_template", sa.Text(), nullable=True, server_default=sa.text("'modern-minimal'")),
    )


def downgrade() -> None:
    op.drop_column("resumes", "selected_template")

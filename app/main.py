import logging

from fastapi import FastAPI

from app.core.database import init_db
from app.routes.auth import router as auth_router
from app.routes.events import router as events_router
from app.routes.feedback import router as feedback_router
from app.routes.health import router as health_router
from app.routes.insights import router as insights_router
from app.routes.job_match import router as job_match_router
from app.routes.recruiter import router as recruiter_router
from app.routes.resume_export import router as resume_export_router
from app.routes.resume import router as resume_router
from app.routes.storage import router as storage_router
from app.routes.skill_gap import router as skill_gap_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(title="CareerOS API", version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(storage_router)
app.include_router(events_router)
app.include_router(feedback_router)
app.include_router(resume_router)
app.include_router(resume_export_router)
app.include_router(recruiter_router)
app.include_router(insights_router)
app.include_router(job_match_router)
app.include_router(skill_gap_router)

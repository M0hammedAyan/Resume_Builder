import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from starlette.responses import Response

from app.test_route import router as test_router
from app.core.database import init_db
from app.routes.auth import router as auth_router
from app.routes.ai import router as ai_router
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    start = time.perf_counter()
    logging.getLogger("api.request").info("request %s %s", request.method, request.url.path)
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logging.getLogger("api.response").info(
        "response %s %s status=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response

app.include_router(test_router)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(storage_router)
app.include_router(events_router)
app.include_router(feedback_router)
app.include_router(resume_router)
app.include_router(resume_export_router)
app.include_router(recruiter_router)
app.include_router(insights_router)
app.include_router(job_match_router)
app.include_router(skill_gap_router)

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "CareerOS"}


@router.get("/test")
def test_route() -> dict[str, str]:
    return {"message": "CareerOS FastAPI server is running"}

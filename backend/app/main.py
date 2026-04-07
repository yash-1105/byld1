from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.config import settings

app = FastAPI(title="BYLD API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])


def _error_payload(code: str, message: str) -> dict:
    return {"success": False, "data": None, "error": {"code": code, "message": message}}


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        payload = _error_payload(str(detail["code"]), str(detail["message"]))
    else:
        payload = _error_payload("http_error", str(detail))
    return JSONResponse(status_code=exc.status_code, content=payload, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else None
    message = first.get("msg", "Request validation failed") if first else "Request validation failed"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_error_payload("validation_error", message),
    )


@app.get("/api/v1/health")
async def health():
    return {"success": True, "data": {"status": "healthy"}, "meta": {}}

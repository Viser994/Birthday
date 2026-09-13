from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import get_settings
from .routers import operations, payments

WEB_DIR = Path(__file__).resolve().parent.parent / "web"


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description=(
            "Simple Real-Time Rail (RTR) payment API. Send CAD with amount, payer, and payee. "
            "The API fills in Payments Canada / ISO 20022 identifiers for you."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(payments.router)
    app.include_router(operations.router)

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        fields: dict[str, str] = {}
        first_message = "The request could not be understood."
        for error in exc.errors():
            location = ".".join(str(part) for part in error.get("loc", []) if part != "body")
            message = error.get("msg", "Invalid value").replace("Value error, ", "")
            if location:
                fields[location] = message
            if first_message == "The request could not be understood.":
                first_message = message
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "INVALID_REQUEST",
                    "message": first_message,
                    "hint": "Check the fields object. You only need amount, payer, and payee.",
                    "fields": fields or None,
                }
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict):
            return JSONResponse(status_code=exc.status_code, content={"error": detail})
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": "HTTP_ERROR", "message": str(detail)}},
        )

    @app.get("/v1/ready", tags=["Operations"], include_in_schema=True)
    async def ready() -> dict:
        return {"ok": True, "service": settings.app_name}

    if WEB_DIR.exists():
        app.mount("/static", StaticFiles(directory=WEB_DIR), name="static")

        @app.get("/", include_in_schema=False)
        async def sandbox() -> FileResponse:
            return FileResponse(WEB_DIR / "index.html")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)

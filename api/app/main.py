from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.routers import inspections, findings, corrective_actions, reports, templates


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="GovSBN API",
        description="Government Inspection & Operational Reporting Platform API",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(inspections.router, prefix="/api/v1")
    app.include_router(findings.router, prefix="/api/v1")
    app.include_router(corrective_actions.router, prefix="/api/v1")
    app.include_router(reports.router, prefix="/api/v1")
    app.include_router(templates.router, prefix="/api/v1")

    @app.get("/")
    async def root():
        return {
            "service": "GovSBN API",
            "version": "1.0.0",
            "status": "operational",
        }

    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    return app


app = create_app()

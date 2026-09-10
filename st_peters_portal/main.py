"""Main application entrypoint: sets up FastAPI, middleware, and router inclusion."""
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from st_peters_portal.database import create_db_and_tables
from st_peters_portal.routers import auth, results, scores, students, subjects


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager: initializes database schema on startup."""
    create_db_and_tables()
    yield


# Custom middleware adding X-Process-Time header to every HTTP response (The Bar: Item 6)
class ProcessTimeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.6f}s"
        return response


# OpenAPI metadata & docs configuration (The Bar: Item 8)
tags_metadata = [
    {"name": "Auth", "description": "Authentication and JWT token acquisition."},
    {"name": "Students", "description": "Student academic profiles and results retrieval."},
    {"name": "Subjects", "description": "Curriculum management and teacher/student assignments."},
    {"name": "Scores", "description": "Score recording, corrections, and class statistics."},
    {"name": "Results", "description": "Term publication, background notifications, and threshold reporting."},
]

app = FastAPI(
    title="St. Peter's Result Portal",
    description=(
        "Centralized academic results backend for St. Peter's College. "
        "Replaces spreadsheets with secure, role-governed results processing for teachers, "
        "students, and exams officers."
    ),
    version="1.0.0",
    openapi_tags=tags_metadata,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# 1. Custom Timing Middleware
app.add_middleware(ProcessTimeMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(subjects.router)
app.include_router(scores.router)
app.include_router(results.router)


@app.get("/", tags=["Health"], summary="Service root & health check")
def health_check() -> dict[str, str]:
    """Basic health check and welcome endpoint."""
    return {
        "status": "healthy",
        "service": "St. Peter's Result Portal",
        "documentation": "/docs",
    }

"""Pydantic schemas and Extra Models pattern for St. Peter's Result Portal."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from st_peters_portal.models import Role


def compute_grade(score: int) -> str:
    """Derive letter grade from score."""
    if score >= 70:
        return "A"
    if score >= 60:
        return "B"
    if score >= 50:
        return "C"
    if score >= 40:
        return "D"
    return "F"


# ---------------------------------------------------------------------------
# Auth / User Schemas
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    username: str = Field(..., examples=["mr_okafor"])
    password: str = Field(..., min_length=6, examples=["TeacherPass123!"])
    role: Role = Field(default=Role.STUDENT, examples=["teacher"])
    full_name: str = Field(..., examples=["Mr. Chidi Okafor"])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "mr_okafor",
                "password": "TeacherPass123!",
                "role": "teacher",
                "full_name": "Mr. Chidi Okafor",
            }
        }
    )


class UserRead(BaseModel):
    id: int
    username: str
    role: Role
    full_name: str
    created_at: datetime


class TokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# Student Schemas
# ---------------------------------------------------------------------------
class StudentCreate(BaseModel):
    user_id: int = Field(..., examples=[2])
    admission_no: str = Field(..., examples=["STP/2026/001"])
    class_level: str = Field(..., examples=["SS2"])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 2,
                "admission_no": "STP/2026/001",
                "class_level": "SS2",
            }
        }
    )


class StudentRead(BaseModel):
    id: int
    user_id: int
    admission_no: str
    class_level: str
    full_name: str


# ---------------------------------------------------------------------------
# Subject Schemas
# ---------------------------------------------------------------------------
class SubjectCreate(BaseModel):
    name: str = Field(..., examples=["Mathematics"])
    code: str = Field(..., examples=["MTH101"])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Mathematics",
                "code": "MTH101",
            }
        }
    )


class SubjectAssignTeacher(BaseModel):
    teacher_id: int = Field(..., examples=[2])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "teacher_id": 2,
            }
        }
    )


class SubjectRead(BaseModel):
    id: int
    name: str
    code: str
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None


class EnrollmentRead(BaseModel):
    id: int
    subject_id: int
    student_id: int
    student_name: str
    admission_no: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Score Schemas
# ---------------------------------------------------------------------------
class ScoreCreate(BaseModel):
    student_id: int = Field(..., examples=[1])
    subject_id: int = Field(..., examples=[1])
    term: str = Field(..., examples=["2026-Term1"])
    score: int = Field(..., ge=0, le=100, examples=[85])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": 1,
                "subject_id": 1,
                "term": "2026-Term1",
                "score": 85,
            }
        }
    )


class ScoreUpdate(BaseModel):
    score: int = Field(..., ge=0, le=100, examples=[92])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "score": 92,
            }
        }
    )


class ScoreRead(BaseModel):
    id: int
    student_id: int
    subject_id: int
    subject_name: str
    term: str
    score: int
    grade: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Results & Statistics Schemas
# ---------------------------------------------------------------------------
class SubjectResultItem(BaseModel):
    subject_id: int
    subject_name: str
    subject_code: str
    score: int
    grade: str


class StudentTermSummary(BaseModel):
    student_id: int
    admission_no: str
    class_level: str
    full_name: str
    term: str
    results: list[SubjectResultItem]
    average_score: float


class SubjectStats(BaseModel):
    subject_id: int
    subject_name: str
    term: str
    highest: int
    lowest: int
    average: float
    total_students: int


class StudentBelowThreshold(BaseModel):
    student_id: int
    student_name: str
    admission_no: str
    subject_id: int
    subject_name: str
    term: str
    score: int
    grade: str


class PublicationRead(BaseModel):
    id: int
    term: str
    published_at: Optional[datetime]
    published_by: Optional[int]


class NotificationRead(BaseModel):
    id: int
    term: str
    student_id: int
    message: str
    created_at: datetime

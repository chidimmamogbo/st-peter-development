"""SQLModel database table definitions for St. Peter's Result Portal."""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


class Role(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    EXAMS_OFFICER = "exams_officer"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    role: Role = Field(default=Role.STUDENT)
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    student: Optional["Student"] = Relationship(back_populates="user")
    subjects: list["Subject"] = Relationship(back_populates="teacher")


class Student(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(unique=True, foreign_key="user.id")
    username: str = Field(default="", index=True)
    admission_no: str = Field(unique=True, index=True)
    class_level: str

    user: Optional[User] = Relationship(back_populates="student")
    scores: list["Score"] = Relationship(back_populates="student")
    enrollments: list["SubjectEnrollment"] = Relationship(back_populates="student")


class Subject(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: str = Field(unique=True, index=True)
    teacher_id: Optional[int] = Field(default=None, foreign_key="user.id")

    teacher: Optional[User] = Relationship(back_populates="subjects")
    scores: list["Score"] = Relationship(back_populates="subject")
    enrollments: list["SubjectEnrollment"] = Relationship(back_populates="subject")


class SubjectEnrollment(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("subject_id", "student_id", name="uq_subject_student"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    subject_id: int = Field(foreign_key="subject.id")
    student_id: int = Field(foreign_key="student.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    subject: Optional[Subject] = Relationship(back_populates="enrollments")
    student: Optional[Student] = Relationship(back_populates="enrollments")


class Score(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("student_id", "subject_id", "term", name="uq_student_subject_term"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id")
    subject_id: int = Field(foreign_key="subject.id")
    term: str = Field(index=True)
    score: int = Field(ge=0, le=100)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    student: Optional[Student] = Relationship(back_populates="scores")
    subject: Optional[Subject] = Relationship(back_populates="scores")


class ResultPublication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    term: str = Field(unique=True, index=True)
    published_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_by: Optional[int] = Field(default=None, foreign_key="user.id")


class NotificationLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    term: str = Field(index=True)
    student_id: int = Field(foreign_key="student.id")
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

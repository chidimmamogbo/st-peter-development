"""Subjects router: creation, teacher assignment, and student subject enrollment."""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from st_peters_portal.database import get_session
from st_peters_portal.dependencies import get_current_user, require_role
from st_peters_portal.models import Role, Student, Subject, SubjectEnrollment, User
from st_peters_portal.schemas import (
    EnrollmentRead,
    SubjectAssignTeacher,
    SubjectCreate,
    SubjectRead,
)

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.post(
    "",
    response_model=SubjectRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new subject (Exams Officer only)",
)
def create_subject(
    subject_in: SubjectCreate,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[User, Depends(require_role(Role.EXAMS_OFFICER))],
) -> SubjectRead:
    """Create a subject offering at St. Peter's College."""
    existing = session.exec(select(Subject).where(Subject.code == subject_in.code)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subject with code '{subject_in.code}' already exists.",
        )

    db_subject = Subject(name=subject_in.name, code=subject_in.code)
    session.add(db_subject)
    session.commit()
    session.refresh(db_subject)

    return SubjectRead(
        id=db_subject.id,  # type: ignore
        name=db_subject.name,
        code=db_subject.code,
        teacher_id=db_subject.teacher_id,
        teacher_name=None,
    )


@router.get(
    "",
    response_model=list[SubjectRead],
    status_code=status.HTTP_200_OK,
    summary="List subjects (all authenticated users)",
)
def list_subjects(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
    mine: Annotated[bool, Query(description="Filter to subjects taught by the caller")] = False,
) -> list[SubjectRead]:
    """List school subjects. Teachers can pass ?mine=true to view only their assigned subjects."""
    query = select(Subject)
    if mine and current_user.role == Role.TEACHER:
        query = query.where(Subject.teacher_id == current_user.id)

    subjects = session.exec(query).all()
    results: list[SubjectRead] = []
    for s in subjects:
        teacher_name = None
        if s.teacher_id:
            teacher = session.get(User, s.teacher_id)
            teacher_name = teacher.full_name if teacher else None
        results.append(
            SubjectRead(
                id=s.id,  # type: ignore
                name=s.name,
                code=s.code,
                teacher_id=s.teacher_id,
                teacher_name=teacher_name,
            )
        )
    return results


@router.patch(
    "/{subject_id}/teacher",
    response_model=SubjectRead,
    status_code=status.HTTP_200_OK,
    summary="Assign a teacher to a subject (Exams Officer only)",
)
def assign_teacher_to_subject(
    subject_id: int,
    assignment: SubjectAssignTeacher,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[User, Depends(require_role(Role.EXAMS_OFFICER))],
) -> SubjectRead:
    """Assign an instructor to a subject."""
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject ID {subject_id} not found.",
        )

    teacher = session.get(User, assignment.teacher_id)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher ID {assignment.teacher_id} not found.",
        )
    if teacher.role != Role.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User '{teacher.username}' does not have the 'teacher' role.",
        )

    subject.teacher_id = assignment.teacher_id
    session.add(subject)
    session.commit()
    session.refresh(subject)

    return SubjectRead(
        id=subject.id,  # type: ignore
        name=subject.name,
        code=subject.code,
        teacher_id=subject.teacher_id,
        teacher_name=teacher.full_name,
    )


@router.post(
    "/{subject_id}/students/{student_id}",
    response_model=EnrollmentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a student into a subject (Assigned teacher or Exams Officer)",
)
def register_student_into_subject(
    subject_id: int,
    student_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EnrollmentRead:
    """
    Register a student into a subject.
    Teachers can only register students into subjects they are assigned to teach (enforces 403).
    """
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject ID {subject_id} not found.",
        )

    # Permission check: must be the assigned teacher or exams officer
    if current_user.role == Role.TEACHER:
        if subject.teacher_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you are not the assigned teacher for this subject.",
            )
    elif current_user.role != Role.EXAMS_OFFICER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: only assigned teachers and exams officers can register students into subjects.",
        )

    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )

    # Check if already enrolled
    existing = session.exec(
        select(SubjectEnrollment).where(
            SubjectEnrollment.subject_id == subject_id,
            SubjectEnrollment.student_id == student_id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student ID {student_id} is already enrolled in subject '{subject.name}'.",
        )

    enrollment = SubjectEnrollment(subject_id=subject_id, student_id=student_id)
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)

    user = session.get(User, student.user_id)
    return EnrollmentRead(
        id=enrollment.id,  # type: ignore
        subject_id=enrollment.subject_id,
        student_id=enrollment.student_id,
        student_name=user.full_name if user else "Unknown",
        admission_no=student.admission_no,
        created_at=enrollment.created_at,
    )


@router.get(
    "/{subject_id}/students",
    response_model=list[EnrollmentRead],
    status_code=status.HTTP_200_OK,
    summary="List registered students in a subject",
)
def list_subject_students(
    subject_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[EnrollmentRead]:
    """List all students registered for this subject."""
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject ID {subject_id} not found.",
        )

    if current_user.role == Role.TEACHER and subject.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you are not the assigned teacher for this subject.",
        )

    enrollments = session.exec(
        select(SubjectEnrollment).where(SubjectEnrollment.subject_id == subject_id)
    ).all()

    results: list[EnrollmentRead] = []
    for enr in enrollments:
        student = session.get(Student, enr.student_id)
        student_name = "Unknown"
        admission_no = ""
        if student:
            admission_no = student.admission_no
            u = session.get(User, student.user_id)
            if u:
                student_name = u.full_name
        results.append(
            EnrollmentRead(
                id=enr.id,  # type: ignore
                subject_id=enr.subject_id,
                student_id=enr.student_id,
                student_name=student_name,
                admission_no=admission_no,
                created_at=enr.created_at,
            )
        )
    return results

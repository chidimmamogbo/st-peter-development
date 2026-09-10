"""Student management and student result query router."""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from st_peters_portal.database import get_session
from st_peters_portal.dependencies import get_current_user, require_role
from st_peters_portal.models import ResultPublication, Role, Score, Student, Subject, User
from st_peters_portal.schemas import (
    StudentCreate,
    StudentRead,
    StudentTermSummary,
    SubjectResultItem,
    compute_grade,
)

router = APIRouter(prefix="/students", tags=["Students"])


@router.post(
    "",
    response_model=StudentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a student profile (Exams Officer only)",
)
def create_student_profile(
    student_in: StudentCreate,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[User, Depends(require_role(Role.EXAMS_OFFICER))],
) -> StudentRead:
    """Create a student academic profile linked to a User account."""
    user = session.get(User, student_in.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID {student_in.user_id} not found.",
        )
    if user.role != Role.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {user.username} does not have the 'student' role.",
        )

    # Check for duplicate student profile
    existing_profile = session.exec(select(Student).where(Student.user_id == student_in.user_id)).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User ID {student_in.user_id} already has a student profile.",
        )

    # Check for duplicate admission number
    existing_adm = session.exec(select(Student).where(Student.admission_no == student_in.admission_no)).first()
    if existing_adm:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Admission number '{student_in.admission_no}' is already registered.",
        )

    db_student = Student(
        user_id=student_in.user_id,
        admission_no=student_in.admission_no,
        class_level=student_in.class_level,
    )
    session.add(db_student)
    session.commit()
    session.refresh(db_student)

    return StudentRead(
        id=db_student.id,  # type: ignore
        user_id=db_student.user_id,
        admission_no=db_student.admission_no,
        class_level=db_student.class_level,
        full_name=user.full_name,
    )


@router.get(
    "",
    response_model=list[StudentRead],
    status_code=status.HTTP_200_OK,
    summary="List all students (Exams Officer only)",
)
def list_students(
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[User, Depends(require_role(Role.EXAMS_OFFICER))],
) -> list[StudentRead]:
    """Retrieve all student profiles across the institution."""
    students = session.exec(select(Student)).all()
    results: list[StudentRead] = []
    for s in students:
        u = session.get(User, s.user_id)
        results.append(
            StudentRead(
                id=s.id,  # type: ignore
                user_id=s.user_id,
                admission_no=s.admission_no,
                class_level=s.class_level,
                full_name=u.full_name if u else "Unknown",
            )
        )
    return results


@router.get(
    "/{student_id}",
    response_model=StudentRead,
    status_code=status.HTTP_200_OK,
    summary="View student profile by ID (Exams Officer only)",
)
def get_student(
    student_id: int,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[User, Depends(require_role(Role.EXAMS_OFFICER))],
) -> StudentRead:
    """Retrieve a specific student's profile details."""
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )
    user = session.get(User, student.user_id)
    return StudentRead(
        id=student.id,  # type: ignore
        user_id=student.user_id,
        admission_no=student.admission_no,
        class_level=student.class_level,
        full_name=user.full_name if user else "Unknown",
    )


@router.get(
    "/{student_id}/results",
    response_model=StudentTermSummary,
    status_code=status.HTTP_200_OK,
    summary="Get student term results (Enforces 403 on ID guessing)",
)
def get_student_results(
    student_id: int,
    term: Annotated[str, Query(description="The academic term, e.g. '2026-Term1'")],
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> StudentTermSummary:
    """
    Retrieve results for a student in a specific term.
    - If caller is a student: verifies student_id matches their own ID. If not, raises 403.
    - If caller is a student: checks if results for this term are published. If not, raises 403.
    - If caller is an exams officer: allowed to inspect any student's results.
    - If caller is a teacher: forbidden (403), teachers only see their own subjects.
    """
    target_student = session.get(Student, student_id)
    if not target_student:
        # If student tries to guess, brief explicitly says: Attempting another student's results is a 403, not a 404
        if current_user.role == Role.STUDENT:
            own_student = session.exec(select(Student).where(Student.user_id == current_user.id)).first()
            if not own_student or own_student.id != student_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: you are not authorized to view results for this student ID.",
                )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )

    # Permission check for students
    if current_user.role == Role.STUDENT:
        own_student = session.exec(select(Student).where(Student.user_id == current_user.id)).first()
        if not own_student or own_student.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you are not authorized to view results for another student.",
            )

        # Ensure term is published
        pub = session.exec(select(ResultPublication).where(ResultPublication.term == term)).first()
        if not pub or not pub.published_at:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Results for term '{term}' have not been officially published yet.",
            )

    elif current_user.role == Role.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teachers cannot view complete student result summaries across all subjects. Check your subject stats instead.",
        )

    # Fetch scores
    scores = session.exec(
        select(Score).where(Score.student_id == student_id, Score.term == term)
    ).all()

    target_user = session.get(User, target_student.user_id)
    items: list[SubjectResultItem] = []
    total_score = 0

    for score in scores:
        subj = session.get(Subject, score.subject_id)
        items.append(
            SubjectResultItem(
                subject_id=score.subject_id,
                subject_name=subj.name if subj else "Unknown",
                subject_code=subj.code if subj else "Unknown",
                score=score.score,
                grade=compute_grade(score.score),
            )
        )
        total_score += score.score

    avg = round(total_score / len(items), 2) if items else 0.0

    return StudentTermSummary(
        student_id=target_student.id,  # type: ignore
        admission_no=target_student.admission_no,
        class_level=target_student.class_level,
        full_name=target_user.full_name if target_user else "Unknown",
        term=term,
        results=items,
        average_score=avg,
    )

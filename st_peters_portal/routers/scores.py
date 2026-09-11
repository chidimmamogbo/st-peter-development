"""Scores router: score entry, corrections, and subject statistics."""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from st_peters_portal.database import get_session
from st_peters_portal.dependencies import get_current_user, require_role
from st_peters_portal.models import Role, Score, Student, Subject, User
from st_peters_portal.schemas import (
    ScoreCreate,
    ScoreRead,
    ScoreUpdate,
    SubjectStats,
    compute_grade,
)

router = APIRouter(prefix="/scores", tags=["Scores"])


@router.get(
    "",
    response_model=list[ScoreRead],
    status_code=status.HTTP_200_OK,
    summary="List and filter scores by term, subject, or student (Bonus ?term= filter)",
)
def list_scores(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
    term: Annotated[Optional[str], Query(description="Filter scores by term, e.g. '2026-Term1'")] = None,
    subject_id: Annotated[Optional[int], Query(description="Filter by subject ID")] = None,
    student_id: Annotated[Optional[int], Query(description="Filter by student ID")] = None,
) -> list[ScoreRead]:
    """
    Bonus Endpoint: List scores with optional ?term=, ?subject_id=, and ?student_id= filters.
    - Teachers can only view scores for subjects assigned to them.
    - Exams Officers can view all scores across the institution.
    - Students are forbidden (403) from querying the bulk scores endpoint.
    """
    if current_user.role == Role.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot access raw score lists. View your term report card instead.",
        )

    query = select(Score)

    # Departmental isolation for teachers
    if current_user.role == Role.TEACHER:
        teacher_subjects = session.exec(
            select(Subject.id).where(Subject.teacher_id == current_user.id)
        ).all()
        query = query.where(Score.subject_id.in_(teacher_subjects))

    if term:
        query = query.where(func.lower(Score.term) == term.strip().lower())
    if subject_id is not None:
        query = query.where(Score.subject_id == subject_id)
    if student_id is not None:
        query = query.where(Score.student_id == student_id)

    scores = session.exec(query).all()
    results: list[ScoreRead] = []
    for sc in scores:
        subj = session.get(Subject, sc.subject_id)
        results.append(
            ScoreRead(
                id=sc.id,  # type: ignore
                student_id=sc.student_id,
                subject_id=sc.subject_id,
                subject_name=subj.name if subj else "Unknown",
                term=sc.term,
                score=sc.score,
                grade=compute_grade(sc.score),
                created_at=sc.created_at,
            )
        )
    return results


@router.post(
    "",
    response_model=ScoreRead,
    status_code=status.HTTP_201_CREATED,
    summary="Enter a student's score (Assigned teacher only)",
)
def enter_score(
    score_in: ScoreCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_role(Role.TEACHER))],
) -> ScoreRead:
    """
    Record a score for a student in a subject for a term.
    - Score is validated at the doorway to 0-100 (422 if invalid).
    - Caller must be assigned teacher for this subject (403 if not).
    - Entering a duplicate score for student+subject+term raises 409 Conflict.
    """
    subject = session.get(Subject, score_in.subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject ID {score_in.subject_id} not found.",
        )

    # Only assigned teacher can enter scores
    if subject.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you can only enter scores for subjects assigned to you.",
        )

    student = session.get(Student, score_in.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {score_in.student_id} not found.",
        )

    # Check for duplicate score entry
    existing = session.exec(
        select(Score).where(
            Score.student_id == score_in.student_id,
            Score.subject_id == score_in.subject_id,
            func.lower(Score.term) == score_in.term.lower(),
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Score already recorded for student {student.admission_no} in subject '{subject.name}' for term '{score_in.term}'.",
        )

    db_score = Score(
        student_id=score_in.student_id,
        subject_id=score_in.subject_id,
        term=score_in.term,
        score=score_in.score,
    )
    session.add(db_score)
    session.commit()
    session.refresh(db_score)

    return ScoreRead(
        id=db_score.id,  # type: ignore
        student_id=db_score.student_id,
        subject_id=db_score.subject_id,
        subject_name=subject.name,
        term=db_score.term,
        score=db_score.score,
        grade=compute_grade(db_score.score),
        created_at=db_score.created_at,
    )


@router.patch(
    "/{score_id}",
    response_model=ScoreRead,
    status_code=status.HTTP_200_OK,
    summary="Correct a recorded score (Assigned teacher only)",
)
def correct_score(
    score_id: int,
    score_update: ScoreUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_role(Role.TEACHER))],
) -> ScoreRead:
    """Correct an existing score entry."""
    score_obj = session.get(Score, score_id)
    if not score_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Score ID {score_id} not found.",
        )

    subject = session.get(Subject, score_obj.subject_id)
    if not subject or subject.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you can only correct scores for subjects assigned to you.",
        )

    score_obj.score = score_update.score
    session.add(score_obj)
    session.commit()
    session.refresh(score_obj)

    return ScoreRead(
        id=score_obj.id,  # type: ignore
        student_id=score_obj.student_id,
        subject_id=score_obj.subject_id,
        subject_name=subject.name,
        term=score_obj.term,
        score=score_obj.score,
        grade=compute_grade(score_obj.score),
        created_at=score_obj.created_at,
    )


@router.get(
    "/subject/{subject_id}/stats",
    response_model=SubjectStats,
    status_code=status.HTTP_200_OK,
    summary="Get subject class statistics (Assigned teacher or Exams Officer)",
)
def get_subject_statistics(
    subject_id: int,
    term: Annotated[str, Query(description="The academic term, e.g. '2026-Term1'")],
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SubjectStats:
    """Calculate class statistics (highest, lowest, average) for a subject in a term."""
    term = term.strip().lower()
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject ID {subject_id} not found.",
        )

    # Permission check: assigned teacher or exams officer
    if current_user.role == Role.TEACHER and subject.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you can only view statistics for subjects assigned to you.",
        )
    elif current_user.role not in (Role.TEACHER, Role.EXAMS_OFFICER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: only teachers and exams officers can view class statistics.",
        )

    scores = session.exec(
        select(Score.score).where(Score.subject_id == subject_id, func.lower(Score.term) == term)
    ).all()

    if not scores:
        return SubjectStats(
            subject_id=subject.id,  # type: ignore
            subject_name=subject.name,
            term=term,
            highest=0,
            lowest=0,
            average=0.0,
            total_students=0,
        )

    highest = max(scores)
    lowest = min(scores)
    average = round(sum(scores) / len(scores), 2)

    return SubjectStats(
        subject_id=subject.id,  # type: ignore
        subject_name=subject.name,
        term=term,
        highest=highest,
        lowest=lowest,
        average=average,
        total_students=len(scores),
    )

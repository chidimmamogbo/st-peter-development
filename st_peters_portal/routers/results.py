"""Results router: term publication, background notification dispatch, and failing student reports."""
from datetime import datetime, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from st_peters_portal.background import notify_students_on_publication
from st_peters_portal.database import get_session
from st_peters_portal.dependencies import require_role
from st_peters_portal.models import (
    NotificationLog,
    ResultPublication,
    Role,
    Score,
    Student,
    Subject,
    User,
)
from st_peters_portal.schemas import (
    NotificationRead,
    PublicationRead,
    StudentBelowThreshold,
    compute_grade,
)

router = APIRouter(prefix="/results", tags=["Results"])


@router.post(
    "/publish/{term}",
    response_model=PublicationRead,
    status_code=status.HTTP_200_OK,
    summary="Publish results for a term and fire background notifications (Exams Officer only)",
)
def publish_term_results(
    term: str,
    background_tasks: BackgroundTasks,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_role(Role.EXAMS_OFFICER))],
) -> PublicationRead:
    """
    Publish a term's results.
    - If term is already published, returns 409 Conflict.
    - Immediately returns HTTP 200 to the exams officer.
    - Dispatches a background task to write notification records per student.
    """
    term = term.strip().lower()
    publication = session.exec(
        select(ResultPublication).where(func.lower(ResultPublication.term) == term)
    ).first()

    if publication and publication.published_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Results for term '{term}' have already been published.",
        )

    now = datetime.now(timezone.utc)
    if not publication:
        publication = ResultPublication(
            term=term,
            published_at=now,
            published_by=current_user.id,
        )
        session.add(publication)
    else:
        publication.published_at = now
        publication.published_by = current_user.id
        session.add(publication)

    session.commit()
    session.refresh(publication)

    # Queue background task to write notifications without delaying response
    background_tasks.add_task(notify_students_on_publication, term)

    return PublicationRead(
        id=publication.id,  # type: ignore
        term=publication.term,
        published_at=publication.published_at,
        published_by=publication.published_by,
    )


@router.get(
    "/below",
    response_model=list[StudentBelowThreshold],
    status_code=status.HTTP_200_OK,
    summary="List students carrying a score below threshold (Exams Officer only)",
)
def get_students_below_threshold(
    term: Annotated[str, Query(description="The academic term, e.g. '2026-Term1'")],
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[User, Depends(require_role(Role.EXAMS_OFFICER))],
    subject_id: Annotated[Optional[int], Query(description="Optional filter by subject")] = None,
    threshold: Annotated[int, Query(description="Score threshold (default 40)", ge=0, le=100)] = 40,
) -> list[StudentBelowThreshold]:
    """Identify students failing any subject (score below threshold, default 40)."""
    term = term.strip().lower()
    query = select(Score).where(func.lower(Score.term) == term, Score.score < threshold)
    if subject_id is not None:
        query = query.where(Score.subject_id == subject_id)

    failing_scores = session.exec(query).all()
    results: list[StudentBelowThreshold] = []

    for sc in failing_scores:
        student = session.get(Student, sc.student_id)
        subject = session.get(Subject, sc.subject_id)
        user = session.get(User, student.user_id) if student else None

        results.append(
            StudentBelowThreshold(
                student_id=sc.student_id,
                student_name=user.full_name if user else "Unknown",
                admission_no=student.admission_no if student else "Unknown",
                subject_id=sc.subject_id,
                subject_name=subject.name if subject else "Unknown",
                term=sc.term,
                score=sc.score,
                grade=compute_grade(sc.score),
            )
        )

    return results


@router.get(
    "/notifications",
    response_model=list[NotificationRead],
    status_code=status.HTTP_200_OK,
    summary="Inspect background task notifications (Exams Officer only)",
)
def list_notifications(
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[User, Depends(require_role(Role.EXAMS_OFFICER))],
    term: Annotated[Optional[str], Query(description="Filter notifications by term")] = None,
) -> list[NotificationRead]:
    """
    Retrieve background notification records to verify the background task's effect live on /docs.
    """
    query = select(NotificationLog)
    if term:
        query = query.where(func.lower(NotificationLog.term) == term.strip().lower())
    query = query.order_by(NotificationLog.id.desc())  # type: ignore

    logs = session.exec(query).all()
    return [
        NotificationRead(
            id=log.id,  # type: ignore
            term=log.term,
            student_id=log.student_id,
            message=log.message,
            created_at=log.created_at,
        )
        for log in logs
    ]

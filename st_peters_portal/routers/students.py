"""Student management and student result query router."""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from st_peters_portal.database import get_session
from st_peters_portal.dependencies import get_current_student, get_current_user, require_role
from st_peters_portal.models import (
    ResultPublication,
    Role,
    Score,
    Student,
    Subject,
    SubjectEnrollment,
    User,
)
from st_peters_portal.schemas import (
    StudentCreate,
    StudentRead,
    StudentTermSummary,
    SubjectResultItem,
    compute_grade,
)
from st_peters_portal.security import hash_password

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
    """
    Create a student academic profile linked to an existing User account (Exams Officer only).
    - User account must be registered first via POST /auth/register with role='student'.
    - Stores both user_id and username in the student table for dual identification.
    """
    # 1. Look up user by user_id
    user = session.get(User, student_in.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID {student_in.user_id} not found. Please register the student user account via POST /auth/register first.",
        )

    # 2. Check role is student
    if user.role != Role.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot create student profile: Target user '{user.username}' (ID {student_in.user_id}) "
                f"has role '{user.role.value}', not 'student'. "
                "Please register a student user via POST /auth/register with role='student' first."
            ),
        )

    # 3. Check username matches the user account
    if user.username.lower() != student_in.username.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Username mismatch: User ID {student_in.user_id} belongs to '{user.username}', "
                f"but you provided username '{student_in.username}'."
            ),
        )

    # 4. Check for duplicate student profile
    existing_profile = session.exec(select(Student).where(Student.user_id == student_in.user_id)).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User ID {student_in.user_id} ('{user.username}') already has a student profile.",
        )

    # 5. Check for duplicate admission number
    existing_adm = session.exec(select(Student).where(Student.admission_no == student_in.admission_no.strip())).first()
    if existing_adm:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Admission number '{student_in.admission_no}' is already registered.",
        )

    db_student = Student(
        user_id=user.id,  # type: ignore
        username=user.username,
        admission_no=student_in.admission_no.strip(),
        class_level=student_in.class_level.strip(),
    )
    session.add(db_student)
    session.commit()
    session.refresh(db_student)

    return StudentRead(
        id=db_student.id,  # type: ignore
        user_id=db_student.user_id,
        username=db_student.username,
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
    subject_id: Annotated[Optional[int], Query(description="Filter to students enrolled in this subject")] = None,
    class_level: Annotated[Optional[str], Query(description="Filter by class level, e.g. 'SS2'")] = None,
) -> list[StudentRead]:
    """Retrieve all student profiles across the institution, with optional filtering by subject or class level."""
    query = select(Student)

    if subject_id is not None:
        subj = session.get(Subject, subject_id)
        if not subj:
            return []
        enrolled_student_ids = session.exec(
            select(SubjectEnrollment.student_id).where(SubjectEnrollment.subject_id == subject_id)
        ).all()
        if not enrolled_student_ids:
            return []
        query = query.where(Student.id.in_(enrolled_student_ids))

    students = session.exec(query).all()

    if class_level:
        target_class = class_level.strip().upper()
        students = [s for s in students if s.class_level and s.class_level.upper() == target_class]

    results: list[StudentRead] = []
    for s in students:
        u = session.get(User, s.user_id)
        results.append(
            StudentRead(
                id=s.id,  # type: ignore
                user_id=s.user_id,
                username=s.username or (u.username if u else ""),
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
        username=student.username or (user.username if user else ""),
        admission_no=student.admission_no,
        class_level=student.class_level,
        full_name=user.full_name if user else "Unknown",
    )


def _build_student_term_summary(
    session: Session,
    target_student: Student,
    term: str,
    check_publication: bool = True,
) -> StudentTermSummary:
    """Internal helper to assemble a student's term report card, computing grades, averages, and teacher names."""
    term = term.strip().lower()

    if check_publication:
        pub = session.exec(select(ResultPublication).where(func.lower(ResultPublication.term) == term)).first()
        if not pub or not pub.published_at:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Results for term '{term}' have not been officially published yet.",
            )

    # Fetch scores
    scores = session.exec(
        select(Score).where(Score.student_id == target_student.id, func.lower(Score.term) == term)
    ).all()

    target_user = session.get(User, target_student.user_id)
    items: list[SubjectResultItem] = []
    total_score = 0

    for score in scores:
        subj = session.get(Subject, score.subject_id)
        teacher = session.get(User, subj.teacher_id) if subj and subj.teacher_id else None
        items.append(
            SubjectResultItem(
                subject_id=score.subject_id,
                subject_name=subj.name if subj else "Unknown",
                subject_code=subj.code if subj else "Unknown",
                score=score.score,
                grade=compute_grade(score.score),
                teacher_name=teacher.full_name if teacher else None,
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


@router.get(
    "/me/results",
    response_model=StudentTermSummary,
    status_code=status.HTTP_200_OK,
    summary="Get caller's own term results (Student only, auto-detected from JWT)",
)
def get_my_results(
    term: Annotated[str, Query(description="The academic term, e.g. '2026-Term1'")],
    session: Annotated[Session, Depends(get_session)],
    current_student: Annotated[Student, Depends(get_current_student)],
) -> StudentTermSummary:
    """
    Retrieve term results for the currently authenticated student.
    - Identity is automatically derived from the caller's JWT token (no student_id needed).
    - Checks that results for this term have been officially published (403 if not).
    """
    return _build_student_term_summary(
        session=session,
        target_student=current_student,
        term=term,
        check_publication=True,
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
    term = term.strip().lower()
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

    elif current_user.role == Role.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teachers cannot view complete student result summaries across all subjects. Check your subject stats instead.",
        )

    return _build_student_term_summary(
        session=session,
        target_student=target_student,
        term=term,
        check_publication=(current_user.role == Role.STUDENT),
    )

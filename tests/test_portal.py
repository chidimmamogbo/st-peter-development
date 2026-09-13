"""Comprehensive automated test suite for St. Peter's Result Portal.
Validates all 10 criteria of The Bar, role permissions, and edge cases.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from st_peters_portal.database import get_session
from st_peters_portal.main import app
from st_peters_portal.models import (
    Role,
    Score,
    Student,
    Subject,
    SubjectEnrollment,
    User,
)
from st_peters_portal.security import hash_password

# Test database setup (in-memory SQLite isolated for testing)
TEST_DATABASE_URL = "sqlite://"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def get_test_session():
    with Session(test_engine) as session:
        yield session


app.dependency_overrides[get_session] = get_test_session
import st_peters_portal.database as db
db.engine = test_engine


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        pwd = hash_password("Secret123!")

        # 1. Exams Officer
        officer = User(
            username="test_officer",
            hashed_password=pwd,
            role=Role.EXAMS_OFFICER,
            full_name="Officer Test",
        )
        # 2. Teachers
        teacher1 = User(
            username="test_teacher1",
            hashed_password=pwd,
            role=Role.TEACHER,
            full_name="Teacher One",
        )
        teacher2 = User(
            username="test_teacher2",
            hashed_password=pwd,
            role=Role.TEACHER,
            full_name="Teacher Two",
        )
        # 3. Students
        student_user1 = User(
            username="test_student1",
            hashed_password=pwd,
            role=Role.STUDENT,
            full_name="Ada Test",
        )
        student_user2 = User(
            username="test_student2",
            hashed_password=pwd,
            role=Role.STUDENT,
            full_name="Obi Test",
        )

        session.add_all([officer, teacher1, teacher2, student_user1, student_user2])
        session.commit()

        # Profiles
        s1 = Student(user_id=student_user1.id, admission_no="STP/T/001", class_level="SS2")  # type: ignore
        s2 = Student(user_id=student_user2.id, admission_no="STP/T/002", class_level="SS2")  # type: ignore
        session.add_all([s1, s2])
        session.commit()

        # Subjects
        sub1 = Subject(name="Mathematics", code="MTH101", teacher_id=teacher1.id)
        sub2 = Subject(name="English", code="ENG101", teacher_id=teacher2.id)
        session.add_all([sub1, sub2])
        session.commit()

        # Enrollment
        session.add(SubjectEnrollment(subject_id=sub1.id, student_id=s1.id))  # type: ignore
        session.add(SubjectEnrollment(subject_id=sub2.id, student_id=s1.id))  # type: ignore
        session.add(SubjectEnrollment(subject_id=sub2.id, student_id=s2.id))  # type: ignore
        session.commit()

    yield
    SQLModel.metadata.drop_all(test_engine)


client = TestClient(app)


def get_token(username: str, password: str = "Secret123!") -> str:
    res = client.post(
        "/auth/token",
        data={"username": username, "password": password},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


# ---------------------------------------------------------------------------
# Bar Item 6: Middleware & Process Time
# ---------------------------------------------------------------------------
def test_timing_middleware():
    res = client.get("/")
    assert res.status_code == 200
    assert "x-process-time" in res.headers
    assert res.headers["x-process-time"].endswith("s")


# ---------------------------------------------------------------------------
# Bar Items 4 & 5: Auth & Role Checking
# ---------------------------------------------------------------------------
def test_auth_invalid_credentials():
    res = client.post(
        "/auth/token",
        data={"username": "test_officer", "password": "WrongPassword!"},
    )
    assert res.status_code == 401


def test_protected_route_without_token():
    res = client.get("/students")
    assert res.status_code == 401


def test_register_user_by_officer_success():
    officer_token = get_token("test_officer")
    res = client.post(
        "/auth/register",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "username": "new_teacher",
            "password": "Password123!",
            "role": "teacher",
            "full_name": "New Teacher",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["username"] == "new_teacher"
    assert "hashed_password" not in data
    assert "password" not in data

    # Attempt duplicate registration -> 409
    dup_res = client.post(
        "/auth/register",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "username": "new_teacher",
            "password": "Password123!",
            "role": "teacher",
            "full_name": "New Teacher",
        },
    )
    assert dup_res.status_code == 409


def test_register_student_and_create_profile_flow():
    officer_token = get_token("test_officer")
    # Step 1: Register student user via /auth/register
    reg_res = client.post(
        "/auth/register",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "username": "ifeanyi1",
            "password": "Secret123!",
            "role": "student",
            "full_name": "Ifeanyi Ibe",
        },
    )
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]

    # Step 2: Create student profile via POST /students with user_id and username
    prof_res = client.post(
        "/students",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "user_id": user_id,
            "username": "ifeanyi1",
            "admission_no": "STP/2026/010",
            "class_level": "SS2",
        },
    )
    assert prof_res.status_code == 201
    data = prof_res.json()
    assert data["user_id"] == user_id
    assert data["username"] == "ifeanyi1"
    assert data["admission_no"] == "STP/2026/010"
    assert data["class_level"] == "SS2"
    assert data["full_name"] == "Ifeanyi Ibe"


def test_role_enforcement_403_for_wrong_role():
    student_token = get_token("test_student1")
    # Student attempting exams officer endpoint
    res = client.post(
        "/subjects",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"name": "Chemistry", "code": "CHM101"},
    )
    assert res.status_code == 403


# ---------------------------------------------------------------------------
# Score Doorway Validation (422) & 201 Creation
# ---------------------------------------------------------------------------
def test_score_doorway_validation_422():
    teacher_token = get_token("test_teacher1")
    # Score > 100
    res = client.post(
        "/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={"student_id": 1, "subject_id": 1, "term": "2026-Term1", "score": 105},
    )
    assert res.status_code == 422

    # Score < 0
    res = client.post(
        "/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={"student_id": 1, "subject_id": 1, "term": "2026-Term1", "score": -10},
    )
    assert res.status_code == 422


def test_teacher_entering_score_for_unassigned_subject_403():
    # Teacher 2 attempting to enter score for Math (assigned to Teacher 1)
    teacher2_token = get_token("test_teacher2")
    res = client.post(
        "/scores",
        headers={"Authorization": f"Bearer {teacher2_token}"},
        json={"student_id": 1, "subject_id": 1, "term": "2026-Term1", "score": 85},
    )
    assert res.status_code == 403


def test_teacher_score_creation_201_and_no_private_fields():
    teacher1_token = get_token("test_teacher1")
    res = client.post(
        "/scores",
        headers={"Authorization": f"Bearer {teacher1_token}"},
        json={"student_id": 1, "subject_id": 1, "term": "2026-Term1", "score": 85},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["score"] == 85
    assert data["grade"] == "A"
    assert "hashed_password" not in data


def test_duplicate_score_409():
    teacher1_token = get_token("test_teacher1")
    # Duplicate score entry for student 1 in subject 1 for 2026-Term1
    res = client.post(
        "/scores",
        headers={"Authorization": f"Bearer {teacher1_token}"},
        json={"student_id": 1, "subject_id": 1, "term": "2026-Term1", "score": 88},
    )
    assert res.status_code == 409


# ---------------------------------------------------------------------------
# Student Results: Deliberate 403 on ID Guessing & Publication Check
# ---------------------------------------------------------------------------
def test_student_guessing_another_student_results_403():
    student1_token = get_token("test_student1")
    # Student 1 trying to view Student 2's results
    res = client.get(
        "/students/2/results?term=2026-Term1",
        headers={"Authorization": f"Bearer {student1_token}"},
    )
    assert res.status_code == 403


def test_student_viewing_unpublished_results_403():
    student1_token = get_token("test_student1")
    # Student 1 viewing own results before term is published
    res = client.get(
        "/students/1/results?term=2026-Term1",
        headers={"Authorization": f"Bearer {student1_token}"},
    )
    assert res.status_code == 403


# ---------------------------------------------------------------------------
# Results Publishing, Background Task & Failing Report
# ---------------------------------------------------------------------------
def test_teacher2_adds_failing_score_and_stats():
    teacher2_token = get_token("test_teacher2")
    # Add score of 35 (below 40) for student 2 in English
    res = client.post(
        "/scores",
        headers={"Authorization": f"Bearer {teacher2_token}"},
        json={"student_id": 2, "subject_id": 2, "term": "2026-Term1", "score": 35},
    )
    assert res.status_code == 201

    # Class stats
    stats_res = client.get(
        "/scores/subject/2/stats?term=2026-Term1",
        headers={"Authorization": f"Bearer {teacher2_token}"},
    )
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["lowest"] == 35
    assert stats["total_students"] == 1


def test_publish_term_and_background_task():
    officer_token = get_token("test_officer")
    # Publish 2026-Term1
    res = client.post(
        "/results/publish/2026-Term1",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["term"] == "2026-term1"
    assert "failing_students" in body
    assert len(body["failing_students"]) >= 1
    assert body["failing_students"][0]["student_id"] == 2
    assert body["failing_students"][0]["score"] == 35

    # Re-publishing same term returns 409
    res_dup = client.post(
        "/results/publish/2026-Term1",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_dup.status_code == 409

    # Inspect background notifications
    notif_res = client.get(
        "/results/notifications?term=2026-Term1",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert notif_res.status_code == 200
    notifications = notif_res.json()
    assert len(notifications) >= 1


def test_student_viewing_published_results():
    student1_token = get_token("test_student1")
    # Verify case-insensitivity: both 2026-term1 and 2026-Term1 succeed
    res_lower = client.get(
        "/students/1/results?term=2026-term1",
        headers={"Authorization": f"Bearer {student1_token}"},
    )
    assert res_lower.status_code == 200

    res = client.get(
        "/students/1/results?term=2026-Term1",
        headers={"Authorization": f"Bearer {student1_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == 1
    assert len(data["results"]) >= 1
    assert data["results"][0]["grade"] == "A"
    assert data["average_score"] == 85.0
    assert data["results"][0]["teacher_name"] == "Teacher One"
    assert "teacher_id" not in data["results"][0]


def test_student_me_results_auto_detects_identity():
    student1_token = get_token("test_student1")
    # Student 1 fetches own results via /me/results without supplying student_id
    res = client.get(
        "/students/me/results?term=2026-Term1",
        headers={"Authorization": f"Bearer {student1_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == 1
    assert data["admission_no"] == "STP/T/001"
    assert data["full_name"] == "Ada Test"
    assert len(data["results"]) >= 1
    assert data["results"][0]["teacher_name"] == "Teacher One"

    # Pre-publication check on /me/results returns 403 for unpublished term
    res_unpub = client.get(
        "/students/me/results?term=2027-Term3",
        headers={"Authorization": f"Bearer {student1_token}"},
    )
    assert res_unpub.status_code == 403

    # Teacher or Exams Officer calling /me/results is forbidden (requires student role)
    teacher1_token = get_token("test_teacher1")
    res_teacher = client.get(
        "/students/me/results?term=2026-Term1",
        headers={"Authorization": f"Bearer {teacher1_token}"},
    )
    assert res_teacher.status_code == 403


def test_failing_students_below_40_report():
    officer_token = get_token("test_officer")
    res = client.get(
        "/results/below?term=2026-Term1&threshold=40",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res.status_code == 200
    failing = res.json()
    assert len(failing) >= 1
    assert failing[0]["student_id"] == 2
    assert failing[0]["score"] == 35
    assert failing[0]["grade"] == "F"


def test_publish_surfaces_failing_students():
    officer_token = get_token("test_officer")
    teacher1_token = get_token("test_teacher1")
    # Teacher 1 adds a failing score for student 1 in 2026-Term2
    client.post(
        "/scores",
        headers={"Authorization": f"Bearer {teacher1_token}"},
        json={"student_id": 1, "subject_id": 1, "term": "2026-Term2", "score": 28},
    )
    # Publish 2026-Term2
    res = client.post(
        "/results/publish/2026-Term2",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["term"] == "2026-term2"
    assert "failing_students" in data
    failing = data["failing_students"]
    assert len(failing) >= 1
    assert any(f["student_id"] == 1 and f["score"] == 28 and f["grade"] == "F" for f in failing)


# ---------------------------------------------------------------------------
# Bonus Features Tests: ?term= filter and Class Ranking Endpoint
# ---------------------------------------------------------------------------
def test_bonus_term_filter_on_scores():
    officer_token = get_token("test_officer")
    res = client.get(
        "/scores?term=2026-Term1",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res.status_code == 200
    scores = res.json()
    assert len(scores) >= 2

    # Verify teacher only sees their assigned subject scores
    teacher1_token = get_token("test_teacher1")
    res_teacher = client.get(
        "/scores?term=2026-Term1",
        headers={"Authorization": f"Bearer {teacher1_token}"},
    )
    assert res_teacher.status_code == 200
    for sc in res_teacher.json():
        assert sc["subject_id"] == 1


def test_bonus_class_ranking_endpoint():
    officer_token = get_token("test_officer")
    res = client.get(
        "/results/rankings?term=2026-Term1",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["term"] == "2026-term1"
    assert data["total_students"] >= 2
    rankings = data["rankings"]
    # Check rank order: rank 1 has highest average score
    assert rankings[0]["rank"] == 1
    assert rankings[0]["average_score"] >= rankings[1]["average_score"]

    # Verify student can also view published class rankings
    student1_token = get_token("test_student1")
    res_student = client.get(
        "/results/rankings?term=2026-Term1",
        headers={"Authorization": f"Bearer {student1_token}"},
    )
    assert res_student.status_code == 200
    assert res_student.json()["total_students"] == data["total_students"]


def test_list_students_filter_by_subject_and_class_level():
    officer_token = get_token("test_officer")
    # 1. Unfiltered returns all students
    res_all = client.get(
        "/students",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_all.status_code == 200
    all_students = res_all.json()
    assert len(all_students) >= 2

    # 2. Case-insensitive class_level filter
    res_ss2 = client.get(
        "/students?class_level=ss2",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_ss2.status_code == 200
    for s in res_ss2.json():
        assert s["class_level"].upper() == "SS2"

    # 3. Class level with no matches
    res_empty_class = client.get(
        "/students?class_level=SS3",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_empty_class.status_code == 200
    assert res_empty_class.json() == []

    # 4. Filter by subject_id (Subject 1 has only Student 1 enrolled)
    res_sub1 = client.get(
        "/students?subject_id=1",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_sub1.status_code == 200
    sub1_students = res_sub1.json()
    assert len(sub1_students) == 1
    assert sub1_students[0]["id"] == 1

    # 5. Filter by subject_id (Subject 2 has Student 1 and Student 2 enrolled)
    res_sub2 = client.get(
        "/students?subject_id=2",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_sub2.status_code == 200
    sub2_student_ids = {s["id"] for s in res_sub2.json()}
    assert 1 in sub2_student_ids and 2 in sub2_student_ids

    # 6. Non-existent subject_id returns empty list (forgiving filter style)
    res_sub_missing = client.get(
        "/students?subject_id=9999",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_sub_missing.status_code == 200
    assert res_sub_missing.json() == []

    # 7. Combined filter (subject_id and class_level)
    res_comb = client.get(
        "/students?subject_id=1&class_level=SS2",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_comb.status_code == 200
    assert len(res_comb.json()) == 1
    assert res_comb.json()[0]["id"] == 1


def test_cors_configuration():
    # 1. Allowed origin receives explicit CORS header and credentials support
    res_allowed = client.options(
        "/",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res_allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert res_allowed.headers.get("access-control-allow-credentials") == "true"

    # 2. Disallowed origin does not receive access-control-allow-origin
    res_disallowed = client.options(
        "/",
        headers={
            "Origin": "http://unauthorized-domain.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res_disallowed.headers.get("access-control-allow-origin") is None


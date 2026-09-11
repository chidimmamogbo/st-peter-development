"""Seed script: initializes database and populates sample demo accounts and data."""
from datetime import datetime, timezone
from st_peters_portal.database import create_db_and_tables, engine
from sqlmodel import SQLModel, Session, select
from st_peters_portal.models import Role, Score, Student, Subject, SubjectEnrollment, User
from st_peters_portal.security import hash_password


def seed_database(custom_engine=None) -> None:
    """Populate initial demo data for St. Peter's Result Portal."""
    target_engine = custom_engine or engine
    print("Creating tables...")
    if custom_engine is None:
        create_db_and_tables()
    else:
        SQLModel.metadata.create_all(target_engine)

    with Session(target_engine) as session:
        # Check if already seeded
        if session.exec(select(User)).first():
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding demo accounts...")
        default_pwd = hash_password("Secret123!")

        # 1. Exams Officer
        officer = User(
            username="officer1",
            hashed_password=default_pwd,
            role=Role.EXAMS_OFFICER,
            full_name="Rev. Fr. Benedict (Exams Officer)",
        )
        session.add(officer)

        # 2. Teachers
        teacher_math = User(
            username="teacher_math",
            hashed_password=default_pwd,
            role=Role.TEACHER,
            full_name="Mr. Emeka Obi (Mathematics)",
        )
        teacher_eng = User(
            username="teacher_eng",
            hashed_password=default_pwd,
            role=Role.TEACHER,
            full_name="Mrs. Ngozi Eze (English)",
        )
        session.add_all([teacher_math, teacher_eng])

        # 3. Students (User accounts)
        user_ada = User(
            username="student_ada",
            hashed_password=default_pwd,
            role=Role.STUDENT,
            full_name="Ada Okafor",
        )
        user_obi = User(
            username="student_obi",
            hashed_password=default_pwd,
            role=Role.STUDENT,
            full_name="Obi Daniel",
        )
        user_chi = User(
            username="student_chi",
            hashed_password=default_pwd,
            role=Role.STUDENT,
            full_name="Chidinma Kalu",
        )
        session.add_all([user_ada, user_obi, user_chi])
        session.commit()

        # 4. Student Profiles
        student_ada = Student(
            user_id=user_ada.id,  # type: ignore
            username=user_ada.username,
            admission_no="STP/2026/001",
            class_level="SS2",
        )
        student_obi = Student(
            user_id=user_obi.id,  # type: ignore
            username=user_obi.username,
            admission_no="STP/2026/002",
            class_level="SS2",
        )
        student_chi = Student(
            user_id=user_chi.id,  # type: ignore
            username=user_chi.username,
            admission_no="STP/2026/003",
            class_level="SS2",
        )
        session.add_all([student_ada, student_obi, student_chi])
        session.commit()

        # 5. Subjects
        sub_math = Subject(
            name="Mathematics",
            code="MTH101",
            teacher_id=teacher_math.id,
        )
        sub_eng = Subject(
            name="English Language",
            code="ENG101",
            teacher_id=teacher_eng.id,
        )
        sub_phy = Subject(
            name="Physics",
            code="PHY101",
            teacher_id=teacher_math.id,
        )
        session.add_all([sub_math, sub_eng, sub_phy])
        session.commit()

        # 6. Enrollments
        enrollments = [
            SubjectEnrollment(subject_id=sub_math.id, student_id=student_ada.id),  # type: ignore
            SubjectEnrollment(subject_id=sub_eng.id, student_id=student_ada.id),  # type: ignore
            SubjectEnrollment(subject_id=sub_phy.id, student_id=student_ada.id),  # type: ignore
            SubjectEnrollment(subject_id=sub_math.id, student_id=student_obi.id),  # type: ignore
            SubjectEnrollment(subject_id=sub_eng.id, student_id=student_obi.id),  # type: ignore
            SubjectEnrollment(subject_id=sub_math.id, student_id=student_chi.id),  # type: ignore
            SubjectEnrollment(subject_id=sub_phy.id, student_id=student_chi.id),  # type: ignore
        ]
        session.add_all(enrollments)

        # 7. Scores for 2026-term1
        term = "2026-term1"
        scores = [
            # Ada: High performer
            Score(student_id=student_ada.id, subject_id=sub_math.id, term=term, score=88),  # type: ignore
            Score(student_id=student_ada.id, subject_id=sub_eng.id, term=term, score=79),  # type: ignore
            Score(student_id=student_ada.id, subject_id=sub_phy.id, term=term, score=92),  # type: ignore
            # Obi: English score below 40
            Score(student_id=student_obi.id, subject_id=sub_math.id, term=term, score=54),  # type: ignore
            Score(student_id=student_obi.id, subject_id=sub_eng.id, term=term, score=34),  # type: ignore
            # Chidinma: Physics score below 40
            Score(student_id=student_chi.id, subject_id=sub_math.id, term=term, score=62),  # type: ignore
            Score(student_id=student_chi.id, subject_id=sub_phy.id, term=term, score=38),  # type: ignore
        ]
        session.add_all(scores)
        session.commit()

        print("Seeding complete! Initial demo data loaded successfully.")


if __name__ == "__main__":
    seed_database()

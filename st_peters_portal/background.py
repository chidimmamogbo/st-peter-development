"""Background task workers for St. Peter's Result Portal."""
from datetime import datetime, timezone
from pathlib import Path
from sqlmodel import Session, select, func

from st_peters_portal import database as db
from st_peters_portal.models import NotificationLog, Score, Student

LOG_FILE = Path("notifications.log")


def notify_students_on_publication(term: str) -> None:
    """
    Background worker executed after the exams officer publishes term results.
    Generates notification records in DB and appends to the notification audit log.
    Runs asynchronously without holding up the HTTP response.
    """
    with Session(db.engine) as session:
        # Find distinct student IDs who have scores for this term
        student_ids = session.exec(
            select(Score.student_id).where(func.lower(Score.term) == term.strip().lower()).distinct()
        ).all()

        notifications: list[NotificationLog] = []
        log_lines: list[str] = []
        timestamp = datetime.now(timezone.utc).isoformat()

        for student_id in student_ids:
            student = session.get(Student, student_id)
            student_ref = student.admission_no if student else f"ID:{student_id}"
            msg = f"Results for term '{term}' have been officially published. Your grades are now ready for viewing."

            notif = NotificationLog(
                term=term,
                student_id=student_id,
                message=msg,
            )
            notifications.append(notif)
            log_lines.append(f"[{timestamp}] NOTIFY student {student_ref} (id={student_id}): {msg}\n")

        if notifications:
            session.add_all(notifications)
            session.commit()

        # Append to audit file for external inspection if needed
        try:
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.writelines(log_lines)
        except OSError:
            pass

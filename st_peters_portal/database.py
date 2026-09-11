from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = "sqlite:///./st_peters.db"

# connect_args={"check_same_thread": False} is required for SQLite in FastAPI
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables() -> None:
    """Create all registered SQLModel tables in SQLite and ensure migrations."""
    SQLModel.metadata.create_all(engine)
    try:
        with engine.connect() as conn:
            cursor = conn.exec_driver_sql("PRAGMA table_info(student)")
            columns = [row[1] for row in cursor.fetchall()]
            if columns and "username" not in columns:
                conn.exec_driver_sql("ALTER TABLE student ADD COLUMN username VARCHAR DEFAULT ''")
                conn.exec_driver_sql(
                    "UPDATE student SET username = (SELECT username FROM user WHERE user.id = student.user_id)"
                )
                conn.commit()
    except Exception:
        pass


def get_session():
    """Provide a transactional database session per request."""
    with Session(engine) as session:
        yield session

"""Database engine, table initialization, and session dependency."""
from collections.abc import Generator
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = "sqlite:///./st_peters.db"

# connect_args={"check_same_thread": False} is required for SQLite in FastAPI
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables() -> None:
    """Create all registered SQLModel tables in SQLite."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Provide a transactional database session per request."""
    with Session(engine) as session:
        yield session

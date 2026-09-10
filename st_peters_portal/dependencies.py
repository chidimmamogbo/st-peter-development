"""Reusable FastAPI dependencies for authentication and role-based access control."""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from jwt.exceptions import InvalidTokenError
from sqlmodel import Session, select

from st_peters_portal.database import get_session
from st_peters_portal.models import Role, Student, User
from st_peters_portal.security import decode_access_token, oauth2_scheme


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> User:
    """Validate JWT token, retrieve authenticated user from database, or raise 401."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(*allowed_roles: Role):
    """Dependency factory enforcing caller role membership. Raises 403 if disallowed."""
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker


def get_current_student(
    current_user: Annotated[User, Depends(require_role(Role.STUDENT))],
    session: Annotated[Session, Depends(get_session)],
) -> Student:
    """Retrieve the student profile corresponding to the currently authenticated student user."""
    student = session.exec(select(Student).where(Student.user_id == current_user.id)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this user account",
        )
    return student

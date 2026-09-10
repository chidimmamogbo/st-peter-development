"""Authentication router for token generation and user registration."""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from st_peters_portal.database import get_session
from st_peters_portal.dependencies import get_current_user
from st_peters_portal.models import Role, User
from st_peters_portal.schemas import TokenRead, UserCreate, UserRead
from st_peters_portal.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register_user(
    user_in: UserCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User | None, Depends(get_current_user)] = None,
) -> UserRead:
    """
    Create a new user (student, teacher, or exams_officer).
    If users already exist, only an exams_officer can register accounts.
    If database is empty, permits bootstrap registration.
    """
    # Check if this is initial bootstrapping
    existing_user_count = session.exec(select(User)).first()
    if existing_user_count is not None:
        if current_user is None or current_user.role != Role.EXAMS_OFFICER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only exams officers can register new accounts.",
            )

    # Check for username conflict
    existing_user = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{user_in.username}' is already taken.",
        )

    db_user = User(
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        full_name=user_in.full_name,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return UserRead.model_validate(db_user)


@router.post(
    "/token",
    response_model=TokenRead,
    status_code=status.HTTP_200_OK,
    summary="Sign in and obtain JWT access token",
)
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[Session, Depends(get_session)],
) -> TokenRead:
    """OAuth2 password flow: exchange username and password for a signed JWT token."""
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "user_id": user.id}
    )
    return TokenRead(access_token=access_token, token_type="bearer")

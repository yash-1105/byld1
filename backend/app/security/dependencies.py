from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.db.models.user import User
from app.security.auth import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def auth_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message},
        headers={"WWW-Authenticate": "Bearer"} if status_code == status.HTTP_401_UNAUTHORIZED else None,
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    credentials_exception = auth_error(
        status.HTTP_401_UNAUTHORIZED,
        "invalid_credentials",
        "Could not validate credentials",
    )
    if credentials is None:
        raise credentials_exception
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise credentials_exception
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


OptionalCurrentUser = Annotated[User | None, Depends(get_optional_current_user)]

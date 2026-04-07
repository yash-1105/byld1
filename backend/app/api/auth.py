import hashlib
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.db.models.user import RefreshToken, User
from app.schemas.auth import AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, UserResponse
from app.security.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.security.dependencies import CurrentUser, OptionalCurrentUser

router = APIRouter()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})


def _auth_response(user: User, access_token: str, refresh_token: str) -> dict:
    return {
        "success": True,
        "data": AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        ).model_dump(),
        "meta": {},
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise _error(status.HTTP_400_BAD_REQUEST, "email_already_registered", "Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
    )
    db.add(user)
    await db.flush()  # get user.id without committing

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    from jose import jwt as _jwt
    from app.config import settings
    payload = _jwt.decode(refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(refresh_token),
        expires_at=expires_at,
        created_at=datetime.now(timezone.utc),
    ))
    await db.commit()
    await db.refresh(user)

    return _auth_response(user, access_token, refresh_token)


@router.post("/login")
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(User).where(User.email == body.email, User.is_deleted.is_(False))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise _error(status.HTTP_401_UNAUTHORIZED, "invalid_credentials", "Invalid credentials")
    if not user.is_active:
        raise _error(status.HTTP_403_FORBIDDEN, "account_inactive", "Account is inactive")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    from jose import jwt as _jwt
    from app.config import settings
    payload = _jwt.decode(refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(refresh_token),
        expires_at=expires_at,
        created_at=datetime.now(timezone.utc),
    ))
    await db.commit()

    return _auth_response(user, access_token, refresh_token)


@router.post("/refresh")
async def refresh(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    credentials_exception = _error(
        status.HTTP_401_UNAUTHORIZED,
        "invalid_refresh_token",
        "Invalid or expired refresh token",
    )
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise credentials_exception
        user_id = uuid.UUID(payload["sub"])
    except Exception:
        raise credentials_exception

    token_hash = _hash_token(body.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
        )
    )
    stored = result.scalar_one_or_none()
    if not stored or stored.expires_at < datetime.now(timezone.utc):
        raise credentials_exception

    user_result = await db.execute(
        select(User).where(User.id == user_id, User.is_active.is_(True))
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise credentials_exception

    # Revoke old token, issue new pair
    stored.revoked = True
    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})

    from jose import jwt as _jwt
    from app.config import settings
    new_payload = _jwt.decode(new_refresh, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    new_expires = datetime.fromtimestamp(new_payload["exp"], tz=timezone.utc)

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(new_refresh),
        expires_at=new_expires,
        created_at=datetime.now(timezone.utc),
    ))
    await db.commit()

    return _auth_response(user, new_access, new_refresh)


@router.get("/me")
async def me(current_user: CurrentUser):
    return {
        "success": True,
        "data": UserResponse.model_validate(current_user).model_dump(),
        "meta": {},
    }


@router.post("/logout")
async def logout(
    db: Annotated[AsyncSession, Depends(get_db)],
    body: RefreshRequest | None = None,
    current_user: OptionalCurrentUser = None,
):
    changed = False
    if body is not None:
        token_hash = _hash_token(body.refresh_token)
        result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        stored = result.scalar_one_or_none()
        if stored:
            stored.revoked = True
            changed = True
    elif current_user is not None:
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == current_user.id,
                RefreshToken.revoked.is_(False),
            )
        )
        for token in result.scalars():
            token.revoked = True
            changed = True
    if changed:
        await db.commit()
    return {"success": True, "data": None, "meta": {}}

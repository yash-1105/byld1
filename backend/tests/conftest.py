import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.config import settings
from app.db.base import Base
from app.db.models import *  # noqa: F401, F403 — ensure all models are registered
from app.main import app

TEST_DATABASE_URL = settings.DATABASE_URL.rsplit("/", 1)[0] + "/byld_test"


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    admin_url = settings.DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
    admin_engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
    async with admin_engine.connect() as conn:
        exists = await conn.execute(text("SELECT 1 FROM pg_database WHERE datname = 'byld_test'"))
        if exists.scalar() is None:
            await conn.execute(text("CREATE DATABASE byld_test"))
    await admin_engine.dispose()

    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

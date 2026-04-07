import uuid

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.enums import SiteUpdateType


class SiteUpdate(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "site_updates"
    __table_args__ = (
        Index("ix_site_updates_project_id", "project_id"),
        Index("ix_site_updates_created_by_id", "created_by_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    update_type: Mapped[SiteUpdateType] = mapped_column(
        String(50), default=SiteUpdateType.PROGRESS, nullable=False
    )
    image_keys: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="site_updates")  # noqa: F821
    created_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="site_updates_created", foreign_keys=[created_by_id]
    )


class SiteLogbookEntry(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "site_logbook_entries"
    __table_args__ = (
        Index("ix_site_logbook_entries_project_id", "project_id"),
        Index("ix_site_logbook_entries_created_by_id", "created_by_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    entry_date: Mapped[str] = mapped_column(String(20), nullable=False)
    weather: Mapped[str | None] = mapped_column(String(100), nullable=True)
    workers_on_site: Mapped[int | None] = mapped_column(nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped["Project"] = relationship(back_populates="logbook_entries")  # noqa: F821
    created_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="logbook_entries_created", foreign_keys=[created_by_id]
    )

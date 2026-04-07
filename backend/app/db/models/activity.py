import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin
from app.db.enums import ActivityAction, NotificationType


class ActivityLog(UUIDMixin, Base):
    __tablename__ = "activity_logs"
    __table_args__ = (
        Index("ix_activity_logs_project_id", "project_id"),
        Index("ix_activity_logs_user_id", "user_id"),
        Index("ix_activity_logs_created_at", "created_at"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    action: Mapped[ActivityAction] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    detail: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="activity_logs")  # noqa: F821
    user: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="activity_logs", foreign_keys=[user_id]
    )


class Notification(UUIDMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_project_id", "project_id"),
        Index("ix_notifications_is_read", "is_read"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True
    )

    notification_type: Mapped[NotificationType] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    entity_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="notifications")  # noqa: F821
    project: Mapped["Project | None"] = relationship(  # noqa: F821
        back_populates="notifications", foreign_keys=[project_id]
    )

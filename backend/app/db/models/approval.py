import uuid

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.enums import ApprovalStatus


class Approval(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "approvals"
    __table_args__ = (
        Index("ix_approvals_project_id", "project_id"),
        Index("ix_approvals_status", "status"),
        Index("ix_approvals_task_id", "task_id"),
        Index("ix_approvals_requested_by_id", "requested_by_id"),
        Index("ix_approvals_reviewed_by_id", "reviewed_by_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True
    )
    requested_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApprovalStatus] = mapped_column(
        String(50), default=ApprovalStatus.PENDING, nullable=False
    )
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped["Project"] = relationship(back_populates="approvals")  # noqa: F821
    task: Mapped["Task | None"] = relationship(back_populates="approvals")  # noqa: F821
    requested_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="approvals_requested", foreign_keys=[requested_by_id]
    )
    reviewed_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="approvals_reviewed", foreign_keys=[reviewed_by_id]
    )

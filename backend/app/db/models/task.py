import uuid

from sqlalchemy import Date, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.enums import TaskPriority, TaskStatus


class Task(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_project_id", "project_id"),
        Index("ix_tasks_status", "status"),
        Index("ix_tasks_assignee_id", "assignee_id"),
        Index("ix_tasks_stage_id", "stage_id"),
        Index("ix_tasks_created_by_id", "created_by_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    stage_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project_stages.id", ondelete="SET NULL"), nullable=True
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(
        String(50), default=TaskStatus.TODO, nullable=False
    )
    priority: Mapped[TaskPriority] = mapped_column(
        String(50), default=TaskPriority.MEDIUM, nullable=False
    )
    due_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)

    project: Mapped["Project"] = relationship(back_populates="tasks")  # noqa: F821
    stage: Mapped["ProjectStage | None"] = relationship(back_populates="tasks")  # noqa: F821
    assignee: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="tasks_assigned", foreign_keys=[assignee_id]
    )
    created_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="tasks_created", foreign_keys=[created_by_id]
    )
    approvals: Mapped[list["Approval"]] = relationship(back_populates="task")  # noqa: F821

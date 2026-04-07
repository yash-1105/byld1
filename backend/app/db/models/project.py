import uuid

from sqlalchemy import Date, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.enums import ProjectMemberRole, ProjectStatus


class Project(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        String(50), default=ProjectStatus.ACTIVE, nullable=False, index=True
    )
    cover_image_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    start_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)

    # relationships
    members: Mapped[list["ProjectMember"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    stages: Mapped[list["ProjectStage"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", order_by="ProjectStage.order"
    )
    tasks: Mapped[list["Task"]] = relationship(back_populates="project")  # noqa: F821
    approvals: Mapped[list["Approval"]] = relationship(back_populates="project")  # noqa: F821
    site_updates: Mapped[list["SiteUpdate"]] = relationship(back_populates="project")  # noqa: F821
    logbook_entries: Mapped[list["SiteLogbookEntry"]] = relationship(back_populates="project")  # noqa: F821
    documents: Mapped[list["Document"]] = relationship(back_populates="project")  # noqa: F821
    contracts: Mapped[list["Contract"]] = relationship(back_populates="project")  # noqa: F821
    budget_entries: Mapped[list["BudgetEntry"]] = relationship(back_populates="project")  # noqa: F821
    payment_milestones: Mapped[list["PaymentMilestone"]] = relationship(back_populates="project")  # noqa: F821
    activity_logs: Mapped[list["ActivityLog"]] = relationship(back_populates="project")  # noqa: F821
    design_decisions: Mapped[list["DesignDecision"]] = relationship(back_populates="project")  # noqa: F821
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        back_populates="project", foreign_keys="[Notification.project_id]"
    )


class ProjectMember(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "project_members"
    __table_args__ = (
        Index("ix_project_members_project_id", "project_id"),
        Index("ix_project_members_user_id", "user_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[ProjectMemberRole] = mapped_column(
        String(50), default=ProjectMemberRole.MEMBER, nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="project_memberships")  # noqa: F821


class ProjectStage(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "project_stages"
    __table_args__ = (Index("ix_project_stages_project_id", "project_id"),)

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(default=0, nullable=False)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="stages")
    tasks: Mapped[list["Task"]] = relationship(back_populates="stage")  # noqa: F821

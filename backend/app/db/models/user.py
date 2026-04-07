import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.enums import UserRole


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(String(50), nullable=False)
    avatar_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── auth ──────────────────────────────────────────────────────────────
    project_memberships: Mapped[list["ProjectMember"]] = relationship(  # noqa: F821
        back_populates="user"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list["ActivityLog"]] = relationship(  # noqa: F821
        back_populates="user", foreign_keys="[ActivityLog.user_id]"
    )

    # ── tasks ─────────────────────────────────────────────────────────────
    tasks_assigned: Mapped[list["Task"]] = relationship(  # noqa: F821
        back_populates="assignee", foreign_keys="[Task.assignee_id]"
    )
    tasks_created: Mapped[list["Task"]] = relationship(  # noqa: F821
        back_populates="created_by", foreign_keys="[Task.created_by_id]"
    )

    # ── approvals ─────────────────────────────────────────────────────────
    approvals_requested: Mapped[list["Approval"]] = relationship(  # noqa: F821
        back_populates="requested_by", foreign_keys="[Approval.requested_by_id]"
    )
    approvals_reviewed: Mapped[list["Approval"]] = relationship(  # noqa: F821
        back_populates="reviewed_by", foreign_keys="[Approval.reviewed_by_id]"
    )

    # ── contracts ─────────────────────────────────────────────────────────
    contracts_created: Mapped[list["Contract"]] = relationship(  # noqa: F821
        back_populates="created_by", foreign_keys="[Contract.created_by_id]"
    )
    contracts_as_contractor: Mapped[list["Contract"]] = relationship(  # noqa: F821
        back_populates="contractor", foreign_keys="[Contract.contractor_id]"
    )
    change_orders_requested: Mapped[list["ChangeOrder"]] = relationship(  # noqa: F821
        back_populates="requested_by", foreign_keys="[ChangeOrder.requested_by_id]"
    )
    change_orders_reviewed: Mapped[list["ChangeOrder"]] = relationship(  # noqa: F821
        back_populates="reviewed_by", foreign_keys="[ChangeOrder.reviewed_by_id]"
    )

    # ── documents ─────────────────────────────────────────────────────────
    documents_uploaded: Mapped[list["Document"]] = relationship(  # noqa: F821
        back_populates="uploaded_by", foreign_keys="[Document.uploaded_by_id]"
    )
    design_decisions_created: Mapped[list["DesignDecision"]] = relationship(  # noqa: F821
        back_populates="created_by", foreign_keys="[DesignDecision.created_by_id]"
    )

    # ── finance ───────────────────────────────────────────────────────────
    budget_entries_created: Mapped[list["BudgetEntry"]] = relationship(  # noqa: F821
        back_populates="created_by", foreign_keys="[BudgetEntry.created_by_id]"
    )
    payment_milestones_created: Mapped[list["PaymentMilestone"]] = relationship(  # noqa: F821
        back_populates="created_by", foreign_keys="[PaymentMilestone.created_by_id]"
    )

    # ── site ──────────────────────────────────────────────────────────────
    site_updates_created: Mapped[list["SiteUpdate"]] = relationship(  # noqa: F821
        back_populates="created_by", foreign_keys="[SiteUpdate.created_by_id]"
    )
    logbook_entries_created: Mapped[list["SiteLogbookEntry"]] = relationship(  # noqa: F821
        back_populates="created_by", foreign_keys="[SiteLogbookEntry.created_by_id]"
    )


class RefreshToken(UUIDMixin, Base):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")

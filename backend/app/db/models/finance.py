import uuid

from sqlalchemy import Date, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.enums import BudgetEntryStatus, BudgetEntryType, MilestoneStatus


class BudgetEntry(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "budget_entries"
    __table_args__ = (
        Index("ix_budget_entries_project_id", "project_id"),
        Index("ix_budget_entries_created_by_id", "created_by_id"),
        Index("ix_budget_entries_entry_type", "entry_type"),
        Index("ix_budget_entries_contract_id", "contract_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    contract_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True
    )

    entry_type: Mapped[BudgetEntryType] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    entry_date: Mapped[str] = mapped_column(Date, nullable=False)
    status: Mapped[BudgetEntryStatus] = mapped_column(
        String(50), default=BudgetEntryStatus.PENDING, nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="budget_entries")  # noqa: F821
    created_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="budget_entries_created", foreign_keys=[created_by_id]
    )


class PaymentMilestone(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payment_milestones"
    __table_args__ = (
        Index("ix_payment_milestones_project_id", "project_id"),
        Index("ix_payment_milestones_status", "status"),
        Index("ix_payment_milestones_contract_id", "contract_id"),
        Index("ix_payment_milestones_created_by_id", "created_by_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    contract_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    due_date: Mapped[str] = mapped_column(Date, nullable=False)
    paid_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    status: Mapped[MilestoneStatus] = mapped_column(
        String(50), default=MilestoneStatus.UPCOMING, nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="payment_milestones")  # noqa: F821
    created_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="payment_milestones_created", foreign_keys=[created_by_id]
    )

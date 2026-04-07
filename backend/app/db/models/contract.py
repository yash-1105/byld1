import uuid

from sqlalchemy import Date, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.enums import ChangeOrderStatus, ContractStatus


class Contract(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "contracts"
    __table_args__ = (
        Index("ix_contracts_project_id", "project_id"),
        Index("ix_contracts_status", "status"),
        Index("ix_contracts_contractor_id", "contractor_id"),
        Index("ix_contracts_created_by_id", "created_by_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    contractor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ContractStatus] = mapped_column(
        String(50), default=ContractStatus.DRAFT, nullable=False
    )
    contract_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    start_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    object_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)

    project: Mapped["Project"] = relationship(back_populates="contracts")  # noqa: F821
    contractor: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="contracts_as_contractor", foreign_keys=[contractor_id]
    )
    created_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="contracts_created", foreign_keys=[created_by_id]
    )
    change_orders: Mapped[list["ChangeOrder"]] = relationship(
        back_populates="contract", cascade="all, delete-orphan"
    )


class ChangeOrder(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "change_orders"
    __table_args__ = (
        Index("ix_change_orders_project_id", "project_id"),
        Index("ix_change_orders_contract_id", "contract_id"),
        Index("ix_change_orders_status", "status"),
        Index("ix_change_orders_requested_by_id", "requested_by_id"),
        Index("ix_change_orders_reviewed_by_id", "reviewed_by_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False
    )
    requested_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ChangeOrderStatus] = mapped_column(
        String(50), default=ChangeOrderStatus.PROPOSED, nullable=False
    )
    cost_impact: Mapped[float | None] = mapped_column(Float, nullable=True)
    schedule_impact_days: Mapped[int | None] = mapped_column(nullable=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    contract: Mapped["Contract"] = relationship(back_populates="change_orders")
    requested_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="change_orders_requested", foreign_keys=[requested_by_id]
    )
    reviewed_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="change_orders_reviewed", foreign_keys=[reviewed_by_id]
    )

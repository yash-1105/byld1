import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.enums import DesignDecisionStatus, DocumentCategory


class Document(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_project_id", "project_id"),
        Index("ix_documents_uploaded_by_id", "uploaded_by_id"),
        Index("ix_documents_category", "category"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[DocumentCategory] = mapped_column(
        String(50), default=DocumentCategory.OTHER, nullable=False
    )
    object_key: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(200), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    project: Mapped["Project"] = relationship(back_populates="documents")  # noqa: F821
    uploaded_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="documents_uploaded", foreign_keys=[uploaded_by_id]
    )
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    design_decision_links: Mapped[list["DesignDecisionDocument"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(UUIDMixin, Base):
    __tablename__ = "document_chunks"
    __table_args__ = (Index("ix_document_chunks_document_id", "document_id"),)

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(ARRAY(Float), nullable=True)

    document: Mapped["Document"] = relationship(back_populates="chunks")


class DesignDecision(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "design_decisions"
    __table_args__ = (
        Index("ix_design_decisions_project_id", "project_id"),
        Index("ix_design_decisions_created_by_id", "created_by_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[DesignDecisionStatus] = mapped_column(
        String(50), default=DesignDecisionStatus.OPEN, nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="design_decisions")  # noqa: F821
    created_by: Mapped["User | None"] = relationship(  # noqa: F821
        back_populates="design_decisions_created", foreign_keys=[created_by_id]
    )
    document_links: Mapped[list["DesignDecisionDocument"]] = relationship(
        back_populates="design_decision", cascade="all, delete-orphan"
    )


class DesignDecisionDocument(UUIDMixin, Base):
    __tablename__ = "design_decision_documents"
    __table_args__ = (
        Index("ix_ddd_design_decision_id", "design_decision_id"),
        Index("ix_ddd_document_id", "document_id"),
    )

    design_decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("design_decisions.id", ondelete="CASCADE"), nullable=False
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )

    design_decision: Mapped["DesignDecision"] = relationship(back_populates="document_links")
    document: Mapped["Document"] = relationship(back_populates="design_decision_links")

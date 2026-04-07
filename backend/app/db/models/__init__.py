# Import all models here so Alembic autogenerate detects them via Base.metadata
from app.db.models.activity import ActivityLog, Notification
from app.db.models.approval import Approval
from app.db.models.contract import ChangeOrder, Contract
from app.db.models.document import DesignDecision, DesignDecisionDocument, Document, DocumentChunk
from app.db.models.finance import BudgetEntry, PaymentMilestone
from app.db.models.project import Project, ProjectMember, ProjectStage
from app.db.models.site import SiteLogbookEntry, SiteUpdate
from app.db.models.task import Task
from app.db.models.user import RefreshToken, User

__all__ = [
    "User",
    "RefreshToken",
    "Project",
    "ProjectMember",
    "ProjectStage",
    "Task",
    "Approval",
    "SiteUpdate",
    "SiteLogbookEntry",
    "ActivityLog",
    "Notification",
    "Document",
    "DocumentChunk",
    "DesignDecision",
    "DesignDecisionDocument",
    "Contract",
    "ChangeOrder",
    "BudgetEntry",
    "PaymentMilestone",
]

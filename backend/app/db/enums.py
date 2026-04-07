from enum import Enum


class UserRole(str, Enum):
    ARCHITECT = "architect"
    CONTRACTOR = "contractor"
    CLIENT = "client"
    CONSULTANT = "consultant"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    CANCELLED = "cancelled"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class MilestoneStatus(str, Enum):
    UPCOMING = "upcoming"
    DUE = "due"
    PAID = "paid"
    OVERDUE = "overdue"


class ContractStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    TERMINATED = "terminated"


class ChangeOrderStatus(str, Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"
    IMPLEMENTED = "implemented"


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class SiteUpdateType(str, Enum):
    PROGRESS = "progress"
    ISSUE = "issue"
    MILESTONE = "milestone"


class DocumentCategory(str, Enum):
    DRAWING = "drawing"
    SPECIFICATION = "specification"
    CONTRACT = "contract"
    PERMIT = "permit"
    REPORT = "report"
    PHOTO = "photo"
    OTHER = "other"


class ActivityAction(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMMENTED = "commented"
    UPLOADED = "uploaded"
    ASSIGNED = "assigned"
    STATUS_CHANGED = "status_changed"


class NotificationType(str, Enum):
    TASK_ASSIGNED = "task_assigned"
    TASK_DUE = "task_due"
    APPROVAL_REQUESTED = "approval_requested"
    APPROVAL_RESOLVED = "approval_resolved"
    DOCUMENT_UPLOADED = "document_uploaded"
    COMMENT_ADDED = "comment_added"
    MILESTONE_DUE = "milestone_due"
    CONTRACT_UPDATED = "contract_updated"


class BudgetEntryType(str, Enum):
    EXPENSE = "expense"
    PAYMENT = "payment"
    BUDGET_ALLOCATION = "budget_allocation"


class ProjectMemberRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class DesignDecisionStatus(str, Enum):
    OPEN = "open"
    APPROVED = "approved"
    REJECTED = "rejected"
    DEFERRED = "deferred"


class BudgetEntryStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

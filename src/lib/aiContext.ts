import { differenceInCalendarDays, format } from 'date-fns';
import type {
  Project, Task, SiteUpdate, BudgetItem, Approval, PurchaseOrder, Reimbursement,
} from '@/data/mockData';

/**
 * Pure helpers that turn workspace data into compact, deterministic AI context.
 * All monetary amounts stay in the app's USD base — prompts must instruct the
 * model to echo them as given, and the UI must format via usePreferences().
 */

/** Raw Supabase `users` row as exposed by DataContext. */
export interface DirectoryUser {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
}

/** Raw Supabase `project_members` row as exposed by DataContext. */
export interface ProjectMemberRow {
  project_id: string;
  user_id: string;
}

export interface WorkspaceSlices {
  projects: Project[];
  tasks: Task[];
  siteUpdates: SiteUpdate[];
  budgetItems: BudgetItem[];
  approvals: Approval[];
  purchaseOrders: PurchaseOrder[];
  reimbursements: Reimbursement[];
  users: DirectoryUser[];
  projectMembers: ProjectMemberRow[];
}

const day = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : format(d, 'yyyy-MM-dd');
};

const truncate = (s: string | undefined, n: number) =>
  s && s.length > n ? `${s.slice(0, n)}…` : s || '';

function nameLookup(users: DirectoryUser[]): (id?: string) => string | undefined {
  const map = new Map(users.map(u => [u.id, u.full_name || u.email || undefined]));
  return (id?: string) => (id ? map.get(id) : undefined);
}

function projectLookup(projects: Project[]): (id?: string) => string | undefined {
  const map = new Map(projects.map(p => [p.id, p.name]));
  return (id?: string) => (id ? map.get(id) : undefined);
}

const openTask = (t: Task) => t.status !== 'done';

export function compactContext(s: WorkspaceSlices, opts: { projectId?: string } = {}) {
  const inScope = <T extends { projectId: string }>(items: T[]) =>
    opts.projectId ? items.filter(i => i.projectId === opts.projectId) : items;

  const userName = nameLookup(s.users);
  const projectName = projectLookup(s.projects);

  const projects = (opts.projectId ? s.projects.filter(p => p.id === opts.projectId) : s.projects)
    .map(p => ({
      id: p.id, name: p.name, status: p.status, progress: p.progress,
      budgetUSD: p.budget, spentUSD: p.spent, deadline: day(p.deadline), team: p.team,
    }));

  const tasks = inScope(s.tasks).slice(0, 200).map(t => ({
    title: t.title, status: t.status, priority: t.priority,
    assignee: userName(t.assignee) ?? null,
    project: projectName(t.projectId), deadline: day(t.deadline),
  }));

  const approvals = inScope(s.approvals).map(a => ({
    title: a.title, category: a.category, status: a.status,
    project: projectName(a.projectId), requestedBy: userName(a.requestedBy) ?? a.requestedBy,
    costUSD: a.costAmount ?? null,
    ageDays: differenceInCalendarDays(new Date(), new Date(a.createdAt)),
  }));

  const purchaseOrders = inScope(s.purchaseOrders).map(po => ({
    item: po.item, category: po.category, supplier: po.supplierName, status: po.status,
    totalCostUSD: po.totalCost, expectedDelivery: day(po.expectedDelivery) ?? null,
    project: projectName(po.projectId),
  }));

  const reimbursements = inScope(s.reimbursements).map(r => ({
    description: truncate(r.description, 120), amountUSD: r.amount, status: r.status,
    project: r.projectName, submittedBy: r.submittedByName,
  }));

  const siteUpdates = inScope(s.siteUpdates).slice(0, 30).map(u => ({
    title: u.title, description: truncate(u.description, 300), type: u.type,
    author: u.author, date: day(u.createdAt), project: projectName(u.projectId),
  }));

  const budgetItems = inScope(s.budgetItems).slice(0, 200).map(b => ({
    category: b.category, description: truncate(b.description, 120),
    amountUSD: b.amount, status: b.status, project: projectName(b.projectId),
  }));

  return { projects, tasks, approvals, purchaseOrders, reimbursements, siteUpdates, budgetItems };
}

export interface PortfolioMetrics {
  generatedAt: string;
  totals: { projects: number; tasks: number; openTasks: number };
  overdueTasks: { title: string; project?: string; daysOverdue: number; assignee?: string }[];
  dueSoonTasks: { title: string; project?: string; deadline?: string; assignee?: string }[];
  budgetByProject: { project: string; budgetUSD: number; spentUSD: number; utilizationPct: number; progressPct: number; overBudget: boolean }[];
  pendingApprovals: { title: string; project?: string; ageDays: number; costUSD?: number }[];
  pendingPurchaseOrders: { item: string; project?: string; expectedDelivery?: string; deliveryOverdue: boolean }[];
  pendingReimbursements: { count: number; totalUSD: number };
  staleProjects: { project: string; daysSinceLastUpdate: number }[];
  taskLoadByAssignee: { assignee: string; openTasks: number }[];
}

export function computePortfolioMetrics(s: WorkspaceSlices): PortfolioMetrics {
  const now = new Date();
  const userName = nameLookup(s.users);
  const projectName = projectLookup(s.projects);

  const overdueTasks = s.tasks
    .filter(t => openTask(t) && t.deadline && new Date(t.deadline) < now)
    .map(t => ({
      title: t.title, project: projectName(t.projectId),
      daysOverdue: differenceInCalendarDays(now, new Date(t.deadline)),
      assignee: userName(t.assignee),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const dueSoonTasks = s.tasks
    .filter(t => {
      if (!openTask(t) || !t.deadline) return false;
      const diff = differenceInCalendarDays(new Date(t.deadline), now);
      return diff >= 0 && diff <= 7;
    })
    .map(t => ({ title: t.title, project: projectName(t.projectId), deadline: day(t.deadline), assignee: userName(t.assignee) }));

  const budgetByProject = s.projects.map(p => ({
    project: p.name,
    budgetUSD: p.budget,
    spentUSD: p.spent,
    utilizationPct: p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0,
    progressPct: p.progress,
    overBudget: p.spent > p.budget && p.budget > 0,
  }));

  const pendingApprovals = s.approvals
    .filter(a => a.status === 'pending')
    .map(a => ({
      title: a.title, project: projectName(a.projectId),
      ageDays: differenceInCalendarDays(now, new Date(a.createdAt)),
      ...(a.costAmount != null ? { costUSD: a.costAmount } : {}),
    }))
    .sort((a, b) => b.ageDays - a.ageDays);

  const pendingPurchaseOrders = s.purchaseOrders
    .filter(po => ['requested', 'approved', 'ordered', 'in_transit'].includes(po.status))
    .map(po => ({
      item: po.item, project: projectName(po.projectId),
      expectedDelivery: day(po.expectedDelivery),
      deliveryOverdue: !!po.expectedDelivery && new Date(po.expectedDelivery) < now && po.status !== 'delivered',
    }));

  const activeReimb = s.reimbursements.filter(r =>
    ['pending_client_review', 'approved', 'overdue'].includes(r.status));

  const staleProjects = s.projects
    .filter(p => p.status !== 'completed')
    .map(p => {
      const updates = s.siteUpdates.filter(u => u.projectId === p.id);
      const last = updates.reduce<Date | null>((acc, u) => {
        const d = new Date(u.createdAt);
        return !acc || d > acc ? d : acc;
      }, null);
      return { project: p.name, daysSinceLastUpdate: last ? differenceInCalendarDays(now, last) : Infinity };
    })
    .filter(p => p.daysSinceLastUpdate >= 14)
    .map(p => ({ ...p, daysSinceLastUpdate: p.daysSinceLastUpdate === Infinity ? 999 : p.daysSinceLastUpdate }));

  const loadMap = new Map<string, number>();
  for (const t of s.tasks) {
    if (!openTask(t) || !t.assignee) continue;
    const name = userName(t.assignee);
    if (!name) continue;
    loadMap.set(name, (loadMap.get(name) ?? 0) + 1);
  }
  const taskLoadByAssignee = [...loadMap.entries()]
    .map(([assignee, openTasks]) => ({ assignee, openTasks }))
    .sort((a, b) => b.openTasks - a.openTasks);

  return {
    generatedAt: format(now, 'yyyy-MM-dd'),
    totals: {
      projects: s.projects.length,
      tasks: s.tasks.length,
      openTasks: s.tasks.filter(openTask).length,
    },
    overdueTasks,
    dueSoonTasks,
    budgetByProject,
    pendingApprovals,
    pendingPurchaseOrders,
    pendingReimbursements: {
      count: activeReimb.length,
      totalUSD: activeReimb.reduce((sum, r) => sum + r.amount, 0),
    },
    staleProjects,
    taskLoadByAssignee,
  };
}

/** Cheap change fingerprint — string-equality only, used to invalidate AI caches. */
export function dataFingerprint(s: WorkspaceSlices): string {
  return JSON.stringify([
    s.projects.length,
    s.tasks.length,
    s.tasks.filter(t => t.status === 'done').length,
    s.tasks.filter(t => openTask(t) && t.deadline && new Date(t.deadline) < new Date()).length,
    s.approvals.filter(a => a.status === 'pending').length,
    s.purchaseOrders.length,
    s.siteUpdates.length,
    s.budgetItems.length,
    s.reimbursements.length,
    Math.round(s.projects.reduce((sum, p) => sum + p.spent, 0)),
  ]);
}

export interface ClientUpdateDigest {
  project: { name: string; status: string; progressPct: number; budgetUSD: number; spentUSD: number };
  range: { from: string; to: string };
  recentlyCompletedTasks: { title: string; description?: string }[];
  upcomingMilestones: { title: string; deadline?: string }[];
  siteUpdates: { title: string; description: string; type: string; date?: string }[];
  budgetMovement: { category: string; description: string; amountUSD: number }[];
  pendingClientApprovals: { title: string; category: string; ageDays: number; costUSD?: number }[];
}

export function buildClientUpdateDigest(
  s: WorkspaceSlices, projectId: string, from: Date, to: Date,
): ClientUpdateDigest | null {
  const project = s.projects.find(p => p.id === projectId);
  if (!project) return null;

  const inRange = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= from && d <= to;
  };

  // Tasks have no completed_at column, so "recently completed" is approximate:
  // done tasks whose createdAt or deadline falls in/near the range.
  const recentlyCompletedTasks = s.tasks
    .filter(t => t.projectId === projectId && t.status === 'done' && (inRange(t.createdAt) || inRange(t.deadline)))
    .map(t => ({ title: t.title, description: truncate(t.description, 150) }));

  const now = new Date();
  const upcomingMilestones = s.tasks
    .filter(t => {
      if (t.projectId !== projectId || !openTask(t) || !t.deadline) return false;
      const diff = differenceInCalendarDays(new Date(t.deadline), now);
      return diff >= 0 && diff <= 14;
    })
    .map(t => ({ title: t.title, deadline: day(t.deadline) }));

  const siteUpdates = s.siteUpdates
    .filter(u => u.projectId === projectId && inRange(u.createdAt))
    .map(u => ({ title: u.title, description: truncate(u.description, 300), type: u.type, date: day(u.createdAt) }));

  const budgetMovement = s.budgetItems
    .filter(b => b.projectId === projectId && inRange(b.date))
    .map(b => ({ category: b.category, description: truncate(b.description, 120), amountUSD: b.amount }));

  const pendingClientApprovals = s.approvals
    .filter(a => a.projectId === projectId && a.status === 'pending'
      && (!a.visibleRoles?.length || a.visibleRoles.includes('client')))
    .map(a => ({
      title: a.title, category: a.category,
      ageDays: differenceInCalendarDays(now, new Date(a.createdAt)),
      ...(a.costAmount != null ? { costUSD: a.costAmount } : {}),
    }));

  return {
    project: {
      name: project.name, status: project.status, progressPct: project.progress,
      budgetUSD: project.budget, spentUSD: project.spent,
    },
    range: { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') },
    recentlyCompletedTasks,
    upcomingMilestones,
    siteUpdates,
    budgetMovement,
    pendingClientApprovals,
  };
}

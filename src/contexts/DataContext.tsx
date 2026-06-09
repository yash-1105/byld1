import React, { createContext, useContext, useMemo } from 'react';
import { Project, Task, SiteUpdate, BudgetItem, Message, Notification, Approval, PurchaseOrder } from '@/data/mockData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  siteUpdates: SiteUpdate[];
  budgetItems: BudgetItem[];
  messages: Message[];
  notifications: Notification[];
  approvals: Approval[];
  purchaseOrders: PurchaseOrder[];
  segments: any[];
  users: any[];
  projectMembers: any[];
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addSiteUpdate: (u: Omit<SiteUpdate, 'id'>) => void;
  addBudgetItem: (b: Omit<BudgetItem, 'id'>) => void;
  addMessage: (m: Omit<Message, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addTeamMember: (projectId: string, userId: string, role: string) => void;
  removeTeamMember: (projectId: string, userId: string) => void;
  addApproval: (a: Omit<Approval, 'id' | 'createdAt'>) => void;
  updateApproval: (id: string, updates: Partial<Approval>) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt'>) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Queries
  const { data: rawProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawSiteUpdates = [] } = useQuery({
    queryKey: ['site_updates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_updates').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawBudgetItems = [] } = useQuery({
    queryKey: ['budget_entries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_entries').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawNotifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawProjectMembers = [] } = useQuery({
    queryKey: ['project_members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_members').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawApprovals = [] } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('approvals').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawSegments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('segments').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: rawPurchaseOrders = [] } = useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_orders').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Transformers
  const projects = useMemo<Project[]>(() => rawProjects.filter(p => {
    // Show projects the user owns or is a member of
    const isOwner = p.owner_id === user?.id;
    const isMember = rawProjectMembers.some(m => m.project_id === p.id && m.user_id === user?.id);
    return isOwner || isMember;
  }).map(p => {
    // Calculate total spent from budget items
    const pSpent = rawBudgetItems
      .filter(b => b.project_id === p.id)
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    // Calculate progress percentage from tasks
    const pTasks = rawTasks.filter(t => t.project_id === p.id);
    const pDoneTasks = pTasks.filter(t => t.status === 'done').length;
    const progress = pTasks.length > 0 ? Math.round((pDoneTasks / pTasks.length) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      description: p.description || '',
      status: (p.type as any) || 'planning',
      progress: progress,
      budget: p.budget || 0,
      spent: pSpent,
      deadline: p.end_date,
      team: rawProjectMembers
        .filter(m => m.project_id === p.id)
        .map(m => rawUsers.find(u => u.id === m.user_id)?.full_name || m.user_id)
        .filter(Boolean),
      createdAt: p.created_at,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      geofenceRadius: p.geofence_radius,
    };
  }), [rawProjects, rawProjectMembers, rawUsers, rawBudgetItems, rawTasks, user?.id]);

  const accessibleProjectIds = useMemo(() => new Set(projects.map(p => p.id)), [projects]);

  const tasks = useMemo<Task[]>(() => rawTasks.filter(t => accessibleProjectIds.has(t.project_id)).map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    status: (t.status as any) || 'todo',
    priority: (t.priority as any) || 'medium',
    assignee: t.assigned_to || '',
    projectId: t.project_id,
    deadline: t.due_date || '',
    createdAt: t.created_at,
  })), [rawTasks, accessibleProjectIds]);

  const siteUpdates = useMemo<SiteUpdate[]>(() => rawSiteUpdates.filter(s => accessibleProjectIds.has(s.project_id)).map(s => {
    // Try to parse new JSON content format { title, description, type }
    let title = s.content?.substring(0, 40) + '...' || 'Update';
    let description = s.content || '';
    let type: 'progress' | 'milestone' | 'issue' = 'progress';
    try {
      const parsed = JSON.parse(s.content || '{}');
      if (parsed.title) {
        title = parsed.title;
        description = parsed.description || '';
        type = parsed.type || 'progress';
      }
    } catch { /* legacy plain text */ }
    return {
      id: s.id,
      projectId: s.project_id,
      title,
      description,
      type,
      author: s.posted_by,
      createdAt: s.created_at,
      images: s.media_urls || undefined
    };
  }), [rawSiteUpdates, accessibleProjectIds]);

  const budgetItems = useMemo<BudgetItem[]>(() => rawBudgetItems.filter(b => accessibleProjectIds.has(b.project_id)).map(b => ({
    id: b.id,
    projectId: b.project_id,
    category: b.category,
    description: b.description,
    amount: b.amount,
    type: 'expense',
    date: b.created_at,
    status: 'pending'
  })), [rawBudgetItems, accessibleProjectIds]);

  const approvals = useMemo<Approval[]>(() =>
    rawApprovals
      .filter(a => !a.project_id || accessibleProjectIds.has(a.project_id))
      .map(a => {
        // description may be encoded as JSON: { text, images }
        let description = a.description || '';
        let images: string[] | undefined;
        try {
          const parsed = JSON.parse(a.description || '{}');
          if (parsed.text !== undefined || parsed.images !== undefined) {
            description = parsed.text || '';
            images = parsed.images?.length ? parsed.images : undefined;
          }
        } catch { /* plain text description */ }
        return {
          id: a.id,
          title: a.title,
          category: a.category || 'Design',
          status: (a.status as Approval['status']) || 'pending',
          description,
          images,
          projectId: a.project_id || '',
          requestedBy: a.requested_by || '',
          decidedBy: a.decided_by || undefined,
          decidedAt: a.decided_at || undefined,
          reason: a.reason || undefined,
          createdAt: a.created_at || '',
        };
      }),
    [rawApprovals, accessibleProjectIds]
  );

  const purchaseOrders = useMemo<PurchaseOrder[]>(() =>
    rawPurchaseOrders
      .filter((po: any) => accessibleProjectIds.has(po.project_id))
      .map((po: any) => ({
        id: po.id,
        projectId: po.project_id,
        segmentId: po.segment_id || undefined,
        item: po.item,
        category: po.category || 'General',
        supplierName: po.supplier_name || '',
        quantity: po.quantity ?? 1,
        unit: po.unit || 'units',
        totalCost: po.total_cost ?? 0,
        currency: po.currency || 'USD',
        status: (po.status as PurchaseOrder['status']) || 'requested',
        expectedDelivery: po.expected_delivery || undefined,
        deliveredAt: po.delivered_at || undefined,
        notes: po.notes || undefined,
        requestedBy: po.requested_by || '',
        createdAt: po.created_at || '',
      })),
    [rawPurchaseOrders, accessibleProjectIds]
  );

  const notifications = useMemo<Notification[]>(() => rawNotifications.map(n => ({
    id: n.id,
    title: n.type,
    message: n.message,
    type: 'info',
    read: !!n.read_at,
    createdAt: n.created_at
  })), [rawNotifications]);

  // Mutations
  const addProjectMutation = useMutation({
    mutationFn: async (p: Omit<Project, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase.from('projects').insert({
        name: p.name,
        description: p.description,
        type: p.status,
        budget: p.budget,
        location: 'TBD',
        start_date: new Date().toISOString(),
        end_date: p.deadline || new Date().toISOString(),
        owner_id: user?.id || ''
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });

  const addTaskMutation = useMutation({
    mutationFn: async (t: Omit<Task, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase.from('tasks').insert({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        project_id: t.projectId,
        due_date: t.deadline || null,
        created_by: user?.id || ''
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Task> }) => {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.assignee !== undefined) dbUpdates.assigned_to = updates.assignee;
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
      if (updates.deadline !== undefined) dbUpdates.due_date = updates.deadline;

      const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const addSiteUpdateMutation = useMutation({
    mutationFn: async (u: Omit<SiteUpdate, 'id'>) => {
      const { data, error } = await supabase.from('site_updates').insert({
        project_id: u.projectId,
        content: u.description,
        media_urls: u.images || [],
        posted_by: user?.id || ''
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site_updates'] })
  });

  const addBudgetItemMutation = useMutation({
    mutationFn: async (b: Omit<BudgetItem, 'id'>) => {
      const { data, error } = await supabase.from('budget_entries').insert({
        project_id: b.projectId,
        category: b.category,
        description: b.description,
        amount: b.amount,
        added_by: user?.id || ''
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budget_entries'] })
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: string, userId: string, role: string }) => {
      const { data, error } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: userId,
        role: role
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project_members'] })
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string, userId: string }) => {
      const { error } = await supabase.from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project_members'] })
  });

  const addApprovalMutation = useMutation({
    mutationFn: async (a: Omit<Approval, 'id' | 'createdAt'>) => {
      const encodedDesc = (a.images?.length)
        ? JSON.stringify({ text: a.description, images: a.images })
        : a.description;
      const { data, error } = await supabase.from('approvals').insert({
        title: a.title,
        category: a.category,
        status: 'pending',
        description: encodedDesc,
        project_id: a.projectId || null,
        requested_by: user?.id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals'] })
  });

  const updateApprovalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Approval> }) => {
      const dbUpdates: any = {};
      if (updates.status !== undefined)    dbUpdates.status = updates.status;
      if (updates.reason !== undefined)    dbUpdates.reason = updates.reason;
      if (updates.decidedBy !== undefined) dbUpdates.decided_by = updates.decidedBy;
      if (updates.decidedAt !== undefined) dbUpdates.decided_at = updates.decidedAt;
      const { data, error } = await supabase.from('approvals').update(dbUpdates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals'] })
  });

  const addPurchaseOrderMutation = useMutation({
    mutationFn: async (po: Omit<PurchaseOrder, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase.from('purchase_orders').insert({
        project_id: po.projectId,
        segment_id: po.segmentId || null,
        item: po.item,
        category: po.category,
        supplier_name: po.supplierName,
        quantity: po.quantity,
        unit: po.unit,
        total_cost: po.totalCost,
        currency: po.currency || 'USD',
        status: po.status || 'requested',
        expected_delivery: po.expectedDelivery || null,
        notes: po.notes || null,
        requested_by: user?.id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase_orders'] })
  });

  const updatePurchaseOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PurchaseOrder> }) => {
      const dbUpdates: any = {};
      if (updates.status !== undefined)           dbUpdates.status = updates.status;
      if (updates.deliveredAt !== undefined)      dbUpdates.delivered_at = updates.deliveredAt;
      if (updates.expectedDelivery !== undefined) dbUpdates.expected_delivery = updates.expectedDelivery;
      if (updates.supplierName !== undefined)     dbUpdates.supplier_name = updates.supplierName;
      if (updates.totalCost !== undefined)        dbUpdates.total_cost = updates.totalCost;
      if (updates.notes !== undefined)            dbUpdates.notes = updates.notes;
      const { data, error } = await supabase
        .from('purchase_orders').update(dbUpdates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase_orders'] })
  });

  return (
    <DataContext.Provider value={{
      projects,
      tasks,
      siteUpdates,
      budgetItems,
      messages: [], // Chat feature can be wired up later
      notifications,
      approvals,
      purchaseOrders,
      segments: rawSegments,
      users: rawUsers,
      projectMembers: rawProjectMembers,
      addProject: (p) => addProjectMutation.mutate(p),
      updateProject: () => {}, // TODO
      addTask: (t) => addTaskMutation.mutate(t),
      updateTask: (id, updates) => updateTaskMutation.mutate({ id, updates }),
      deleteTask: () => {}, // TODO
      addSiteUpdate: (u) => addSiteUpdateMutation.mutate(u),
      addBudgetItem: (b) => addBudgetItemMutation.mutate(b),
      addMessage: () => {}, // TODO
      markNotificationRead: () => {}, // TODO
      markAllNotificationsRead: () => {}, // TODO
      addTeamMember: (projectId, userId, role) => addTeamMemberMutation.mutate({ projectId, userId, role }),
      removeTeamMember: (projectId, userId) => removeTeamMemberMutation.mutate({ projectId, userId }),
      addApproval: (a) => addApprovalMutation.mutate(a),
      updateApproval: (id, updates) => updateApprovalMutation.mutate({ id, updates }),
      addPurchaseOrder: (po) => addPurchaseOrderMutation.mutate(po),
      updatePurchaseOrder: (id, updates) => updatePurchaseOrderMutation.mutate({ id, updates }),
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'design' | 'approval' | 'construction' | 'finishing' | 'completed';
  progress: number;
  budget: number;
  spent: number;
  deadline: string;
  team: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  projectId: string;
  deadline: string;
  createdAt: string;
}

export interface SiteUpdate {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'progress' | 'issue' | 'milestone';
  author: string;
  createdAt: string;
  images?: string[];
}

export interface BudgetItem {
  id: string;
  projectId: string;
  category: string;
  description: string;
  amount: number;
  type: 'expense' | 'payment';
  date: string;
  status: 'pending' | 'approved' | 'paid';
}

export interface Message {
  id: string;
  channel: string;
  sender: string;
  content: string;
  timestamp: string;
  avatar: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export const initialProjects: Project[] = [
  { id: '1', name: 'Skyline Tower', description: 'Modern 45-story mixed-use tower with retail podium', status: 'construction', progress: 65, budget: 12500000, spent: 8125000, deadline: '2025-12-15', team: ['Sarah Chen', 'Mike Johnson', 'David Park'], createdAt: '2024-01-15' },
  { id: '2', name: 'Harbor View Residences', description: 'Luxury waterfront residential complex with 120 units', status: 'design', progress: 30, budget: 8200000, spent: 2460000, deadline: '2026-06-30', team: ['Sarah Chen', 'Lisa Wang'], createdAt: '2024-06-01' },
  { id: '3', name: 'Green Valley Mall', description: 'Sustainable shopping center with rooftop gardens', status: 'approval', progress: 15, budget: 15000000, spent: 2250000, deadline: '2027-03-01', team: ['Sarah Chen', 'Mike Johnson'], createdAt: '2024-09-10' },
  { id: '4', name: 'Metro Station Plaza', description: 'Transit-oriented development with office and retail', status: 'planning', progress: 5, budget: 6800000, spent: 340000, deadline: '2027-08-15', team: ['Sarah Chen'], createdAt: '2025-01-05' },
];

export const initialTasks: Task[] = [
  { id: 't1', title: 'Foundation inspection report', description: 'Complete structural inspection of foundation work', status: 'done', priority: 'high', assignee: 'Mike Johnson', projectId: '1', deadline: '2025-03-01', createdAt: '2025-02-15' },
  { id: 't2', title: 'Steel framework - Level 30-35', description: 'Install steel framework for levels 30 through 35', status: 'in_progress', priority: 'urgent', assignee: 'Mike Johnson', projectId: '1', deadline: '2025-04-15', createdAt: '2025-03-01' },
  { id: 't3', title: 'MEP coordination drawings', description: 'Coordinate mechanical, electrical, and plumbing drawings', status: 'review', priority: 'high', assignee: 'Sarah Chen', projectId: '1', deadline: '2025-04-01', createdAt: '2025-02-20' },
  { id: 't4', title: 'Interior design concept', description: 'Develop interior design concepts for lobby and common areas', status: 'in_progress', priority: 'medium', assignee: 'Sarah Chen', projectId: '2', deadline: '2025-05-01', createdAt: '2025-03-10' },
  { id: 't5', title: 'Environmental impact review', description: 'Submit environmental impact assessment for approval', status: 'todo', priority: 'high', assignee: 'Lisa Wang', projectId: '3', deadline: '2025-05-15', createdAt: '2025-03-15' },
  { id: 't6', title: 'Curtain wall installation', description: 'Begin curtain wall installation on east facade', status: 'todo', priority: 'medium', assignee: 'Mike Johnson', projectId: '1', deadline: '2025-06-01', createdAt: '2025-03-20' },
  { id: 't7', title: 'Client presentation prep', description: 'Prepare materials for client progress presentation', status: 'todo', priority: 'low', assignee: 'Sarah Chen', projectId: '2', deadline: '2025-04-20', createdAt: '2025-03-25' },
  { id: 't8', title: 'Safety audit - Q2', description: 'Conduct quarterly safety audit on all active sites', status: 'in_progress', priority: 'urgent', assignee: 'Mike Johnson', projectId: '1', deadline: '2025-04-10', createdAt: '2025-03-28' },
];

export const initialSiteUpdates: SiteUpdate[] = [
  { id: 'su1', projectId: '1', title: 'Level 28 concrete pour complete', description: 'Successfully completed concrete pour for level 28. All quality checks passed. Ready for formwork removal in 72 hours.', type: 'milestone', author: 'Mike Johnson', createdAt: '2025-03-28T14:30:00' },
  { id: 'su2', projectId: '1', title: 'Weather delay - High winds', description: 'Crane operations suspended due to high winds exceeding 35 mph. Expected to resume tomorrow morning.', type: 'issue', author: 'Mike Johnson', createdAt: '2025-03-27T09:15:00' },
  { id: 'su3', projectId: '1', title: 'Electrical rough-in progress', description: 'Electrical rough-in completed for floors 20-25. Inspection scheduled for next week.', type: 'progress', author: 'Mike Johnson', createdAt: '2025-03-26T16:45:00' },
  { id: 'su4', projectId: '2', title: 'Site grading commenced', description: 'Site preparation and grading work has begun. Topsoil removal 40% complete.', type: 'progress', author: 'Mike Johnson', createdAt: '2025-03-25T11:00:00' },
];

export const initialBudgetItems: BudgetItem[] = [
  { id: 'b1', projectId: '1', category: 'Materials', description: 'Structural steel - Phase 3', amount: 850000, type: 'expense', date: '2025-03-15', status: 'approved' },
  { id: 'b2', projectId: '1', category: 'Labor', description: 'Concrete crew - March', amount: 320000, type: 'expense', date: '2025-03-01', status: 'paid' },
  { id: 'b3', projectId: '1', category: 'Equipment', description: 'Tower crane rental - Q1', amount: 180000, type: 'expense', date: '2025-01-15', status: 'paid' },
  { id: 'b4', projectId: '1', category: 'Subcontractor', description: 'MEP subcontractor payment', amount: 450000, type: 'expense', date: '2025-03-20', status: 'pending' },
  { id: 'b5', projectId: '2', category: 'Design', description: 'Architectural design fees', amount: 620000, type: 'expense', date: '2025-02-01', status: 'paid' },
  { id: 'b6', projectId: '1', category: 'Payment', description: 'Client milestone payment - Foundation', amount: 2500000, type: 'payment', date: '2025-02-15', status: 'paid' },
  { id: 'b7', projectId: '1', category: 'Payment', description: 'Client milestone payment - Structure', amount: 3000000, type: 'payment', date: '2025-03-25', status: 'approved' },
];

export const initialMessages: Message[] = [
  { id: 'm1', channel: 'skyline-tower', sender: 'Mike Johnson', content: 'Concrete pour for level 28 completed successfully. All test samples collected.', timestamp: '2025-03-28T14:30:00', avatar: 'MJ' },
  { id: 'm2', channel: 'skyline-tower', sender: 'Sarah Chen', content: 'Great work! Can you send the quality test results when available?', timestamp: '2025-03-28T14:35:00', avatar: 'SC' },
  { id: 'm3', channel: 'skyline-tower', sender: 'Mike Johnson', content: 'Will do. Results should be ready by tomorrow afternoon.', timestamp: '2025-03-28T14:38:00', avatar: 'MJ' },
  { id: 'm4', channel: 'harbor-view', sender: 'Sarah Chen', content: 'Updated the lobby design concept. Please review the attached drawings.', timestamp: '2025-03-27T10:00:00', avatar: 'SC' },
  { id: 'm5', channel: 'harbor-view', sender: 'Lisa Wang', content: 'The natural lighting analysis looks promising. I have a few suggestions for the atrium.', timestamp: '2025-03-27T10:45:00', avatar: 'LW' },
];

export const initialNotifications: Notification[] = [
  { id: 'n1', title: 'Task Overdue', message: 'MEP coordination drawings deadline has passed', type: 'warning', read: false, createdAt: '2025-03-29T08:00:00' },
  { id: 'n2', title: 'Budget Alert', message: 'Skyline Tower has reached 65% of allocated budget', type: 'error', read: false, createdAt: '2025-03-28T16:00:00' },
  { id: 'n3', title: 'Approval Required', message: 'New change order pending your review', type: 'info', read: false, createdAt: '2025-03-28T14:00:00' },
  { id: 'n4', title: 'Milestone Reached', message: 'Level 28 concrete pour completed successfully', type: 'success', read: true, createdAt: '2025-03-28T14:30:00' },
  { id: 'n5', title: 'New Team Member', message: 'Alex Rivera has joined the Skyline Tower project', type: 'info', read: true, createdAt: '2025-03-27T09:00:00' },
];

export const teamMembers = [
  { id: '1', name: 'Sarah Chen', role: 'architect', email: 'sarah@byld.io', avatar: 'SC', projects: ['Skyline Tower', 'Harbor View', 'Green Valley'] },
  { id: '2', name: 'Mike Johnson', role: 'contractor', email: 'mike@byld.io', avatar: 'MJ', projects: ['Skyline Tower', 'Green Valley'] },
  { id: '3', name: 'David Park', role: 'client', email: 'david@byld.io', avatar: 'DP', projects: ['Skyline Tower'] },
  { id: '4', name: 'Lisa Wang', role: 'consultant', email: 'lisa@byld.io', avatar: 'LW', projects: ['Harbor View'] },
  { id: '5', name: 'Alex Rivera', role: 'contractor', email: 'alex@byld.io', avatar: 'AR', projects: ['Skyline Tower'] },
  { id: '6', name: 'Emily Foster', role: 'architect', email: 'emily@byld.io', avatar: 'EF', projects: ['Metro Station'] },
];

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, DollarSign, CheckSquare, ClipboardCheck, ShoppingCart, Layers, Clock, TrendingUp, X, Trash2, Truck } from 'lucide-react';
import SegmentMapView from '@/components/projects/SegmentMapView';
import DeliveryTracker from '@/components/maps/DeliveryTracker';

const workflowTabs = [
  { key: 'map', label: 'Segment Map', icon: Layers },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'approvals', label: 'Approvals', icon: ClipboardCheck },
  { key: 'procurement', label: 'Procurement', icon: ShoppingCart },
  { key: 'deliveries', label: 'Deliveries', icon: Truck },
  { key: 'timeline', label: 'Timeline', icon: Clock },
];

const timelineItems = [
  { phase: 'Design', start: 'Jan 2025', end: 'Feb 2025', progress: 100, status: 'completed' },
  { phase: 'Approvals', start: 'Feb 2025', end: 'Mar 2025', progress: 85, status: 'in_progress' },
  { phase: 'Construction', start: 'Mar 2025', end: 'Aug 2025', progress: 35, status: 'in_progress' },
  { phase: 'Finishing', start: 'Aug 2025', end: 'Oct 2025', progress: 0, status: 'pending' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, tasks, users, projectMembers, addTeamMember, removeTeamMember } = useData();
  const { formatCurrencyCompact } = usePreferences();
  const project = projects.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState('map');
  const [showTeamModal, setShowTeamModal] = useState(false);

  const clients = users.filter((u: any) => u.role === 'client');

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Project not found</p>
        <Link to="/projects" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to projects</Link>
      </div>
    );
  }

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const doneTasks = projectTasks.filter(t => t.status === 'done').length;

  const procurementItems = [
    { name: 'Structural Steel', status: 'delivered', qty: '450 tons', cost: '$680,000' },
    { name: 'Concrete Mix', status: 'in_transit', qty: '2,000 m³', cost: '$320,000' },
    { name: 'Glass Panels', status: 'ordered', qty: '1,200 units', cost: '$540,000' },
    { name: 'Electrical Wiring', status: 'pending', qty: '15,000 m', cost: '$95,000' },
  ];

  const procStatusColors: Record<string, string> = {
    delivered: 'bg-success/10 text-success',
    in_transit: 'bg-primary/10 text-primary',
    ordered: 'bg-warning/10 text-warning',
    pending: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Progress', value: `${project.progress}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Tasks Done', value: `${doneTasks}/${projectTasks.length}`, icon: CheckSquare, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Budget Used', value: formatCurrencyCompact(project.spent), icon: DollarSign, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Team', value: project.team.length.toString(), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((s, i) => (
          <motion.div 
            key={s.label} 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }} 
            onClick={() => s.label === 'Team' && setShowTeamModal(true)}
            className={`soft-card p-5 ${s.label === 'Team' ? 'cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Workflow Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {workflowTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'gradient-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'map' && <SegmentMapView projectId={project.id} />}

      {activeTab === 'tasks' && (
        <div className="soft-card p-6 space-y-3">
          <h3 className="font-semibold text-foreground mb-4">Project Tasks</h3>
          {projectTasks.length > 0 ? projectTasks.map(task => (
            <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                task.status === 'done' ? 'bg-success/10' : task.status === 'in_progress' ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <CheckSquare className={`w-4 h-4 ${
                  task.status === 'done' ? 'text-success' : task.status === 'in_progress' ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{task.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{task.assignee} · Due {new Date(task.deadline).toLocaleDateString()}</div>
              </div>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                task.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
                task.priority === 'high' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
              }`}>{task.priority}</span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
          )}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="soft-card p-6 space-y-3">
          <h3 className="font-semibold text-foreground mb-4">Pending Approvals</h3>
          {[
            { title: 'Change Order #12 — Additional Steel', amount: '$45,000', status: 'pending' },
            { title: 'Ceiling Design Revision', amount: '-', status: 'pending' },
            { title: 'Material Selection — Italian Marble', amount: '$28,000', status: 'approved' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.status === 'approved' ? 'bg-success/10' : 'bg-warning/10'}`}>
                <ClipboardCheck className={`w-4 h-4 ${a.status === 'approved' ? 'text-success' : 'text-warning'}`} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{a.title}</div>
                {a.amount !== '-' && <div className="text-xs text-muted-foreground mt-0.5">{a.amount}</div>}
              </div>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize ${
                a.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>{a.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'procurement' && (
        <div className="soft-card p-6 space-y-3">
          <h3 className="font-semibold text-foreground mb-4">Procurement Status</h3>
          {procurementItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.qty} · {item.cost}</div>
              </div>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize ${procStatusColors[item.status]}`}>
                {item.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'deliveries' && (
        <div className="soft-card p-6 space-y-6">
          <h3 className="font-semibold text-foreground">Delivery Tracking & Geofencing</h3>
          <DeliveryTracker project={project} />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="soft-card p-6 space-y-6">
          <h3 className="font-semibold text-foreground">Project Timeline</h3>
          <div className="space-y-4">
            {timelineItems.map((item, i) => (
              <motion.div key={item.phase} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.status === 'completed' ? 'bg-success/10' : item.status === 'in_progress' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {item.status === 'completed' ? (
                      <CheckSquare className="w-4 h-4 text-success" />
                    ) : (
                      <Clock className={`w-4 h-4 ${item.status === 'in_progress' ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  {i < timelineItems.length - 1 && <div className="w-px h-12 bg-border mt-2" />}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">{item.phase}</h4>
                    <span className="text-xs text-muted-foreground">{item.start} — {item.end}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                        className={`h-full rounded-full ${item.status === 'completed' ? 'bg-success' : 'gradient-primary'}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Team Management Modal */}
      <AnimatePresence>
        {showTeamModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-semibold text-lg">Manage Team (Clients)</h3>
                <button onClick={() => setShowTeamModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {clients.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">No clients found in the system.</p>
                ) : clients.map((client: any) => {
                  const isMember = projectMembers.some((m: any) => m.project_id === project.id && m.user_id === client.id);
                  return (
                    <div key={client.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium text-sm text-foreground">{client.full_name || client.email}</div>
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      </div>
                      {isMember ? (
                        <button onClick={() => removeTeamMember(project.id, client.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => addTeamMember(project.id, client.id, 'client')} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors">
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border bg-muted/10">
                <Link to="/team" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all">
                  <Users className="w-4 h-4" /> Manage Full Team
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

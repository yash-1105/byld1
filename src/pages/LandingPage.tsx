import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Building2, ArrowRight, BarChart3, Users, Zap, Camera, Bot,
  CheckCircle, Layers, FileText, Bell, MessageSquare, ClipboardCheck,
  HardHat, User, Briefcase, ChevronRight, Play, Shield
} from 'lucide-react';
import Footer from '@/components/Footer';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    { icon: BarChart3, title: 'Project Dashboard', desc: 'Real-time analytics with progress tracking, budget monitoring, and milestone visualization across all projects.' },
    { icon: CheckCircle, title: 'Workflow & Tasks', desc: 'Kanban boards, stage-based workflows, priority management, and automated task assignment for teams.' },
    { icon: Camera, title: 'Site Monitoring', desc: 'Digital site logbook with photo/video updates, weather tracking, labor logs, and inventory management.' },
    { icon: Layers, title: 'Budget Tracking', desc: 'Complete financial oversight with expense categories, payment milestones, invoice automation, and variance alerts.' },
    { icon: MessageSquare, title: 'Collaboration', desc: 'Project-based channels, document sharing, drawing annotations, and structured approval workflows.' },
    { icon: Bot, title: 'AI Assistance', desc: 'Smart notifications, communication summaries, document search, and predictive project insights.' },
  ];

  const tabs = [
    { label: 'Dashboard', desc: 'See every project at a glance — progress bars, budget utilization, task completion, and team activity in one view.' },
    { label: 'Tasks', desc: 'Drag-and-drop Kanban boards with priority labels, deadlines, assignees, and status tracking across your team.' },
    { label: 'Updates', desc: 'Timeline of site progress with milestone markers, issue flags, photo documentation, and daily logbook entries.' },
  ];

  const workflowSteps = [
    { stage: 'Design', desc: 'Architectural plans, MEP coordination, and interior concepts with collaborative review.' },
    { stage: 'Approval', desc: 'Stakeholder sign-offs, environmental reviews, and regulatory compliance checks.' },
    { stage: 'Construction', desc: 'Site monitoring, task execution, quality inspections, and progress documentation.' },
    { stage: 'Finishing', desc: 'Final inspections, punch lists, handover documentation, and project closeout.' },
  ];

  const roles = [
    { role: 'Architect', icon: Building2, desc: 'Full project control — create projects, assign tasks, manage budgets, approve changes, and coordinate teams.', gradient: 'from-primary/10 to-primary/5' },
    { role: 'Contractor', icon: HardHat, desc: 'Task execution focus — view assigned work, post site updates, upload documentation, and report progress.', gradient: 'from-warning/10 to-warning/5' },
    { role: 'Client', icon: User, desc: 'Simplified oversight — track progress, review budgets, approve decisions, and receive real-time updates.', gradient: 'from-success/10 to-success/5' },
    { role: 'Consultant', icon: Briefcase, desc: 'Expert collaboration — respond to consultation requests, share assessments, and communicate with architects.', gradient: 'from-accent/10 to-accent/5' },
  ];

  const advancedFeatures = [
    { icon: ClipboardCheck, title: 'Approvals Tracking', desc: 'Review change orders, material substitutions, and design revisions with full audit trail.' },
    { icon: Camera, title: 'Real-Time Updates', desc: 'Live site feeds with photo/video, weather conditions, labor counts, and equipment status.' },
    { icon: FileText, title: 'Document Management', desc: 'Organized folders with tagging, version control, drag-and-drop upload, and file preview.' },
    { icon: Bell, title: 'Smart Notifications', desc: 'AI-prioritized alerts for overdue tasks, budget overruns, weather delays, and pending approvals.' },
    { icon: Users, title: 'Consultant Network', desc: 'Request expert consultations, manage responses, and build your trusted advisor network.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">BYLD</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors hidden sm:inline-block">Sign In</Link>
          <Link to="/login" className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-warning/[0.03]" />
        <div className="absolute top-20 left-1/3 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-warning/[0.05] blur-[100px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full inline-block mb-6">
                Construction Management Platform
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.08] tracking-tight">
                Build smarter.<br />
                <span className="gradient-text">Deliver faster.</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-6 max-w-lg leading-relaxed">
                Manage construction projects, track progress, control budgets, and collaborate with your entire team in one place.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
                <Link to="/login" className="gradient-primary text-primary-foreground px-7 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xl shadow-primary/25">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="border border-border text-foreground px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-card transition-colors flex items-center gap-2">
                  <Play className="w-4 h-4" /> View Demo
                </Link>
              </div>
            </motion.div>

            {/* Product Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 gradient-primary opacity-[0.07] rounded-3xl blur-2xl" />
              <div className="relative soft-card overflow-hidden shadow-2xl shadow-primary/10">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/50" />
                    <div className="w-3 h-3 rounded-full bg-warning/50" />
                    <div className="w-3 h-3 rounded-full bg-success/50" />
                  </div>
                  <div className="flex-1 text-center text-xs text-muted-foreground font-medium">BYLD — Dashboard</div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Active Projects', val: '4', color: 'text-primary' },
                      { label: 'Tasks Done', val: '67%', color: 'text-success' },
                      { label: 'Budget Used', val: '$8.1M', color: 'text-warning' },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/40 rounded-xl p-3.5 border border-border/50">
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                        <div className={`text-lg font-bold ${s.color} mt-0.5`}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <div className="text-xs font-medium text-foreground mb-3">Project Progress</div>
                    <div className="flex items-end gap-2 h-20">
                      {[65, 30, 15, 5, 45, 80, 55].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                          className="flex-1 gradient-primary rounded-t-md min-h-[4px]"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['Steel framework — Level 30', 'MEP coordination review', 'Foundation inspection'].map((t, i) => (
                      <div key={t} className="flex items-center gap-3 bg-muted/30 rounded-xl px-3.5 py-2.5 border border-border/50">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-destructive' : i === 1 ? 'bg-warning' : 'bg-success'}`} />
                        <span className="text-xs text-foreground flex-1">{t}</span>
                        <span className="text-[10px] text-muted-foreground">{i === 0 ? 'Urgent' : i === 1 ? 'Review' : 'Done'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <motion.div {...fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Trusted by construction teams worldwide</span>
            <div className="flex items-center gap-6">
              {[
                { name: 'Architects', icon: Building2 },
                { name: 'Contractors', icon: HardHat },
                { name: 'Developers', icon: Zap },
                { name: 'Consultants', icon: Briefcase },
              ].map(t => (
                <span key={t.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <t.icon className="w-3 h-3 text-primary" />
                  </div>
                  {t.name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-28">
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Features</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mt-5">Everything you need to manage construction</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">From project planning to completion, BYLD gives your team the tools to deliver on time and on budget.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} {...stagger} transition={{ delay: i * 0.08 }} className="group soft-card-hover p-7">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Product Showcase Tabs */}
      <section className="bg-card/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-28">
          <motion.div {...fadeUp} className="text-center mb-14">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Product</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mt-5">See BYLD in action</h2>
          </motion.div>
          <div className="flex justify-center gap-2 mb-10">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === i ? 'gradient-primary text-primary-foreground shadow-xl shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-4xl mx-auto">
            <div className="soft-card overflow-hidden shadow-xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
                </div>
              </div>
              <div className="p-8">
                {activeTab === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { l: 'Projects', v: '4', c: 'text-primary' },
                        { l: 'Completed', v: '12', c: 'text-success' },
                        { l: 'Budget', v: '$42.5M', c: 'text-foreground' },
                        { l: 'Team', v: '24', c: 'text-primary' },
                      ].map(s => (
                        <div key={s.l} className="bg-muted/40 rounded-xl p-4 text-center border border-border/50">
                          <div className="text-xs text-muted-foreground">{s.l}</div>
                          <div className={`text-xl font-bold ${s.c} mt-1`}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-xl p-4 h-32 flex items-end border border-border/50">
                        <div className="flex items-end gap-1 w-full h-full">
                          {[40, 65, 30, 80, 55, 70, 45, 90].map((h, i) => (
                            <div key={i} className="flex-1 gradient-primary rounded-t-sm" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-center border border-border/50">
                        <div className="relative w-24 h-24">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray="264" strokeDashoffset="92" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-foreground">65%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {['To Do', 'In Progress', 'Review', 'Done'].map((col, ci) => (
                      <div key={col} className="space-y-2">
                        <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                          {col}
                          <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">{ci + 1}</span>
                        </div>
                        {Array.from({ length: 2 - (ci === 3 ? 1 : 0) }, (_, i) => (
                          <div key={i} className="bg-muted/40 rounded-xl p-3 border border-border/50">
                            <div className="text-xs font-medium text-foreground">Task {ci * 2 + i + 1}</div>
                            <div className="flex items-center gap-1 mt-2">
                              <div className={`text-[9px] px-1.5 py-0.5 rounded-full ${ci === 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                {ci === 0 ? 'urgent' : 'medium'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 2 && (
                  <div className="space-y-3">
                    {[
                      { title: 'Level 28 concrete pour complete', type: 'milestone', time: '2h ago' },
                      { title: 'Weather delay — High winds', type: 'issue', time: '1d ago' },
                      { title: 'Electrical rough-in progress', type: 'progress', time: '2d ago' },
                    ].map(u => (
                      <div key={u.title} className="flex items-start gap-3 bg-muted/30 rounded-xl p-4 border border-border/50">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${u.type === 'milestone' ? 'bg-success' : u.type === 'issue' ? 'bg-destructive' : 'bg-primary'}`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{u.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{u.time}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          u.type === 'milestone' ? 'bg-success/10 text-success' : u.type === 'issue' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                        }`}>{u.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">{tabs[activeTab].desc}</p>
          </motion.div>
        </div>
      </section>

      {/* Workflow */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-28">
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Workflow</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mt-5">From design to delivery</h2>
          <p className="text-muted-foreground mt-4 text-lg">Track every project through a structured, stage-based workflow.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {workflowSteps.map((step, i) => (
            <motion.div key={step.stage} {...stagger} transition={{ delay: i * 0.1 }} className="relative">
              <div className="soft-card-hover p-7 text-center h-full">
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground mx-auto mb-5 shadow-lg shadow-primary/20">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{step.stage}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-card/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-28">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Roles</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mt-5">Tailored for every team member</h2>
            <p className="text-muted-foreground mt-4 text-lg">Each role gets a unique dashboard, navigation, and permissions.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r, i) => (
              <motion.div key={r.role} {...stagger} transition={{ delay: i * 0.08 }} className="soft-card-hover p-7 text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mx-auto mb-5`}>
                  <r.icon className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{r.role}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-28">
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Advanced</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mt-5">Built for serious project management</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {advancedFeatures.map((f, i) => (
            <motion.div key={f.title} {...stagger} transition={{ delay: i * 0.08 }} className="group flex items-start gap-5 soft-card-hover p-6">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-24 lg:py-28 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Start managing your projects the smarter way</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">Join construction teams who deliver projects on time and on budget with BYLD.</p>
            <div className="flex items-center justify-center gap-3 mt-8">
              <Link to="/login" className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xl shadow-primary/25">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="border border-border text-foreground px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-card transition-colors">
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

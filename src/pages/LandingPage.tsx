import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import {
  Building2, ArrowRight, BarChart3, Users, Zap, Camera, Bot,
  CheckCircle, Layers, FileText, Bell, MessageSquare, ClipboardCheck,
  HardHat, User, Briefcase, ChevronRight, Play, Shield, Sparkles,
  ArrowUpRight, Map, Palette
} from 'lucide-react';
import Footer from '@/components/Footer';
import marbleWall from '@/assets/marble-wall.jpg';
import velvetSofa from '@/assets/velvet-sofa.jpg';
import blackMarble from '@/assets/black-marble.jpg';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function MagneticButton({ children, className, ...props }: React.ComponentProps<typeof Link>) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.15);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      <Link className={className} {...props}>{children}</Link>
    </motion.div>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeChild = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    { icon: Map, title: 'Segment Map', slug: 'segment-map', desc: 'Interactive floor plans with clickable room segments, real-time status, and per-area task tracking.' },
    { icon: Palette, title: 'Design Board', slug: 'design-board', desc: 'Pin inspiration, confirm materials, and track rejected ideas with a visual moodboard system.' },
    { icon: ClipboardCheck, title: 'Approvals', slug: 'approvals', desc: 'Tinder-style approval cards with mandatory reasons, history tracking, and role-based workflows.' },
    { icon: Layers, title: 'Budget Tracking', slug: 'budget', desc: 'Segment-wise budgets, expense breakdown, payment milestones, and real-time variance alerts.' },
    { icon: Camera, title: 'Site Monitoring', slug: 'site-monitoring', desc: 'Photo/video updates, digital logbook, weather tracking, and smart inventory management.' },
    { icon: Bot, title: 'AI Assistance', slug: 'ai-assistance', desc: 'Smart notifications, communication summaries, predictive insights, and document search.' },
  ];

  const tabs = [
    { label: 'Dashboard', desc: 'Real-time project analytics with visual progress tracking and budget monitoring.' },
    { label: 'Segment Map', desc: 'Click any room to access tasks, approvals, budgets, and design boards.' },
    { label: 'Design Board', desc: 'Pin inspiration, confirm materials, and manage the creative workflow.' },
  ];

  const roles = [
    { role: 'Architect', icon: Building2, desc: 'Full project control — design, assign, approve, and oversee every detail.', stat: 'Full Access' },
    { role: 'Contractor', icon: HardHat, desc: 'Task execution, site updates, and progress reporting with real-time tools.', stat: 'Task Focus' },
    { role: 'Client', icon: User, desc: 'Simplified oversight — approvals, budgets, and progress at a glance.', stat: 'Approvals' },
    { role: 'Consultant', icon: Briefcase, desc: 'Expert collaboration with consultation requests and advisory tools.', stat: 'Advisory' },
  ];

  return (
    <div className="min-h-screen bg-background noise-bg overflow-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="h-16 bg-card/60 backdrop-blur-2xl border-b border-border/50 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50"
      >
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/byld-logo.jpeg" alt="BYLD" className="h-8 w-8 rounded-lg object-cover" />
          <span className="text-xl tracking-[0.2em] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>BYLD</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {['Features', 'Pricing', 'About', 'Blog'].map(l => (
            <Link key={l} to={`/${l.toLowerCase()}`} className="relative group hover:text-foreground transition-colors">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors hidden sm:inline-block">Sign In</Link>
          <MagneticButton to="/login" className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 inline-block">
            Get Started
          </MagneticButton>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated blobs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-primary rounded-full blur-[140px]"
          style={{ animation: 'morph-blob 12s ease-in-out infinite' }}
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-warning rounded-full blur-[120px]"
          style={{ animation: 'morph-blob 15s ease-in-out infinite reverse' }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-40 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-xs font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-6 border border-primary/20"
              >
                <Sparkles className="w-3 h-3" /> Construction Management Platform
              </motion.span>
              <h1 className="text-5xl sm:text-6xl lg:text-[4rem] font-bold text-foreground leading-[1.05] tracking-tight">
                Build smarter.
                <br />
                <span className="gradient-text text-glow">Deliver faster.</span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg text-muted-foreground mt-6 max-w-lg leading-relaxed"
              >
                Manage construction projects, track progress, control budgets, and collaborate with your entire team in one place.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8"
              >
                <MagneticButton to="/login" className="gradient-primary text-primary-foreground px-8 py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-primary/25 inline-block">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </MagneticButton>
                <Link to="/login" className="border border-border text-foreground px-8 py-4 rounded-2xl text-sm font-semibold hover:bg-card hover:shadow-md transition-all flex items-center gap-2 group">
                  <Play className="w-4 h-4 group-hover:text-primary transition-colors" /> View Demo
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="flex items-center gap-8 mt-12 pt-8 border-t border-border/50"
              >
                {[
                  { val: 500, suffix: '+', label: 'Projects Managed' },
                  { val: 98, suffix: '%', label: 'On-time Delivery' },
                  { val: 24, suffix: '/7', label: 'Support' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-foreground"><AnimatedCounter target={s.val} suffix={s.suffix} /></div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Product Mockup with 3D tilt */}
            <motion.div
              initial={{ opacity: 0, x: 60, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative perspective-[2000px]"
            >
              <div className="absolute -inset-6 gradient-primary opacity-[0.06] rounded-3xl blur-3xl" />
              <motion.div
                whileHover={{ rotateY: 3, rotateX: -2, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative soft-card overflow-hidden shadow-2xl shadow-primary/10"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/20">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/40" />
                    <div className="w-3 h-3 rounded-full bg-warning/40" />
                    <div className="w-3 h-3 rounded-full bg-success/40" />
                  </div>
                  <div className="flex-1 text-center text-xs text-muted-foreground font-medium">BYLD — Project Dashboard</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Active Projects', val: '4', color: 'text-primary' },
                      { label: 'Tasks Done', val: '67%', color: 'text-success' },
                      { label: 'Budget Used', val: '$8.1M', color: 'text-warning' },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                        className="bg-muted/30 rounded-xl p-3.5 border border-border/40"
                      >
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                        <div className={`text-lg font-bold ${s.color} mt-0.5`}>{s.val}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/40">
                    <div className="text-xs font-medium text-foreground mb-3">Project Progress</div>
                    <div className="flex items-end gap-2 h-20">
                      {[65, 30, 15, 5, 45, 80, 55].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: 1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                          className="flex-1 gradient-primary rounded-t-md min-h-[4px] hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['Steel framework — Level 30', 'MEP coordination review', 'Foundation inspection'].map((t, i) => (
                      <motion.div
                        key={t}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + i * 0.1 }}
                        className="flex items-center gap-3 bg-muted/20 rounded-xl px-3.5 py-2.5 border border-border/40 hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-destructive' : i === 1 ? 'bg-warning' : 'bg-success'}`} />
                        <span className="text-xs text-foreground flex-1">{t}</span>
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-sm text-muted-foreground"
          >
            <span className="font-medium text-foreground">Trusted by construction teams worldwide</span>
            <div className="flex items-center gap-6">
              {[
                { name: 'Architects', icon: Building2 },
                { name: 'Contractors', icon: HardHat },
                { name: 'Developers', icon: Zap },
                { name: 'Consultants', icon: Briefcase },
              ].map((t, i) => (
                <motion.span
                  key={t.name}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                    <t.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {t.name}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features — Interactive Cards */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">Features</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mt-6 tracking-tight">Everything you need to manage construction</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">From design to completion, BYLD gives your team the tools to deliver on time and on budget.</p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeChild}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <Link to={`/features#${f.slug}`} className="group soft-card-hover p-8 relative overflow-hidden cursor-pointer block h-full">
              {/* Hover glow */}
              <motion.div
                animate={{ opacity: hoveredFeature === i ? 0.06 : 0, scale: hoveredFeature === i ? 1.5 : 1 }}
                className="absolute inset-0 bg-primary rounded-full blur-3xl pointer-events-none"
              />
              <div className="relative">
                <motion.div
                  animate={{ rotate: hoveredFeature === i ? 8 : 0, scale: hoveredFeature === i ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/10"
                >
                  <f.icon className="w-7 h-7 text-primary" />
                </motion.div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <motion.div
                  animate={{ x: hoveredFeature === i ? 4 : 0, opacity: hoveredFeature === i ? 1 : 0 }}
                  className="flex items-center gap-1 text-xs font-medium text-primary mt-4"
                >
                  Learn more <ArrowRight className="w-3 h-3" />
                </motion.div>
              </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Product Showcase Tabs */}
      <section className="bg-card/30 border-y border-border/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">Product</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mt-6 tracking-tight">See BYLD in action</h2>
          </motion.div>
          <div className="flex justify-center gap-2 mb-10">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === i ? 'gradient-primary text-primary-foreground shadow-xl shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:shadow-md'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="max-w-4xl mx-auto">
            <div className="soft-card overflow-hidden shadow-2xl shadow-foreground/5">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
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
                        <div key={s.l} className="bg-muted/30 rounded-xl p-4 text-center border border-border/40">
                          <div className="text-xs text-muted-foreground">{s.l}</div>
                          <div className={`text-xl font-bold ${s.c} mt-1`}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/20 rounded-xl p-4 h-32 flex items-end border border-border/40">
                        <div className="flex items-end gap-1 w-full h-full">
                          {[40, 65, 30, 80, 55, 70, 45, 90].map((h, i) => (
                            <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex-1 gradient-primary rounded-t-sm" />
                          ))}
                        </div>
                      </div>
                      <div className="bg-muted/20 rounded-xl p-4 flex items-center justify-center border border-border/40">
                        <div className="relative w-24 h-24">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                            <motion.circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round"
                              initial={{ strokeDasharray: '264', strokeDashoffset: '264' }}
                              whileInView={{ strokeDashoffset: '92' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, ease: 'easeOut' }}
                            />
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
                  <div className="space-y-4">
                    {/* Floor-plan SVG overview */}
                    <div className="bg-muted/20 rounded-xl p-4 border border-border/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-medium text-foreground flex items-center gap-2">
                          <Map className="w-3.5 h-3.5 text-primary" /> Floor Plan — Level 1
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Done</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> In Progress</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Pending</span>
                        </div>
                      </div>
                      <svg viewBox="0 0 400 220" className="w-full h-auto rounded-lg">
                        {[
                          { x: 10, y: 10, w: 180, h: 110, label: 'Living Room', fill: 'hsl(var(--success) / 0.12)', stroke: 'hsl(var(--success))', pct: 80 },
                          { x: 200, y: 10, w: 110, h: 110, label: 'Kitchen', fill: 'hsl(var(--warning) / 0.12)', stroke: 'hsl(var(--warning))', pct: 55 },
                          { x: 320, y: 10, w: 70, h: 110, label: 'Bath', fill: 'hsl(var(--muted) / 0.6)', stroke: 'hsl(var(--border))', pct: 15 },
                          { x: 10, y: 130, w: 130, h: 80, label: 'Bedroom', fill: 'hsl(var(--success) / 0.12)', stroke: 'hsl(var(--success))', pct: 90 },
                          { x: 150, y: 130, w: 130, h: 80, label: 'Office', fill: 'hsl(var(--warning) / 0.12)', stroke: 'hsl(var(--warning))', pct: 40 },
                          { x: 290, y: 130, w: 100, h: 80, label: 'Outdoor', fill: 'hsl(var(--muted) / 0.6)', stroke: 'hsl(var(--border))', pct: 20 },
                        ].map((r, i) => (
                          <g key={r.label} className="cursor-pointer">
                            <motion.rect
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              x={r.x} y={r.y} width={r.w} height={r.h} rx={6}
                              fill={r.fill} stroke={r.stroke} strokeWidth={1.5}
                            />
                            <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 4} textAnchor="middle" className="fill-foreground" fontSize={10} fontWeight={600}>{r.label}</text>
                            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 10} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>{r.pct}%</text>
                          </g>
                        ))}
                      </svg>
                    </div>
                    {/* Segment summary cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { l: 'Active Segments', v: '6', c: 'text-primary' },
                        { l: 'Tasks Open', v: '14', c: 'text-warning' },
                        { l: 'Avg Progress', v: '50%', c: 'text-success' },
                      ].map(s => (
                        <div key={s.l} className="bg-muted/30 rounded-xl p-3 text-center border border-border/40">
                          <div className="text-[10px] text-muted-foreground">{s.l}</div>
                          <div className={`text-base font-bold ${s.c} mt-0.5`}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 2 && (
                  <div className="space-y-3">
                    {[
                      { title: 'Marble Accent Wall', note: 'Living Room — Feature wall', img: marbleWall, status: 'Rough', badge: 'bg-warning/10 text-warning' },
                      { title: 'Velvet Sofa — Forest Green', note: 'Living Room — Seating', img: velvetSofa, status: 'Confirmed', badge: 'bg-success/10 text-success' },
                      { title: 'Black Marble Countertop', note: 'Kitchen — Replaced with quartz', img: blackMarble, status: 'Discarded', badge: 'bg-destructive/10 text-destructive' },
                    ].map((d, i) => (
                      <motion.div key={d.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-4 bg-muted/20 rounded-xl p-3 border border-border/40 hover:border-primary/30 transition-colors">
                        <img src={d.img} alt={d.title} loading="lazy" width={56} height={56} className="w-14 h-14 rounded-lg object-cover border border-border/40 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{d.title}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{d.note}</div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${d.badge} flex-shrink-0`}>{d.status}</span>
                      </motion.div>
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
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-32">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">Workflow</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mt-6 tracking-tight">From design to delivery</h2>
          <p className="text-muted-foreground mt-4 text-lg">Track every project through a structured, stage-based workflow.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { stage: 'Design', desc: 'Architectural plans, MEP coordination, and interior concepts.' },
            { stage: 'Approval', desc: 'Stakeholder sign-offs and compliance checks.' },
            { stage: 'Construction', desc: 'Site monitoring, task execution, and quality inspections.' },
            { stage: 'Finishing', desc: 'Final inspections, punch lists, and project closeout.' },
          ].map((step, i) => (
            <motion.div
              key={step.stage}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative"
            >
              <div className="soft-card-hover p-8 text-center h-full group">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground mx-auto mb-6 shadow-lg shadow-primary/20"
                >
                  {i + 1}
                </motion.div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{step.stage}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="w-5 h-5 text-primary/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-card/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">Roles</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mt-6 tracking-tight">Tailored for every team member</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="soft-card p-8 text-center group cursor-pointer hover:shadow-xl transition-shadow duration-500"
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 border border-primary/10 group-hover:border-primary/30 transition-colors"
                >
                  <r.icon className="w-8 h-8 text-primary" />
                </motion.div>
                <div className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full inline-block mb-3">{r.stat}</div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{r.role}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-32">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">Advanced</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mt-6 tracking-tight">Built for serious project management</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: ClipboardCheck, title: 'Approvals Tracking', desc: 'Review change orders, material substitutions, and design revisions with full audit trail.' },
            { icon: Camera, title: 'Real-Time Updates', desc: 'Live site feeds with photo/video, weather conditions, labor counts, and equipment status.' },
            { icon: FileText, title: 'Document Management', desc: 'Organized folders with tagging, version control, drag-and-drop upload, and file preview.' },
            { icon: Bell, title: 'Smart Notifications', desc: 'AI-prioritized alerts for overdue tasks, budget overruns, weather delays, and pending approvals.' },
            { icon: Users, title: 'Consultant Network', desc: 'Request expert consultations, manage responses, and build your trusted advisor network.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group flex items-start gap-5 soft-card-hover p-7"
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: 8 }}
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/10"
              >
                <f.icon className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-[140px]"
        />
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-28 lg:py-32 text-center relative">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground tracking-tight">Start managing your projects the smarter way</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">Join construction teams who deliver projects on time and on budget with BYLD.</p>
            <div className="flex items-center justify-center gap-3 mt-10">
              <MagneticButton to="/login" className="gradient-primary text-primary-foreground px-10 py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-primary/25 inline-block">
                Get Started <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <Link to="/pricing" className="border border-border text-foreground px-10 py-4 rounded-2xl text-sm font-semibold hover:bg-card hover:shadow-md transition-all">
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

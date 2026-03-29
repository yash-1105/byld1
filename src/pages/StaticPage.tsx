import { motion } from 'framer-motion';
import { Building2, Zap, Shield, BarChart3, Users, Cloud, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const pages: Record<string, { title: string; subtitle: string; content: React.ReactNode }> = {
  features: {
    title: 'Features',
    subtitle: 'Everything you need to manage construction projects',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { icon: BarChart3, title: 'Project Analytics', desc: 'Real-time dashboards with progress tracking, budget monitoring, and team performance metrics.' },
          { icon: Users, title: 'Team Collaboration', desc: 'Built-in chat, document sharing, and approval workflows for seamless team communication.' },
          { icon: Shield, title: 'Role-Based Access', desc: 'Granular permissions for architects, contractors, clients, and consultants.' },
          { icon: Zap, title: 'Task Management', desc: 'Kanban boards, priority settings, and deadline tracking for every team member.' },
          { icon: Cloud, title: 'Document Management', desc: 'Organized file storage with tags, folders, and version control.' },
          { icon: Building2, title: 'AI Assistant', desc: 'Intelligent project insights and recommendations powered by AI.' },
        ].map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card-hover p-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    ),
  },
  pricing: {
    title: 'Pricing',
    subtitle: 'Simple, transparent pricing for teams of all sizes',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
        {[
          { plan: 'Starter', price: '$29', desc: 'For small teams', features: ['5 projects', '10 team members', 'Basic analytics', 'Email support'] },
          { plan: 'Professional', price: '$79', desc: 'For growing teams', features: ['Unlimited projects', '50 team members', 'Advanced analytics', 'Priority support', 'AI Assistant'], popular: true },
          { plan: 'Enterprise', price: 'Custom', desc: 'For large organizations', features: ['Unlimited everything', 'SSO & SAML', 'Dedicated support', 'Custom integrations', 'SLA guarantee'] },
        ].map((p, i) => (
          <motion.div key={p.plan} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`glass-card p-6 ${p.popular ? 'ring-2 ring-primary' : ''}`}>
            {p.popular && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Most Popular</span>}
            <h3 className="text-xl font-bold text-foreground mt-2">{p.plan}</h3>
            <div className="text-3xl font-bold text-foreground mt-2">{p.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
            <ul className="mt-4 space-y-2">
              {p.features.map(f => <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">✓ {f}</li>)}
            </ul>
            <button className={`w-full mt-6 py-2.5 rounded-xl text-sm font-medium ${p.popular ? 'gradient-primary text-primary-foreground' : 'border border-border text-foreground hover:bg-muted'} transition-colors`}>
              Get Started
            </button>
          </motion.div>
        ))}
      </div>
    ),
  },
  integrations: { title: 'Integrations', subtitle: 'Connect with the tools you already use', content: <div className="text-center py-12"><p className="text-muted-foreground">Integrations with AutoCAD, Revit, Procore, QuickBooks, and more coming soon.</p></div> },
  about: { title: 'About BYLD', subtitle: 'Building the future of construction management', content: <div className="max-w-2xl mx-auto mt-8 space-y-4 text-muted-foreground text-sm"><p>BYLD was founded with a simple mission: make construction project management accessible, collaborative, and intelligent.</p><p>Our platform brings together architects, contractors, clients, and consultants in one unified workspace, eliminating communication gaps and reducing project delays.</p><p>With AI-powered insights and real-time collaboration tools, BYLD is trusted by construction teams worldwide to deliver projects on time and on budget.</p></div> },
  blog: { title: 'Blog', subtitle: 'Insights and updates from the BYLD team', content: <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">{[{ title: 'The Future of Construction Tech', date: 'Mar 25, 2025' }, { title: 'How AI is Transforming Project Management', date: 'Mar 20, 2025' }, { title: '5 Tips for Better Construction Collaboration', date: 'Mar 15, 2025' }, { title: 'Introducing BYLD 2.0', date: 'Mar 10, 2025' }].map(p => <div key={p.title} className="glass-card-hover p-6"><div className="text-xs text-muted-foreground mb-2">{p.date}</div><h3 className="font-semibold text-foreground">{p.title}</h3><p className="text-sm text-muted-foreground mt-2">Read more →</p></div>)}</div> },
  careers: { title: 'Careers', subtitle: 'Join our team and shape the future of construction', content: <div className="max-w-2xl mx-auto mt-8 space-y-3">{['Senior Frontend Engineer', 'Product Designer', 'AI/ML Engineer', 'Customer Success Manager'].map(j => <div key={j} className="glass-card-hover p-5 flex items-center justify-between"><div><div className="font-medium text-foreground">{j}</div><div className="text-xs text-muted-foreground">Remote · Full-time</div></div><button className="text-sm text-primary hover:underline flex items-center gap-1">Apply <ArrowRight className="w-3 h-3" /></button></div>)}</div> },
  privacy: { title: 'Privacy Policy', subtitle: 'Last updated: March 29, 2025', content: <div className="max-w-2xl mx-auto mt-8 text-sm text-muted-foreground space-y-4"><p>At BYLD, we take your privacy seriously. This policy outlines how we collect, use, and protect your data.</p><p><strong className="text-foreground">Data Collection:</strong> We collect information you provide when creating an account, using our services, and communicating with us.</p><p><strong className="text-foreground">Data Usage:</strong> Your data is used to provide and improve our services, communicate with you, and ensure platform security.</p><p><strong className="text-foreground">Data Protection:</strong> We implement industry-standard security measures to protect your information.</p></div> },
  terms: { title: 'Terms of Service', subtitle: 'Last updated: March 29, 2025', content: <div className="max-w-2xl mx-auto mt-8 text-sm text-muted-foreground space-y-4"><p>By using BYLD, you agree to these terms. Please read them carefully.</p><p><strong className="text-foreground">Account:</strong> You are responsible for maintaining the confidentiality of your account credentials.</p><p><strong className="text-foreground">Usage:</strong> Our platform may only be used for lawful purposes related to construction project management.</p><p><strong className="text-foreground">Liability:</strong> BYLD is provided "as is" without warranties of any kind.</p></div> },
  security: { title: 'Security', subtitle: 'Enterprise-grade security for your projects', content: <div className="max-w-2xl mx-auto mt-8 text-sm text-muted-foreground space-y-4"><p>BYLD employs multiple layers of security to protect your data.</p><p>• End-to-end encryption for all data in transit and at rest</p><p>• SOC 2 Type II compliance</p><p>• Regular security audits and penetration testing</p><p>• Role-based access control with granular permissions</p><p>• Two-factor authentication support</p></div> },
};

export default function StaticPage({ page }: { page: string }) {
  const data = pages[page];
  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">BYLD</span>
        </Link>
        <Link to="/login" className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">Sign In</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-3xl font-bold text-foreground">{data.title}</h1>
          <p className="text-muted-foreground mt-2">{data.subtitle}</p>
        </motion.div>
        {data.content}
      </div>

      <Footer />
    </div>
  );
}

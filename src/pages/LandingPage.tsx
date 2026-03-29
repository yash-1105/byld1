import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, BarChart3, Users, Shield, Zap } from 'lucide-react';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">BYLD</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
        </div>
        <Link to="/login" className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          Get Started
        </Link>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Construction Management, Reimagined</span>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mt-6 leading-tight">
            Build smarter.<br />
            <span className="gradient-text">Deliver faster.</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
            BYLD brings architects, contractors, clients, and consultants together in one powerful platform. Track progress, manage budgets, and collaborate in real-time.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link to="/login" className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/features" className="border border-border text-foreground px-8 py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track project progress with live dashboards' },
            { icon: Users, title: 'Team Collaboration', desc: 'Chat, share files, and approve decisions' },
            { icon: Shield, title: 'Role-Based Access', desc: 'Tailored views for every team member' },
            { icon: Zap, title: 'AI-Powered', desc: 'Smart insights and recommendations' },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="glass-card-hover p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

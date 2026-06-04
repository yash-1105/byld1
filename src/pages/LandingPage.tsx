import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import {
  Building2, ArrowRight, HardHat, User, Briefcase, ChevronRight
} from 'lucide-react';
import Footer from '@/components/Footer';
import HeroScrollAnimation from '@/components/HeroScrollAnimation';
import ProductShowcase from '@/components/ProductShowcase';



export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > window.innerHeight * 3);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const roles = [
    { role: 'Architect', icon: Building2, desc: 'Full project control — design, assign, approve, and oversee every detail.', stat: 'Full Access' },
    { role: 'Contractor', icon: HardHat, desc: 'Task execution, site updates, and progress reporting with real-time tools.', stat: 'Task Focus' },
    { role: 'Client', icon: User, desc: 'Simplified oversight — approvals, budgets, and progress at a glance.', stat: 'Approvals' },
    { role: 'Consultant', icon: Briefcase, desc: 'Expert collaboration with consultation requests and advisory tools.', stat: 'Advisory' },
  ];

  return (
    <div className="min-h-screen bg-white noise-bg">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`h-16 fixed top-0 inset-x-0 z-50 transition-colors duration-300 flex items-center justify-between px-6 lg:px-12 ${
          isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-black/5 text-black' : 'bg-transparent text-white'
        }`}
      >
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/byld-logo.jpeg" alt="BYLD" className="h-8 w-8 rounded-lg object-cover" />
          
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {['Features', 'Pricing', 'About', 'Blog'].map(l => (
            <Link key={l} to={`/${l.toLowerCase()}`} className="relative group hover:inherit transition-colors">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium inherit hover:text-primary transition-colors hidden sm:inline-block">Sign In</Link>
          <Link to="/login" className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 inline-block">
            Get Started
          </Link>
        </div>
      </motion.nav>

      <HeroScrollAnimation />
      <ProductShowcase />


      {/* Workflow */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-32">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#1a1814] bg-[#f5f5f5] px-4 py-1.5 rounded-full border border-[#e8e4df]">Workflow</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1814] mt-6 tracking-tight">From design to delivery</h2>
          <p className="text-[#9c9589] mt-4 text-lg">Track every project through a structured, stage-based workflow.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="bg-[#faf9f8] p-6 rounded-2xl border border-[#e8e4df] h-full group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden cursor-pointer">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <span className="text-7xl font-black text-[#1a1814]">0{i + 1}</span>
                </div>
                
                {/* Mini Diagram Container */}
                <div className="w-full h-32 bg-white rounded-xl border border-[#e8e4df] mb-6 relative overflow-hidden shadow-sm group-hover:border-[#1a1814]/20 transition-colors">
                  {i === 0 && (
                    <div className="absolute inset-0 p-4 flex flex-col gap-2">
                       <div className="w-3/4 h-2 bg-[#e8e4df] rounded-full group-hover:bg-[#1a1814]/20 transition-colors" />
                       <div className="w-1/2 h-2 bg-[#f5f5f5] rounded-full" />
                       <div className="mt-auto w-full h-14 border-t-2 border-dashed border-[#e8e4df] flex items-end">
                         <div className="w-8 h-10 bg-[#f5f5f5] rounded-t-md ml-2 border-x border-t border-[#e8e4df] group-hover:-translate-y-2 transition-transform duration-500" />
                         <div className="w-12 h-16 bg-[#faf9f8] rounded-t-md ml-2 border-x border-t border-[#e8e4df] group-hover:-translate-y-4 transition-transform duration-500 delay-75" />
                       </div>
                    </div>
                  )}
                  {i === 1 && (
                    <div className="absolute inset-0 p-4 flex items-center justify-center">
                       <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-green-500 transition-all duration-300">
                         <svg className="w-6 h-6 text-green-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="absolute inset-0 p-5 flex flex-col justify-center gap-4">
                       <div className="w-full h-3 bg-[#f5f5f5] rounded-full overflow-hidden">
                         <div className="w-1/3 h-full bg-[#b5aa9d] rounded-full group-hover:w-full transition-all duration-1000 ease-out" />
                       </div>
                       <div className="w-full h-3 bg-[#f5f5f5] rounded-full overflow-hidden">
                         <div className="w-1/4 h-full bg-[#1a1814] rounded-full group-hover:w-3/4 transition-all duration-1000 ease-out delay-150" />
                       </div>
                    </div>
                  )}
                  {i === 3 && (
                    <div className="absolute inset-0 p-5 flex flex-col gap-3 justify-center">
                       <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-sm bg-green-500 flex items-center justify-center"><svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div><div className="w-16 h-2 bg-[#e8e4df] rounded-full" /></div>
                       <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-sm bg-green-500 flex items-center justify-center"><svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div><div className="w-12 h-2 bg-[#e8e4df] rounded-full" /></div>
                       <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-sm border-2 border-[#e8e4df] group-hover:bg-green-500 group-hover:border-green-500 transition-colors duration-500 flex items-center justify-center"><svg className="w-2 h-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div><div className="w-20 h-2 bg-[#f5f5f5] rounded-full" /></div>
                    </div>
                  )}
                </div>

                <div className="relative z-10">
                  <h3 className="font-semibold text-[#1a1814] text-lg mb-2">{step.stage}</h3>
                  <p className="text-sm text-[#9c9589] leading-relaxed">{step.desc}</p>
                </div>
              </div>
              
              {/* Connector Line (Desktop) */}
              {i < 3 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="w-5 h-5 text-[#e8e4df]" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-white border-y border-[#e8e4df]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#1a1814] bg-[#f5f5f5] px-4 py-1.5 rounded-full border border-[#e8e4df]">Roles</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1814] mt-6 tracking-tight">Tailored for every team member</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#faf9f8] p-8 rounded-2xl border border-[#e8e4df] text-center group cursor-pointer transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
              >
                {/* Interactive Diagram Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 border border-[#e8e4df] group-hover:border-[#1a1814]/20 group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md">
                    <r.icon className="w-7 h-7 text-[#1a1814]" />
                  </div>
                  <div className="text-[9px] font-bold text-[#1a1814] bg-white border border-[#e8e4df] px-2.5 py-1 rounded-md inline-block mb-4 tracking-wider uppercase shadow-sm">
                    {r.stat}
                  </div>
                  <h3 className="font-semibold text-[#1a1814] text-lg mb-2">{r.role}</h3>
                  <p className="text-sm text-[#9c9589] leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="bg-white border-b border-[#e8e4df] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#faf9f8] rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-28 lg:py-32 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl lg:text-6xl font-bold text-[#1a1814] tracking-tight">Start managing your projects the smarter way</h2>
            <p className="text-[#9c9589] mt-6 max-w-xl mx-auto text-lg leading-relaxed">Join construction teams who deliver projects on time and on budget with BYLD.</p>
            <div className="flex items-center justify-center gap-4 mt-10">
              <Link to="/login" className="gradient-primary text-primary-foreground px-10 py-4 rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="bg-[#faf9f8] text-[#1a1814] border border-[#e8e4df] px-10 py-4 rounded-xl text-sm font-bold hover:bg-[#f5f5f5] transition-all hover:-translate-y-0.5 shadow-sm">
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

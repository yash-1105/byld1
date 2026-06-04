import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, ChevronRight, ArrowUpRight, Clock, Users, DollarSign, Calendar
} from 'lucide-react';

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Mockups ───────────────────────────────────────────────────────────────

function SegmentMapMockup() {
  const rooms = [
    { label: 'Living Room', status: 'On Track', color: 'bg-green-500' },
    { label: 'Kitchen', status: 'In Progress', color: 'bg-orange-500' },
    { label: 'Master Suite', status: 'Complete', color: 'bg-green-500' },
    { label: 'Office', status: 'Delayed', color: 'bg-orange-500' },
  ];

  return (
    <div className="bg-[#faf9f8] rounded-2xl border border-[#e8e4df] overflow-hidden shadow-xl">
      <div className="h-40 w-full relative border-b border-[#e8e4df]">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
          alt="Architectural Blueprint" 
          className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf9f8] via-transparent to-transparent" />
        
        {/* Interactive Map Pins */}
        <div className="absolute top-10 left-16 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-md animate-pulse" />
        <div className="absolute top-24 left-1/2 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white shadow-md animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="absolute bottom-10 right-20 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-md animate-pulse" style={{ animationDelay: '600ms' }} />
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {rooms.map(r => (
            <div key={r.label} className="bg-white p-4 rounded-xl border border-[#e8e4df] flex flex-col gap-2 shadow-sm transform hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#1a1814]">{r.label}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${r.color} shadow-sm`} />
              </div>
              <span className="text-xs text-[#9c9589] font-medium">{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesignBoardMockup() {
  const materials = [
    { name: 'Calacatta Marble', category: 'Countertops', status: 'Confirmed', color: 'bg-zinc-100', statusColor: 'bg-green-100 text-green-700' },
    { name: 'Matte Black Fixtures', category: 'Plumbing', status: 'Under Review', color: 'bg-zinc-800', statusColor: 'bg-orange-100 text-orange-700' },
    { name: 'Engineered Oak', category: 'Flooring', status: 'Concept', color: 'bg-[#d2b48c]', statusColor: 'bg-[#f5f5f5] text-[#57534b]' }
  ];

  return (
    <div className="bg-[#faf9f8] rounded-2xl border border-[#e8e4df] overflow-hidden shadow-xl p-6">
      <div className="flex flex-col gap-4">
        {materials.map(m => (
          <div key={m.name} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-[#e8e4df] shadow-sm transform hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer">
            <div className={`w-12 h-12 rounded-lg border border-black/10 ${m.color}`} />
            <div className="flex-1">
              <div className="font-semibold text-sm text-[#1a1814]">{m.name}</div>
              <div className="text-xs text-[#9c9589] mt-0.5">{m.category}</div>
            </div>
            <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${m.statusColor}`}>
              {m.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalMockup() {
  return (
    <div className="bg-[#faf9f8] rounded-2xl border border-[#e8e4df] overflow-hidden shadow-xl p-6 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-[#e8e4df] overflow-hidden shadow-lg w-full max-w-sm transform hover:-translate-y-1 transition-transform duration-300">
        <div className="h-36 w-full relative">
          <img 
            src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Plumbing Fixture" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              JD
            </div>
            <span className="text-white/90 text-xs font-medium drop-shadow-md">Requested by John D.</span>
          </div>
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-[#1a1814] text-sm lg:text-base">Matte Black Basin Faucet</h4>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">+$450</span>
          </div>
          <p className="text-xs text-[#9c9589] mb-5 leading-relaxed">Awaiting client signature for the upgraded master bath fixtures.</p>
          <div className="flex gap-3">
            <button className="flex-1 bg-green-500 text-white text-sm py-2 rounded-xl font-semibold shadow-sm hover:bg-green-600 transition-colors">Approve</button>
            <button className="flex-1 bg-[#f5f5f5] text-[#57534b] text-sm py-2 rounded-xl font-semibold hover:bg-[#e8e4df] transition-colors border border-[#e8e4df]">Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcurementMockup() {
  return (
    <div className="bg-[#faf9f8] rounded-2xl border border-[#e8e4df] overflow-hidden shadow-xl p-6">
      <div className="space-y-4">
        {/* Supplier A - Recommended */}
        <div className="bg-white p-4 rounded-xl border border-green-500/30 shadow-sm relative overflow-hidden transform hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">RECOMMENDED</div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold text-sm text-[#1a1814]">BuildSupply Co.</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex text-orange-400 text-[10px]">★★★★★</div>
                <span className="text-[10px] text-[#9c9589]">(42 orders)</span>
              </div>
            </div>
            <span className="text-base font-bold text-[#1a1814]">$11,800</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-4">
            <span className="text-[#57534b] flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5"/> 3-5 days delivery</span>
            <button className="bg-[#1a1814] text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-black transition-colors shadow-sm">Select</button>
          </div>
        </div>

        {/* Supplier B */}
        <div className="bg-white p-4 rounded-xl border border-[#e8e4df] shadow-sm transform hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold text-sm text-[#1a1814]">Metro Materials</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex text-orange-400 text-[10px]">★★★★☆</div>
                <span className="text-[10px] text-[#9c9589]">(18 orders)</span>
              </div>
            </div>
            <span className="text-base font-bold text-[#1a1814]">$12,400</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-4">
            <span className="text-[#9c9589] flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5"/> 7-10 days delivery</span>
            <button className="bg-[#f5f5f5] text-[#57534b] border border-[#e8e4df] px-4 py-1.5 rounded-lg font-semibold hover:bg-[#e8e4df] transition-colors">Select</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineMockup() {
  const tasks = [
    { name: 'Foundation', status: 'Done', color: 'bg-green-500/10 border-green-500/20 text-green-700', left: 'left-[0%]', width: 'w-[30%]' },
    { name: 'Framing', status: 'In Progress', color: 'bg-orange-500/10 border-orange-500/20 text-orange-700', left: 'left-[30%]', width: 'w-[40%]' },
    { name: 'Plumbing', status: 'Pending', color: 'bg-[#e8e4df]/50 border-[#e8e4df] text-[#57534b]', left: 'left-[70%]', width: 'w-[25%]' },
  ];

  return (
    <div className="bg-[#faf9f8] rounded-2xl border border-[#e8e4df] overflow-hidden shadow-xl p-6">
      {/* Timeline Header */}
      <div className="flex border-b border-[#e8e4df] pb-3 mb-4 text-[10px] font-bold text-[#9c9589] uppercase tracking-wider">
        <div className="w-20 shrink-0">Task</div>
        <div className="flex-1 flex justify-between px-2">
          <span>W1</span>
          <span>W2</span>
          <span>W3</span>
          <span>W4</span>
        </div>
      </div>
      
      {/* Timeline Rows */}
      <div className="space-y-3 relative">
        {/* Vertical Grid Lines */}
        <div className="absolute inset-y-0 left-20 right-0 flex justify-between px-2 pointer-events-none z-0">
          <div className="w-px h-full bg-[#e8e4df]/60" />
          <div className="w-px h-full bg-[#e8e4df]/60" />
          <div className="w-px h-full bg-[#e8e4df]/60" />
          <div className="w-px h-full bg-[#e8e4df]/60" />
        </div>

        {tasks.map(t => (
          <div key={t.name} className="relative z-10 h-10 bg-white rounded-xl border border-[#e8e4df] w-full flex items-center px-3 shadow-sm transform hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer group">
            <span className="text-xs font-semibold text-[#1a1814] w-20 shrink-0">{t.name}</span>
            <div className="flex-1 relative h-full">
              <div className={`absolute top-1/2 -translate-y-1/2 ${t.left} ${t.width} h-6 rounded-md border flex items-center px-2 ${t.color} shadow-sm group-hover:brightness-95 transition-all`}>
                <span className="text-[9px] font-bold tracking-wide uppercase truncate">{t.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

const showcaseItems = [
  {
    tag: 'Segment Map',
    slug: 'segment-map',
    headline: 'Navigate projects\nroom by room.',
    sub: 'Replace sprawling spreadsheets with an interactive floor plan. Click any room to instantly access its tasks, budget, progress, and outstanding approvals — organized the way your project actually lives.',
    bullets: ['Clickable rooms with live progress', 'Per-segment budget & task overview', 'Status indicators at a glance'],
    MockupComponent: SegmentMapMockup,
    reverse: false,
  },
  {
    tag: 'Design Board',
    slug: 'design-board',
    headline: 'From inspiration\nto execution.',
    sub: 'A visual moodboard that doubles as a decision log. Move materials from Rough Concepts through Confirmed all the way to Discarded — so your team always builds from the right spec, never a stale idea.',
    bullets: ['Pinterest-style material curation', 'Full design history & audit trail', 'One-tap material confirmation'],
    MockupComponent: DesignBoardMockup,
    reverse: true,
  },
  {
    tag: 'Approvals',
    slug: 'approvals',
    headline: 'Every decision\ndocumented.',
    sub: 'No more chasing sign-offs over email. A structured approval queue means clients and stakeholders review, approve, or reject with one tap — and every decision is captured with a timestamp and reason.',
    bullets: ['Approval, hold, and reject actions', 'Mandatory reason capture', 'Full audit trail for every item'],
    MockupComponent: ApprovalMockup,
    reverse: false,
  },
  {
    tag: 'Procurement',
    slug: 'procurement',
    headline: 'Choose suppliers\nwith full clarity.',
    sub: 'Compare quotes side by side with cost, lead time, and risk scoring built in. Generate purchase orders in one click and track deliveries in real time — so nothing arrives late or over budget.',
    bullets: ['Multi-vendor quote comparison', 'Automated risk scoring', 'One-click PO generation'],
    MockupComponent: ProcurementMockup,
    reverse: true,
  },
  {
    tag: 'Timeline',
    slug: 'timeline',
    headline: 'See delays\nbefore they hit.',
    sub: 'A premium Gantt interface built for architectural complexity. Visualize task dependencies, flag risks early, and keep every team member aligned — across the full project lifecycle.',
    bullets: ['Dependency-aware Gantt chart', 'Predictive delay detection', 'Team assignment & milestones'],
    MockupComponent: TimelineMockup,
    reverse: false,
  },
];

export default function ProductShowcase() {
  return (
    <section className="bg-white py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col gap-32">
          {showcaseItems.map((item, idx) => (
            <div key={item.tag} className={`flex flex-col ${item.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 items-center`}>
              <Reveal className="flex-1 w-full">
                <div className="mb-8">
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-[#9c9589] mb-3 block">
                    0{idx + 1} — {item.tag}
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-bold text-[#1a1814] leading-tight whitespace-pre-line">
                    {item.headline}
                  </h3>
                </div>
                <p className="text-base text-[#9c9589] leading-relaxed max-w-md">
                  {item.sub}
                </p>
                <ul className="space-y-3 mt-6">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-[#57534b]">
                      <span className="w-5 h-5 rounded-full bg-[#57534b]/8 border border-[#57534b]/12 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-[#57534b]" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="pt-8">
                  <Link to={`/features#${item.slug}`} className="group inline-flex items-center gap-2 text-sm font-semibold text-[#57534b] hover:text-[#1a1814] transition-colors">
                    Explore {item.tag}
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.15} className="flex-1 w-full relative">
                <item.MockupComponent />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

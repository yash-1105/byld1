import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowDown, Zap, Check } from 'lucide-react';
import { Reveal, Pill, Chip } from './primitives';
import { SEGMENTS, BUDGET, PROJECT } from './mockProject';
import { useBookDemo } from './BookDemo';

const NAV_LINKS: [string, string][] = [
  ['Segment Map', 'segment-map'], ['Design', 'design-board'], ['Approvals', 'approvals'],
  ['Budget', 'budget'], ['Procurement', 'procurement'], ['Timeline', 'timeline'], ['AI', 'ai-assistance'],
];

function Wordmark() {
  return (
    <span style={{ fontWeight: 800, letterSpacing: '-.03em', fontSize: 22, color: 'var(--bf-ink)', display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
      BYLD
      <span style={{ color: 'var(--bf-muted-2)', fontWeight: 500 }}>/</span>
      <span style={{ color: '#82887f', fontWeight: 600, letterSpacing: '.22em', fontSize: 13, textTransform: 'uppercase' }}>Space</span>
    </span>
  );
}

export function SiteNav() {
  const { open: openDemo } = useBookDemo();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: scrolled ? 'rgba(246,248,246,.82)' : 'transparent',
      backdropFilter: scrolled ? 'saturate(140%) blur(14px)' : 'none',
      borderBottom: `1px solid ${scrolled ? 'var(--bf-line)' : 'transparent'}`,
      transition: 'all .35s var(--bf-ease)',
    }}>
      <div className="bf-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
        <Link to="/" style={{ textDecoration: 'none' }}><Wordmark /></Link>
        <nav style={{ display: 'flex', gap: 4 }} className="bf-nav-links">
          {NAV_LINKS.map(([t, id]) => (
            <a key={id} href={`#${id}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--bf-ink-soft)', textDecoration: 'none', padding: '8px 12px', borderRadius: 999, transition: 'background .2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bf-beige)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {t}
            </a>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" className="bf-btn bf-btn--ghost bf-btn--sm" style={{ textDecoration: 'none' }}>Sign in</Link>
          <button onClick={openDemo} className="bf-btn bf-btn--primary bf-btn--sm">Book a demo</button>
        </div>
      </div>
    </header>
  );
}

function HeroDashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 2600);
    return () => clearInterval(t);
  }, []);
  const liveSeg = SEGMENTS[tick % 4];
  const ring = 56, r = 24, c = 2 * Math.PI * r;
  const prog = BUDGET.spent / BUDGET.total;

  return (
    <div className="bf-appframe" style={{ width: '100%' }}>
      <div className="bf-appframe__bar">
        <span className="bf-appframe__dots"><i /><i /><i /></span>
        <span className="bf-appframe__title">{PROJECT.projectName}</span>
        <Pill color="green" style={{ marginLeft: 'auto' }}><Zap /> Live</Pill>
      </div>
      <div className="bf-collapse" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="bf-card" style={{ padding: 16, boxShadow: 'var(--bf-sh-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <svg width={ring} height={ring} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke="var(--bf-beige)" strokeWidth="7" />
                <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke="var(--bf-mocha)" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - 0.63)} style={{ transition: 'stroke-dashoffset 1.2s var(--bf-ease)' }} />
              </svg>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>63%</div>
                <div style={{ fontSize: 12.5, color: 'var(--bf-muted)', fontWeight: 600, marginTop: 3 }}>Project complete</div>
              </div>
            </div>
          </div>
          <div className="bf-card" style={{ padding: 16, boxShadow: 'var(--bf-sh-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--bf-muted)', fontWeight: 700, marginBottom: 9 }}>
              <span>BUDGET · ₹{BUDGET.total}L</span><span style={{ color: 'var(--bf-mocha-d)' }}>₹{BUDGET.spent}L spent</span>
            </div>
            <div className="bf-bar" style={{ height: 9 }}><i style={{ width: prog * 100 + '%', transition: 'width 1.4s var(--bf-ease)' }} /></div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {BUDGET.categories.slice(0, 4).map((cat, i) => (
                <div key={i} title={cat.name} style={{ flex: cat.alloc, height: 6, borderRadius: 4, background: cat.color, opacity: .85 }} />
              ))}
            </div>
          </div>
        </div>
        <div className="bf-card" style={{ padding: 16, boxShadow: 'var(--bf-sh-sm)', display: 'grid', gap: 10, alignContent: 'start' }}>
          <div style={{ fontSize: 12.5, color: 'var(--bf-muted)', fontWeight: 700 }}>ACTIVE SEGMENT</div>
          <div key={liveSeg.id} style={{ animation: 'bf-fadeSwap .5s var(--bf-ease)' }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{liveSeg.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--bf-muted)', marginTop: 2 }}>{liveSeg.contractor}</div>
            <div className="bf-bar" style={{ marginTop: 10 }}><i style={{ width: liveSeg.progress + '%', background: liveSeg.status === 'over' ? 'var(--bf-red)' : 'var(--bf-mocha)' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: 'var(--bf-muted)' }}>{liveSeg.progress}% done</span>
              <Pill color={liveSeg.status === 'over' ? 'red' : liveSeg.status === 'complete' ? 'green' : 'mocha'} style={{ padding: '2px 8px', fontSize: 11 }}>{liveSeg.tasks} tasks</Pill>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--bf-line)', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chip style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bf-green-bg)', color: 'var(--bf-green)' }}><Check style={{ width: 16, height: 16 }} /></Chip>
            <span style={{ fontSize: 12.5, color: 'var(--bf-ink-soft)', fontWeight: 600 }}>3 approvals cleared today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { open: openDemo } = useBookDemo();
  const chips = ['Segment Map', 'Design Board', 'Approvals', 'Budget', 'Procurement', 'Timeline', 'Site Diary', 'AI Copilot'];
  return (
    <section className="bf-section" style={{ paddingTop: 64, paddingBottom: 72, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(900px 420px at 50% -8%, rgba(168,195,170,.20), transparent 70%)' }} />
      <div className="bf-wrap" style={{ position: 'relative' }}>
        <Reveal style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto' }}>
          <Pill color="mocha" style={{ marginBottom: 22 }}><Sparkles /> Interactive product tour — no sign-up</Pill>
          <h1 style={{ fontSize: 'clamp(40px, 6.4vw, 76px)', lineHeight: 1.02, letterSpacing: '-.035em', fontWeight: 800 }}>
            See BYLD<span style={{ color: 'var(--bf-mocha)' }}> in action</span>
          </h1>
          <p className="bf-lede" style={{ fontSize: 'clamp(18px,2.1vw,22px)', margin: '22px auto 0', maxWidth: 600 }}>
            Explore every feature through interactive demos and real project workflows.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
            <a href="#segment-map" className="bf-btn bf-btn--primary" style={{ textDecoration: 'none' }}>Start the tour <ArrowDown style={{ width: 16, height: 16 }} /></a>
            <button onClick={openDemo} className="bf-btn bf-btn--ghost">Book a live demo</button>
          </div>
        </Reveal>

        <Reveal delay={0.16} style={{ marginTop: 52, maxWidth: 940, marginLeft: 'auto', marginRight: 'auto' }}>
          <HeroDashboard />
        </Reveal>

        <Reveal delay={0.24} style={{ marginTop: 30, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <span key={c} style={{ fontSize: 13, fontWeight: 600, color: 'var(--bf-muted)', background: 'var(--bf-white)', border: '1px solid var(--bf-line)', padding: '7px 14px', borderRadius: 999, boxShadow: 'var(--bf-sh-sm)' }}>{c}</span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

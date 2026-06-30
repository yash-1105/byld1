import { Link } from 'react-router-dom';
import { Map, Palette, CheckSquare, Layers, Box, Calendar, Camera, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Reveal, Pill, Chip } from './primitives';
import { useBookDemo } from './BookDemo';

const FLOW: [string, React.ReactNode, string][] = [
  ['Segment Map', <Map />, 'segment-map'], ['Design Board', <Palette />, 'design-board'], ['Approvals', <CheckSquare />, 'approvals'],
  ['Budget', <Layers />, 'budget'], ['Procurement', <Box />, 'procurement'], ['Timeline', <Calendar />, 'timeline'],
  ['Site Diary', <Camera />, 'site-monitoring'], ['AI Copilot', <Sparkles />, 'ai-assistance'],
];

export default function Closing() {
  const { open: openDemo } = useBookDemo();
  return (
    <>
      {/* flow recap */}
      <section className="bf-section" style={{ paddingBottom: 40 }}>
        <div className="bf-wrap">
          <Reveal style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px' }}>
            <div className="bf-eyebrow">THE WHOLE JOURNEY</div>
            <h2 style={{ fontSize: 'clamp(28px,3.6vw,42px)', marginTop: 12 }}>One project, start to handover</h2>
            <p className="bf-lede" style={{ marginTop: 14 }}>Every feature you just explored is one stage of the same build. That's how BYLD thinks — not as tools, but as a flow.</p>
          </Reveal>
          <Reveal delay={0.08}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }}>
              {FLOW.map(([t, icon, id], i) => (
                <div key={t} style={{ display: 'contents' }}>
                  <a href={`#${id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 16px', borderRadius: 16, transition: 'background .2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bf-white)'; e.currentTarget.style.boxShadow = 'var(--bf-sh-sm)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <Chip style={{ width: 48, height: 48, borderRadius: 14 }}>{icon}</Chip>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--bf-ink-soft)' }}>{t}</span>
                  </a>
                  {i < FLOW.length - 1 && <ArrowRight className="bf-flow-arrow" style={{ width: 18, height: 18, color: 'var(--bf-muted-2)' }} />}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="bf-section" style={{ paddingTop: 40 }}>
        <div className="bf-wrap">
          <Reveal>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 32, padding: '64px 40px', textAlign: 'center', background: 'linear-gradient(160deg, #3c423d, #262b27)', color: '#eef3ee' }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(600px 300px at 50% 0%, rgba(168,195,170,.28), transparent 70%)' }} />
              <div style={{ position: 'relative' }}>
                <span className="bf-pill" style={{ background: 'rgba(238,243,236,.12)', color: '#dde7de', marginBottom: 20 }}><Sparkles style={{ width: 13, height: 13 }} /> You've seen it. Now build with it.</span>
                <h2 style={{ color: '#f6f8f4', fontSize: 'clamp(32px,4.4vw,54px)', lineHeight: 1.05 }}>Start your project on BYLD</h2>
                <p style={{ color: '#c6d7c7', fontSize: 19, maxWidth: 520, margin: '18px auto 0', lineHeight: 1.55 }}>
                  Spin up the Whitefield Villa workspace — or your own — and put every one of these features to work today.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
                  <Link to="/login" className="bf-btn" style={{ background: '#eef3ee', color: '#262b27', textDecoration: 'none' }}>Start free trial <ArrowRight style={{ width: 16, height: 16 }} /></Link>
                  <button onClick={openDemo} className="bf-btn" style={{ background: 'rgba(238,243,236,.1)', color: '#eef3ee', boxShadow: 'inset 0 0 0 1px rgba(238,243,236,.25)' }}>Book a live demo</button>
                </div>
                <div style={{ marginTop: 22, fontSize: 13, color: '#9ba097', display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check style={{ width: 14, height: 14 }} /> No card required</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check style={{ width: 14, height: 14 }} /> Free for your first project</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check style={{ width: 14, height: 14 }} /> Setup in minutes</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* footer */}
      <footer style={{ borderTop: '1px solid var(--bf-line)', padding: '40px 0' }}>
        <div className="bf-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, letterSpacing: '-.03em', fontSize: 22, color: 'var(--bf-ink)', display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
            BYLD<span style={{ color: 'var(--bf-muted-2)', fontWeight: 500 }}>/</span><span style={{ color: '#82887f', fontWeight: 600, letterSpacing: '.22em', fontSize: 13, textTransform: 'uppercase' }}>Space</span>
          </span>
          <div style={{ fontSize: 13, color: 'var(--bf-muted)' }}>Construction project management, reimagined.</div>
          <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--bf-muted)', fontWeight: 600 }}>
            <Link to="/features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</Link>
            <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link>
            <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>Docs</Link>
            <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

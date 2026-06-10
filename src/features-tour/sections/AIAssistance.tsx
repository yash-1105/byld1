import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Sparkles, Zap, User, CheckSquare, Layers, Truck, TrendingUp, Send } from 'lucide-react';
import { FeatureSection, Pill, Chip } from '../primitives';
import { PROJECT } from '../mockProject';

type PillColor = 'green' | 'amber' | 'red' | 'blue' | 'mocha' | 'muted';
interface InsightCard { t: string; s: string; c: PillColor; v: string }
interface Answer { q: string; text: string; cards: InsightCard[] }
interface Msg { role: 'ai' | 'user'; text: string; done: boolean; typing?: boolean; cards?: InsightCard[] }

const ANSWERS: Record<string, Answer> = {
  approvals: {
    q: 'What approvals are pending?',
    text: "Two approvals are waiting on you right now. **Modular Kitchen — Hacker** (₹6.2L) needs the designer's sign-off, and **Premium Paint — Asian Royale** (₹1.3L) is with the site lead. The Italian Marble for the living room was approved this morning.",
    cards: [{ t: 'Modular Kitchen — Hacker', s: '₹6.2L · Designer', c: 'amber', v: 'Pending' }, { t: 'Premium Paint — Royale', s: '₹1.3L · Site Lead', c: 'amber', v: 'Pending' }],
  },
  budget: {
    q: 'Which segment exceeded budget?',
    text: 'The **Kitchen** is the only segment over budget — it has spent ₹12.8L against a ₹12.0L allocation, a ₹0.8L overrun driven by the modular cabinetry upgrade. Everything else is within limits; Paint & Finish still has ₹4.1L of headroom you could reallocate.',
    cards: [{ t: 'Kitchen', s: '₹12.8L / ₹12.0L', c: 'red', v: '+₹0.8L' }, { t: 'Paint & Finish', s: '₹0.9L / ₹5.0L', c: 'green', v: '₹4.1L free' }],
  },
  delayed: {
    q: 'What materials are delayed?',
    text: 'Nothing is fully blocked, but **balcony waterproofing** lost 4 hours to rain on Mar 9, and 4 boxes from the **Kajaria tile delivery** are held for inspection. If the tiles fail QC, flooring could slip — I\'m watching that against the critical path.',
    cards: [{ t: 'Balcony waterproofing', s: 'Weather · 4 hr delay', c: 'blue', v: 'Logged' }, { t: 'Kajaria tiles', s: '4 boxes · inspection', c: 'amber', v: 'On hold' }],
  },
  health: {
    q: 'Show project health.',
    text: 'The **Whitefield Luxury Villa** is **63% complete** and tracking to a May 5 handover. ₹33.9L of ₹50L is spent — on pace, with one segment (Kitchen) over budget. Bathroom is fully done; Living Room and Master are in the home stretch. Overall: **healthy, watch the kitchen spend.**',
    cards: [{ t: 'Completion', s: 'On schedule', c: 'green', v: '63%' }, { t: 'Budget used', s: '₹33.9L / ₹50L', c: 'mocha', v: '68%' }, { t: 'Risks', s: 'Kitchen overspend', c: 'amber', v: '1 open' }],
  },
};

const PROMPTS: { id: string; icon: ReactNode }[] = [
  { id: 'approvals', icon: <CheckSquare style={{ width: 15, height: 15, color: 'var(--bf-mocha)' }} /> },
  { id: 'budget', icon: <Layers style={{ width: 15, height: 15, color: 'var(--bf-mocha)' }} /> },
  { id: 'delayed', icon: <Truck style={{ width: 15, height: 15, color: 'var(--bf-mocha)' }} /> },
  { id: 'health', icon: <TrendingUp style={{ width: 15, height: 15, color: 'var(--bf-mocha)' }} /> },
];

function renderMd(t: string) {
  return t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**')
    ? <b key={i} style={{ color: 'var(--bf-ink)' }}>{p.slice(2, -2)}</b>
    : <span key={i}>{p}</span>);
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, padding: '2px 0' }}>
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--bf-muted-2)', animation: `bf-pulse 1s ${i * 0.18}s infinite` }} />)}
    </span>
  );
}

export default function AIAssistance() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'ai', text: `Hi — I'm your BYLD copilot for the **${PROJECT.projectName}**. Ask me anything, or tap a question below.`, done: true },
  ]);
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });

  const ask = (key: string) => {
    if (busy) return;
    const a = ANSWERS[key];
    setAsked((x) => [...x, key]);
    setBusy(true);
    setMsgs((m) => [...m, { role: 'user', text: a.q, done: true }]);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: 'ai', text: '', done: false, typing: true, cards: a.cards }]);
      const words = a.text.split(' ');
      let i = 0;
      const stream = setInterval(() => {
        i++;
        setMsgs((m) => {
          const copy = [...m];
          const last = { ...copy[copy.length - 1] };
          last.typing = false;
          last.text = words.slice(0, i).join(' ');
          if (i >= words.length) last.done = true;
          copy[copy.length - 1] = last;
          return copy;
        });
        if (i >= words.length) { clearInterval(stream); setBusy(false); }
      }, 38);
    }, 650);
  };

  const remaining = PROMPTS.filter((p) => !asked.includes(p.id));

  return (
    <FeatureSection
      id="ai-assistance" wash icon={<Sparkles />} num="08" kicker="AI ASSISTANCE"
      title="A copilot that's read your whole project"
      sub="Ask in plain language. BYLD answers from live tasks, budgets and approvals — streaming insights the way a great site manager would, only instantly."
    >
      <div className="bf-appframe" style={{ marginTop: 34, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
        <div className="bf-appframe__bar">
          <Chip style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bf-sand)', color: 'var(--bf-mocha-d)' }}><Sparkles style={{ width: 16, height: 16 }} /></Chip>
          <span className="bf-appframe__title" style={{ color: 'var(--bf-ink)' }}>BYLD Copilot</span>
          <Pill color="green" style={{ marginLeft: 'auto' }}><Zap /> Connected to project</Pill>
        </div>

        <div ref={scrollRef} className="bf-scroll-y" style={{ padding: 22, height: 400, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bf-panel)' }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', animation: 'bf-fadeSwap .3s' }}>
              <Chip style={{ width: 32, height: 32, borderRadius: 9, flex: 'none', background: m.role === 'user' ? 'var(--bf-mocha)' : 'var(--bf-white)', color: m.role === 'user' ? '#fff' : 'var(--bf-mocha-d)', boxShadow: 'var(--bf-sh-sm)' }}>
                {m.role === 'user' ? <User style={{ width: 16, height: 16 }} /> : <Sparkles style={{ width: 16, height: 16 }} />}
              </Chip>
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  padding: '11px 14px', borderRadius: 14, fontSize: 14, lineHeight: 1.55,
                  background: m.role === 'user' ? 'var(--bf-mocha)' : 'var(--bf-white)',
                  color: m.role === 'user' ? '#fff' : 'var(--bf-ink-soft)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--bf-line)',
                  borderTopRightRadius: m.role === 'user' ? 4 : 14, borderTopLeftRadius: m.role === 'user' ? 14 : 4,
                  boxShadow: 'var(--bf-sh-sm)',
                }}>
                  {m.typing ? <TypingDots /> : renderMd(m.text)}
                  {!m.done && !m.typing && <span style={{ display: 'inline-block', width: 7, height: 14, background: 'var(--bf-mocha)', marginLeft: 2, borderRadius: 2, verticalAlign: '-2px', animation: 'bf-pulse 1s infinite' }} />}
                </div>
                {m.cards && m.done && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {m.cards.map((c, j) => (
                      <div key={j} className="bf-card" style={{ padding: '9px 12px', boxShadow: 'var(--bf-sh-sm)', display: 'flex', alignItems: 'center', gap: 10, animation: `bf-popIn .3s var(--bf-ease) ${j * 0.08}s both` }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800 }}>{c.t}</div>
                          <div style={{ fontSize: 11, color: 'var(--bf-muted)' }}>{c.s}</div>
                        </div>
                        <Pill color={c.c}>{c.v}</Pill>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--bf-line)', background: 'var(--bf-white)' }}>
          {remaining.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {remaining.map((p) => (
                <button key={p.id} onClick={() => ask(p.id)} disabled={busy}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--bf-ink-soft)', background: 'var(--bf-panel)', border: '1px solid var(--bf-line)', padding: '8px 13px', borderRadius: 999, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1, transition: 'all .2s', fontFamily: 'inherit' }}>
                  {p.icon} {ANSWERS[p.id].q}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bf-panel)', border: '1px solid var(--bf-line)', borderRadius: 999, padding: '6px 6px 6px 16px' }}>
            <Sparkles style={{ width: 16, height: 16, color: 'var(--bf-muted-2)' }} />
            <input readOnly placeholder={busy ? 'Copilot is thinking…' : remaining.length ? 'Tap a question above to see a live answer…' : 'Ask a follow-up…'} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: 'var(--bf-ink)', outline: 'none', fontFamily: 'inherit' }} />
            <button className="bf-btn bf-btn--primary bf-btn--sm" style={{ padding: '9px 12px' }} disabled><Send style={{ width: 16, height: 16 }} /></button>
          </div>
        </div>
      </div>
    </FeatureSection>
  );
}

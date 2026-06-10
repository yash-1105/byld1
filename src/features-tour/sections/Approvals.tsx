import { useRef, useState } from 'react';
import { CheckSquare, Check, X, User, Clock, RotateCcw } from 'lucide-react';
import { FeatureSection, AppFrame, Pill, Btn, Chip, PH } from '../primitives';
import { APPROVALS } from '../mockProject';
import { imgFor, APPROVAL_IMG } from '../images';

interface HistoryItem { id: string; title: string; amount: string; role: string; decision: 'approved' | 'rejected'; time: string; comment: string }

export default function Approvals() {
  const deck = APPROVALS;
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [leaving, setLeaving] = useState<{ dir: 'left' | 'right'; id: string } | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const reset = () => { setIdx(0); setHistory([]); setLeaving(null); setDrag({ x: 0, y: 0, active: false }); };

  const decide = (dir: 'left' | 'right') => {
    if (leaving || idx >= deck.length) return;
    const card = deck[idx];
    setLeaving({ dir, id: card.id });
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimeout(() => {
      setHistory((h) => [{
        id: card.id, title: card.title, amount: card.amount, role: card.role,
        decision: dir === 'right' ? 'approved' : 'rejected', time,
        comment: dir === 'right' ? 'Approved — proceed to PO.' : 'Rejected — revise & resubmit.',
      }, ...h]);
      setIdx((i) => i + 1);
      setLeaving(null);
      setDrag({ x: 0, y: 0, active: false });
    }, 380);
  };

  const onDown = (e: React.PointerEvent) => { startRef.current = { x: e.clientX, y: e.clientY }; setDrag((d) => ({ ...d, active: true })); e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (!startRef.current) return; setDrag({ x: e.clientX - startRef.current.x, y: (e.clientY - startRef.current.y) * 0.3, active: true }); };
  const onUp = () => {
    if (!startRef.current) return;
    const { x } = drag;
    startRef.current = null;
    if (x > 90) decide('right');
    else if (x < -90) decide('left');
    else setDrag({ x: 0, y: 0, active: false });
  };

  const remaining = deck.length - idx;
  const tilt = drag.x / 18;
  const hintApprove = Math.max(0, Math.min(1, drag.x / 100));
  const hintReject = Math.max(0, Math.min(1, -drag.x / 100));

  return (
    <FeatureSection
      id="approvals" icon={<CheckSquare />} num="03" kicker="APPROVALS"
      title="Approve at the speed of a swipe"
      sub="Pending decisions stack up like cards. Swipe right to approve, left to reject — every choice is timestamped, attributed, and logged to an audit trail."
    >
      <div className="bf-appframe bf-collapse" style={{ marginTop: 34, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Card stack */}
        <div className="bf-collapse-divider" style={{ padding: 28, borderRight: '1px solid var(--bf-line)', background: 'var(--bf-panel)', position: 'relative', minHeight: 460 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--bf-muted)' }}>PENDING REQUESTS</span>
            <Pill color="amber">{remaining} waiting</Pill>
          </div>

          <div style={{ position: 'relative', height: 320, maxWidth: 320, margin: '0 auto' }}>
            {remaining === 0 ? (
              <div className="bf-card" style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24, animation: 'bf-popIn .4s var(--bf-ease-spring)' }}>
                <div>
                  <Chip style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px', background: 'var(--bf-green-bg)', color: 'var(--bf-green)' }}><Check /></Chip>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Queue cleared</div>
                  <div style={{ fontSize: 13.5, color: 'var(--bf-muted)', marginTop: 6, maxWidth: 200 }}>All {deck.length} approvals processed. The audit trail is locked.</div>
                  <Btn variant="ghost" sm onClick={reset} style={{ marginTop: 16 }}><RotateCcw style={{ width: 15, height: 15 }} /> Replay demo</Btn>
                </div>
              </div>
            ) : (
              deck.slice(idx, idx + 3).map((card, i) => {
                const isTop = i === 0;
                const isLeaving = leaving && leaving.id === card.id;
                const style: React.CSSProperties = isTop ? {
                  transform: isLeaving
                    ? `translate(${leaving.dir === 'right' ? 460 : -460}px, -30px) rotate(${leaving.dir === 'right' ? 22 : -22}deg)`
                    : `translate(${drag.x}px, ${drag.y}px) rotate(${tilt}deg)`,
                  transition: drag.active && !isLeaving ? 'none' : 'transform .4s var(--bf-ease)',
                  zIndex: 10, cursor: drag.active ? 'grabbing' : 'grab',
                } : {
                  transform: `translateY(${i * 14}px) scale(${1 - i * 0.05})`,
                  transition: 'transform .4s var(--bf-ease)', zIndex: 10 - i, opacity: 1 - i * 0.12,
                };
                return (
                  <div key={card.id} className="bf-card"
                    onPointerDown={isTop ? onDown : undefined}
                    onPointerMove={isTop ? onMove : undefined}
                    onPointerUp={isTop ? onUp : undefined}
                    style={{ position: 'absolute', inset: 0, padding: 0, overflow: 'hidden', boxShadow: isTop ? 'var(--bf-sh-lg)' : 'var(--bf-sh-sm)', touchAction: 'none', ...style }}>
                    <PH src={APPROVAL_IMG[card.id] ?? imgFor(card.img)} alt={card.title} style={{ height: 150, borderRadius: 0, position: 'relative' }}>
                      {isTop && (
                        <>
                          <div style={{ position: 'absolute', top: 14, left: 14, opacity: hintApprove, transform: 'rotate(-12deg)', border: '3px solid var(--bf-green)', color: 'var(--bf-green)', fontWeight: 800, fontSize: 16, padding: '4px 12px', borderRadius: 8, letterSpacing: '.05em' }}>APPROVE</div>
                          <div style={{ position: 'absolute', top: 14, right: 14, opacity: hintReject, transform: 'rotate(12deg)', border: '3px solid var(--bf-red)', color: 'var(--bf-red)', fontWeight: 800, fontSize: 16, padding: '4px 12px', borderRadius: 8, letterSpacing: '.05em' }}>REJECT</div>
                        </>
                      )}
                    </PH>
                    <div style={{ padding: 18 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{card.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--bf-muted)', marginTop: 5 }}>{card.meta}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--bf-mocha-d)' }}>{card.amount}</span>
                        <Pill color="muted"><User style={{ width: 12, height: 12 }} /> {card.role}</Pill>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--bf-muted-2)', marginTop: 10, fontStyle: 'italic' }}>“{card.note}”</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {remaining > 0 && (
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 24 }}>
              <button onClick={() => decide('left')} title="Reject"
                style={{ width: 56, height: 56, borderRadius: 99, cursor: 'pointer', background: 'var(--bf-white)', boxShadow: 'var(--bf-sh-md)', border: '1px solid var(--bf-line)', display: 'grid', placeItems: 'center', color: 'var(--bf-red)', transition: 'transform .2s, background .2s' }}>
                <X style={{ width: 24, height: 24 }} />
              </button>
              <button onClick={() => decide('right')} title="Approve"
                style={{ width: 56, height: 56, borderRadius: 99, cursor: 'pointer', background: 'var(--bf-mocha)', boxShadow: 'var(--bf-sh-md)', border: 'none', display: 'grid', placeItems: 'center', color: '#fff', transition: 'transform .2s, background .2s' }}>
                <Check style={{ width: 26, height: 26 }} />
              </button>
            </div>
          )}
        </div>

        {/* Audit trail */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock style={{ width: 17, height: 17, color: 'var(--bf-mocha)' }} />
            <span style={{ fontSize: 14, fontWeight: 800 }}>Audit trail</span>
            <Pill color="muted" style={{ marginLeft: 'auto' }}>{history.length} logged</Pill>
          </div>
          <div className="bf-scroll-y" style={{ flex: 1, maxHeight: 400, display: 'grid', gap: 10, alignContent: 'start' }}>
            {history.length === 0 && (
              <div style={{ fontSize: 13.5, color: 'var(--bf-muted)', padding: '30px 10px', textAlign: 'center', border: '1.5px dashed var(--bf-line-2)', borderRadius: 14 }}>
                Make a decision on the left — it appears here instantly with who, when, and why.
              </div>
            )}
            {history.map((h) => (
              <div key={h.id} className="bf-card" style={{ padding: 13, boxShadow: 'var(--bf-sh-sm)', animation: 'bf-slideInRight .35s var(--bf-ease)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Chip style={{ width: 32, height: 32, borderRadius: 9, background: h.decision === 'approved' ? 'var(--bf-green-bg)' : 'var(--bf-red-bg)', color: h.decision === 'approved' ? 'var(--bf-green)' : 'var(--bf-red)' }}>
                    {h.decision === 'approved' ? <Check style={{ width: 18, height: 18 }} /> : <X style={{ width: 18, height: 18 }} />}
                  </Chip>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.2 }}>{h.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--bf-muted)', marginTop: 2 }}>{h.amount} · by {h.role} · {h.time}</div>
                  </div>
                  <Pill color={h.decision === 'approved' ? 'green' : 'red'} style={{ textTransform: 'capitalize' }}>{h.decision}</Pill>
                </div>
                <div style={{ fontSize: 12, color: 'var(--bf-ink-soft)', marginTop: 9, paddingLeft: 42 }}>{h.comment}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeatureSection>
  );
}

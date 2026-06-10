import { useState } from 'react';
import { Calendar, Check, AlertTriangle } from 'lucide-react';
import { FeatureSection, AppFrame, Chip, Segmented } from '../primitives';

type Status = 'complete' | 'in-progress' | 'upcoming' | 'at-risk';
const BASE = [
  { id: 'foundation', name: 'Foundation', offset: 0,  dur: 25, status: 'complete' as Status,    team: 'Rajesh Stoneworks', dep: '—' },
  { id: 'electrical', name: 'Electrical', offset: 26, dur: 23, status: 'complete' as Status,    team: 'VoltEdge Pvt',      dep: 'Foundation' },
  { id: 'flooring',   name: 'Flooring',   offset: 50, dur: 24, status: 'in-progress' as Status, team: 'Kajaria Prime',     dep: 'Electrical' },
  { id: 'painting',   name: 'Painting',   offset: 75, dur: 21, status: 'upcoming' as Status,    team: 'ColorCraft',        dep: 'Flooring' },
  { id: 'finishing',  name: 'Finishing',  offset: 97, dur: 23, status: 'upcoming' as Status,    team: 'Interio Build Co.', dep: 'Painting' },
];
const TOTAL = 145;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
const colorFor = (st: Status) => ({ complete: 'var(--bf-green)', 'in-progress': 'var(--bf-mocha)', upcoming: 'var(--bf-line-2)', 'at-risk': 'var(--bf-red)' }[st]);

function Row({ k, v, cap, danger }: { k: string; v: string; cap?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
      <span style={{ color: 'var(--bf-muted)' }}>{k}</span>
      <span style={{ fontWeight: 700, color: danger ? 'var(--bf-red)' : 'var(--bf-ink)', textTransform: cap ? 'capitalize' : 'none', textAlign: 'right', maxWidth: 120 }}>{v}</span>
    </div>
  );
}

export default function Timeline() {
  const [delay, setDelay] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  const stages = BASE.map((s) => {
    let off = s.offset, dur = s.dur, status: Status = s.status, risk = 'none';
    if (s.id === 'flooring') { dur += delay; if (delay) { status = 'at-risk'; risk = 'delayed'; } }
    if (delay && (s.id === 'painting' || s.id === 'finishing')) { off += delay; status = 'at-risk'; risk = 'cascade'; }
    return { ...s, off, dur, status, risk };
  });

  return (
    <FeatureSection
      id="timeline" wash icon={<Calendar />} num="06" kicker="TIMELINE"
      title="See a delay before it happens"
      sub="A dependency-aware construction schedule. Hover any stage for its team and risk — then simulate a delay and watch it ripple down the critical path in real time."
    >
      <AppFrame
        style={{ marginTop: 34 }}
        title={`Schedule · Whitefield Luxury Villa`}
        status={
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--bf-muted)', fontWeight: 600 }}>Simulate delay on Flooring:</span>
            <Segmented size="sm" value={String(delay)} onChange={(v) => setDelay(Number(v))} options={[
              { value: '0', label: 'On time' }, { value: '10', label: '+10d' }, { value: '22', label: '+22d' },
            ]} />
          </div>
        }
      >
        <div style={{ padding: '26px 28px' }}>
          {/* month axis */}
          <div style={{ position: 'relative', marginLeft: 130, height: 22, borderBottom: '1px solid var(--bf-line)', marginBottom: 16 }}>
            {MONTHS.map((m, i) => (
              <span key={m} style={{ position: 'absolute', left: `${(i / MONTHS.length) * 100}%`, fontSize: 11.5, color: 'var(--bf-muted-2)', fontWeight: 700 }}>{m}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12, position: 'relative' }}>
            {stages.map((s, i) => {
              const left = (s.off / TOTAL) * 100, width = (s.dur / TOTAL) * 100;
              const col = colorFor(s.status);
              // Keep the tooltip inside the frame: show it above for the bottom rows,
              // and right-align it when the bar sits in the right half.
              const tipAbove = i >= stages.length - 2;
              const tipRight = left + width > 52;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 130, flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: col }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>{s.name}</span>
                  </div>
                  <div style={{ position: 'relative', flex: 1, height: 38 }}>
                    <div style={{ position: 'absolute', inset: '13px 0', background: 'var(--bf-beige)', borderRadius: 99 }} />
                    <div
                      onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
                      style={{
                        position: 'absolute', top: 5, height: 28, left: `${left}%`, width: `${width}%`, background: col, borderRadius: 99,
                        transition: 'left .7s var(--bf-ease-spring), width .7s var(--bf-ease-spring), background .4s',
                        display: 'flex', alignItems: 'center', paddingLeft: 12, cursor: 'pointer',
                        boxShadow: hover === s.id ? 'var(--bf-sh-md)' : 'none',
                        backgroundImage: s.status === 'at-risk' ? 'repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 6px, transparent 6px 12px)' : 'none',
                      }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: s.status === 'upcoming' ? 'var(--bf-muted)' : '#fff', whiteSpace: 'nowrap' }}>
                        {s.status === 'complete' ? '✓ Done' : s.status === 'in-progress' ? 'In progress' : s.status === 'at-risk' ? 'At risk' : 'Upcoming'}
                      </span>
                    </div>
                    {hover === s.id && (
                      <div className="bf-card" style={{
                        position: 'absolute', zIndex: 30, padding: 12, width: 210, boxShadow: 'var(--bf-sh-pop)', animation: 'bf-popIn .15s',
                        top: tipAbove ? 'auto' : 40, bottom: tipAbove ? 40 : 'auto',
                        left: tipRight ? 'auto' : `${left}%`, right: tipRight ? `${Math.max(0, 100 - left - width)}%` : 'auto',
                      }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>{s.name}</div>
                        <Row k="Status" v={s.status === 'at-risk' ? 'At risk' : s.status} cap />
                        <Row k="Team" v={s.team} />
                        <Row k="Depends on" v={s.dep} />
                        <Row k="Delay risk" v={s.risk === 'delayed' ? `+${delay}d added` : s.risk === 'cascade' ? `Pushed ${delay}d` : 'None'} danger={s.risk !== 'none'} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--bf-line)' }}>
            {delay === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--bf-green)', fontWeight: 600 }}>
                <Chip style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bf-green-bg)', color: 'var(--bf-green)' }}><Check style={{ width: 18, height: 18 }} /></Chip>
                On schedule — handover tracking for <b style={{ color: 'var(--bf-ink)' }}>&nbsp;May 5</b>.
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, animation: 'bf-fadeSwap .3s' }}>
                <Chip style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bf-red-bg)', color: 'var(--bf-red)', flex: 'none' }}><AlertTriangle style={{ width: 18, height: 18 }} /></Chip>
                <div style={{ fontSize: 13.5, color: 'var(--bf-ink-soft)' }}>
                  <b style={{ color: 'var(--bf-red)' }}>Critical path impacted.</b> A {delay}-day flooring delay pushes Painting and Finishing — handover slips to <b>{delay === 10 ? 'May 15' : 'May 27'}</b>. BYLD has already notified ColorCraft and Interio Build Co. to re-sequence.
                </div>
              </div>
            )}
          </div>
        </div>
      </AppFrame>
    </FeatureSection>
  );
}

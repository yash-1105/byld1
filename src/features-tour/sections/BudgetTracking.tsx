import { useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { Layers, AlertTriangle, Check, IndianRupee, TrendingUp } from 'lucide-react';
import { FeatureSection, AppFrame, Pill, Chip, CountUp } from '../primitives';
import { BUDGET } from '../mockProject';

function BudgetDonut({ spent, total, allocated }: { spent: number; total: number; allocated: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: '-10%' });
  const size = 200, r = 78, cx = size / 2, cy = size / 2, c = 2 * Math.PI * r;
  const spentP = spent / total, allocP = allocated / total;
  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bf-beige)" strokeWidth="18" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bf-tan-soft)" strokeWidth="18" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={seen ? c * (1 - allocP) : c} style={{ transition: 'stroke-dashoffset 1.3s var(--bf-ease) .1s' }} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bf-mocha)" strokeWidth="18" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={seen ? c * (1 - spentP) : c} style={{ transition: 'stroke-dashoffset 1.5s var(--bf-ease) .3s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--bf-muted)', fontWeight: 700 }}>SPENT</div>
        <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>₹<CountUp value={spent} decimals={1} />L</div>
        <div style={{ fontSize: 12.5, color: 'var(--bf-muted)', marginTop: 4 }}>of ₹{total}L total</div>
      </div>
    </div>
  );
}

function BudgetBar({ pct, color, active }: { pct: number; color: string; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: '-10%' });
  return (
    <div ref={ref} className="bf-bar" style={{ height: 10, boxShadow: active ? 'inset 0 0 0 1px var(--bf-line-2)' : 'none' }}>
      <i style={{ width: seen ? Math.min(100, pct) + '%' : 0, background: color, filter: active ? 'brightness(1.05)' : 'none' }} />
    </div>
  );
}

export default function BudgetTracking() {
  const B = BUDGET;
  const [hover, setHover] = useState<string | null>(null);
  const over = B.categories.filter((c) => c.spent > c.alloc);

  const stats = [
    { label: 'Total budget', val: B.total, color: 'var(--bf-ink)', icon: <IndianRupee style={{ width: 13, height: 13 }} /> },
    { label: 'Allocated', val: B.allocated, color: 'var(--bf-tan)', icon: <Layers style={{ width: 13, height: 13 }} /> },
    { label: 'Spent', val: B.spent, color: 'var(--bf-mocha)', icon: <TrendingUp style={{ width: 13, height: 13 }} /> },
    { label: 'Remaining', val: B.remaining, color: 'var(--bf-green)', icon: <Check style={{ width: 13, height: 13 }} /> },
  ];

  return (
    <FeatureSection
      id="budget" wash icon={<Layers />} num="04" kicker="BUDGET TRACKING"
      title="Every rupee, accounted for"
      sub="A ₹50 lakh build, tracked live. Watch allocated, spent, and remaining update — and get flagged the moment a segment crosses its line."
    >
      <AppFrame
        style={{ marginTop: 34 }}
        title={`Budget · Whitefield Luxury Villa`}
        status={over.length > 0 ? <Pill color="red"><AlertTriangle /> {over.length} segment over budget</Pill> : undefined}
      >
        <div className="bf-collapse" style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
          {/* Left: donut + stat tiles */}
          <div className="bf-collapse-divider" style={{ padding: 24, borderRight: '1px solid var(--bf-line)', background: 'var(--bf-panel)' }}>
            <BudgetDonut spent={B.spent} total={B.total} allocated={B.allocated} />
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 14, fontSize: 11.5, color: 'var(--bf-muted)', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--bf-mocha)' }} /> Spent</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--bf-tan-soft)' }} /> Allocated</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
              {stats.map((s) => (
                <div key={s.label} className="bf-card" style={{ padding: 12, boxShadow: 'none', background: 'var(--bf-white)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--bf-muted)', fontWeight: 700 }}>
                    <span style={{ color: s.color, display: 'grid', placeItems: 'center' }}>{s.icon}</span> {s.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4, color: s.color }}>₹<CountUp value={s.val} decimals={1} />L</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: category breakdown + milestones */}
          <div style={{ padding: 24, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>Segment breakdown</span>
              <span style={{ fontSize: 12, color: 'var(--bf-muted)' }}>hover a bar for detail</span>
            </div>
            <div style={{ display: 'grid', gap: 15 }}>
              {B.categories.map((cat) => {
                const isOver = cat.spent > cat.alloc;
                const pct = Math.min(100, (cat.spent / cat.alloc) * 100);
                return (
                  <div key={cat.name} onMouseEnter={() => setHover(cat.name)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--bf-ink-soft)', display: 'flex', alignItems: 'center', gap: 7 }}>
                        {cat.name}
                        {isOver && <Pill color="red" style={{ padding: '1px 7px', fontSize: 10 }}><AlertTriangle style={{ width: 10, height: 10 }} /> over</Pill>}
                      </span>
                      <span style={{ fontWeight: 700, color: isOver ? 'var(--bf-red)' : 'var(--bf-muted)' }}>₹{cat.spent}L / ₹{cat.alloc}L</span>
                    </div>
                    <BudgetBar pct={pct} color={isOver ? 'var(--bf-red)' : cat.color} active={hover === cat.name} />
                    {hover === cat.name && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--bf-muted)', display: 'flex', gap: 16, animation: 'bf-fadeSwap .2s' }}>
                        <span>Used <b style={{ color: isOver ? 'var(--bf-red)' : 'var(--bf-ink)' }}>{pct.toFixed(0)}%</b></span>
                        <span>{isOver ? <span style={{ color: 'var(--bf-red)' }}>Over by ₹{(cat.spent - cat.alloc).toFixed(1)}L</span> : <span style={{ color: 'var(--bf-green)' }}>₹{(cat.alloc - cat.spent).toFixed(1)}L headroom</span>}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {over.length > 0 && (
              <div style={{ marginTop: 20, padding: 14, borderRadius: 14, background: 'var(--bf-red-bg)', border: '1px solid #E4C3BA', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Chip style={{ width: 34, height: 34, borderRadius: 10, background: '#F2D6CE', color: 'var(--bf-red)', flex: 'none' }}><AlertTriangle /></Chip>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--bf-red)' }}>Overspend alert — {over[0].name}</div>
                  <div style={{ fontSize: 12.5, color: '#A65A48', marginTop: 3 }}>Crossed its ₹{over[0].alloc}L allocation by ₹{(over[0].spent - over[0].alloc).toFixed(1)}L. Reallocate from Paint &amp; Finish (₹4.1L headroom) to stay on total.</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Payment milestones</div>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                {B.milestones.map((m, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    {i < B.milestones.length - 1 && <div style={{ position: 'absolute', top: 11, left: '50%', width: '100%', height: 2, background: m.done ? 'var(--bf-mocha)' : 'var(--bf-line-2)' }} />}
                    <div style={{ width: 24, height: 24, borderRadius: 99, margin: '0 auto', position: 'relative', zIndex: 2, background: m.done ? 'var(--bf-mocha)' : 'var(--bf-white)', border: `2px solid ${m.done ? 'var(--bf-mocha)' : 'var(--bf-line-2)'}`, display: 'grid', placeItems: 'center', color: '#fff' }}>
                      {m.done && <Check style={{ width: 14, height: 14 }} />}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 7, color: m.done ? 'var(--bf-ink)' : 'var(--bf-muted)' }}>{m.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--bf-mocha-d)', fontWeight: 700, marginTop: 2 }}>{m.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppFrame>
    </FeatureSection>
  );
}

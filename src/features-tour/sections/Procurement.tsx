import { useMemo, useState, type ReactNode } from 'react';
import { Box, Star, Truck, MapPin, CheckSquare, Check, IndianRupee, Clock, Undo2 } from 'lucide-react';
import { FeatureSection, Reveal, Pill, Btn, Chip, PH, Segmented } from '../primitives';
import { SUPPLIERS, type Supplier } from '../mockProject';
import { VENDOR_IMG } from '../images';

type Sort = 'value' | 'fast' | 'rated';

function ProcRow({ icon, label, value, sub, best }: { icon: ReactNode; label: string; value: string; sub?: string; best?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: best ? 'var(--bf-sand)' : 'var(--bf-white)' }}>
      <span style={{ width: 15, height: 15, color: 'var(--bf-muted)', flex: 'none', display: 'grid', placeItems: 'center' }}>{icon}</span>
      <span style={{ fontSize: 12.5, color: 'var(--bf-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 13.5, fontWeight: 800, color: best ? 'var(--bf-mocha-d)' : 'var(--bf-ink)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {best && <Check style={{ width: 13, height: 13, color: 'var(--bf-green)' }} />}
        {value}
      </span>
      {sub && <span style={{ fontSize: 10.5, color: 'var(--bf-muted-2)', marginLeft: 4 }}>·</span>}
    </div>
  );
}

function impactPill(impact: Supplier['impact']) {
  const m: Record<Supplier['impact'], { color: 'green' | 'mocha' | 'amber'; label: string }> = {
    under: { color: 'green', label: 'Under budget' },
    on: { color: 'mocha', label: 'On budget' },
    over: { color: 'amber', label: 'Over budget' },
  };
  const { color, label } = m[impact];
  return <Pill color={color}>{label}</Pill>;
}

const ICON = { rupee: <IndianRupee style={{ width: 15, height: 15 }} />, truck: <Truck style={{ width: 15, height: 15 }} />, pin: <MapPin style={{ width: 15, height: 15 }} />, warranty: <CheckSquare style={{ width: 15, height: 15 }} /> };

export default function Procurement() {
  const base = SUPPLIERS;
  const [sort, setSort] = useState<Sort>('value');
  const [selected, setSelected] = useState<string | null>(null);
  const [poState, setPoState] = useState<'idle' | 'generating' | 'done'>('idle');

  const sorted = useMemo(() => {
    const arr = [...base];
    if (sort === 'value') arr.sort((a, b) => a.quote - b.quote);
    if (sort === 'fast') arr.sort((a, b) => a.days - b.days);
    if (sort === 'rated') arr.sort((a, b) => b.rating - a.rating);
    return arr;
  }, [sort, base]);

  const best = {
    quote: Math.min(...base.map((s) => s.quote)),
    days: Math.min(...base.map((s) => s.days)),
    rating: Math.max(...base.map((s) => s.rating)),
  };

  const select = (s: Supplier) => {
    setSelected(s.id);
    setPoState('generating');
    setTimeout(() => setPoState('done'), 1500);
  };
  const reset = () => { setSelected(null); setPoState('idle'); };

  const sortLabel = sort === 'value' ? 'Best value' : sort === 'fast' ? 'Fastest' : 'Top rated';

  return (
    <FeatureSection
      id="procurement" icon={<Box />} num="05" kicker="PROCUREMENT"
      title="Source the right vendor in 30 seconds"
      sub="A live request for floor tiles, three real quotes side by side. Compare rating, price, lead time and budget impact — then issue a purchase order in one click."
    >
      {/* request banner */}
      <Reveal delay={0.08} style={{ marginTop: 34 }}>
        <div className="bf-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Chip style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--bf-sand)', color: 'var(--bf-mocha-d)' }}><Box /></Chip>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: 'var(--bf-muted)', fontWeight: 700 }}>OPEN REQUEST · LIVING ROOM</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Floor Tiles — 1,200 sq ft, vitrified</div>
          </div>
          <Segmented<Sort> value={sort} onChange={setSort} options={[
            { value: 'value', label: 'Best value' }, { value: 'fast', label: 'Fastest' }, { value: 'rated', label: 'Top rated' },
          ]} />
        </div>
      </Reveal>

      <div className="bf-proc-grid" style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {sorted.map((s, i) => {
          const isSel = selected === s.id;
          const dim = !!selected && !isSel;
          return (
            <Reveal key={s.id} delay={Math.min(0.32, (i + 1) * 0.08)}>
              <div className="bf-card" style={{
                padding: 0, overflow: 'hidden', position: 'relative',
                outline: isSel ? '2.5px solid var(--bf-mocha)' : '1px solid var(--bf-line)',
                boxShadow: isSel ? 'var(--bf-sh-lg)' : 'var(--bf-sh-md)',
                opacity: dim ? 0.5 : 1, transform: isSel ? 'translateY(-4px)' : 'none',
                transition: 'all .4s var(--bf-ease)',
              }}>
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                  {i === 0 && <Pill color="mocha"><Star style={{ width: 12, height: 12 }} /> {sortLabel}</Pill>}
                </div>
                <PH src={VENDOR_IMG[s.id]} alt={s.name} style={{ height: 110, borderRadius: 0 }} />
                <div style={{ padding: 18 }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <span style={{ display: 'flex', gap: 1, color: 'var(--bf-tan)' }}>
                      {[0, 1, 2, 3, 4].map((n) => <Star key={n} style={{ width: 13, height: 13, opacity: n < Math.round(s.rating) ? 1 : 0.25, fill: n < Math.round(s.rating) ? 'var(--bf-tan)' : 'none' }} />)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{s.rating}</span>
                    <span style={{ fontSize: 12, color: 'var(--bf-muted)' }}>({s.reviews})</span>
                  </div>

                  <div style={{ display: 'grid', gap: 1, marginTop: 16, background: 'var(--bf-line)', borderRadius: 12, overflow: 'hidden' }}>
                    <ProcRow icon={ICON.rupee} label="Quote" value={`₹${s.quote}L`} sub={s.unit} best={s.quote === best.quote} />
                    <ProcRow icon={ICON.truck} label="Delivery" value={`${s.days} days`} best={s.days === best.days} />
                    <ProcRow icon={ICON.pin} label="Distance" value={s.distance} />
                    <ProcRow icon={ICON.warranty} label="Warranty" value={s.warranty} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                    <span style={{ fontSize: 12, color: 'var(--bf-muted)', fontWeight: 700 }}>BUDGET IMPACT</span>
                    {impactPill(s.impact)}
                  </div>

                  <Btn
                    variant={isSel ? 'primary' : 'ghost'}
                    onClick={() => (isSel ? undefined : select(s))}
                    disabled={!!selected && !isSel}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 16, opacity: dim ? 0.6 : 1 }}
                  >
                    {isSel ? (
                      poState === 'generating'
                        ? <><Clock className="bf-spin" style={{ width: 16, height: 16 }} /> Generating PO…</>
                        : <><Check style={{ width: 16, height: 16 }} /> Selected</>
                    ) : 'Select supplier'}
                  </Btn>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* PO result */}
      {poState === 'done' && selected && (
        <Reveal style={{ marginTop: 18 }}>
          <div className="bf-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bf-green-bg)', border: '1px solid #BFD4BA', animation: 'bf-popIn .4s var(--bf-ease-spring)', flexWrap: 'wrap' }}>
            <Chip style={{ width: 46, height: 46, borderRadius: 13, background: '#CFE2C9', color: 'var(--bf-green)' }}><Check /></Chip>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#3F5B3B' }}>Purchase order PO-2041 issued to {base.find((s) => s.id === selected)?.name}</div>
              <div style={{ fontSize: 13, color: '#4F6B4B', marginTop: 3 }}>Linked to Living Room budget · delivery tracked on the site diary · vendor notified automatically.</div>
            </div>
            <Btn variant="ghost" sm onClick={reset}><Undo2 style={{ width: 15, height: 15 }} /> Compare again</Btn>
          </div>
        </Reveal>
      )}
    </FeatureSection>
  );
}

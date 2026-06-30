import { useRef, useState } from 'react';
import { Map, User, CheckSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import { FeatureSection, AppFrame, Pill, Btn, Chip, PH, StatBar, Segmented } from '../primitives';
import { SEGMENTS, APPROVALS, PROJECT, segmentById, type SegmentStatus } from '../mockProject';
import { imgFor } from '../images';

const SEG_ROOMS = [
  { id: 'kitchen', x: 20,  y: 20,  w: 250, h: 165, lx: 145, ly: 102 },
  { id: 'living',  x: 20,  y: 201, w: 250, h: 179, lx: 145, ly: 290 },
  { id: 'master',  x: 286, y: 20,  w: 254, h: 170, lx: 413, ly: 105 },
  { id: 'bath',    x: 286, y: 206, w: 118, h: 84,  lx: 345, ly: 248 },
  { id: 'foyer',   x: 420, y: 206, w: 120, h: 84,  lx: 480, ly: 248 },
  { id: 'balcony', x: 286, y: 306, w: 254, h: 74,  lx: 413, ly: 343 },
];

const SEG_FILL: Record<SegmentStatus, { fill: string; stroke: string; text: string }> = {
  complete:      { fill: '#E9EFE6', stroke: '#9FBE9A', text: '#4F6B4B' },
  'in-progress': { fill: '#eef3ec', stroke: '#a8c3aa', text: '#5e7e64' },
  over:          { fill: '#F6E4DF', stroke: '#D69A8C', text: '#B05744' },
  pending:       { fill: '#eff3ef', stroke: '#dbe3dc', text: '#939990' },
};

const SEG_TASKS: Record<string, [string, string][]> = {
  living:  [['Lay Statuario marble', 'in-progress'], ['Install fluted TV unit', 'pending'], ['Cove lighting wiring', 'pending']],
  kitchen: [['Modular cabinet install', 'in-progress'], ['Countertop fitting', 'pending'], ['Chimney + hob', 'pending'], ['Backsplash tiling', 'pending'], ['Plumbing final', 'blocked'], ['Electrical points', 'done']],
  master:  [['Wardrobe shutters', 'in-progress']],
  bath:    [],
  foyer:   [['Arch plaster work', 'in-progress'], ['Brass sconce wiring', 'pending'], ['Stair railing', 'pending'], ['Niche lighting', 'pending']],
  balcony: [['Waterproofing', 'in-progress'], ['Deck tiling', 'pending']],
};

const SEG_DESIGN: Record<string, string[]> = {
  living:  ['Marble sample', 'Fluted unit ref', 'Linen sofa'],
  kitchen: ['Kitchen render', 'Matte handle', 'Quartz top'],
  master:  ['Walnut wardrobe', 'Headboard ref'],
  bath:    ['Vanity render'],
  foyer:   ['Arch reference', 'Brass sconce'],
  balcony: ['Deck tile', 'Planter layout'],
};

const STATUS_PILL: Record<SegmentStatus, { color: 'green' | 'mocha' | 'red' | 'muted'; label: string }> = {
  complete:      { color: 'green', label: 'Complete' },
  'in-progress': { color: 'mocha', label: 'In progress' },
  over:          { color: 'red',   label: 'Over budget' },
  pending:       { color: 'muted', label: 'Pending' },
};

function SegStatusPill({ status }: { status: SegmentStatus }) {
  const { color, label } = STATUS_PILL[status];
  return <Pill color={color}>{label}</Pill>;
}

const TASK_DOT: Record<string, string> = {
  done: 'var(--bf-green)', 'in-progress': 'var(--bf-mocha)', pending: 'var(--bf-line-2)', blocked: 'var(--bf-red)',
};

type Tip = { x: number; y: number; id: string; below: boolean } | null;
type Tab = 'tasks' | 'budget' | 'approvals' | 'design';

export default function SegmentMap() {
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState('living');
  const [tab, setTab] = useState<Tab>('tasks');
  const [tip, setTip] = useState<Tip>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selSeg = segmentById(sel);

  const onEnter = (room: typeof SEG_ROOMS[number], e: React.MouseEvent) => {
    setHover(room.id);
    const host = wrapRef.current?.getBoundingClientRect();
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement?.getBoundingClientRect();
    if (!host || !svg) return;
    const scaleX = svg.width / 560, scaleY = svg.height / 400;
    // Rooms near the top would push an "above" tooltip off the frame — flip those below.
    const below = room.y < 130;
    const anchorY = below ? room.y + room.h : room.y;
    const x = Math.max(105, Math.min(host.width - 105, room.lx * scaleX + (svg.left - host.left)));
    setTip({ x, y: anchorY * scaleY + (svg.top - host.top), id: room.id, below });
  };

  const tipSeg = tip ? segmentById(tip.id) : null;

  return (
    <FeatureSection
      id="segment-map" icon={<Map />} num="01" kicker="SEGMENT MAP"
      title="Walk the villa, room by room"
      sub="An interactive floor plan of the Whitefield Luxury Villa. Hover any room for a live status read-out; click to open its full workspace."
    >
      <AppFrame
        style={{ marginTop: 34 }}
        title={`Segment Map · ${PROJECT.projectName}`}
        status={
          <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {(['complete', 'in-progress', 'pending', 'over'] as SegmentStatus[]).map((k) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: 'var(--bf-muted)' }}>
                <i style={{ width: 9, height: 9, borderRadius: 3, background: SEG_FILL[k].stroke }} />
                {STATUS_PILL[k].label.replace(' budget', '')}
              </span>
            ))}
          </span>
        }
      >
        <div ref={wrapRef} className="bf-collapse" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.35fr 1fr' }}>
          {/* Floor plan */}
          <div className="bf-collapse-divider" style={{ padding: 22, borderRight: '1px solid var(--bf-line)', background: 'var(--bf-panel)' }}>
            <svg viewBox="0 0 560 400" style={{ width: '100%', height: 'auto', display: 'block' }} onMouseLeave={() => { setHover(null); setTip(null); }}>
              <rect x="10" y="10" width="540" height="380" rx="10" fill="none" stroke="var(--bf-line-2)" strokeWidth="3" />
              {SEG_ROOMS.map((room) => {
                const s = segmentById(room.id);
                const st = SEG_FILL[s.status];
                const isHover = hover === room.id, isSel = sel === room.id;
                return (
                  <g key={room.id} style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => onEnter(room, e)} onMouseMove={(e) => onEnter(room, e)}
                    onClick={() => { setSel(room.id); setTab('tasks'); }}>
                    <rect x={room.x} y={room.y} width={room.w} height={room.h} rx="7"
                      fill={st.fill} stroke={isSel ? 'var(--bf-mocha)' : st.stroke}
                      strokeWidth={isSel ? 3 : isHover ? 2.4 : 1.6}
                      style={{ transition: 'all .25s var(--bf-ease)', filter: isHover || isSel ? 'brightness(1.03)' : 'none' }} />
                    <rect x={room.x} y={room.y + room.h - 6} width={room.w * s.progress / 100} height="6" rx="3" fill={st.stroke} opacity="0.9" style={{ transition: 'width 1s var(--bf-ease)' }} />
                    <text x={room.lx} y={room.ly} textAnchor="middle" fontSize="14" fontWeight="800" fill={st.text} style={{ pointerEvents: 'none' }}>{s.name}</text>
                    <text x={room.lx} y={room.ly + 18} textAnchor="middle" fontSize="12" fontWeight="700" fill={st.text} opacity="0.75" style={{ pointerEvents: 'none' }}>{s.progress}%</text>
                  </g>
                );
              })}
            </svg>
            <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: 'var(--bf-muted-2)', fontFamily: 'ui-monospace, monospace' }}>
              Ground floor · hover a room · click to open
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ padding: 22, minHeight: 420, display: 'flex', flexDirection: 'column' }}>
            <div key={sel} style={{ animation: 'bf-fadeSwap .35s var(--bf-ease)', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{selSeg.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--bf-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User style={{ width: 14, height: 14 }} /> {selSeg.contractor}
                  </div>
                </div>
                <SegStatusPill status={selSeg.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0' }}>
                <div className="bf-card" style={{ padding: 12, boxShadow: 'none', background: 'var(--bf-panel)' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--bf-muted)', fontWeight: 700 }}>PROGRESS</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{selSeg.progress}%</div>
                  <div className="bf-bar" style={{ marginTop: 7 }}><i style={{ width: selSeg.progress + '%', background: SEG_FILL[selSeg.status].stroke }} /></div>
                </div>
                <div className="bf-card" style={{ padding: 12, boxShadow: 'none', background: 'var(--bf-panel)' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--bf-muted)', fontWeight: 700 }}>BUDGET</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: selSeg.spent > selSeg.budget ? 'var(--bf-red)' : 'var(--bf-ink)' }}>₹{selSeg.spent}L</div>
                  <div style={{ fontSize: 11.5, color: 'var(--bf-muted)', marginTop: 4 }}>of ₹{selSeg.budget}L allocated</div>
                </div>
              </div>

              <Segmented<Tab> size="sm" value={tab} onChange={setTab} options={[
                { value: 'tasks', label: `Tasks ${selSeg.tasks ? '· ' + selSeg.tasks : ''}` },
                { value: 'budget', label: 'Budget' },
                { value: 'approvals', label: 'Approvals' },
                { value: 'design', label: 'Design' },
              ]} />

              <div className="bf-scroll-y" style={{ marginTop: 14, flex: 1, maxHeight: 200 }}>
                {tab === 'tasks' && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(SEG_TASKS[sel] || []).length === 0 && <div style={{ fontSize: 13, color: 'var(--bf-muted)', padding: 8 }}>All tasks complete — ready for handover. ✓</div>}
                    {(SEG_TASKS[sel] || []).map(([t, st], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: 'var(--bf-panel)', border: '1px solid var(--bf-line)', animation: `bf-fadeSwap .3s var(--bf-ease) ${i * 0.04}s both` }}>
                        <span style={{ width: 9, height: 9, borderRadius: 99, background: TASK_DOT[st], flex: 'none' }} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>{t}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-muted)', textTransform: 'capitalize' }}>{st.replace('-', ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'budget' && (
                  <div style={{ display: 'grid', gap: 12, paddingTop: 4 }}>
                    <StatBar label="Allocated" value={selSeg.budget} max={selSeg.budget} color="var(--bf-tan)" prefix="₹" suffix="L" />
                    <StatBar label="Spent" value={selSeg.spent} max={selSeg.budget} color={selSeg.spent > selSeg.budget ? 'var(--bf-red)' : 'var(--bf-mocha)'} prefix="₹" suffix="L" />
                    {selSeg.spent > selSeg.budget && (
                      <Pill color="red" style={{ alignSelf: 'start' }}><AlertTriangle /> Over by ₹{(selSeg.spent - selSeg.budget).toFixed(1)}L</Pill>
                    )}
                  </div>
                )}
                {tab === 'approvals' && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {APPROVALS.slice(0, sel === 'kitchen' ? 2 : 1).map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 10, background: 'var(--bf-panel)', border: '1px solid var(--bf-line)' }}>
                        <Chip style={{ width: 30, height: 30, borderRadius: 8 }}><CheckSquare style={{ width: 16, height: 16 }} /></Chip>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--bf-muted)' }}>{a.amount} · {a.role}</div>
                        </div>
                        <Pill color={i === 0 ? 'green' : 'amber'}>{i === 0 ? 'Approved' : 'Pending'}</Pill>
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'design' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {(SEG_DESIGN[sel] || []).map((d, i) => (
                      <PH key={i} src={imgFor(d)} alt={d} style={{ aspectRatio: '1', animation: `bf-popIn .3s var(--bf-ease) ${i * 0.05}s both` }} />
                    ))}
                  </div>
                )}
              </div>

              <Btn variant="primary" sm style={{ marginTop: 14, justifyContent: 'center' }}>
                Open {selSeg.name} workspace <ArrowRight style={{ width: 15, height: 15 }} />
              </Btn>
            </div>
          </div>

          {/* hover tooltip */}
          {tip && tipSeg && (
            <div className="bf-card" style={{ position: 'absolute', left: tip.x, top: tip.y, transform: tip.below ? 'translate(-50%, 12px)' : 'translate(-50%, calc(-100% - 12px))', padding: 12, width: 200, boxShadow: 'var(--bf-sh-pop)', pointerEvents: 'none', zIndex: 40, animation: 'bf-popIn .15s var(--bf-ease)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{tipSeg.name}</span>
                <SegStatusPill status={tipSeg.status} />
              </div>
              <div className="bf-bar"><i style={{ width: tipSeg.progress + '%', background: SEG_FILL[tipSeg.status].stroke }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, fontSize: 12 }}>
                <div><span style={{ color: 'var(--bf-muted)' }}>Progress </span><b>{tipSeg.progress}%</b></div>
                <div><span style={{ color: 'var(--bf-muted)' }}>Tasks </span><b>{tipSeg.tasks}</b></div>
                <div style={{ gridColumn: '1/3' }}><span style={{ color: 'var(--bf-muted)' }}>Budget </span><b style={{ color: tipSeg.spent > tipSeg.budget ? 'var(--bf-red)' : 'var(--bf-ink)' }}>₹{tipSeg.spent}L / ₹{tipSeg.budget}L</b></div>
                <div style={{ gridColumn: '1/3', color: 'var(--bf-muted)', display: 'flex', gap: 5, alignItems: 'center' }}><User style={{ width: 12, height: 12 }} /> {tipSeg.contractor}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--bf-mocha)', fontWeight: 700, marginTop: 8 }}>Click to open →</div>
            </div>
          )}
        </div>
      </AppFrame>
    </FeatureSection>
  );
}

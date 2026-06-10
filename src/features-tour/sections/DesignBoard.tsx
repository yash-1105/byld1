import { useState } from 'react';
import { Palette, Check, RotateCcw, ChevronRight, GripVertical, X, Link2, FileText, Sparkles } from 'lucide-react';
import { FeatureSection, AppFrame, Pill, Btn, Chip, PH } from '../primitives';
import { DESIGN_BOARD, type DesignCard } from '../mockProject';
import { imgFor, DESIGN_IMG } from '../images';

type ColId = 'rough' | 'confirmed' | 'discarded';
const ORDER: ColId[] = ['rough', 'confirmed', 'discarded'];
const COLS: { id: ColId; label: string; icon: React.ReactNode; hint: string; accent: string }[] = [
  { id: 'rough',     label: 'Rough Ideas',       icon: <Sparkles />, hint: 'Free-form inspiration', accent: 'var(--bf-tan)' },
  { id: 'confirmed', label: 'Confirmed Designs',  icon: <Check />,    hint: 'Locked & costed',       accent: 'var(--bf-green)' },
  { id: 'discarded', label: 'Discarded',          icon: <RotateCcw />, hint: 'Kept for the record',  accent: 'var(--bf-muted-2)' },
];

export default function DesignBoard() {
  const [cols, setCols] = useState<Record<ColId, DesignCard[]>>(() => ({
    rough: DESIGN_BOARD.rough.map((c) => ({ ...c })),
    confirmed: DESIGN_BOARD.confirmed.map((c) => ({ ...c })),
    discarded: DESIGN_BOARD.discarded.map((c) => ({ ...c })),
  }));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColId | null>(null);
  const [open, setOpen] = useState<DesignCard | null>(null);
  const [justMoved, setJustMoved] = useState<string | null>(null);

  const findCard = (id: string): [ColId | null, DesignCard | null] => {
    for (const k of ORDER) { const c = cols[k].find((x) => x.id === id); if (c) return [k, c]; }
    return [null, null];
  };

  const move = (id: string, target: ColId) => {
    const [from, card] = findCard(id);
    if (!from || !card || from === target) { setOverCol(null); return; }
    setCols((prev) => ({ ...prev, [from]: prev[from].filter((x) => x.id !== id), [target]: [{ ...card }, ...prev[target]] }));
    setJustMoved(id);
    setTimeout(() => setJustMoved(null), 600);
    setOverCol(null);
  };

  const cycle = (id: string, dir: 1 | -1) => {
    const [from] = findCard(id);
    if (!from) return;
    const idx = ORDER.indexOf(from);
    const target = ORDER[Math.min(ORDER.length - 1, Math.max(0, idx + dir))];
    if (target !== from) move(id, target);
  };

  return (
    <FeatureSection
      id="design-board" wash icon={<Palette />} num="02" kicker="DESIGN BOARD"
      title="Watch a design decision evolve"
      sub="A three-stage moodboard for every segment. Drag a card from rough idea to confirmed — or to the discard pile — and the audit trail follows along."
    >
      <AppFrame
        style={{ marginTop: 34 }}
        title="Design Board · Living Room & Kitchen"
        status={
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--bf-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GripVertical style={{ width: 15, height: 15 }} /> Drag cards between columns
          </span>
        }
      >
        <div className="bf-collapse" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--bf-panel)' }}>
          {COLS.map((col, ci) => (
            <div key={col.id}
              className="bf-collapse-divider"
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
              onDragLeave={(e) => { if (e.currentTarget === e.target) setOverCol(null); }}
              onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, col.id); }}
              style={{ padding: 16, borderRight: ci < 2 ? '1px solid var(--bf-line)' : 'none', background: overCol === col.id ? 'var(--bf-sand)' : 'transparent', transition: 'background .2s', minHeight: 380 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: col.accent }} />
                <span style={{ fontSize: 14, fontWeight: 800 }}>{col.label}</span>
                <Pill color="muted" style={{ marginLeft: 'auto', padding: '2px 9px' }}>{cols[col.id].length}</Pill>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--bf-muted)', marginBottom: 14, paddingLeft: 17 }}>{col.hint}</div>
              <div style={{ display: 'grid', gap: 11 }}>
                {cols[col.id].map((card) => (
                  <div key={card.id} draggable
                    onDragStart={() => setDragId(card.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onClick={() => setOpen(card)}
                    className="bf-card"
                    style={{
                      padding: 10, cursor: 'grab',
                      boxShadow: dragId === card.id ? 'var(--bf-sh-pop)' : 'var(--bf-sh-sm)',
                      opacity: dragId === card.id ? 0.5 : 1,
                      animation: justMoved === card.id ? 'bf-popIn .5s var(--bf-ease-spring)' : 'none',
                      transition: 'box-shadow .2s, transform .2s',
                    }}>
                    <PH src={DESIGN_IMG[card.id] ?? imgFor(card.img)} alt={card.title} style={{ height: 78, marginBottom: 9 }} />
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>{card.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <Pill color="mocha" style={{ padding: '2px 8px', fontSize: 10.5 }}>{card.tag}</Pill>
                      <span style={{ display: 'flex', gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); cycle(card.id, -1); }} title="Move left"
                          style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bf-beige)', color: 'var(--bf-muted)', display: ci === 0 ? 'none' : 'grid', placeItems: 'center' }}>
                          <ChevronRight style={{ width: 13, height: 13, transform: 'rotate(180deg)' }} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cycle(card.id, 1); }} title="Move right"
                          style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bf-beige)', color: 'var(--bf-muted)', display: ci === 2 ? 'none' : 'grid', placeItems: 'center' }}>
                          <ChevronRight style={{ width: 13, height: 13 }} />
                        </button>
                      </span>
                    </div>
                  </div>
                ))}
                {cols[col.id].length === 0 && (
                  <div style={{ border: '1.5px dashed var(--bf-line-2)', borderRadius: 12, padding: '26px 12px', textAlign: 'center', fontSize: 12, color: 'var(--bf-muted-2)' }}>Drop a card here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </AppFrame>

      {/* detail modal */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(54,49,43,.34)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 20, animation: 'bf-fadeSwap .2s' }}>
          <div onClick={(e) => e.stopPropagation()} className="bf-card" style={{ width: 460, maxWidth: '100%', padding: 0, overflow: 'hidden', animation: 'bf-popIn .25s var(--bf-ease-spring)' }}>
            <PH src={DESIGN_IMG[open.id] ?? imgFor(open.img)} alt={open.title} style={{ height: 180, borderRadius: 0 }} />
            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{open.title}</div>
                  <Pill color="mocha" style={{ marginTop: 8 }}>{open.tag}</Pill>
                </div>
                <Chip style={{ width: 34, height: 34, borderRadius: 10, cursor: 'pointer' }}><button onClick={() => setOpen(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', display: 'grid', placeItems: 'center' }}><X style={{ width: 18, height: 18 }} /></button></Chip>
              </div>
              <div style={{ marginTop: 16, padding: 14, background: 'var(--bf-panel)', borderRadius: 12, border: '1px solid var(--bf-line)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--bf-muted)', marginBottom: 5 }}>DESIGNER NOTE</div>
                <div style={{ fontSize: 14, color: 'var(--bf-ink-soft)' }}>{open.note}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Btn variant="ghost" sm style={{ flex: 1, justifyContent: 'center' }}><Link2 style={{ width: 15, height: 15 }} /> Vendor link</Btn>
                <Btn variant="ghost" sm style={{ flex: 1, justifyContent: 'center' }}><FileText style={{ width: 15, height: 15 }} /> Add note</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeatureSection>
  );
}

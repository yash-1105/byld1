import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw,
  Layers, Columns2, SlidersHorizontal,
} from 'lucide-react';
import { renderVersionToCanvas, buildDiffCanvas } from '@/lib/drawingRender';
import type { DrawingVersion } from '@/pages/DrawingsPage';

type CompareMode = 'overlay' | 'side' | 'slider';

const RENDER_WIDTH = 1400;
const NUDGE_STEP = 2; // px per arrow press, at render scale

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drawingTitle: string;
  /** All revisions of the drawing, newest first. */
  versions: DrawingVersion[];
}

export default function DrawingCompareDialog({ open, onOpenChange, drawingTitle, versions }: Props) {
  // Default: previous revision vs current revision
  const [oldId, setOldId] = useState(versions[1]?.id || versions[0]?.id);
  const [newId, setNewId] = useState(versions[0]?.id);
  const [mode, setMode] = useState<CompareMode>('overlay');
  const [nudge, setNudge] = useState({ dx: 0, dy: 0 });
  const [sliderPct, setSliderPct] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const oldVersion = versions.find(v => v.id === oldId);
  const newVersion = versions.find(v => v.id === newId);

  // Rendered source canvases, cached per file so mode/nudge changes are instant.
  const canvasCache = useRef(new Map<string, HTMLCanvasElement>());
  const [oldSrc, setOldSrc] = useState<string | null>(null);
  const [newSrc, setNewSrc] = useState<string | null>(null);
  const [diffSrc, setDiffSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!oldVersion || !newVersion) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const renderCached = async (v: DrawingVersion) => {
      const hit = canvasCache.current.get(v.id);
      if (hit) return hit;
      const canvas = await renderVersionToCanvas(v.file_url, v.file_type, RENDER_WIDTH);
      canvasCache.current.set(v.id, canvas);
      return canvas;
    };

    (async () => {
      try {
        const [oldCanvas, newCanvas] = await Promise.all([renderCached(oldVersion), renderCached(newVersion)]);
        if (cancelled) return;
        setOldSrc(oldCanvas.toDataURL('image/jpeg', 0.85));
        setNewSrc(newCanvas.toDataURL('image/jpeg', 0.85));
        const diff = buildDiffCanvas(oldCanvas, newCanvas, nudge.dx, nudge.dy);
        if (cancelled) return;
        setDiffSrc(diff.toDataURL());
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to render revisions');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [oldVersion, newVersion, nudge]);

  const versionLabel = (v?: DrawingVersion) =>
    v ? `Rev ${v.version_number} · ${new Date(v.created_at).toLocaleDateString()}` : '—';

  const modes: { key: CompareMode; label: string; icon: React.ElementType }[] = [
    { key: 'overlay', label: 'Overlay', icon: Layers },
    { key: 'side', label: 'Side by side', icon: Columns2 },
    { key: 'slider', label: 'Slider', icon: SlidersHorizontal },
  ];

  const applyNudge = (dx: number, dy: number) => setNudge(n => ({ dx: n.dx + dx, dy: n.dy + dy }));

  const sliderRef = useRef<HTMLDivElement>(null);
  const handleSliderDrag = (clientX: number) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSliderPct(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-foreground/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) onOpenChange(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }}
            className="bg-card rounded-3xl border shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4 border-b border-border/40 shrink-0">
              <div className="min-w-0 w-full sm:w-auto sm:mr-auto flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-foreground truncate">Compare — {drawingTitle}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-0.5">
                    <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#dc2626]" /> Removed (only in {oldVersion ? `Rev ${oldVersion.version_number}` : 'older'})</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#2563eb]" /> Added (only in {newVersion ? `Rev ${newVersion.version_number}` : 'newer'})</span>
                    <span className="hidden sm:inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#2d322a]" /> Unchanged</span>
                  </div>
                </div>
                <button onClick={() => onOpenChange(false)} className="p-2 -m-1 rounded-xl hover:bg-muted text-muted-foreground shrink-0 sm:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Revision pickers */}
              <div className="flex items-center gap-2 text-xs min-w-0">
                <select
                  value={oldId}
                  onChange={e => setOldId(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 min-w-0 max-w-[38vw] sm:max-w-none"
                  aria-label="Older revision"
                >
                  {versions.map(v => <option key={v.id} value={v.id}>{versionLabel(v)}</option>)}
                </select>
                <span className="text-muted-foreground shrink-0">vs</span>
                <select
                  value={newId}
                  onChange={e => setNewId(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 min-w-0 max-w-[38vw] sm:max-w-none"
                  aria-label="Newer revision"
                >
                  {versions.map(v => <option key={v.id} value={v.id}>{versionLabel(v)}</option>)}
                </select>
              </div>

              {/* Mode tabs */}
              <div className="flex items-center bg-muted rounded-xl p-1 shrink-0">
                {modes.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      mode === m.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{m.label}</span>
                  </button>
                ))}
              </div>

              <button onClick={() => onOpenChange(false)} className="hidden sm:block p-2 rounded-xl hover:bg-muted text-muted-foreground shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 relative bg-muted/30">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground z-10">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Rendering revisions…</span>
                </div>
              )}
              {error && !loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">{error}</div>
              )}

              {!loading && !error && mode === 'overlay' && diffSrc && (
                <div className="h-full overflow-auto p-4 flex items-start justify-center">
                  <img src={diffSrc} alt="Revision differences" className="max-w-full rounded-lg border border-border/50 shadow-sm bg-white" />
                </div>
              )}

              {!loading && !error && mode === 'side' && (
                <div className="h-full grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 overflow-auto">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{versionLabel(oldVersion)}</div>
                    {oldSrc && <img src={oldSrc} alt="" className="w-full rounded-lg border border-border/50 shadow-sm bg-white" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-primary mb-1.5 uppercase tracking-wide">{versionLabel(newVersion)} (current selection)</div>
                    {newSrc && <img src={newSrc} alt="" className="w-full rounded-lg border border-border/50 shadow-sm bg-white" />}
                  </div>
                </div>
              )}

              {!loading && !error && mode === 'slider' && oldSrc && newSrc && (
                <div className="h-full p-4 flex items-start justify-center overflow-auto">
                  <div
                    ref={sliderRef}
                    className="relative select-none max-w-full cursor-col-resize"
                    onMouseMove={e => { if (e.buttons === 1) handleSliderDrag(e.clientX); }}
                    onMouseDown={e => handleSliderDrag(e.clientX)}
                    onTouchMove={e => handleSliderDrag(e.touches[0].clientX)}
                  >
                    <img src={oldSrc} alt="" className="max-w-full rounded-lg border border-border/50 shadow-sm bg-white block" draggable={false} />
                    <div className="absolute inset-0 overflow-hidden rounded-lg" style={{ clipPath: `inset(0 ${100 - sliderPct}% 0 0)` }}>
                      <img src={newSrc} alt="" className="max-w-full bg-white block" draggable={false} />
                    </div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary shadow" style={{ left: `${sliderPct}%` }}>
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-lg">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary text-primary-foreground">Rev {newVersion?.version_number}</span>
                    <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-foreground/70 text-background">Rev {oldVersion?.version_number}</span>
                  </div>
                </div>
              )}

              {/* Alignment nudge (overlay mode only) — for exports that shifted between revisions */}
              {mode === 'overlay' && !loading && !error && (
                <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur border border-border rounded-2xl shadow-lg p-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1 hidden sm:block">Align</span>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span />
                    <button onClick={() => applyNudge(0, -NUDGE_STEP)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Nudge up"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <span />
                    <button onClick={() => applyNudge(-NUDGE_STEP, 0)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Nudge left"><ArrowLeft className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setNudge({ dx: 0, dy: 0 })} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Reset alignment" title="Reset"><RotateCcw className="w-3.5 h-3.5" /></button>
                    <button onClick={() => applyNudge(NUDGE_STEP, 0)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Nudge right"><ArrowRight className="w-3.5 h-3.5" /></button>
                    <span />
                    <button onClick={() => applyNudge(0, NUDGE_STEP)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Nudge down"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <span />
                  </div>
                  {(nudge.dx !== 0 || nudge.dy !== 0) && (
                    <span className="text-[10px] font-mono text-muted-foreground px-1">{nudge.dx},{nudge.dy}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

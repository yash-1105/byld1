/**
 * Shared primitives for the "Drafting Board" bento dashboard.
 * Sage / white / ink palette + Space Grotesk · Instrument Sans · JetBrains Mono.
 * Single source of truth for the tile palette so hex isn't repeated per tile.
 */
import { ReactNode, useState } from 'react';
import { Plus, Sparkles, ChevronsUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AIInsightsPanel from '@/components/ai/AIInsightsPanel';
import AISummaryPanel from '@/components/ai/AISummaryPanel';

// ── palette ──────────────────────────────────────────────────────────────
export const C = {
  sage: '#4a5d40',
  sageLight: '#a6c587',
  ink: '#1e2419',
  white: '#ffffff',
  canvas: '#eef2e8',
  surface: '#f7f9f4',
  tintSage: '#e6ede0',
  tint: '#ebeee3',
  hairStrong: '#e3e8dd',
  hairSoft: '#e9ede3',
  border: '#e6eae0',
  milestoneBorder: '#ccd8be',
  onDarkBorder: '#36412f',
  textStrong: '#333a2c',
  muted: '#5b6253',
  muted2: '#6b7263',
  mono: '#8c9380',
  faint: '#828a76',
  faint2: '#99a08d',
  faint3: '#aeb4a2',
  onDark: '#ccd3c1',
  onDarkText: '#f7f9f4',
} as const;

// ── helpers ──────────────────────────────────────────────────────────────
export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
export const longDate = (d = new Date()) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
/** "JUL 04" */
export const monoDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();

// ── tile shell ───────────────────────────────────────────────────────────
export function Tile({
  children, className = '', dark = false, onClick, style,
}: {
  children: ReactNode; className?: string; dark?: boolean;
  onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: dark ? C.ink : C.white,
        border: dark ? 'none' : `1px solid ${C.border}`,
        borderRadius: 14,
        color: dark ? C.onDarkText : C.ink,
        ...style,
      }}
      className={`p-[16px_17px] transition-shadow duration-150 ${onClick ? 'cursor-pointer hover:shadow-[0_4px_14px_rgba(38,46,33,0.10)]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/** Small uppercase mono label, e.g. "BUDGET UTILIZED" */
export function Eyebrow({ children, color = C.mono, className = '' }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.06em] ${className}`} style={{ color }}>
      {children}
    </span>
  );
}

export function TileTitle({ children }: { children: ReactNode }) {
  return <span className="font-display font-semibold text-[13px]">{children}</span>;
}

// ── donut (budget ring) ──────────────────────────────────────────────────
export function Donut({ percent, center, label, sub }: { percent: number; center: string; label: string; sub: string }) {
  const r = 40, circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(Math.max(percent, 0), 100) / 100);
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke={C.tint} strokeWidth="9" />
          <circle cx="48" cy="48" r={r} fill="none" stroke={C.sage} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 48 48)"
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-semibold text-[22px]">{center}</span>
        </div>
      </div>
      <Eyebrow className="mt-2.5">{label}</Eyebrow>
      <div className="font-body text-[12px] mt-[3px]" style={{ color: C.muted2 }}>{sub}</div>
    </div>
  );
}

// ── segment bar (one segment per task) ─────────────────────────────────────
export function SegmentBar({ total, done }: { total: number; done: number }) {
  const n = Math.max(total, 1);
  return (
    <div className="flex gap-1 mt-3.5">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-[3px]" style={{ background: i < done ? C.sage : C.tint }} />
      ))}
    </div>
  );
}

// ── 7-day "this week on site" strip ────────────────────────────────────────
export type WeekDay = { wd: string; kind: 'empty' | 'event' | 'today' | 'milestone'; label?: string; dim?: boolean };
export function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => {
        const isToday = d.kind === 'today';
        const isMile = d.kind === 'milestone';
        const hasEvent = d.kind === 'event';
        return (
          <div key={i} className="text-center" style={{ opacity: d.dim ? 0.5 : 1 }}>
            <Eyebrow className="block mb-2">{d.wd}</Eyebrow>
            <div
              className="h-[54px] rounded-lg p-[7px] flex flex-col"
              style={{
                background: isToday ? C.ink : isMile ? C.tintSage : C.canvas,
                border: isToday ? 'none' : `1px solid ${isMile ? C.milestoneBorder : C.hairSoft}`,
                justifyContent: isToday ? 'space-between' : 'flex-end',
              }}
            >
              {isToday && <span className="font-mono text-[9px]" style={{ color: C.sageLight }}>TODAY</span>}
              {(hasEvent || isMile || isToday) && d.label && (
                <span className="font-mono text-[9px] leading-[1.25] text-left overflow-hidden text-ellipsis"
                  style={{ color: isToday ? C.onDark : isMile ? C.sage : C.muted }}>
                  {d.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── striped image placeholder (render / photo slots) ───────────────────────
export function Striped({ label, className = '', style, children }: { label?: string; className?: string; style?: React.CSSProperties; children?: ReactNode }) {
  return (
    <div
      className={`relative flex items-end ${className}`}
      style={{ background: `repeating-linear-gradient(135deg, ${C.hairStrong} 0 11px, ${C.canvas} 11px 22px)`, ...style }}
    >
      {children}
      {label && <span className="font-mono text-[10px] tracking-[0.06em] p-[7px]" style={{ color: C.faint }}>{label}</span>}
    </div>
  );
}

// ── AI dialog: preserves both AI features behind "Analyze project" ──────────
export function useAnalyzeDialog() {
  const [open, setOpen] = useState(false);
  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">AI analysis</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <AIInsightsPanel />
          <AISummaryPanel compact />
        </div>
      </DialogContent>
    </Dialog>
  );
  return { open, setOpen, dialog };
}

// ── greeting header row ─────────────────────────────────────────────────────
export function BentoHeader({ name, summary, onNewTask, onAnalyze, switcher }: {
  name: string; summary: ReactNode; onNewTask?: () => void; onAnalyze?: () => void; switcher?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
      <div>
        <Eyebrow className="block mb-[5px] tracking-[0.1em]">{longDate()}</Eyebrow>
        <h1 className="font-display font-semibold text-[26px] tracking-[-0.02em] leading-none" style={{ color: C.ink }}>
          {greeting()}, {name}
        </h1>
        <div className="font-body text-[13px] mt-[6px]" style={{ color: C.muted }}>{summary}</div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {switcher}
        {onNewTask && (
          <button onClick={onNewTask}
            className="flex items-center gap-[7px] px-[13px] py-[9px] rounded-[9px] font-body font-medium text-[12.5px]"
            style={{ background: C.white, border: `1px solid ${C.hairStrong}`, color: C.textStrong }}>
            <Plus size={14} /> New task
          </button>
        )}
        {onAnalyze && (
          <button onClick={onAnalyze}
            className="flex items-center gap-[7px] px-[13px] py-[9px] rounded-[9px] font-body font-medium text-[12.5px]"
            style={{ background: C.ink, color: C.onDarkText }}>
            <Sparkles size={14} /> Analyze project
          </button>
        )}
      </div>
    </div>
  );
}

export function BentoGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-[13px]">{children}</div>;
}

export function ProjectSwitcher({ value, onChange, projects }: {
  value: string; onChange: (v: string) => void; projects: { id: string; name: string }[];
}) {
  return (
    <div className="flex items-center rounded-[10px]" style={{ background: C.surface, border: `1px solid ${C.hairStrong}` }}>
      <ChevronsUpDown size={14} style={{ color: C.mono }} className="ml-[11px]" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-display font-semibold text-[13px] pl-2 pr-[11px] py-[7px] outline-none cursor-pointer"
        style={{ color: C.ink }}
      >
        <option value="all">All projects</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
}

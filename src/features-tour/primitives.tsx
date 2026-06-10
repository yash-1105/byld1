import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE = [0.22, 0.61, 0.36, 1] as const;

/* ---------- Reveal on scroll (slide only; content always visible) ---------- */
export function Reveal({
  children, className, delay = 0, style,
}: { children: ReactNode; className?: string; delay?: number; style?: CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { y: 20 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Count-up (rAF + safety net so the final value always lands) ---------- */
export function useCountUp(target: number, { dur = 1100, decimals = 0 }: { dur?: number; decimals?: number } = {}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '-10%' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(target * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(() => setVal(target), dur + 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [seen, target, dur]);
  return { ref, value: decimals ? val.toFixed(decimals) : Math.round(val) };
}

export function CountUp({ value, decimals = 0, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const { ref, value: v } = useCountUp(value, { decimals });
  return <span ref={ref}>{prefix}{v}{suffix}</span>;
}

/* ---------- Pill ---------- */
type PillColor = 'green' | 'amber' | 'red' | 'blue' | 'mocha' | 'muted';
export function Pill({ color = 'muted', children, className, style }: { color?: PillColor; children: ReactNode; className?: string; style?: CSSProperties }) {
  return <span className={cn(`bf-pill bf-pill--${color}`, className)} style={style}>{children}</span>;
}

/* ---------- Button ---------- */
export function Btn({
  variant = 'primary', sm, className, style, ...rest
}: { variant?: 'primary' | 'ghost'; sm?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('bf-btn', `bf-btn--${variant}`, sm && 'bf-btn--sm', className)} style={style} {...rest} />;
}

/* ---------- Icon chip ---------- */
export function Chip({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <span className={cn('bf-chip', className)} style={style}>{children}</span>;
}

/* ---------- Image placeholder. With `src` it renders a real photo (the
   striped fill shows underneath while loading); any children render on top
   as overlays. Without `src` it shows the striped placeholder + label. ---------- */
export function PH({ children, src, alt, className, style }: {
  children?: ReactNode; src?: string; alt?: string; className?: string; style?: CSSProperties;
}) {
  return (
    <div className={cn('bf-ph', className)} style={{ position: 'relative', ...(src ? { padding: 0 } : {}), ...style }}>
      {src && (
        <img src={src} alt={alt ?? ''} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      )}
      {children}
    </div>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  options, value, onChange, size,
}: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; size?: 'sm' }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bf-beige)', borderRadius: 999, padding: 4, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: size === 'sm' ? '6px 13px' : '8px 16px', borderRadius: 999,
              fontSize: size === 'sm' ? 12.5 : 13.5, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', color: active ? 'var(--bf-ink)' : 'var(--bf-muted)',
              background: active ? 'var(--bf-white)' : 'transparent',
              boxShadow: active ? 'var(--bf-sh-sm)' : 'none', transition: 'all .25s var(--bf-ease)', whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Animated stat bar ---------- */
export function StatBar({
  label, value, max, color, suffix = '', prefix = '',
}: { label: string; value: number; max: number; color?: string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: '-10%' });
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div ref={ref}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--bf-ink-soft)', fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--bf-muted)', fontWeight: 700 }}>{prefix}{value}{suffix}</span>
      </div>
      <div className="bf-bar">
        <i style={{ width: seen ? pct + '%' : 0, background: color || 'var(--bf-mocha)' }} />
      </div>
    </div>
  );
}

/* ---------- App frame ---------- */
export function AppFrame({ title, status, children, className, style }: {
  title: ReactNode; status?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties;
}) {
  return (
    <div className={cn('bf-appframe', className)} style={style}>
      <div className="bf-appframe__bar">
        <span className="bf-appframe__dots"><i /><i /><i /></span>
        <span className="bf-appframe__title">{title}</span>
        {status && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{status}</span>}
      </div>
      {children}
    </div>
  );
}

/* ---------- Feature section shell + header ---------- */
export function FeatureSection({
  id, wash, icon, num, kicker, title, sub, children,
}: {
  id: string; wash?: boolean; icon: ReactNode; num: string; kicker: string;
  title: string; sub: string; children: ReactNode;
}) {
  return (
    <section id={id} className={cn('bf-section', wash && 'bf-section--wash')}>
      <div className="bf-wrap">
        <Reveal className="bf-feat-head">
          <Chip style={{ width: 52, height: 52, borderRadius: 16 }}>{icon}</Chip>
          <div>
            <div className="bf-feat-num">{num} · {kicker}</div>
            <h2 className="bf-feat-title">{title}</h2>
            <p className="bf-feat-sub">{sub}</p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>{children}</Reveal>
      </div>
    </section>
  );
}

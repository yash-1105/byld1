import { createContext, useContext, useState, type ReactNode } from 'react';
import { Sparkles, Check, X, Calendar } from 'lucide-react';
import { Chip, Btn } from './primitives';

interface BookDemoCtx { open: () => void }
const Ctx = createContext<BookDemoCtx | undefined>(undefined);

export function useBookDemo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBookDemo must be used within BookDemoProvider');
  return ctx;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid var(--bf-line-2)',
  background: 'var(--bf-panel)', fontSize: 14, fontFamily: 'inherit', color: 'var(--bf-ink)', outline: 'none',
};

export function BookDemoProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', date: '' });

  const open = () => { setDone(false); setIsOpen(true); };
  const close = () => setIsOpen(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return;
    setDone(true);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div className="byld-features" onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(54,49,43,.4)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20, animation: 'bf-fadeSwap .2s' }}>
          <div className="bf-card" style={{ width: 460, maxWidth: '100%', padding: 26, animation: 'bf-popIn .25s var(--bf-ease-spring)', position: 'relative' }}>
            <button onClick={close} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--bf-beige)', color: 'var(--bf-muted)', display: 'grid', placeItems: 'center' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>

            {!done ? (
              <form onSubmit={submit}>
                <Chip style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--bf-sand)', color: 'var(--bf-mocha-d)', marginBottom: 14 }}><Calendar style={{ width: 22, height: 22 }} /></Chip>
                <h3 style={{ fontSize: 22, fontWeight: 800 }}>Book a live demo</h3>
                <p style={{ fontSize: 14.5, color: 'var(--bf-muted)', marginTop: 6, lineHeight: 1.5 }}>
                  See BYLD on your own project. Leave your details and we'll reach out to schedule a 30-minute walkthrough.
                </p>
                <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
                  <input style={inputStyle} placeholder="Full name *" value={form.name} onChange={set('name')} required />
                  <input style={inputStyle} type="email" placeholder="Work email *" value={form.email} onChange={set('email')} required />
                  <input style={inputStyle} placeholder="Company / studio" value={form.company} onChange={set('company')} />
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--bf-muted)' }}>
                    Preferred date
                    <input style={{ ...inputStyle, marginTop: 6 }} type="date" value={form.date} onChange={set('date')} />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <Btn type="button" variant="ghost" onClick={close} style={{ flex: 1, justifyContent: 'center' }}>Cancel</Btn>
                  <Btn type="submit" variant="primary" style={{ flex: 1, justifyContent: 'center' }}>Request demo <Sparkles style={{ width: 16, height: 16 }} /></Btn>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 4px' }}>
                <Chip style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px', background: 'var(--bf-green-bg)', color: 'var(--bf-green)' }}><Check style={{ width: 28, height: 28 }} /></Chip>
                <h3 style={{ fontSize: 22, fontWeight: 800 }}>Request received</h3>
                <p style={{ fontSize: 14.5, color: 'var(--bf-muted)', marginTop: 8, lineHeight: 1.55 }}>
                  Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''} — we'll email <b style={{ color: 'var(--bf-ink)' }}>{form.email}</b> to confirm a time
                  {form.date ? <> around <b style={{ color: 'var(--bf-ink)' }}>{form.date}</b></> : ''}.
                </p>
                <Btn variant="primary" onClick={close} style={{ marginTop: 22, justifyContent: 'center', width: '100%' }}>Done</Btn>
              </div>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

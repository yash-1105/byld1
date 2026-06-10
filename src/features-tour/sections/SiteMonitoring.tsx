import { useState } from 'react';
import { Camera, Truck, CloudRain, CheckSquare, Sun, Cloud, ChevronDown, MapPin, User } from 'lucide-react';
import { FeatureSection, AppFrame, Pill, Chip, PH, Segmented } from '../primitives';
import { DIARY, type DiaryEntry } from '../mockProject';
import { imgFor } from '../images';

type Filter = 'all' | 'delivery' | 'rain';
const WEATHER: Record<DiaryEntry['weather'], React.ReactNode> = {
  sun: <Sun style={{ width: 16, height: 16 }} />, cloud: <Cloud style={{ width: 16, height: 16 }} />, rain: <CloudRain style={{ width: 16, height: 16 }} />,
};

export default function SiteMonitoring() {
  const [open, setOpen] = useState<string | null>('d1');
  const [filter, setFilter] = useState<Filter>('all');
  const filtered = filter === 'all' ? DIARY : DIARY.filter((d) => (filter === 'delivery' ? d.delivery : d.weather === 'rain'));

  const summary = [
    { icon: <Camera style={{ width: 17, height: 17 }} />, label: 'Site visits', val: '4 logged', c: 'var(--bf-mocha)' },
    { icon: <Truck style={{ width: 17, height: 17 }} />, label: 'Deliveries', val: '1 received', c: 'var(--bf-green)' },
    { icon: <CloudRain style={{ width: 17, height: 17 }} />, label: 'Weather delays', val: '4 hrs', c: 'var(--bf-blue)' },
    { icon: <CheckSquare style={{ width: 17, height: 17 }} />, label: 'Updates', val: '9 entries', c: 'var(--bf-tan)' },
  ];

  return (
    <FeatureSection
      id="site-monitoring" icon={<Camera />} num="07" kicker="SITE MONITORING"
      title="A diary your site writes itself"
      sub="Every visit, photo, delivery and weather log — pinned to a date and a segment. Scroll the timeline the way it actually happened on the ground."
    >
      <div className="bf-appframe bf-collapse" style={{ marginTop: 34, display: 'grid', gridTemplateColumns: '260px 1fr' }}>
        {/* left rail */}
        <div className="bf-collapse-divider" style={{ padding: 22, borderRight: '1px solid var(--bf-line)', background: 'var(--bf-panel)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>This week on site</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {summary.map((x) => (
              <div key={x.label} className="bf-card" style={{ padding: 12, boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 11 }}>
                <Chip style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bf-white)', color: x.c, boxShadow: 'var(--bf-sh-sm)' }}>{x.icon}</Chip>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--bf-muted)', fontWeight: 600 }}>{x.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{x.val}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, fontSize: 12, fontWeight: 700, color: 'var(--bf-muted)', marginBottom: 8 }}>FILTER</div>
          <Segmented<Filter> size="sm" value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'All' }, { value: 'delivery', label: 'Deliveries' }, { value: 'rain', label: 'Weather' },
          ]} />
        </div>

        {/* diary timeline */}
        <div className="bf-scroll-y" style={{ padding: '24px 28px', maxHeight: 540 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 11, top: 6, bottom: 6, width: 2, background: 'var(--bf-line)' }} />
            <div style={{ display: 'grid', gap: 18 }}>
              {filtered.map((d) => {
                const isOpen = open === d.id;
                return (
                  <div key={d.id} style={{ position: 'relative', paddingLeft: 38 }}>
                    <span style={{ position: 'absolute', left: 3, top: 4, width: 18, height: 18, borderRadius: 99, background: 'var(--bf-white)', border: '2px solid var(--bf-mocha)', display: 'grid', placeItems: 'center', zIndex: 2 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--bf-mocha)' }} />
                    </span>
                    <div className="bf-card" style={{ padding: 0, overflow: 'hidden', boxShadow: isOpen ? 'var(--bf-sh-md)' : 'var(--bf-sh-sm)', transition: 'box-shadow .25s' }}>
                      <button onClick={() => setOpen(isOpen ? null : d.id)} style={{ width: '100%', textAlign: 'left', padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--bf-mocha-d)' }}>{d.date}</span>
                            <span style={{ fontSize: 11.5, color: 'var(--bf-muted-2)' }}>· {d.day}</span>
                            <Pill color="muted" style={{ padding: '2px 8px' }}>{d.segment}</Pill>
                          </div>
                          <div style={{ fontSize: 15.5, fontWeight: 800 }}>{d.title}</div>
                          <div style={{ fontSize: 13, color: 'var(--bf-muted)', marginTop: 4, lineHeight: 1.5 }}>{d.body}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flex: 'none' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--bf-blue)' }}>
                            {WEATHER[d.weather]} {d.temp}
                          </span>
                          <ChevronDown style={{ width: 18, height: 18, color: 'var(--bf-muted-2)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} />
                        </div>
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 16px 16px', animation: 'bf-fadeSwap .3s' }}>
                          {d.delivery && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, background: 'var(--bf-green-bg)', marginBottom: 12 }}>
                              <Truck style={{ width: 16, height: 16, color: 'var(--bf-green)' }} />
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3F5B3B' }}>Material delivery — {d.delivery}</span>
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${d.photos.length}, 1fr)`, gap: 10 }}>
                            {d.photos.map((p, i) => (
                              <PH key={i} src={imgFor(p)} alt={p} style={{ height: 110, animation: `bf-popIn .3s var(--bf-ease) ${i * 0.06}s both` }} />
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12, color: 'var(--bf-muted)', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Camera style={{ width: 13, height: 13 }} /> {d.photos.length} photos</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin style={{ width: 13, height: 13 }} /> {d.segment}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><User style={{ width: 13, height: 13 }} /> Logged by site lead</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </FeatureSection>
  );
}

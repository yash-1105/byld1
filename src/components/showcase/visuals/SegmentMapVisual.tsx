import { useState } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ROOMS, PHOTO_HOUSE, EASE_OUT, type VisualProps, type Room } from '../featureData';

const STAGE_SHADOW =
  'shadow-[0_50px_110px_-60px_rgba(40,30,18,0.55),0_6px_20px_-12px_rgba(0,0,0,0.1)]';

function Pin({ room, i, progress, active, onSelect }: {
  room: Room; i: number; progress: MotionValue<number>; active: boolean; onSelect: () => void;
}) {
  const scale = useTransform(progress, [0.05 + i * 0.05, 0.2 + i * 0.05], [0, 1], { clamp: true });
  const color = room.s === 'ok' ? '#25c75c' : '#ea7c3c';
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-label={room.name}
      style={{ left: `${room.x}%`, top: `${room.y}%`, x: '-50%', y: '-50%', scale }}
      className="absolute w-[26px] h-[26px] cursor-pointer z-[3]"
    >
      <span
        className="absolute inset-0 rounded-full opacity-50 animate-pin-pulse motion-reduce:animate-none"
        style={{ background: color }}
      />
      <span
        className="absolute inset-[7px] rounded-full"
        style={{
          background: color,
          boxShadow: active
            ? '0 0 0 3px #fff, 0 2px 8px rgba(0,0,0,0.4)'
            : '0 2px 6px rgba(0,0,0,0.3)',
        }}
      />
    </motion.button>
  );
}

function RoomCard({ room, i, progress, active, onSelect }: {
  room: Room; i: number; progress: MotionValue<number>; active: boolean; onSelect: () => void;
}) {
  const range: [number, number] = [0.22 + i * 0.07, 0.42 + i * 0.07];
  const opacity = useTransform(progress, range, [0, 1], { clamp: true });
  const y = useTransform(progress, range, [14, 0], { clamp: true });
  const dot = room.s === 'ok' ? '#25c75c' : '#ea7c3c';
  return (
    <motion.div style={{ opacity, y }}>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left rounded-[14px] px-4 py-[15px] border transition-[transform,border-color,box-shadow,background] duration-300 ${
          active
            ? 'bg-[#161513] border-[#161513]'
            : 'bg-white border-[#e7e3db] hover:border-[#c9b8a3] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(0,0,0,0.25)]'
        }`}
      >
        <span className="flex items-center justify-between">
          <b className={`text-[15px] tracking-[-0.01em] ${active ? 'text-white' : 'text-[#161513]'}`}>{room.name}</b>
          <span className="w-[9px] h-[9px] rounded-full flex-none" style={{ background: dot }} />
        </span>
        <span className={`block text-[13px] mt-1 ${active ? 'text-white/60' : 'text-[#908b82]'}`}>{room.status}</span>
      </button>
    </motion.div>
  );
}

export default function SegmentMapVisual({ progress }: VisualProps) {
  const [active, setActive] = useState(0);
  const detailOpacity = useTransform(progress, [0.6, 0.78], [0, 1], { clamp: true });
  const detailY = useTransform(progress, [0.6, 0.78], [12, 0], { clamp: true });
  const r = ROOMS[active];
  const stats = [
    { k: 'Budget', v: r.budget },
    { k: 'Tasks done', v: r.tasks },
    { k: 'Progress', v: r.prog },
  ];

  return (
    <div className={`relative bg-white border border-[#e7e3db] rounded-[24px] overflow-hidden ${STAGE_SHADOW}`}>
      <div className="relative h-[250px] bg-[#f1efea]">
        <img src={PHOTO_HOUSE} alt="Project hero" loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-white/[0.06]" />
        {ROOMS.map((room, i) => (
          <Pin key={room.name} room={room} i={i} progress={progress} active={active === i} onSelect={() => setActive(i)} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {ROOMS.map((room, i) => (
          <RoomCard key={room.name} room={room} i={i} progress={progress} active={active === i} onSelect={() => setActive(i)} />
        ))}
      </div>

      <motion.div
        style={{ opacity: detailOpacity, y: detailY }}
        className="border-t border-[#efece5] p-4 grid grid-cols-3 gap-3"
      >
        <motion.div
          key={active}
          initial={{ opacity: 0.4, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="contents"
        >
          {stats.map((s) => (
            <div key={s.k} className="bg-[#fbfaf8] border border-[#efece5] rounded-[11px] px-[13px] py-[11px]">
              <div className="text-[11px] font-semibold text-[#908b82]">{s.k}</div>
              <div className="text-[18px] font-bold tracking-[-0.02em] text-[#161513] mt-[3px] tabular-nums">{s.v}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { Clock } from 'lucide-react';
import { VENDORS, type VisualProps, type Vendor } from '../featureData';

const STAGE_SHADOW =
  'shadow-[0_50px_110px_-60px_rgba(40,30,18,0.55),0_6px_20px_-12px_rgba(0,0,0,0.1)]';

function VendorCard({ v, i, progress, selected, onSelect }: {
  v: Vendor; i: number; progress: MotionValue<number>; selected: boolean; onSelect: () => void;
}) {
  const range: [number, number] = [0.06 + i * 0.08, 0.28 + i * 0.08];
  const opacity = useTransform(progress, range, [0, 1], { clamp: true });
  const y = useTransform(progress, range, [16, 0], { clamp: true });
  const fill = useTransform(progress, range, ['0%', `${v.risk}%`], { clamp: true });

  return (
    <motion.div
      style={{ opacity, y }}
      className={`relative rounded-[14px] p-4 border transition-[border-color,box-shadow] duration-300 ${
        selected ? 'border-[#141714] shadow-[0_16px_34px_-22px_rgba(0,0,0,0.35)]' : 'border-[#e1e7e2]'
      }`}
    >
      {v.rec && (
        <span className="absolute -top-[9px] right-4 bg-[#25c75c] text-white text-[9px] font-extrabold tracking-[0.08em] uppercase px-[9px] py-1 rounded-full">
          Recommended
        </span>
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[16px] font-bold tracking-[-0.01em] text-[#141714]">{v.n}</div>
          <div className="text-[12px] mt-1 tracking-[1px] text-[#6b986d]">
            {v.stars}
            <span className="text-[#8a8f86] ml-1.5">({v.orders})</span>
          </div>
        </div>
        <div className="text-[20px] font-bold tracking-[-0.02em] text-[#141714] tabular-nums">{v.price}</div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-[12px]">
        <span className="font-semibold text-[#8a8f86]">Risk</span>
        <span className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#f1f4f1]">
          <motion.span className="block h-full rounded-full" style={{ width: fill, background: v.riskC }} />
        </span>
        <span className="font-semibold" style={{ color: v.riskC }}>{v.riskL}</span>
      </div>

      <div className="flex items-center justify-between mt-3.5">
        <span className="inline-flex items-center gap-[5px] text-[12px] text-[#8a8f86]">
          <Clock className="w-[13px] h-[13px]" /> {v.days}
        </span>
        <button
          type="button"
          onClick={onSelect}
          className={`text-[13px] font-semibold px-[18px] py-2 rounded-full transition-[transform,background] duration-200 hover:-translate-y-0.5 ${
            selected ? 'bg-[#25c75c] text-white' : 'bg-[#f1f4f1] text-[#353a36]'
          }`}
        >
          {selected ? 'Selected' : 'Select'}
        </button>
      </div>
    </motion.div>
  );
}

export default function ProcurementVisual({ progress }: VisualProps) {
  const [selected, setSelected] = useState(0);
  return (
    <div className={`bg-white border border-[#e1e7e2] rounded-[24px] overflow-hidden p-5 flex flex-col gap-3 ${STAGE_SHADOW}`}>
      {VENDORS.map((v, i) => (
        <VendorCard key={v.n} v={v} i={i} progress={progress} selected={selected === i} onSelect={() => setSelected(i)} />
      ))}
    </div>
  );
}

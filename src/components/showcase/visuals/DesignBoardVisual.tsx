import { motion, useTransform, type MotionValue } from 'framer-motion';
import { BOARD, type VisualProps, type Material } from '../featureData';

const STAGE_SHADOW =
  'shadow-[0_50px_110px_-60px_rgba(40,30,18,0.55),0_6px_20px_-12px_rgba(0,0,0,0.1)]';

const CHIP: Record<Material['chip'], string> = {
  concept: 'bg-[#f1f4f1] text-[#8a8f86]',
  review: 'bg-[#e8f1ea] text-[#6b986d]',
  confirmed: 'bg-[#e6f6ec] text-[#16a34a]',
};

function MaterialCard({ m, gi, progress }: { m: Material; gi: number; progress: MotionValue<number> }) {
  const range: [number, number] = [0.06 + gi * 0.055, 0.26 + gi * 0.055];
  const opacity = useTransform(progress, range, [0, 1], { clamp: true });
  const y = useTransform(progress, range, [18, 0], { clamp: true });
  const scale = useTransform(progress, range, [0.96, 1], { clamp: true });
  return (
    <motion.div style={{ opacity, y, scale }} className="mb-2.5">
      <div className="group bg-white border border-[#e1e7e2] rounded-[12px] p-[11px] flex flex-col gap-2.5 cursor-grab transition-[transform,box-shadow,border-color] duration-300 hover:border-[#bcd0bf] hover:shadow-[0_14px_28px_-18px_rgba(0,0,0,0.3)] hover:-translate-y-[3px] hover:rotate-[-0.6deg] active:cursor-grabbing">
        <div className="flex items-center justify-between gap-2">
          <span className="w-9 h-9 rounded-[9px] flex-none border border-black/[0.06]" style={{ background: m.c }} />
          <span className={`text-[10px] font-bold tracking-[0.03em] uppercase px-[9px] py-1 rounded-full whitespace-nowrap ${CHIP[m.chip]}`}>
            {m.lbl}
          </span>
        </div>
        <div className="min-w-0">
          <b className="block text-[13.5px] tracking-[-0.01em] text-[#141714] truncate">{m.n}</b>
          <span className="block text-[12px] text-[#8a8f86] truncate">{m.t}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function DesignBoardVisual({ progress }: VisualProps) {
  let gi = -1; // running global index across all columns (matches prototype order)
  return (
    <div className={`bg-white border border-[#e1e7e2] rounded-[24px] overflow-hidden p-5 ${STAGE_SHADOW}`}>
      <div className="grid grid-cols-3 gap-3">
        {BOARD.map((col) => (
          <div key={col.title}>
            <div className="flex items-center gap-[7px] mb-2.5 text-[11px] font-bold tracking-[0.1em] uppercase text-[#8a8f86]">
              {col.title}
              <span className="bg-[#f1f4f1] rounded-full px-[7px] py-px text-[10px] text-[#353a36] tracking-normal">
                {col.items.length}
              </span>
            </div>
            {col.items.map((m) => {
              gi += 1;
              return <MaterialCard key={m.n} m={m} gi={gi} progress={progress} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

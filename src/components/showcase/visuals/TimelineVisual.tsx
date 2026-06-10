import { motion, useTransform, type MotionValue } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { TIMELINE_TASKS, type VisualProps, type TimelineTask } from '../featureData';

const STAGE_SHADOW =
  'shadow-[0_50px_110px_-60px_rgba(40,30,18,0.55),0_6px_20px_-12px_rgba(0,0,0,0.1)]';

const BAR: Record<TimelineTask['cls'], string> = {
  done: 'bg-[#e6f6ec] text-[#16a34a]',
  prog: 'bg-[#fcecdf] text-[#ea7c3c]',
  pend: 'bg-[#f1efea] text-[#908b82]',
  risk: 'bg-[#fbe3e0] text-[#c0392b]',
};

function TaskRow({ t, i, progress }: { t: TimelineTask; i: number; progress: MotionValue<number> }) {
  const scaleX = useTransform(progress, [0.12 + i * 0.085, 0.4 + i * 0.085], [0, 1], { clamp: true });
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3.5 py-[13px] border-b border-[#efece5]">
      <span className="text-[14px] font-semibold text-[#161513]">{t.n}</span>
      <div className="relative h-[30px]">
        <div className="absolute inset-0 grid grid-cols-4">
          {[0, 1, 2, 3].map((c) => (
            <i key={c} className={c < 3 ? 'border-r border-dashed border-[#e7e3db]' : ''} />
          ))}
        </div>
        <motion.div
          style={{
            left: `${(t.start / 4) * 100}%`,
            width: `${(t.span / 4) * 100}%`,
            scaleX,
            transformOrigin: 'left',
          }}
          className={`absolute top-1 h-[22px] rounded-[7px] flex items-center px-[11px] text-[10px] font-extrabold tracking-[0.05em] uppercase whitespace-nowrap overflow-hidden ${BAR[t.cls]}`}
        >
          {t.lbl}
        </motion.div>
      </div>
    </div>
  );
}

export default function TimelineVisual({ progress }: VisualProps) {
  const alertOpacity = useTransform(progress, [0.72, 0.9], [0, 1], { clamp: true });
  const alertY = useTransform(progress, [0.72, 0.9], [10, 0], { clamp: true });

  return (
    <div className={`bg-white border border-[#e7e3db] rounded-[24px] overflow-hidden p-[22px] ${STAGE_SHADOW}`}>
      <div className="grid grid-cols-[120px_repeat(4,1fr)] pb-3 border-b border-[#efece5] text-[11px] font-bold tracking-[0.08em] uppercase text-[#908b82]">
        <span>Task</span>
        <span>W1</span>
        <span>W2</span>
        <span>W3</span>
        <span>W4</span>
      </div>

      {TIMELINE_TASKS.map((t, i) => (
        <TaskRow key={t.n} t={t} i={i} progress={progress} />
      ))}

      <motion.div
        style={{ opacity: alertOpacity, y: alertY }}
        className="mt-4 flex items-center gap-[11px] rounded-[12px] px-[15px] py-3 text-[13px] font-medium bg-[#fbe3e0] border border-[#f3c9c4] text-[#b23a2d]"
      >
        <AlertTriangle className="w-[18px] h-[18px] flex-none" strokeWidth={2.2} />
        <span>
          <b className="font-bold">Predicted delay:</b> Plumbing overlaps Electrical by 3 days — reassign crew to recover.
        </span>
      </motion.div>
    </div>
  );
}

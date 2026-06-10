import { useState } from 'react';
import { motion, AnimatePresence, useTransform } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { PHOTO_BATHROOM, EASE_OUT, type VisualProps } from '../featureData';

const STAGE_SHADOW =
  'shadow-[0_50px_110px_-60px_rgba(40,30,18,0.55),0_6px_20px_-12px_rgba(0,0,0,0.1)]';

type Result = 'approved' | 'rejected';

const TRAIL: Record<Result, string[]> = {
  approved: [
    'Requested by John D. · 2h ago',
    '+$450 upgrade logged to budget',
    'Approved · timestamp captured',
  ],
  rejected: [
    'Requested by John D. · 2h ago',
    'Held for revision · pending reason',
  ],
};

export default function ApprovalsVisual({ progress }: VisualProps) {
  const [result, setResult] = useState<Result | null>(null);

  const reqOpacity = useTransform(progress, [0.05, 0.2], [0, 1], { clamp: true });
  const reqX = useTransform(progress, [0.05, 0.2], [-16, 0], { clamp: true });
  const bodyOpacity = useTransform(progress, [0.12, 0.34], [0, 1], { clamp: true });
  const bodyY = useTransform(progress, [0.12, 0.34], [20, 0], { clamp: true });

  return (
    <div className={`bg-white border border-[#e7e3db] rounded-[24px] overflow-hidden ${STAGE_SHADOW}`}>
      <div className="relative h-[188px] bg-[#f1efea]">
        <img src={PHOTO_BATHROOM} alt="Fixture" loading="lazy" className="w-full h-full object-cover" />
        <motion.span
          style={{ opacity: reqOpacity, x: reqX }}
          className="absolute left-3.5 top-3.5 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-white text-[12px] font-medium bg-[#141210]/60 backdrop-blur-[8px]"
        >
          <span className="w-[22px] h-[22px] rounded-full grid place-items-center text-[10px] font-bold bg-[#9a7d5e]">JD</span>
          Requested by John D.
        </motion.span>
      </div>

      <motion.div style={{ opacity: bodyOpacity, y: bodyY }} className="p-5">
        <AnimatePresence mode="wait" initial={false}>
          {result === null ? (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-[19px] font-bold tracking-[-0.02em] text-[#161513]">Matte Black Basin Faucet</h4>
                <span className="bg-[#fcecdf] text-[#ea7c3c] text-[14px] font-bold px-[11px] py-1 rounded-full whitespace-nowrap">+$450</span>
              </div>
              <p className="text-[14px] text-[#908b82] mt-2 leading-[1.5]">
                Awaiting client signature for the upgraded master bath fixtures.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setResult('approved')}
                  className="py-3.5 rounded-[12px] text-[15px] font-semibold text-white bg-[#25c75c] transition hover:brightness-105 active:scale-[0.97]"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setResult('rejected')}
                  className="py-3.5 rounded-[12px] text-[15px] font-semibold text-[#3a3833] bg-[#f1efea] transition hover:bg-[#e7e3db] active:scale-[0.97]"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={result}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="text-center py-1.5"
            >
              <div
                className={`w-14 h-14 mx-auto mb-3.5 rounded-full grid place-items-center ${
                  result === 'approved' ? 'bg-[#e6f6ec] text-[#16a34a]' : 'bg-[#fcecdf] text-[#ea7c3c]'
                }`}
              >
                {result === 'approved' ? <Check className="w-[26px] h-[26px]" strokeWidth={2.6} /> : <X className="w-[26px] h-[26px]" strokeWidth={2.6} />}
              </div>
              <h4 className="text-[19px] font-bold text-[#161513]">{result === 'approved' ? 'Approved' : 'Rejected'}</h4>
              <p className="text-[13px] text-[#908b82] mt-1.5">
                {result === 'approved' ? 'Signed off by you · just now' : 'Reason capture required before closing'}
              </p>
              <div className="mt-4 pt-3.5 border-t border-[#efece5] flex flex-col gap-[9px] text-left">
                {TRAIL[result].map((t) => (
                  <div key={t} className="flex items-center gap-[9px] text-[12px] text-[#908b82]">
                    <span className="w-1.5 h-1.5 rounded-full flex-none bg-[#c9b8a3]" />
                    {t}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="mt-4 text-[12px] font-semibold text-[#9a7d5e] hover:text-[#836845] transition-colors"
              >
                Reset demo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

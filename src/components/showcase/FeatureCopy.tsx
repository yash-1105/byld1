import { motion, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import { EASE_OUT, type FeatureMeta } from './featureData';

const MotionLink = motion(Link);

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
};

interface Props {
  meta: FeatureMeta;
  index: number;
  progress: MotionValue<number>;
}

export default function FeatureCopy({ meta, index, progress }: Props) {
  const reduce = useReducedMotion();
  const barWidth = useTransform(progress, [0, 1], ['0%', '100%']);
  const num = `0${index + 1}`;

  return (
    <motion.div
      className="max-w-[480px]"
      variants={container}
      initial={reduce ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      {/* index row */}
      <motion.div variants={item} className="flex items-center gap-2.5 mb-[26px]">
        <span className="text-[13px] font-bold tracking-[0.04em] text-[#b6b1a8] tabular-nums">{num}</span>
        <span className="flex-1 max-w-[120px] h-0.5 rounded-sm overflow-hidden bg-[#e7e3db]">
          <motion.span className="block h-full bg-[#9a7d5e]" style={{ width: barWidth }} />
        </span>
        <span className="text-[13px] font-bold tracking-[0.04em] text-[#9a7d5e]">{meta.label}</span>
      </motion.div>

      {/* heading */}
      <motion.h2
        variants={item}
        className="mb-6 font-bold tracking-[-0.04em] leading-[0.96] text-[#161513] text-[clamp(38px,5.2vw,76px)]"
      >
        {meta.title[0]}
        <br />
        {meta.title[1]}
      </motion.h2>

      {/* lead */}
      <motion.p
        variants={item}
        className="mb-[30px] leading-[1.5] text-[#3a3833] text-[clamp(17px,1.35vw,21px)]"
      >
        {meta.lead}
      </motion.p>

      {/* checklist */}
      <motion.ul variants={item} className="flex flex-col mb-8">
        {meta.list.map((t) => (
          <li
            key={t}
            className="flex items-center gap-[13px] py-[11px] text-[16px] font-medium text-[#3a3833] border-t border-[#efece5] last:border-b"
          >
            <span className="w-[22px] h-[22px] flex-none rounded-full grid place-items-center bg-[#efe7dc] text-[#836845]">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            {t}
          </li>
        ))}
      </motion.ul>

      {/* explore link → detailed feature section on /features */}
      <MotionLink
        variants={item}
        to={meta.href}
        className="group inline-flex items-center gap-2 pb-[3px] text-[15px] font-bold text-[#161513] border-b-2 border-[#161513] transition-[gap,color,border-color] duration-300 hover:gap-[13px] hover:text-[#9a7d5e] hover:border-[#9a7d5e]"
      >
        Explore {meta.label}
        <ArrowUpRight className="w-[15px] h-[15px]" strokeWidth={2.4} />
      </MotionLink>
    </motion.div>
  );
}

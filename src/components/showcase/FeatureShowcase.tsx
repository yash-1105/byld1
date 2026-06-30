import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT, FEATURES } from './featureData';
import PinnedFeature from './PinnedFeature';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
};

/**
 * Cinematic feature showcase — an intro header followed by five pinned/sticky
 * product reveals. Mounted on the landing page after the hero scroll animation.
 */
export default function FeatureShowcase() {
  const reduce = useReducedMotion();
  return (
    <section id="showcase" className="bg-[#f5f8f5] text-[#141714] [overflow-x:clip]">
      {/* intro */}
      <div className="mx-auto w-full max-w-[1240px] px-6 min-[940px]:px-10">
        <motion.div
          className="text-center pt-24 pb-10 min-[940px]:pt-40"
          variants={container}
          initial={reduce ? 'show' : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          <motion.span
            variants={item}
            className="block text-[12px] font-bold tracking-[0.16em] uppercase text-[#8a8f86]"
          >
            The platform
          </motion.span>
          <motion.h2
            variants={item}
            className="mx-auto mt-4 max-w-[14ch] font-bold tracking-[-0.04em] leading-[0.96] text-[clamp(38px,5.2vw,76px)]"
          >
            One workspace.
            <br />
            The whole build.
          </motion.h2>
          <motion.p
            variants={item}
            className="mx-auto mt-5 max-w-[560px] leading-[1.5] text-[#353a36] text-[clamp(17px,1.35vw,21px)]"
          >
            Scroll through the five pillars that take a project from first sketch to final
            walkthrough.
          </motion.p>
        </motion.div>
      </div>

      {/* five pinned reveals */}
      {FEATURES.map((meta, i) => (
        <PinnedFeature key={meta.key} meta={meta} index={i} />
      ))}
    </section>
  );
}

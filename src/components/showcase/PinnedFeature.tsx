import { useEffect, useRef, useState, type ComponentType } from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValue, useReducedMotion } from 'framer-motion';
import FeatureCopy from './FeatureCopy';
import SegmentMapVisual from './visuals/SegmentMapVisual';
import DesignBoardVisual from './visuals/DesignBoardVisual';
import ApprovalsVisual from './visuals/ApprovalsVisual';
import ProcurementVisual from './visuals/ProcurementVisual';
import TimelineVisual from './visuals/TimelineVisual';
import type { FeatureMeta, FeatureKey, VisualProps } from './featureData';

const VISUALS: Record<FeatureKey, ComponentType<VisualProps>> = {
  segment: SegmentMapVisual,
  board: DesignBoardVisual,
  approvals: ApprovalsVisual,
  procurement: ProcurementVisual,
  timeline: TimelineVisual,
};

/** Tracks a media query without an extra dependency. */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export default function PinnedFeature({ meta, index }: { meta: FeatureMeta; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // Smooth the raw scroll progress through a spring so the linked animations
  // ease toward their target and settle naturally instead of tracking the
  // scroll position 1:1 (which feels stiff/jumpy).
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
    restDelta: 0.0005,
  });

  // On narrow screens (unpinned) and with reduced motion, drive everything to
  // its end-state by feeding a constant progress of 1.
  const isNarrow = useMediaQuery('(max-width: 939px)');
  const reduce = useReducedMotion();
  const staticProgress = useMotionValue(1);
  const progress = isNarrow || reduce ? staticProgress : smooth;

  // vstage entrance — stage(p, 0, 0.12)
  const entY = useTransform(progress, [0, 0.12], [40, 0], { clamp: true });
  const entScale = useTransform(progress, [0, 0.12], [0.95, 1], { clamp: true });
  const entOpacity = useTransform(progress, [0, 0.12], [0, 1], { clamp: true });

  const Visual = VISUALS[meta.key];

  return (
    <section ref={ref} className="relative min-[940px]:h-[230vh]">
      <div className="relative py-[70px] min-[940px]:sticky min-[940px]:top-0 min-[940px]:h-screen min-[940px]:py-0 min-[940px]:flex min-[940px]:items-center">
        <div className="mx-auto w-full max-w-[1240px] px-6 min-[940px]:px-10">
          <div
            className={`grid grid-cols-1 items-center w-full gap-10 min-[940px]:gap-[72px] ${
              meta.flip ? 'min-[940px]:grid-cols-[1.12fr_1fr]' : 'min-[940px]:grid-cols-[1fr_1.12fr]'
            }`}
          >
            <div className={meta.flip ? 'min-[940px]:order-2' : ''}>
              <FeatureCopy meta={meta} index={index} progress={progress} />
            </div>
            <motion.div
              style={{ y: entY, scale: entScale, opacity: entOpacity }}
              className={meta.flip ? 'min-[940px]:order-1' : ''}
            >
              <Visual progress={progress} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const FRAME_COUNT = 240;

export default function HeroScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  useEffect(() => {
    // Pre-fetch images into browser cache so they swap instantly
    // We fetch them sequentially to not block the network
    const preloadImage = (index: number) => {
      if (index > FRAME_COUNT) return;
      const strIndex = index.toString().padStart(3, '0');
      fetch(`/hero-sequence/ezgif-frame-${strIndex}.jpg`).then(() => {
        // Fetch next batch of 3
        if (index + 3 <= FRAME_COUNT) preloadImage(index + 3);
      }).catch(() => {
        if (index + 3 <= FRAME_COUNT) preloadImage(index + 3);
      });
    };
    preloadImage(1);
    preloadImage(2);
    preloadImage(3);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((progress) => {
      let nextFrame = Math.floor(progress * (FRAME_COUNT - 1));
      nextFrame = Math.max(0, Math.min(nextFrame, FRAME_COUNT - 1));
      setFrameIndex(nextFrame);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Transform for the text
  const y1 = useTransform(scrollYProgress, [0, 0.4], [50, -50]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.2, 0.4], [1, 1, 0]);

  const y2 = useTransform(scrollYProgress, [0.3, 0.6], [50, -50]);
  const opacity2 = useTransform(scrollYProgress, [0.3, 0.4, 0.6], [0, 1, 0]);
  
  const y3 = useTransform(scrollYProgress, [0.6, 0.9], [50, -50]);
  const opacity3 = useTransform(scrollYProgress, [0.6, 0.7, 0.9], [0, 1, 0]);

  // Fade out the entire hero to white at the end of the scroll
  const sectionOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0]);

  const strIndex = (frameIndex + 1).toString().padStart(3, '0');
  const currentSrc = `/hero-sequence/ezgif-frame-${strIndex}.jpg`;

  return (
    <div ref={containerRef} className="h-[400vh] bg-transparent relative">
      <motion.div 
        style={{ opacity: sectionOpacity }}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#1a1814]"
      >
        {/* Simple image tag relies on browser memory management and hardware acceleration */}
        <img
          src={currentSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Dark overlay to make text readable */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Text Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 lg:p-12 text-center pointer-events-none">
          <motion.div
            style={{ y: y1, opacity: opacity1 }}
            className="absolute inset-x-0 flex flex-col items-center justify-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-bold text-white tracking-tight leading-[1.05]">
              Build smarter.<br />
              <span className="text-[#b5aa9d]">Deliver faster.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/80">
              Manage construction projects, track progress, control budgets, and collaborate with your entire team in one place.
            </p>
          </motion.div>

          <motion.div
            style={{ y: y2, opacity: opacity2 }}
            className="absolute inset-x-0 flex flex-col items-center justify-center"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold text-white tracking-tight leading-[1.05]">
              Real-time site updates.
            </h2>
            <p className="mt-6 max-w-lg text-lg text-white/80 mx-auto">
              Know exactly what's happening on site, every day, without stepping foot outside your office.
            </p>
          </motion.div>

          <motion.div
            style={{ y: y3, opacity: opacity3 }}
            className="absolute inset-x-0 flex flex-col items-center justify-center"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold text-white tracking-tight leading-[1.05]">
              Total financial control.
            </h2>
            <p className="mt-6 max-w-lg text-lg text-white/80 mx-auto">
              Track budgets by segment, manage change orders, and keep every dollar accounted for.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

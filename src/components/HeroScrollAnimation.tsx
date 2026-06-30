import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function HeroScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ready = useRef(false);
  const dur = useRef(8);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // grab duration once metadata is available
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => { ready.current = true; dur.current = v.duration || 8; };
    if (v.readyState >= 1) onMeta();
    else v.addEventListener('loadedmetadata', onMeta);
    return () => v.removeEventListener('loadedmetadata', onMeta);
  }, []);

  // scrub the video to the scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((progress) => {
      const v = videoRef.current;
      if (!v || !ready.current) return;
      const target = Math.max(0, Math.min(1, progress)) * (dur.current - 0.04);
      if (Math.abs(v.currentTime - target) > 0.001) v.currentTime = target;
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

  return (
    <div ref={containerRef} className="h-[650vh] bg-transparent relative">
      <motion.div
        style={{ opacity: sectionOpacity }}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#181b18]"
      >
        {/* Single scroll-scrubbed video (replaces the 240-frame sequence) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          poster="/hero-poster.jpg"
          aria-label="Luxury villa visualization"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

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
              <span className="text-[#aab0a6]">Deliver faster.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/80">
              Uncomplicate project management. Control timelines, enhance client transparency, collect faster and hire the right people — all in one place.
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
              Let clients see their vision taking shape — build transparency and client confidence. BYLD space allows contractors and site engineers to document real-time progress, eliminating repeated updates across various channels.
            </p>
          </motion.div>

          <motion.div
            style={{ y: y3, opacity: opacity3 }}
            className="absolute inset-x-0 flex flex-col items-center justify-center"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold text-white tracking-tight leading-[1.05]">
              Transparent costs and seamless viewing.
            </h2>
            <p className="mt-6 max-w-lg text-lg text-white/80 mx-auto">
              Centralized document hub for clients. Design concepts to final invoices — in a single interface. While project managers track resource allocation and project margins, clients can track segment-wise costs, procurements and revisions.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

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
    // iOS Safari defers loading (even with preload="auto") until load() is
    // called — without it the hero renders as a black screen on iPhone.
    v.load();
    // Prime the first frame with a tiny seek (paints without playing). The
    // earlier play()/pause() prime caused the video to visibly play on phones
    // when the pause landed late.
    const prime = () => {
      if (v.currentTime === 0) v.currentTime = 0.001;
      v.removeEventListener('loadeddata', prime);
    };
    v.addEventListener('loadeddata', prime);
    // Hard guard: this video must never play — it's a scroll scrubber.
    const noPlay = () => v.pause();
    v.addEventListener('play', noPlay);
    return () => {
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('loadeddata', prime);
      v.removeEventListener('play', noPlay);
    };
  }, []);

  // scrub the video to the scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((progress) => {
      const v = videoRef.current;
      if (!v || !ready.current) return;
      const target = Math.max(0, Math.min(1, progress)) * (dur.current - 0.04);
      // Skip while a seek is in flight and throttle to ~1 frame of granularity —
      // issuing a new seek every scroll event makes iOS flash black frames.
      if (!v.seeking && Math.abs(v.currentTime - target) > 0.034) v.currentTime = target;
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
        {/* Single scroll-scrubbed video (replaces the 240-frame sequence).
            Mobile (9:16): letterbox the full 16:9 frame in the upper third so the
            whole shot is visible; desktop keeps the full-bleed cover crop. */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain object-[center_22%] md:object-cover md:object-center [transform:translateZ(0)] [backface-visibility:hidden]"
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

        {/* Text Content — bottom-anchored on mobile (below the letterboxed video band),
            centered on desktop. Absolute children take their static position from the
            flex alignment, so justify-* moves all three panels together. */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-36 md:justify-center md:pb-0 p-6 lg:p-12 text-center pointer-events-none">
          <motion.div
            style={{ y: y1, opacity: opacity1 }}
            className="absolute inset-x-0 flex flex-col items-center justify-center px-5"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-bold text-white tracking-tight leading-[1.05]">
              Build smarter.<br />
              <span className="text-[#aab0a6]">Deliver faster.</span>
            </h1>
            <p className="mt-5 md:mt-6 max-w-lg text-base md:text-lg text-white/80">
              Uncomplicate project management. Control timelines, enhance client transparency, collect faster and hire the right people — all in one place.
            </p>
          </motion.div>

          <motion.div
            style={{ y: y2, opacity: opacity2 }}
            className="absolute inset-x-0 flex flex-col items-center justify-center px-5"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-[4rem] font-bold text-white tracking-tight leading-[1.05]">
              Real-time site updates.
            </h2>
            <p className="mt-5 md:mt-6 max-w-lg text-base md:text-lg text-white/80 mx-auto">
              Let clients see their vision taking shape — build transparency and client confidence. BYLD space allows contractors and site engineers to document real-time progress, eliminating repeated updates across various channels.
            </p>
          </motion.div>

          <motion.div
            style={{ y: y3, opacity: opacity3 }}
            className="absolute inset-x-0 flex flex-col items-center justify-center px-5"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-[4rem] font-bold text-white tracking-tight leading-[1.05]">
              Transparent costs and seamless viewing.
            </h2>
            <p className="mt-5 md:mt-6 max-w-lg text-base md:text-lg text-white/80 mx-auto">
              Centralized document hub for clients. Design concepts to final invoices — in a single interface. While project managers track resource allocation and project margins, clients can track segment-wise costs, procurements and revisions.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

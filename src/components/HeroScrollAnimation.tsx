import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const FRAME_COUNT = 240;

export default function HeroScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(FRAME_COUNT).fill(null));

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  useEffect(() => {
    // Aggressive memory prefetch using HTMLImageElement
    // Loads them into JS memory so they can be painted instantly to canvas (60fps)
    const loadImages = async () => {
      // Load first 10 frames sequentially and instantly
      for (let i = 0; i < 10; i++) {
        if (i >= FRAME_COUNT) break;
        const img = new Image();
        const strIndex = (i + 1).toString().padStart(3, '0');
        img.src = `/hero-sequence/ezgif-frame-${strIndex}.jpg`;
        await new Promise(r => img.onload = r);
        imagesRef.current[i] = img;
        
        // Draw the very first frame to the canvas immediately
        if (i === 0 && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
          }
        }
      }
      
      // Load the rest in the background
      for (let i = 10; i < FRAME_COUNT; i++) {
        const img = new Image();
        const strIndex = (i + 1).toString().padStart(3, '0');
        img.src = `/hero-sequence/ezgif-frame-${strIndex}.jpg`;
        img.onload = () => {
          imagesRef.current[i] = img;
        };
      }
    };
    loadImages();
  }, []);

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((progress) => {
      let nextFrame = Math.floor(progress * (FRAME_COUNT - 1));
      nextFrame = Math.max(0, Math.min(nextFrame, FRAME_COUNT - 1));
      
      if (canvasRef.current) {
        const img = imagesRef.current[nextFrame];
        const ctx = canvasRef.current.getContext('2d');
        if (img && ctx && img.complete) {
          if (canvasRef.current.width !== img.width) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
          }
          requestAnimationFrame(() => {
            ctx.drawImage(img, 0, 0);
          });
        }
      }
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
    <div ref={containerRef} className="h-[400vh] bg-transparent relative">
      <motion.div 
        style={{ opacity: sectionOpacity }}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#1a1814]"
      >
        {/* Hardware accelerated canvas rendering */}
        <canvas
          ref={canvasRef}
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

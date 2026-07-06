import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ArrowRight, Check, X, Building2, HardHat, User, Briefcase,
} from 'lucide-react';
import './cinematic.css';

/* ------------------------------------------------------------------
   BYLD / SPACE — Cinematic, scroll-driven feature showcase.

   The scroll IS the animation timeline. A single requestAnimationFrame
   loop drives every sticky "scene": each scene wrapper is 400vh tall,
   its inner <section> is sticky, and progress (0→1) through the wrapper
   is mapped to interpolated style values. No animation libraries — the
   rAF engine below is hand-rolled vanilla JS run from one useEffect.
   ------------------------------------------------------------------ */

export default function CinematicShowcase() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* ---------- helpers ---------- */
    const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const q = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = el): T =>
      ctx.querySelector(sel) as T;
    const qa = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = el): T[] =>
      Array.from(ctx.querySelectorAll(sel)) as T[];

    const setOT = (n: HTMLElement | null, opacity: number, y = 0, x = 0, scale = 1) => {
      if (!n) return;
      n.style.opacity = String(opacity);
      n.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };
    const narrate = (
      node: HTMLElement | null,
      arr: { at: number; t: string }[],
      p: number,
    ) => {
      if (!node) return;
      let t = arr[0].t;
      for (const item of arr) if (p >= item.at) t = item.t;
      if (node.textContent !== t) node.textContent = t;
    };
    const revealBlock = (node: HTMLElement | null, p: number) => {
      const r = easeOut(seg(p, 0.86, 1));
      setOT(node, r, lerp(22, 0, r));
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Mobile keeps the full scroll-scrub experience (videos letterboxed via CSS);
    // only prefers-reduced-motion falls back to static frames.
    const isMobile = () => window.innerWidth < 768;

    /* ================= SCENE 1 — Segment map ================= */
    const s1 = q('#cinS1');
    const s1L = q('.cin-left', s1);
    const s1N = q<HTMLElement>('.cin-narrate', s1);
    const s1Rev = q('.cin-reveal', s1);
    const s1video = q<HTMLVideoElement>('.cin-video', s1);
    const s1cards = qa('.cin-roomcard', s1);
    const s1stats = q('.cin-stats', s1);
    const s1bgt = q<HTMLElement>('.cin-bgt-fill', s1);
    const s1tasks = qa('.cin-tasklist span', s1);
    // scroll-scrubbed fly-through video (outside → living → kitchen → master → office)
    let videoReady = false;
    let videoDur = 8;
    const onMeta = () => {
      videoReady = true;
      videoDur = s1video.duration || 8;
      // reduced-motion: show the final (office) frame statically
      if (reduce) s1video.currentTime = videoDur - 0.04;
    };
    if (s1video.readyState >= 1) onMeta();
    else s1video.addEventListener('loadedmetadata', onMeta);
    // windows tuned to the fly-through footage (≈8s):
    // exterior 0–1.6s · living 1.7–3.3s · kitchen 3.4–5.3s · master 5.4–6.6s · office 6.8–8s
    const s1Windows = [
      [0.21, 0.42], // living
      [0.42, 0.62], // kitchen
      [0.66, 0.85], // master
      [0.85, 0.94], // office
    ];
    const S1N = [
      { at: 0, t: 'Approaching the build…' },
      { at: 0.21, t: 'Living Room — On Track ✓' },
      { at: 0.42, t: 'Kitchen — In Progress' },
      { at: 0.66, t: 'Master Suite — Complete ✓' },
      { at: 0.85, t: 'Office — Delayed ⚠' },
      { at: 0.94, t: 'Every room, one scroll away.' },
    ];
    const renderS1 = (p: number, visible = true) => {
      const intro = easeOut(seg(p, 0, 0.08));
      setOT(s1L, intro, lerp(20, 0, intro));
      narrate(s1N, S1N, p);
      // scrub the fly-through video to the scroll position
      if (videoReady && visible) {
        const target = clamp(p) * (videoDur - 0.04);
        if (Math.abs(s1video.currentTime - target) > 0.001) s1video.currentTime = target;
      }
      // room detail cards
      s1cards.forEach((c, i) => {
        const [a, b] = s1Windows[i];
        const inP = easeOut(seg(p, a, a + 0.05));
        const outP = seg(p, b - 0.04, b);
        setOT(c as HTMLElement, inP * (1 - outP), 0, lerp(34, 0, inP));
      });
      if (s1bgt) s1bgt.style.width = `${easeOut(seg(p, 0.46, 0.62)) * 64}%`;
      s1tasks.forEach((t, i) => {
        (t as HTMLElement).style.opacity = String(easeOut(seg(p, 0.72 + i * 0.04, 0.78 + i * 0.04)));
      });
      // final state — stats + reveal
      const endP = easeOut(seg(p, 0.94, 1));
      setOT(s1stats, endP, lerp(20, 0, endP));
      revealBlock(s1Rev, p);
    };

    /* ================= SCENE 2 — Design board (scroll-scrubbed video) ================= */
    const s2 = q('#cinS2');
    const s2L = q('.cin-left', s2);
    const s2Rev = q('.cin-reveal', s2);
    const s2video = q<HTMLVideoElement>('.cin-video', s2);
    const s2cards = qa('.cin-roomcard', s2);
    const s2stats = q('.cin-stats', s2);
    // scrubbed material fly-through (oak → marble → brass → glass)
    let video2Ready = false;
    let video2Dur = 8;
    const onMeta2 = () => {
      video2Ready = true;
      video2Dur = s2video.duration || 8;
      if (reduce) s2video.currentTime = video2Dur - 0.04;
    };
    if (s2video.readyState >= 1) onMeta2();
    else s2video.addEventListener('loadedmetadata', onMeta2);
    // windows tuned to the footage: oak 0–1s · marble 1.1–2.5s · brass 2.7–4.8s · glass 5–8s
    const s2Windows = [
      [0.02, 0.13], // oak
      [0.15, 0.30], // marble
      [0.34, 0.59], // brass
      [0.63, 0.94], // glass
    ];
    const renderS2 = (p: number, visible = true) => {
      const intro = easeOut(seg(p, 0, 0.08));
      setOT(s2L, intro, lerp(20, 0, intro));
      if (video2Ready && visible) {
        const target = clamp(p) * (video2Dur - 0.04);
        if (Math.abs(s2video.currentTime - target) > 0.001) s2video.currentTime = target;
      }
      s2cards.forEach((c, i) => {
        const [a, b] = s2Windows[i];
        const inP = easeOut(seg(p, a, a + 0.05));
        const outP = seg(p, b - 0.04, b);
        setOT(c as HTMLElement, inP * (1 - outP), 0, lerp(34, 0, inP));
      });
      const endP = easeOut(seg(p, 0.94, 1));
      setOT(s2stats, endP, lerp(20, 0, endP));
      revealBlock(s2Rev, p);
    };

    /* ================= SCENE 3 — Approvals (scroll-scrubbed video) ================= */
    const s3 = q('#cinS3');
    const s3L = q('.cin-left', s3);
    const s3Rev = q('.cin-reveal', s3);
    const s3video = q<HTMLVideoElement>('.cin-video', s3);
    const s3cards = qa('.cin-roomcard', s3);
    const s3verdicts = qa('.cin-verdict', s3);
    const s3stats = q('.cin-stats', s3);
    // scrubbed decision reel: marble accepted → oak rejected → brass accepted → glass rejected
    let video3Ready = false;
    let video3Dur = 8;
    const onMeta3 = () => {
      video3Ready = true;
      video3Dur = s3video.duration || 8;
      if (reduce) s3video.currentTime = video3Dur - 0.04;
    };
    if (s3video.readyState >= 1) onMeta3();
    else s3video.addEventListener('loadedmetadata', onMeta3);
    // windows tuned to the footage: marble 0–1.7s · oak 2–3.6s · brass 4.2–6s · glass 6.2–8s
    const s3Windows = [
      [0.02, 0.20], // marble (approved)
      [0.24, 0.46], // oak (rejected)
      [0.52, 0.76], // brass (approved)
      [0.80, 0.96], // glass (rejected)
    ];
    const renderS3 = (p: number, visible = true) => {
      const intro = easeOut(seg(p, 0, 0.08));
      setOT(s3L, intro, lerp(20, 0, intro));
      if (video3Ready && visible) {
        const target = clamp(p) * (video3Dur - 0.04);
        if (Math.abs(s3video.currentTime - target) > 0.001) s3video.currentTime = target;
      }
      s3cards.forEach((c, i) => {
        const [a, b] = s3Windows[i];
        const inP = easeOut(seg(p, a, a + 0.05));
        const outP = seg(p, b - 0.04, b);
        setOT(c as HTMLElement, inP * (1 - outP), 0, lerp(34, 0, inP));
      });
      s3verdicts.forEach((c, i) => {
        const [a, b] = s3Windows[i];
        const inP = easeOut(seg(p, a, a + 0.06));
        const outP = seg(p, b - 0.05, b);
        setOT(c as HTMLElement, inP * (1 - outP), 0, 0, lerp(0.7, 1, inP));
      });
      const endP = easeOut(seg(p, 0.94, 1));
      setOT(s3stats, endP, lerp(20, 0, endP));
      revealBlock(s3Rev, p);
    };

    /* ================= SCENE 4 — Procurement (scroll-scrubbed video) ================= */
    const s4 = q('#cinS4');
    const s4L = q('.cin-left', s4);
    const s4video = q<HTMLVideoElement>('.cin-video', s4);
    // scrubbed supplier-comparison demo: bids → risk scored → recommended → selected → PO
    let video4Ready = false;
    let video4Dur = 10;
    const onMeta4 = () => {
      video4Ready = true;
      video4Dur = s4video.duration || 10;
      // reduced-motion: rest on an early frame (cards visible, right clear for copy)
      if (reduce) s4video.currentTime = video4Dur * 0.16;
    };
    if (s4video.readyState >= 1) onMeta4();
    else s4video.addEventListener('loadedmetadata', onMeta4);
    const renderS4 = (p: number, visible = true) => {
      // copy greets over the empty early frames, then hands off to the demo.
      // On mobile the letterboxed video leaves room, so copy stays put.
      const inn = easeOut(seg(p, 0, 0.08));
      const out = (reduce || isMobile()) ? 0 : easeOut(seg(p, 0.42, 0.52));
      setOT(s4L, inn * (1 - out), lerp(20, 0, inn));
      if (video4Ready && visible) {
        const target = (reduce ? 0.16 : clamp(p)) * (video4Dur - 0.04);
        if (Math.abs(s4video.currentTime - target) > 0.001) s4video.currentTime = target;
      }
    };

    /* ================= SCENE 5 — Timeline (scroll-scrubbed video) ================= */
    const s5 = q('#cinS5');
    const s5L = q('.cin-left', s5);
    const s5video = q<HTMLVideoElement>('.cin-video', s5);
    // scrubbed gantt demo: tasks map → conflict detected → flagged → resolved
    let video5Ready = false;
    let video5Dur = 10;
    const onMeta5 = () => {
      video5Ready = true;
      video5Dur = s5video.duration || 10;
      // reduced-motion: rest on an early frame (gantt readable, right clear for copy)
      if (reduce) s5video.currentTime = video5Dur * 0.16;
    };
    if (s5video.readyState >= 1) onMeta5();
    else s5video.addEventListener('loadedmetadata', onMeta5);
    const renderS5 = (p: number, visible = true) => {
      // copy greets over the early frames, then hands off to the demo.
      // On mobile the letterboxed video leaves room, so copy stays put.
      const inn = easeOut(seg(p, 0, 0.08));
      const out = (reduce || isMobile()) ? 0 : easeOut(seg(p, 0.42, 0.52));
      setOT(s5L, inn * (1 - out), lerp(20, 0, inn));
      if (video5Ready && visible) {
        const target = (reduce ? 0.16 : clamp(p)) * (video5Dur - 0.04);
        if (Math.abs(s5video.currentTime - target) > 0.001) s5video.currentTime = target;
      }
    };

    /* ---------- scene registry ---------- */
    const scenes: { wrap: HTMLElement; render: (p: number, visible?: boolean) => void }[] = [
      { wrap: q('#cinS1'), render: renderS1 },
      { wrap: q('#cinS2'), render: renderS2 },
      { wrap: q('#cinS3'), render: renderS3 },
      { wrap: q('#cinS4'), render: renderS4 },
      { wrap: q('#cinS5'), render: renderS5 },
    ];

    /* ---------- the single rAF master loop ---------- */
    let raf = 0;
    const frame = () => {
      const vh = window.innerHeight;
      for (const sc of scenes) {
        const rect = sc.wrap.getBoundingClientRect();
        const p = clamp(-rect.top / (sc.wrap.offsetHeight - vh));
        const visible = rect.bottom > 0 && rect.top < vh * 1.2;
        sc.render(p, visible);
      }
      raf = requestAnimationFrame(frame);
    };

    /* ---------- static final-state render (mobile / reduced motion) ---------- */
    const renderStatic = () => {
      for (const sc of scenes) sc.render(1, true);
    };

    if (reduce) {
      renderStatic();
    } else {
      raf = requestAnimationFrame(frame);
    }

    /* ---------- scene-6 reveal on enter ---------- */
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.18 },
    );
    qa('.cin-rev-el').forEach((n) => io.observe(n));

    /* ---------- lazy-load each scene video as it nears the viewport ---------- */
    const videoIO = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const v = e.target as HTMLVideoElement;
        v.preload = 'auto';
        v.load();
        // iOS Safari won't paint seeked frames until the (muted, playsinline)
        // video has been primed with a play/pause once data is available.
        const prime = () => {
          v.play().then(() => { v.pause(); }).catch(() => { /* ignore */ });
          v.removeEventListener('loadeddata', prime);
        };
        v.addEventListener('loadeddata', prime, { once: true });
        videoIO.unobserve(v);
      }),
      { rootMargin: '200% 0px 200% 0px' },
    );
    qa<HTMLVideoElement>('.cin-video').forEach((v) => videoIO.observe(v));

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      videoIO.disconnect();
      s1video.removeEventListener('loadedmetadata', onMeta);
      s2video.removeEventListener('loadedmetadata', onMeta2);
      s3video.removeEventListener('loadedmetadata', onMeta3);
      s4video.removeEventListener('loadedmetadata', onMeta4);
      s5video.removeEventListener('loadedmetadata', onMeta5);
    };
  }, []);

  const arrow = <ArrowUpRight strokeWidth={2.4} />;

  return (
    <div className="cin" ref={root}>
      {/* ============ SCENE 1 — SEGMENT MAP (immersive video) ============ */}
      <div className="cin-wrap" id="cinS1">
        <section className="cin-scene cin-scene--hero">
          <div className="cin-hero-stage">
            <div className="cin-video-wrap">
              <video
                className="cin-video"
                muted
                playsInline
                preload="none"
                tabIndex={-1}
                poster="/segment-map-poster.jpg"
                aria-label="Fly-through of the project, room by room"
              >
                <source src="/segment-map.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="cin-hero-scrim" aria-hidden="true" />

            <div className="cin-hero-copy">
              <div className="cin-left">
                <span className="cin-eyebrow">01 — Segment Map</span>
                <h2 className="cin-h">Navigate projects<br />room by room.</h2>
                <div className="cin-reveal">
                  <ul className="cin-check">
                    <li><span className="tick"><Check strokeWidth={3} /></span>Per-room status, budget &amp; tasks</li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>Convenient viewing and visualisation of the final design at a single portal</li>
                  </ul>
                  <Link className="cin-cta" to="/features#segment-map">Explore Segment Map {arrow}</Link>
                </div>
              </div>
            </div>

            {/* room status cards, over the video */}
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot pulse" style={{ background: 'var(--green)' }} />Living Room</h4>
              <div className="sub">On Track ✓ · 3 tasks remaining</div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--orange)' }} />Kitchen</h4>
              <div className="sub">In Progress · 64% of budget used</div>
              <div className="cin-bgt"><div className="cin-bgt-track"><div className="cin-bgt-fill" /></div></div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--green)' }} />Master Suite</h4>
              <div className="sub">Complete ✓</div>
              <div className="cin-tasklist">
                <span>Tiling ✓</span><span>Fixtures ✓</span><span>Paint ✓</span>
              </div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--red)' }} />Office</h4>
              <div className="sub">Delayed ⚠</div>
              <div className="cin-alertmini">2 tasks overdue</div>
            </div>

            <div className="cin-stats">
              <div><div className="k">Budget</div><div className="v">$24.5k</div></div>
              <div><div className="k">Tasks</div><div className="v">8/11</div></div>
              <div><div className="k">Progress</div><div className="v">82%</div></div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ SCENE 2 — DESIGN BOARD (immersive video) ============ */}
      <div className="cin-wrap" id="cinS2">
        <section className="cin-scene cin-scene--hero">
          <div className="cin-hero-stage">
            <div className="cin-video-wrap">
              <video
                className="cin-video"
                muted
                playsInline
                preload="none"
                tabIndex={-1}
                poster="/design-board-poster.jpg"
                aria-label="Material studies: oak, marble, brass and glass"
              >
                <source src="/design-board.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="cin-hero-scrim" aria-hidden="true" />

            <div className="cin-hero-copy">
              <div className="cin-left">
                <span className="cin-eyebrow">02 — Design Board</span>
                <h2 className="cin-h">From inspiration<br />to execution.</h2>
                <div className="cin-reveal">
                  <ul className="cin-check">
                    <li><span className="tick"><Check strokeWidth={3} /></span>Track the life cycle of your design from start to end, forget files with a million versions</li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>Allow clients to view discarded designs as per need when revisions are requested</li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>Manage scope creep efficiently and notify clients for variation billing</li>
                  </ul>
                  <Link className="cin-cta" to="/features#design-board">Explore Design Board {arrow}</Link>
                </div>
              </div>
            </div>

            {/* material status cards, over the video */}
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--green)' }} />Engineered Oak</h4>
              <div className="sub">Flooring · Confirmed</div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--green)' }} />Calacatta Marble</h4>
              <div className="sub">Countertop · Confirmed</div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--orange)' }} />Brushed Brass</h4>
              <div className="sub">Hardware · Under review</div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: '#aab0a6' }} />Smoked Glass</h4>
              <div className="sub">Partition · Concept</div>
            </div>

            <div className="cin-stats">
              <div><div className="k">Materials</div><div className="v">4</div></div>
              <div><div className="k">Confirmed</div><div className="v">2</div></div>
              <div><div className="k">Pending</div><div className="v">2</div></div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ SCENE 3 — APPROVALS (immersive video) ============ */}
      <div className="cin-wrap" id="cinS3">
        <section className="cin-scene cin-scene--hero">
          <div className="cin-hero-stage">
            <div className="cin-video-wrap">
              <video
                className="cin-video"
                muted
                playsInline
                preload="none"
                tabIndex={-1}
                poster="/approvals-board-poster.jpg"
                aria-label="Approval decisions: accepted items move right, rejected move left"
              >
                <source src="/approvals-board.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="cin-hero-scrim" aria-hidden="true" />

            <div className="cin-hero-copy">
              <div className="cin-left">
                <span className="cin-eyebrow">03 — Approvals</span>
                <h2 className="cin-h">Every decision<br />documented.</h2>
                <div className="cin-reveal">
                  <ul className="cin-check">
                    <li>
                      <span className="tick"><Check strokeWidth={3} /></span>
                      <span className="cin-check-text">
                        Full context, opportunity costs of delay, and maximum accountability.
                        <span className="cin-check-sub">Forget the blame game.</span>
                      </span>
                    </li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>One-tap approve or reject</li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>Timestamped audit trail</li>
                  </ul>
                  <Link className="cin-cta" to="/features#approvals">Explore Approvals {arrow}</Link>
                </div>
              </div>
            </div>

            {/* material name, top-right */}
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--green)' }} />Calacatta Marble</h4>
              <div className="sub">Countertop · Approved</div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--red)' }} />Engineered Oak</h4>
              <div className="sub">Flooring · Rejected</div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--green)' }} />Brushed Brass</h4>
              <div className="sub">Hardware · Approved</div>
            </div>
            <div className="cin-roomcard">
              <h4><span className="cin-statusdot" style={{ background: 'var(--red)' }} />Smoked Glass</h4>
              <div className="sub">Partition · Rejected</div>
            </div>

            {/* minimal verdict, centered over the video */}
            <div className="cin-verdict">
              <span className="cin-verdict-icon approve" aria-label="Approved"><Check strokeWidth={2} /></span>
            </div>
            <div className="cin-verdict">
              <span className="cin-verdict-icon reject" aria-label="Rejected"><X strokeWidth={2} /></span>
            </div>
            <div className="cin-verdict">
              <span className="cin-verdict-icon approve" aria-label="Approved"><Check strokeWidth={2} /></span>
            </div>
            <div className="cin-verdict">
              <span className="cin-verdict-icon reject" aria-label="Rejected"><X strokeWidth={2} /></span>
            </div>

            <div className="cin-stats">
              <div><div className="k">Decisions</div><div className="v">4</div></div>
              <div><div className="k">Approved</div><div className="v">2</div></div>
              <div><div className="k">Rejected</div><div className="v">2</div></div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ SCENE 4 — PROCUREMENT (immersive video) ============ */}
      <div className="cin-wrap" id="cinS4">
        <section className="cin-scene cin-scene--hero cin-hero--flip">
          <div className="cin-hero-stage">
            <div className="cin-video-wrap">
              <video
                className="cin-video"
                muted
                playsInline
                preload="none"
                tabIndex={-1}
                poster="/procurement-board-poster.jpg"
                aria-label="Supplier comparison: bids, risk scores, recommendation and PO"
              >
                <source src="/procurement-board.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="cin-hero-scrim" aria-hidden="true" />

            <div className="cin-hero-copy">
              <div className="cin-left">
                <span className="cin-eyebrow">04 — Procurement</span>
                <h2 className="cin-h">Choose suppliers<br />with full clarity.</h2>
                <div className="cin-reveal">
                  <ul className="cin-check">
                    <li><span className="tick"><Check strokeWidth={3} /></span>Side-by-side bid comparison</li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>Automatic risk scoring</li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>Best value, not just lowest price</li>
                  </ul>
                  <Link className="cin-cta" to="/features#procurement">Explore Procurement {arrow}</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ SCENE 5 — TIMELINE (immersive video) ============ */}
      <div className="cin-wrap" id="cinS5">
        <section className="cin-scene cin-scene--hero cin-hero--flip">
          <div className="cin-hero-stage">
            <div className="cin-video-wrap">
              <video
                className="cin-video"
                muted
                playsInline
                preload="none"
                tabIndex={-1}
                poster="/timeline-board-poster.jpg"
                aria-label="Project timeline: tasks mapped, a conflict detected and resolved"
              >
                <source src="/timeline-board.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="cin-hero-scrim" aria-hidden="true" />

            <div className="cin-hero-copy">
              <div className="cin-left">
                <span className="cin-eyebrow">05 — Timeline</span>
                <h2 className="cin-h">See delays<br />before they hit.</h2>
                <div className="cin-reveal">
                  <ul className="cin-check">
                    <li><span className="tick"><Check strokeWidth={3} /></span>Dependency-aware scheduling</li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>Warn clients of the opportunity cost of every change requested, minimise variations</li>
                    <li><span className="tick"><Check strokeWidth={3} /></span>Deadlines for approvals — clients know the cost of their delayed decisions</li>
                  </ul>
                  <Link className="cin-cta" to="/features#timeline">Explore Timeline {arrow}</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ SCENE 6 — WORKFLOW + ROLES ============ */}
      <section className="cin-section">
        <div className="cin-section-inner">
          <div className="cin-section-head">
            <span className="cin-pill cin-rev-el">Workflow</span>
            <h2 className="cin-rev-el">From design to delivery</h2>
            <p className="cin-rev-el">Track every project through a structured, stage-based workflow.</p>
          </div>
          <div className="cin-cardgrid">
            {[
              { stage: 'Design', desc: 'Architectural plans, MEP coordination, and interior concepts.' },
              { stage: 'Approval', desc: 'Stakeholder sign-offs and compliance checks.' },
              { stage: 'Construction', desc: 'Site monitoring, task execution, and intelligent timelines.' },
              { stage: 'Finishing', desc: 'Final inspections and transparent project close-outs.' },
            ].map((s, i) => (
              <div key={s.stage} className="cin-stage-card cin-rev-el" style={{ transitionDelay: `${i * 0.1}s` }}>
                <span className="num">0{i + 1}</span>
                <h3>{s.stage}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="cin-section-head" style={{ marginTop: 80 }}>
            <span className="cin-pill cin-rev-el">Roles</span>
            <h2 className="cin-rev-el">Tailored for every team member</h2>
          </div>
          <div className="cin-rolegrid">
            {[
              { role: 'Architect', icon: Building2, desc: 'Full project control — design, assign, approve, and oversee every detail.', stat: 'Full Access' },
              { role: 'Contractor', icon: HardHat, desc: 'Task execution, site updates, and progress reporting with real-time tools.', stat: 'Task Focus' },
              { role: 'Client', icon: User, desc: 'Simplified oversight — approvals, budgets, and progress at a glance.', stat: 'Approvals' },
              { role: 'Consultant', icon: Briefcase, desc: 'Expert collaboration with consultation requests and advisory tools.', stat: 'Advisory' },
            ].map((r, i) => (
              <div key={r.role} className="cin-role-card cin-rev-el" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="ic"><r.icon size={26} /></div>
                <span className="tag">{r.stat}</span>
                <h3>{r.role}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="cin-ctasec">
        <div className="glow" />
        <div className="cin-ctasec-inner">
          <h2>Start managing your projects the smarter way</h2>
          <p>Join construction teams who deliver projects on time and on budget with BYLD.</p>
          <div className="cin-ctabtns">
            <Link className="cin-btn-primary" to="/login">Get Started <ArrowRight size={16} /></Link>
            <Link className="cin-btn-outline" to="/pricing">View Pricing</Link>
          </div>
        </div>
      </section>
    </div>
  );
}


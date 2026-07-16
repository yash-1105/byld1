import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pen, Circle as CircleIcon, ArrowUpRight, Type, Eraser, Undo2, Trash2, Loader2, Send } from 'lucide-react';
import {
  Canvas, PencilBrush, Textbox, Ellipse, Line, Triangle, Group, FabricImage, Point,
  type FabricObject,
} from 'fabric';
import Portal from '@/components/ui/portal';

type Tool = 'pen' | 'circle' | 'arrow' | 'text' | 'eraser';

// Object-level eraser: an undo step is either an add (remove it) or an erase
// (re-add the objects it removed). This models both directions on one stack.
type UndoAction = { kind: 'add'; obj: FabricObject } | { kind: 'erase'; objs: FabricObject[] };

// Small circular cursor so the eraser reads differently from the pen/pointer.
const ERASER_CURSOR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26'><circle cx='13' cy='13' r='10' fill='rgba(255,255,255,0.25)' stroke='white' stroke-width='2'/></svg>\") 13 13, crosshair";

interface Props {
  imageSrc: string;
  onCancel: () => void;
  onSend: (file: File) => void;
}

// High-contrast markup colors — deliberately NOT the sage design tokens, so the
// annotation always stands out against whatever the photo contains.
const COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ffffff', '#111111'];
const WIDTHS: { key: 'thin' | 'medium' | 'thick'; label: string; value: number }[] = [
  { key: 'thin', label: 'S', value: 3 },
  { key: 'medium', label: 'M', value: 6 },
  { key: 'thick', label: 'L', value: 10 },
];

export default function PhotoAnnotator({ imageSrc, onCancel, onSend }: Props) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(6);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [, forceRender] = useState(0);

  // Latest tool/style read imperatively by the canvas event handlers (the canvas
  // is created once; these refs avoid stale closures).
  const toolRef = useRef<Tool>('pen');
  const colorRef = useRef('#ef4444');
  const widthRef = useRef(6);

  // Undo history (add + erase actions, newest last). Pen strokes arrive via
  // 'path:created'; shapes/text push explicitly on finish; erases push on drag end.
  const undoRef = useRef<UndoAction[]>([]);

  // In-progress drag state for circle/arrow.
  const drawingRef = useRef(false);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const shapeRef = useRef<FabricObject | null>(null);

  // Eraser drag state — objects removed within the current down→up gesture,
  // collapsed into one undo step so a swipe restores together.
  const erasingRef = useRef(false);
  const erasedDragRef = useRef<Set<FabricObject>>(new Set());

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { widthRef.current = width; }, [width]);

  // ─── Canvas lifecycle (created once) ───────────────────────────────────────
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const canvas = new Canvas(el, {
      backgroundColor: '#000000',
      selection: false,
      preserveObjectStacking: true,
    });
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = colorRef.current;
    canvas.freeDrawingBrush.width = widthRef.current;
    canvas.isDrawingMode = toolRef.current === 'pen';
    fabricRef.current = canvas;

    // Freehand strokes → track for undo.
    canvas.on('path:created', (e: { path: FabricObject }) => {
      if (e.path) undoRef.current.push({ kind: 'add', obj: e.path });
    });

    const getPoint = (opt: { e: Event }) => canvas.getScenePoint(opt.e as MouseEvent);

    // Erase every annotation object under `p` not already erased this gesture.
    // The background photo is `canvas.backgroundImage`, never in getObjects(),
    // so it can never be erased.
    const eraseAt = (p: Point) => {
      const objs = [...canvas.getObjects()];
      let any = false;
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (erasedDragRef.current.has(o)) continue;
        if (o.containsPoint(p)) {
          canvas.remove(o);
          erasedDragRef.current.add(o);
          any = true;
        }
      }
      if (any) canvas.requestRenderAll();
    };

    canvas.on('mouse:down', opt => {
      const t = toolRef.current;
      if (t === 'eraser') {
        erasingRef.current = true;
        erasedDragRef.current = new Set();
        eraseAt(getPoint(opt));
        return;
      }
      if (t === 'pen') return; // brush handles it
      // Let Fabric handle grabbing/moving an existing text object.
      if (opt.target && (opt.target as { isType?: (s: string) => boolean }).isType?.('textbox')) return;

      const p = getPoint(opt);

      if (t === 'text') {
        const tb = new Textbox('Text', {
          left: p.x, top: p.y, fontSize: Math.max(20, widthRef.current * 4),
          fill: colorRef.current, width: 160, editable: true,
          selectable: true, evented: true,
        });
        canvas.add(tb);
        canvas.setActiveObject(tb);
        tb.enterEditing();
        tb.selectAll();
        undoRef.current.push({ kind: 'add', obj: tb });
        forceRender(n => n + 1);
        return;
      }

      // circle / arrow — start a drag
      drawingRef.current = true;
      originRef.current = { x: p.x, y: p.y };
      if (t === 'circle') {
        const ell = new Ellipse({
          left: p.x, top: p.y, rx: 0, ry: 0, originX: 'left', originY: 'top',
          fill: 'transparent', stroke: colorRef.current, strokeWidth: widthRef.current,
          selectable: false, evented: false,
        });
        canvas.add(ell);
        shapeRef.current = ell;
      } else {
        const ln = new Line([p.x, p.y, p.x, p.y], {
          stroke: colorRef.current, strokeWidth: widthRef.current,
          selectable: false, evented: false,
        });
        canvas.add(ln);
        shapeRef.current = ln;
      }
    });

    canvas.on('mouse:move', opt => {
      if (erasingRef.current) { eraseAt(getPoint(opt)); return; }
      if (!drawingRef.current || !originRef.current || !shapeRef.current) return;
      const p = getPoint(opt);
      const o = originRef.current;
      const t = toolRef.current;
      if (t === 'circle') {
        (shapeRef.current as Ellipse).set({
          left: Math.min(o.x, p.x), top: Math.min(o.y, p.y),
          rx: Math.abs(p.x - o.x) / 2, ry: Math.abs(p.y - o.y) / 2,
        });
      } else {
        (shapeRef.current as Line).set({ x2: p.x, y2: p.y });
      }
      canvas.requestRenderAll();
    });

    canvas.on('mouse:up', opt => {
      if (erasingRef.current) {
        erasingRef.current = false;
        if (erasedDragRef.current.size > 0) {
          undoRef.current.push({ kind: 'erase', objs: [...erasedDragRef.current] });
          forceRender(n => n + 1);
        }
        return;
      }
      if (!drawingRef.current || !originRef.current) return;
      const p = getPoint(opt);
      const o = originRef.current;
      const t = toolRef.current;
      const shape = shapeRef.current;
      drawingRef.current = false;
      originRef.current = null;
      shapeRef.current = null;

      if (t === 'circle') {
        const ell = shape as Ellipse | null;
        if (!ell) return;
        if ((ell.rx ?? 0) < 4 && (ell.ry ?? 0) < 4) {
          canvas.remove(ell); // ignore a stray tap
        } else {
          undoRef.current.push({ kind: 'add', obj: ell });
        }
        canvas.requestRenderAll();
        forceRender(n => n + 1);
        return;
      }

      // arrow — drop the preview line, build shaft + arrowhead as one group
      if (shape) canvas.remove(shape);
      const dx = p.x - o.x, dy = p.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) { canvas.requestRenderAll(); return; }

      const w = widthRef.current;
      const c = colorRef.current;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const head = Math.max(14, w * 3.5);
      const shaft = new Line([o.x, o.y, p.x, p.y], { stroke: c, strokeWidth: w });
      const tip = new Triangle({
        left: p.x, top: p.y, originX: 'center', originY: 'center',
        width: head, height: head, fill: c, angle: angle + 90,
      });
      const arrow = new Group([shaft, tip], { selectable: false, evented: false });
      canvas.add(arrow);
      undoRef.current.push({ kind: 'add', obj: arrow });
      canvas.requestRenderAll();
      forceRender(n => n + 1);
    });

    // ─── Load the photo as a fitted, locked background ───
    let disposed = false;
    FabricImage.fromURL(imageSrc, { crossOrigin: 'anonymous' })
      .then(img => {
        if (disposed) return;
        const iw = img.width || 1;
        const ih = img.height || 1;
        // Reserve room for the top bar (~64px) and bottom toolbar (~120px).
        const maxW = Math.min(window.innerWidth * 0.94, 1100);
        const maxH = window.innerHeight - 200;
        const scale = Math.min(maxW / iw, maxH / ih);
        const cw = Math.round(iw * scale);
        const ch = Math.round(ih * scale);
        canvas.setDimensions({ width: cw, height: ch });
        img.set({ scaleX: scale, scaleY: scale, originX: 'left', originY: 'top', left: 0, top: 0 });
        canvas.backgroundImage = img;
        canvas.requestRenderAll();
        setReady(true);
      })
      .catch(() => { if (!disposed) setReady(true); });

    return () => {
      disposed = true;
      void canvas.dispose();
      fabricRef.current = null;
    };
    // Canvas is created exactly once for a given source image.
  }, [imageSrc]);

  // Apply tool changes imperatively.
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const eraser = tool === 'eraser';
    canvas.isDrawingMode = tool === 'pen';
    // In eraser mode no object is a drag/select target (so a tap erases instead
    // of grabbing the text box); otherwise only text stays interactive/movable.
    canvas.getObjects().forEach(o => {
      const isText = (o as { isType?: (s: string) => boolean }).isType?.('textbox') ?? false;
      o.set({ evented: eraser ? false : isText, selectable: eraser ? false : isText });
    });
    canvas.defaultCursor = eraser ? ERASER_CURSOR : tool === 'text' ? 'text' : 'crosshair';
    if (tool !== 'text') canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [tool]);

  // Apply color/width — to the brush, and to the selected text if any.
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = width;
    }
    const active = canvas.getActiveObject();
    if (active && (active as { isType?: (s: string) => boolean }).isType?.('textbox')) {
      active.set({ fill: color });
      canvas.requestRenderAll();
    }
  }, [color, width]);

  const undo = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const action = undoRef.current.pop();
    if (!action) return;
    if (action.kind === 'add') {
      if (canvas.getActiveObject() === action.obj) canvas.discardActiveObject();
      canvas.remove(action.obj);
    } else {
      // Restore erased objects. Re-add matches the eraser's evented state so
      // they behave the same as before erasing on the next tool switch.
      action.objs.forEach(o => canvas.add(o));
    }
    canvas.requestRenderAll();
    forceRender(n => n + 1);
  };

  const clearAll = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.getObjects().forEach(o => canvas.remove(o)); // background image is not an object
    undoRef.current = [];
    canvas.requestRenderAll();
    forceRender(n => n + 1);
  };

  const handleSend = () => {
    const canvas = fabricRef.current;
    if (!canvas || sending) return;
    setSending(true);
    // Drop selection handles / exit any active text edit before flattening.
    const active = canvas.getActiveObject() as { isEditing?: boolean; exitEditing?: () => void } | undefined;
    if (active?.isEditing) active.exitEditing?.();
    canvas.discardActiveObject();
    canvas.renderAll();
    const el = canvas.getElement();
    el.toBlob(blob => {
      if (!blob) { setSending(false); return; }
      const file = new File([blob], `annotated-${Date.now()}.png`, { type: 'image/png' });
      onSend(file);
    }, 'image/png');
  };

  const hasEdits = undoRef.current.length > 0;

  const TOOLS: { key: Tool; label: string; icon: typeof Pen }[] = [
    { key: 'pen', label: 'Draw', icon: Pen },
    { key: 'circle', label: 'Circle', icon: CircleIcon },
    { key: 'arrow', label: 'Arrow', icon: ArrowUpRight },
    { key: 'text', label: 'Text', icon: Type },
    { key: 'eraser', label: 'Erase', icon: Eraser },
  ];

  return (
    <Portal>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black flex flex-col"
      >
        {/* Top bar: Cancel · Send */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button
            onClick={onCancel}
            aria-label="Cancel"
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-white/70 text-xs font-medium hidden sm:block">Markup</span>
          <button
            onClick={handleSend}
            disabled={sending || !ready}
            className="flex items-center gap-2 gradient-primary text-primary-foreground text-sm font-semibold pl-4 pr-3.5 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>

        {/* Canvas stage */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-2 overflow-hidden">
          <div className="relative">
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              </div>
            )}
            <canvas ref={canvasElRef} className="rounded-lg shadow-2xl touch-none" />
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto max-w-2xl flex flex-col gap-2.5">
            {/* Colors + stroke width */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'ring-1 ring-white/25'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="w-px h-6 bg-white/15" />
              <div className="flex items-center gap-1.5">
                {WIDTHS.map(w => (
                  <button
                    key={w.key}
                    onClick={() => setWidth(w.value)}
                    aria-label={`${w.key} stroke`}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      width === w.value ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <span className="rounded-full bg-current" style={{ width: w.value + 2, height: w.value + 2 }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Tools + undo / clear */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {TOOLS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTool(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    tool === key ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
              <div className="w-px h-6 bg-white/15 mx-0.5" />
              <button
                onClick={undo}
                disabled={!hasEdits}
                aria-label="Undo"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30"
              >
                <Undo2 className="w-4 h-4" /> <span className="hidden sm:inline">Undo</span>
              </button>
              <button
                onClick={clearAll}
                disabled={!hasEdits}
                aria-label="Clear all"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
    </Portal>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Portal from '@/components/ui/portal';
import {
  MousePointer2, Pen, Eraser, Lasso, Type, Square, Circle, Minus, ImagePlus, Palette,
  Trash2, ChevronsUp, ChevronsDown, Undo2, Redo2, ZoomIn, ZoomOut,
  Maximize, Download, ArrowLeft, Loader2, Check, Cloud, MoreHorizontal,
} from 'lucide-react';
import {
  Canvas, PencilBrush, Textbox, Rect, Ellipse, Line, FabricImage, Point, ActiveSelection,
} from 'fabric';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { MoodBoardRow } from './MoodBoardSection';

interface Props {
  board: MoodBoardRow;
  onClose: () => void;
}

type Tool = 'select' | 'pen' | 'eraser' | 'lasso';
type SaveState = 'idle' | 'pending' | 'saving' | 'saved';

// Ray-casting point-in-polygon test (polygon in scene coords).
function pointInPolygon(poly: { x: number; y: number }[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9',
  '#6366f1', '#a855f7', '#ec4899', '#78716c', '#1e2419',
];
const MAX_HISTORY = 50;
const AUTOSAVE_MS = 2000;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;

// Small circular cursor so the eraser reads differently from the pen/pointer.
const ERASER_CURSOR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26'><circle cx='13' cy='13' r='10' fill='rgba(30,36,25,0.15)' stroke='%231e2419' stroke-width='2'/></svg>\") 13 13, crosshair";

export default function MoodBoardEditor({ board, onClose }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [title, setTitle] = useState(board.title);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);
  const [, forceRender] = useState(0);

  // History (undo/redo) — JSON snapshot stack
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);
  const restoringRef = useRef(false);
  const recordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const titleRef = useRef(board.title);
  const savingRef = useRef(false);

  // Pan
  const spaceDownRef = useRef(false);
  const panningRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const toolRef = useRef<Tool>('select');

  // Eraser drag state — objects removed within the current down→up gesture.
  // (Undo works automatically: canvas.remove fires object:removed → recordChange
  // → snapshot, so no separate eraser bookkeeping on the history stack.)
  const erasingRef = useRef(false);
  const erasedDragRef = useRef<Set<object>>(new Set());

  // Two-finger touch gesture (pinch-zoom + pan) state.
  const gesturingRef = useRef(false);
  const pinchRef = useRef<{ dist: number; midX: number; midY: number }>({ dist: 0, midX: 0, midY: 0 });

  // Lasso (freeform multi-select) drag state. The lasso outline is painted on
  // the upper canvas context so it never becomes a real object / history entry.
  const lassoingRef = useRef(false);
  const lassoPointsRef = useRef<{ x: number; y: number }[]>([]);

  const [moreOpen, setMoreOpen] = useState(false);

  const pushSnapshot = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || restoringRef.current) return;
    const json = JSON.stringify(canvas.toJSON());
    const h = historyRef.current.slice(0, historyIdxRef.current + 1);
    if (h[h.length - 1] === json) return;
    h.push(json);
    if (h.length > MAX_HISTORY) h.shift();
    historyRef.current = h;
    historyIdxRef.current = h.length - 1;
    forceRender(n => n + 1);
  }, []);

  const saveNow = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas || savingRef.current) return;
    savingRef.current = true;
    dirtyRef.current = false;
    setSaveState('saving');
    try {
      const canvasData = canvas.toJSON();

      // Downscaled PNG thumbnail for the grid card — best effort: a CORS-tainted
      // image would make toDataURL throw, and that must not block the JSON save.
      let thumbnailUrl: string | undefined;
      try {
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.3 });
        const blob = await (await fetch(dataUrl)).blob();
        const path = `mood-boards/${board.project_id}/${board.id}/thumb-${Date.now()}.png`;
        const { error: upErr } = await supabase.storage.from('chat-media').upload(path, blob);
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
          thumbnailUrl = publicUrl;
        }
      } catch { /* thumbnail is cosmetic */ }

      const { error } = await supabase.from('mood_boards').update({
        canvas_data: JSON.parse(JSON.stringify(canvasData)),
        title: titleRef.current.trim() || 'Untitled Board',
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
      }).eq('id', board.id);
      if (error) throw error;
      setSaveState('saved');
    } catch (err) {
      setSaveState('idle');
      dirtyRef.current = true;
      toast.error(`Failed to save board: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      savingRef.current = false;
    }
  }, [board.id, board.project_id]);

  const scheduleAutosave = useCallback(() => {
    dirtyRef.current = true;
    setSaveState('pending');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void saveNow(), AUTOSAVE_MS);
  }, [saveNow]);

  const recordChange = useCallback(() => {
    if (restoringRef.current || lassoingRef.current) return; // ignore transient lasso paints
    if (recordTimerRef.current) clearTimeout(recordTimerRef.current);
    recordTimerRef.current = setTimeout(pushSnapshot, 150); // coalesce event bursts
    scheduleAutosave();
  }, [pushSnapshot, scheduleAutosave]);

  const restoreSnapshot = useCallback((idx: number) => {
    const canvas = fabricRef.current;
    const json = historyRef.current[idx];
    if (!canvas || json === undefined) return;
    restoringRef.current = true;
    historyIdxRef.current = idx;
    void canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.backgroundColor = '#ffffff';
      canvas.requestRenderAll();
      restoringRef.current = false;
      scheduleAutosave();
      forceRender(n => n + 1);
    });
  }, [scheduleAutosave]);

  const undo = useCallback(() => {
    if (historyIdxRef.current > 0) restoreSnapshot(historyIdxRef.current - 1);
  }, [restoreSnapshot]);
  const redo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) restoreSnapshot(historyIdxRef.current + 1);
  }, [restoreSnapshot]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    active.forEach(o => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, []);

  // ─── Canvas lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasElRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;

    const canvas = new Canvas(el, {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = strokeWidth;
    fabricRef.current = canvas;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.setDimensions({ width: rect.width, height: rect.height });
      canvas.requestRenderAll();
    };
    resize();
    window.addEventListener('resize', resize);

    // Erase every erasable object under `p` not already erased this gesture.
    // Images are treated as board content (like the locked photo in the chat
    // annotator) and never erased — only pen/shape/text/line annotations.
    const eraseAt = (p: Point) => {
      const objs = [...canvas.getObjects()];
      let any = false;
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (erasedDragRef.current.has(o)) continue;
        if ((o as { type?: string }).type === 'image') continue; // protect images
        if (o.containsPoint(p)) {
          canvas.remove(o); // fires object:removed → recordChange (undoable)
          erasedDragRef.current.add(o);
          any = true;
        }
      }
      if (any) canvas.requestRenderAll();
    };

    // Paint the in-progress lasso outline on the upper canvas — it never becomes
    // a real object, so it stays out of history/export.
    const drawLasso = () => {
      const ctx = canvas.contextTop;
      canvas.clearContext(ctx);
      const pts = lassoPointsRef.current;
      if (pts.length < 2) return;
      const retina = canvas.getRetinaScaling();
      const vpt = canvas.viewportTransform;
      const zoom = canvas.getZoom();
      ctx.save();
      ctx.setTransform(retina, 0, 0, retina, 0, 0);
      ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(37,99,235,0.08)';
      ctx.fill();
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeStyle = '#2563eb';
      ctx.stroke();
      ctx.restore();
    };

    // Close the lasso, select every object whose center falls inside it.
    const finishLasso = () => {
      canvas.clearContext(canvas.contextTop);
      const pts = lassoPointsRef.current;
      lassoPointsRef.current = [];
      lassoingRef.current = false;
      if (pts.length < 3) { canvas.requestRenderAll(); return; }
      const hits = canvas.getObjects().filter(o => {
        const c = o.getCenterPoint();
        return pointInPolygon(pts, c.x, c.y);
      });
      if (hits.length === 0) { canvas.requestRenderAll(); return; } // empty lasso — stay in lasso mode
      // Re-enable interaction so the selection can be dragged, then hand off to Select.
      canvas.getObjects().forEach(o => o.set({ selectable: true, evented: true }));
      canvas.discardActiveObject();
      if (hits.length === 1) canvas.setActiveObject(hits[0]);
      else canvas.setActiveObject(new ActiveSelection(hits, { canvas }));
      canvas.requestRenderAll();
      setTool('select'); // let the user drag the selection
    };

    // Pointer interactions: space/middle-drag pan, eraser, lasso, and — with the
    // Select tool — drag empty space to pan / drag an object to move it.
    canvas.on('mouse:down', opt => {
      const evt = opt.e as MouseEvent;
      if (gesturingRef.current) return; // two-finger gesture owns the pointer
      if (spaceDownRef.current || evt.button === 1) {
        panningRef.current = true;
        lastPosRef.current = { x: evt.clientX, y: evt.clientY };
        evt.preventDefault();
        return;
      }
      if (toolRef.current === 'eraser') {
        erasingRef.current = true;
        erasedDragRef.current = new Set();
        eraseAt(canvas.getScenePoint(evt));
        return;
      }
      if (toolRef.current === 'lasso') {
        lassoingRef.current = true;
        const p = canvas.getScenePoint(evt);
        lassoPointsRef.current = [{ x: p.x, y: p.y }];
        return;
      }
      // Select tool: empty space pans, an object drags (Fabric moves it).
      if (toolRef.current === 'select' && !opt.target && evt.button === 0) {
        panningRef.current = true;
        lastPosRef.current = { x: evt.clientX, y: evt.clientY };
        canvas.setCursor('grabbing');
      }
    });
    canvas.on('mouse:move', opt => {
      if (gesturingRef.current) return;
      if (lassoingRef.current) {
        const p = canvas.getScenePoint(opt.e as MouseEvent);
        lassoPointsRef.current.push({ x: p.x, y: p.y });
        drawLasso();
        return;
      }
      if (erasingRef.current) {
        eraseAt(canvas.getScenePoint(opt.e as MouseEvent));
        return;
      }
      if (!panningRef.current || !lastPosRef.current) return;
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      vpt[4] += evt.clientX - lastPosRef.current.x;
      vpt[5] += evt.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      canvas.requestRenderAll();
    });
    canvas.on('mouse:up', () => {
      if (lassoingRef.current) { finishLasso(); return; }
      panningRef.current = false;
      lastPosRef.current = null;
      erasingRef.current = false;
    });

    // History + autosave triggers (object:added also covers free-drawn paths)
    const onChange = () => recordChange();
    canvas.on('object:added', onChange);
    canvas.on('object:modified', onChange);
    canvas.on('object:removed', onChange);

    // Load persisted content, then seed history with the loaded state
    const cd = board.canvas_data;
    const hasContent = cd && typeof cd === 'object' && Object.keys(cd).length > 0;
    const seed = () => {
      canvas.backgroundColor = '#ffffff';
      canvas.requestRenderAll();
      restoringRef.current = false;
      pushSnapshot();
      setSaveState('saved');
      dirtyRef.current = false;
    };
    if (hasContent) {
      restoringRef.current = true;
      void canvas.loadFromJSON(cd).then(seed);
    } else {
      seed();
    }

    // ─── Two-finger touch: pinch-to-zoom + pan ───
    // Only 2 simultaneous touches are intercepted; a single touch falls through
    // untouched so the active tool (pen/eraser/shape/text) works exactly as with
    // a mouse. `touch-action: none` on the wrapper stops the browser's own pinch.
    const touchMid = (t1: Touch, t2: Touch) => ({
      dist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
      midX: (t1.clientX + t2.clientX) / 2,
      midY: (t1.clientY + t2.clientY) / 2,
    });
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      // A second finger landed mid-gesture: abort any in-progress draw/erase/pan
      // so the stroke isn't finalized as a stray mark.
      gesturingRef.current = true;
      canvas.isDrawingMode = false;
      erasingRef.current = false;
      panningRef.current = false;
      lastPosRef.current = null;
      canvas.discardActiveObject();
      pinchRef.current = touchMid(e.touches[0], e.touches[1]);
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!gesturingRef.current || e.touches.length !== 2) return;
      e.preventDefault();
      const { dist, midX, midY } = touchMid(e.touches[0], e.touches[1]);
      const prev = pinchRef.current;
      const rect = wrap.getBoundingClientRect();
      // Pinch → zoom toward the fingers' midpoint, clamped to the button range.
      if (prev.dist > 0) {
        const zoom = Math.min(Math.max(canvas.getZoom() * (dist / prev.dist), MIN_ZOOM), MAX_ZOOM);
        canvas.zoomToPoint(new Point(midX - rect.left, midY - rect.top), zoom);
        setZoomPct(Math.round(zoom * 100));
      }
      // Two-finger drag → pan by the midpoint delta.
      canvas.relativePan(new Point(midX - prev.midX, midY - prev.midY));
      pinchRef.current = { dist, midX, midY };
    };
    const endGesture = (e: TouchEvent) => {
      if (!gesturingRef.current || e.touches.length >= 2) return;
      gesturingRef.current = false;
      pinchRef.current = { dist: 0, midX: 0, midY: 0 };
      canvas.isDrawingMode = toolRef.current === 'pen';
      canvas.selection = toolRef.current === 'select';
    };
    // ─── Scroll-wheel + trackpad-pinch zoom (laptop/desktop) ───
    // A laptop trackpad pinch is delivered as a wheel event (with ctrlKey), so
    // one handler covers both the mouse wheel and the trackpad pinch. Zoom is
    // toward the cursor and shares the same clamp as the +/- buttons/touch pinch.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // stop the browser's page scroll / ctrl+wheel page zoom
      const rect = wrap.getBoundingClientRect();
      const zoom = Math.min(Math.max(canvas.getZoom() * 0.999 ** e.deltaY, MIN_ZOOM), MAX_ZOOM);
      canvas.zoomToPoint(new Point(e.clientX - rect.left, e.clientY - rect.top), zoom);
      setZoomPct(Math.round(zoom * 100));
    };

    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('touchstart', onTouchStart, { passive: false });
    wrap.addEventListener('touchmove', onTouchMove, { passive: false });
    wrap.addEventListener('touchend', endGesture);
    wrap.addEventListener('touchcancel', endGesture);

    return () => {
      window.removeEventListener('resize', resize);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchmove', onTouchMove);
      wrap.removeEventListener('touchend', endGesture);
      wrap.removeEventListener('touchcancel', endGesture);
      void canvas.dispose();
      fabricRef.current = null;
    };
    // Canvas is created exactly once per board — tool/color changes are applied
    // imperatively in their own effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const isTyping = () => {
      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject() as { isEditing?: boolean } | undefined;
      const tag = document.activeElement?.tagName;
      return !!active?.isEditing || tag === 'INPUT' || tag === 'TEXTAREA';
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isTyping()) {
        spaceDownRef.current = true;
        const canvas = fabricRef.current;
        if (canvas) canvas.isDrawingMode = false; // suspend pen while panning
        e.preventDefault();
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping()) {
        e.preventDefault();
        deleteSelected();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spaceDownRef.current = false;
        const canvas = fabricRef.current;
        if (canvas) canvas.isDrawingMode = toolRef.current === 'pen';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [undo, redo, deleteSelected]);

  // ─── Tool / style application ──────────────────────────────────────────────
  useEffect(() => {
    toolRef.current = tool;
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Eraser & lasso hit-test objects directly, so they must not be grabbable
    // (a click would otherwise select/move instead of erase/lasso).
    const noInteract = tool === 'eraser' || tool === 'lasso';
    canvas.isDrawingMode = tool === 'pen';
    // Rubber-band box selection is replaced by the Lasso tool; the Select tool's
    // empty-space drag pans instead. So the native drag-select is always off.
    canvas.selection = false;
    canvas.getObjects().forEach(o => o.set({ selectable: !noInteract, evented: !noInteract }));
    canvas.defaultCursor =
      tool === 'eraser' ? ERASER_CURSOR
      : tool === 'pen' ? 'crosshair'
      : tool === 'lasso' ? 'crosshair'
      : tool === 'select' ? 'grab'   // hint that empty-space drag pans the board
      : 'default';
    canvas.requestRenderAll();
  }, [tool]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = strokeWidth;
    }
    const active = canvas.getActiveObjects();
    if (active.length > 0) {
      active.forEach(o => {
        const type = (o as { type?: string }).type;
        if (type === 'textbox' || type === 'i-text' || type === 'text') o.set('fill', color);
        else if (type !== 'image') o.set({ stroke: color, strokeWidth });
      });
      canvas.requestRenderAll();
      recordChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, strokeWidth]);

  useEffect(() => { titleRef.current = title; }, [title]);

  // ─── Object creation ───────────────────────────────────────────────────────
  const viewportCenter = () => {
    const canvas = fabricRef.current!;
    const vpt = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    return {
      x: (canvas.getWidth() / 2 - vpt[4]) / zoom,
      y: (canvas.getHeight() / 2 - vpt[5]) / zoom,
    };
  };

  const addAndSelect = (obj: Parameters<Canvas['add']>[0]) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.add(obj);
    canvas.setActiveObject(obj as Parameters<Canvas['setActiveObject']>[0]);
    canvas.requestRenderAll();
    setTool('select');
  };

  const addText = () => {
    const { x, y } = viewportCenter();
    const t = new Textbox('Text', { left: x - 75, top: y - 16, width: 150, fontSize: 28, fill: color });
    addAndSelect(t);
    t.enterEditing();
    t.selectAll();
  };
  const addRect = () => {
    const { x, y } = viewportCenter();
    addAndSelect(new Rect({ left: x - 70, top: y - 45, width: 140, height: 90, fill: 'transparent', stroke: color, strokeWidth, rx: 2, ry: 2 }));
  };
  const addEllipse = () => {
    const { x, y } = viewportCenter();
    addAndSelect(new Ellipse({ left: x - 70, top: y - 45, rx: 70, ry: 45, fill: 'transparent', stroke: color, strokeWidth }));
  };
  const addLine = () => {
    const { x, y } = viewportCenter();
    addAndSelect(new Line([x - 80, y, x + 80, y], { stroke: color, strokeWidth }));
  };

  const handleImagePicked = async (file: File | null) => {
    const canvas = fabricRef.current;
    if (!file || !canvas) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `mood-boards/${board.project_id}/${board.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('chat-media').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
      const img = await FabricImage.fromURL(publicUrl, { crossOrigin: 'anonymous' });
      const scale = Math.min(1, 480 / (img.width || 480));
      const { x, y } = viewportCenter();
      img.set({ left: x - (img.width || 0) * scale / 2, top: y - (img.height || 0) * scale / 2, scaleX: scale, scaleY: scale });
      addAndSelect(img);
    } catch (err) {
      toast.error(`Image upload failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ─── Layering / zoom / export ──────────────────────────────────────────────
  const bringToFront = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach(o => canvas.bringObjectToFront(o));
    canvas.requestRenderAll();
    recordChange();
  };
  const sendToBack = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach(o => canvas.sendObjectToBack(o));
    canvas.requestRenderAll();
    recordChange();
  };

  const setZoomClamped = (z: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const zoom = Math.min(Math.max(z, MIN_ZOOM), MAX_ZOOM);
    canvas.zoomToPoint(new Point(canvas.getWidth() / 2, canvas.getHeight() / 2), zoom);
    setZoomPct(Math.round(zoom * 100));
  };
  const resetView = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomPct(100);
  };

  const exportPng = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL({ format: 'png', multiplier: 2 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titleRef.current.trim() || 'mood-board'}.png`;
      a.click();
    } catch {
      toast.error('Export failed — an image on the board may block cross-origin export');
    }
  };

  const handleClose = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (dirtyRef.current) await saveNow(); // never lose the last edit
    onClose();
  };

  const canUndo = historyIdxRef.current > 0;
  const canRedo = historyIdxRef.current < historyRef.current.length - 1;

  const ToolButton = ({ label, active, onClick, disabled, children }: {
    label: string; active?: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 ${
            active ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <Portal>
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-card shrink-0">
        <button onClick={() => void handleClose()} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground" title="Back to boards">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); scheduleAutosave(); }}
          className="font-semibold text-foreground text-sm bg-transparent outline-none rounded-lg px-2 py-1.5 hover:bg-muted/60 focus:bg-muted/60 focus:ring-2 focus:ring-primary/20 min-w-0 flex-1 max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {saveState === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
            {saveState === 'pending' && <><Cloud className="w-3 h-3" /> Unsaved changes</>}
            {saveState === 'saved' && <><Check className="w-3 h-3 text-success" /> Saved</>}
          </span>
          <button
            onClick={exportPng}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-card border border-border text-foreground hover:bg-muted whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" /> Export PNG
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left tool rail */}
        <div className="w-14 border-r border-border/60 bg-card flex flex-col items-center gap-1 py-3 overflow-y-auto scrollbar-none shrink-0">
          <ToolButton label="Select · drag empty space to pan, an object to move it" active={tool === 'select'} onClick={() => setTool('select')}><MousePointer2 className="w-4 h-4" /></ToolButton>
          <ToolButton label="Freehand pen" active={tool === 'pen'} onClick={() => setTool('pen')}><Pen className="w-4 h-4" /></ToolButton>
          <ToolButton label="Eraser (removes strokes/shapes/text, not images)" active={tool === 'eraser'} onClick={() => setTool('eraser')}><Eraser className="w-4 h-4" /></ToolButton>
          <ToolButton label="Lasso select — circle objects to select them" active={tool === 'lasso'} onClick={() => setTool('lasso')}><Lasso className="w-4 h-4" /></ToolButton>
          <ToolButton label="Add text" onClick={addText}><Type className="w-4 h-4" /></ToolButton>

          {/* Color + stroke width */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted relative">
                    <Palette className="w-4 h-4" />
                    <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-white/70" style={{ backgroundColor: color }} />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Color & stroke width</TooltipContent>
            </Tooltip>
            <PopoverContent side="right" className="w-64 p-3" collisionPadding={12}>
              <div className="grid grid-cols-5 gap-1.5">
                {PALETTE.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-lg border-2 transition-transform hover:scale-110 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <label className="text-[11px] text-muted-foreground">Custom</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent" />
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-muted-foreground block mb-1">Stroke width — {strokeWidth}px</label>
                <input type="range" min={1} max={20} value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} className="w-full" />
              </div>
            </PopoverContent>
          </Popover>

          {/* More tools — shapes, image & layer order tucked away to keep the rail tidy */}
          <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">More tools</TooltipContent>
            </Tooltip>
            <PopoverContent side="right" align="start" className="w-48 p-1.5" collisionPadding={12}>
              <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Shapes</p>
              {[
                { icon: Square, label: 'Rectangle', onClick: addRect, disabled: false },
                { icon: Circle, label: 'Ellipse', onClick: addEllipse, disabled: false },
                { icon: Minus, label: 'Line', onClick: addLine, disabled: false },
                { icon: ImagePlus, label: uploadingImage ? 'Uploading…' : 'Add image', onClick: () => fileRef.current?.click(), disabled: uploadingImage },
              ].map(({ icon: Icon, label, onClick, disabled }) => (
                <button
                  key={label}
                  disabled={disabled}
                  onClick={() => { onClick(); setMoreOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-40 text-left"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" /> {label}
                </button>
              ))}
              <div className="h-px bg-border/60 my-1" />
              <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Arrange</p>
              {[
                { icon: ChevronsUp, label: 'Bring to front', onClick: bringToFront },
                { icon: ChevronsDown, label: 'Send to back', onClick: sendToBack },
              ].map(({ icon: Icon, label, onClick }) => (
                <button
                  key={label}
                  onClick={() => { onClick(); setMoreOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" /> {label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="w-6 border-t border-border/60 my-1.5" />
          <ToolButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}><Undo2 className="w-4 h-4" /></ToolButton>
          <ToolButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}><Redo2 className="w-4 h-4" /></ToolButton>
          <ToolButton label="Delete selected (Del)" onClick={deleteSelected}><Trash2 className="w-4 h-4" /></ToolButton>

          <div className="w-6 border-t border-border/60 my-1.5" />
          <ToolButton label="Zoom in" onClick={() => setZoomClamped((fabricRef.current?.getZoom() || 1) * 1.25)}><ZoomIn className="w-4 h-4" /></ToolButton>
          <ToolButton label="Zoom out" onClick={() => setZoomClamped((fabricRef.current?.getZoom() || 1) / 1.25)}><ZoomOut className="w-4 h-4" /></ToolButton>
          <ToolButton label="Reset view" onClick={resetView}><Maximize className="w-4 h-4" /></ToolButton>
          <span className="text-[10px] text-muted-foreground mt-0.5">{zoomPct}%</span>
        </div>

        {/* Canvas — touch-none stops the browser's own pinch-zoom/scroll so the
            two-finger handlers own multi-touch gestures. */}
        <div ref={wrapRef} className="flex-1 min-w-0 bg-muted/30 relative overflow-hidden touch-none">
          <canvas ref={canvasElRef} />
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => void handleImagePicked(e.target.files?.[0] || null)} />
    </motion.div>
    </Portal>
  );
}

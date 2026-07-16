import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MousePointer2, Pen, Type, Square, Circle, Minus, ImagePlus, Palette,
  Trash2, ChevronsUp, ChevronsDown, Undo2, Redo2, ZoomIn, ZoomOut,
  Maximize, Download, ArrowLeft, Loader2, Check, Cloud,
} from 'lucide-react';
import {
  Canvas, PencilBrush, Textbox, Rect, Ellipse, Line, FabricImage, Point,
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

type Tool = 'select' | 'pen';
type SaveState = 'idle' | 'pending' | 'saving' | 'saved';

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9',
  '#6366f1', '#a855f7', '#ec4899', '#78716c', '#1e2419',
];
const MAX_HISTORY = 50;
const AUTOSAVE_MS = 2000;

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
    if (restoringRef.current) return;
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

    // Pan: space+drag or middle-mouse-drag
    canvas.on('mouse:down', opt => {
      const evt = opt.e as MouseEvent;
      if (spaceDownRef.current || evt.button === 1) {
        panningRef.current = true;
        canvas.selection = false;
        lastPosRef.current = { x: evt.clientX, y: evt.clientY };
        evt.preventDefault();
      }
    });
    canvas.on('mouse:move', opt => {
      if (!panningRef.current || !lastPosRef.current) return;
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      vpt[4] += evt.clientX - lastPosRef.current.x;
      vpt[5] += evt.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      canvas.requestRenderAll();
    });
    canvas.on('mouse:up', () => {
      panningRef.current = false;
      lastPosRef.current = null;
      canvas.selection = toolRef.current === 'select';
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

    return () => {
      window.removeEventListener('resize', resize);
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
    canvas.isDrawingMode = tool === 'pen';
    canvas.selection = tool === 'select';
    canvas.defaultCursor = tool === 'pen' ? 'crosshair' : 'default';
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
    const zoom = Math.min(Math.max(z, 0.2), 5);
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
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 ${
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
          <ToolButton label="Select / move (hold Space to pan)" active={tool === 'select'} onClick={() => setTool('select')}><MousePointer2 className="w-4 h-4" /></ToolButton>
          <ToolButton label="Freehand pen" active={tool === 'pen'} onClick={() => setTool('pen')}><Pen className="w-4 h-4" /></ToolButton>
          <ToolButton label="Add text" onClick={addText}><Type className="w-4 h-4" /></ToolButton>
          <ToolButton label="Rectangle" onClick={addRect}><Square className="w-4 h-4" /></ToolButton>
          <ToolButton label="Ellipse" onClick={addEllipse}><Circle className="w-4 h-4" /></ToolButton>
          <ToolButton label="Line" onClick={addLine}><Minus className="w-4 h-4" /></ToolButton>
          <ToolButton label="Upload image" onClick={() => fileRef.current?.click()} disabled={uploadingImage}>
            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          </ToolButton>

          {/* Color + stroke width */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted relative">
                    <Palette className="w-4 h-4" />
                    <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white/70" style={{ backgroundColor: color }} />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Color & stroke width</TooltipContent>
            </Tooltip>
            <PopoverContent side="right" className="w-52 p-3" collisionPadding={12}>
              <div className="grid grid-cols-5 gap-1.5">
                {PALETTE.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <label className="text-[11px] text-muted-foreground">Custom</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-muted-foreground block mb-1">Stroke width — {strokeWidth}px</label>
                <input type="range" min={1} max={20} value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} className="w-full" />
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-6 border-t border-border/60 my-1.5" />
          <ToolButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}><Undo2 className="w-4 h-4" /></ToolButton>
          <ToolButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}><Redo2 className="w-4 h-4" /></ToolButton>
          <ToolButton label="Delete selected (Del)" onClick={deleteSelected}><Trash2 className="w-4 h-4" /></ToolButton>
          <ToolButton label="Bring to front" onClick={bringToFront}><ChevronsUp className="w-4 h-4" /></ToolButton>
          <ToolButton label="Send to back" onClick={sendToBack}><ChevronsDown className="w-4 h-4" /></ToolButton>

          <div className="w-6 border-t border-border/60 my-1.5" />
          <ToolButton label="Zoom in" onClick={() => setZoomClamped((fabricRef.current?.getZoom() || 1) * 1.25)}><ZoomIn className="w-4 h-4" /></ToolButton>
          <ToolButton label="Zoom out" onClick={() => setZoomClamped((fabricRef.current?.getZoom() || 1) / 1.25)}><ZoomOut className="w-4 h-4" /></ToolButton>
          <ToolButton label="Reset view" onClick={resetView}><Maximize className="w-4 h-4" /></ToolButton>
          <span className="text-[10px] text-muted-foreground mt-0.5">{zoomPct}%</span>
        </div>

        {/* Canvas */}
        <div ref={wrapRef} className="flex-1 min-w-0 bg-muted/30 relative overflow-hidden">
          <canvas ref={canvasElRef} />
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => void handleImagePicked(e.target.files?.[0] || null)} />
    </motion.div>
  );
}

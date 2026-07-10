// Canvas rendering + pixel-diff helpers for the Drawings module.
// PDFs render via pdfjs-dist (lazy-loaded so it never lands in the main bundle);
// raster drawings (png/jpeg) load through a plain <img>. Both come back as a
// canvas so thumbnails and the compare view share one pipeline.

export type DrawingFileType = 'pdf' | 'image';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist');
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Supabase storage serves with permissive CORS
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Render a drawing version (first PDF page, or the raster image) to a canvas
 * scaled to `targetWidth` px wide.
 */
export async function renderVersionToCanvas(
  fileUrl: string,
  fileType: DrawingFileType,
  targetWidth: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (fileType === 'pdf') {
    const pdfjs = await getPdfjs();
    const doc = await pdfjs.getDocument({ url: fileUrl }).promise;
    try {
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = targetWidth / base.width;
      const viewport = page.getViewport({ scale });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    } finally {
      doc.destroy();
    }
  } else {
    const img = await loadImage(fileUrl);
    const scale = targetWidth / img.naturalWidth;
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

// Procore-style diff palette: content only in the OLD revision reads red
// (removed), content only in the NEW revision reads blue (added), content in
// both stays near-black, empty paper stays white.
const REMOVED = { r: 220, g: 38, b: 38 };
const ADDED = { r: 37, g: 99, b: 235 };
const COMMON = { r: 45, g: 50, b: 42 };

/**
 * Build the color-coded overlay diff of two rendered revisions.
 * `dx`/`dy` nudge the NEW revision (in px at render scale) so slightly
 * misaligned exports can be manually re-registered before comparing.
 */
export function buildDiffCanvas(
  oldCanvas: HTMLCanvasElement,
  newCanvas: HTMLCanvasElement,
  dx = 0,
  dy = 0,
): HTMLCanvasElement {
  const w = Math.max(oldCanvas.width, newCanvas.width);
  const h = Math.max(oldCanvas.height, newCanvas.height);

  // Normalize both onto same-size white backdrops (new one gets the nudge).
  const oldFlat = flatten(oldCanvas, w, h, 0, 0);
  const newFlat = flatten(newCanvas, w, h, dx, dy);

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d')!;
  const result = ctx.createImageData(w, h);

  const oldData = oldFlat.getContext('2d')!.getImageData(0, 0, w, h).data;
  const newData = newFlat.getContext('2d')!.getImageData(0, 0, w, h).data;
  const px = result.data;

  for (let i = 0; i < px.length; i += 4) {
    // "Ink" = darkness relative to white paper, 0..1
    const oldInk = 1 - (0.299 * oldData[i] + 0.587 * oldData[i + 1] + 0.114 * oldData[i + 2]) / 255;
    const newInk = 1 - (0.299 * newData[i] + 0.587 * newData[i + 1] + 0.114 * newData[i + 2]) / 255;
    const common = Math.min(oldInk, newInk);
    const removed = oldInk - common;
    const added = newInk - common;

    px[i]     = clamp(255 - removed * (255 - REMOVED.r) - added * (255 - ADDED.r) - common * (255 - COMMON.r));
    px[i + 1] = clamp(255 - removed * (255 - REMOVED.g) - added * (255 - ADDED.g) - common * (255 - COMMON.g));
    px[i + 2] = clamp(255 - removed * (255 - REMOVED.b) - added * (255 - ADDED.b) - common * (255 - COMMON.b));
    px[i + 3] = 255;
  }

  ctx.putImageData(result, 0, 0);
  return out;
}

function flatten(src: HTMLCanvasElement, w: number, h: number, dx: number, dy: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src, dx, dy);
  return c;
}

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** Infer our storage file_type from a File's MIME type; null if unsupported. */
export function drawingFileType(file: File): DrawingFileType | null {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp') return 'image';
  return null;
}

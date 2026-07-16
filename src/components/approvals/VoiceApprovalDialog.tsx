import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getModel, parseAIJson } from '@/lib/ai';
import { getSupportedAudioMimeType, isVoiceInputSupported, isStreamingCaptureSupported } from '@/lib/voiceSupport';
import { supabase } from '@/integrations/supabase/client';

interface VoiceProject {
  id: string;
  name: string;
}

export interface VoiceExtractedFields {
  title: string | null;
  category: string | null;
  projectId: string | null;
  description: string;
  costType: 'none' | 'fixed' | 'variable' | null;
  costAmount: number | null;
  shareRoles: string[];
  flaggedFields: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: VoiceProject[];
  defaultProjectId?: string;
  onExtracted: (fields: VoiceExtractedFields) => void;
}

interface RawExtracted {
  title: string | null;
  category: string | null;
  projectName: string | null;
  description: string;
  costType: 'none' | 'fixed' | 'variable' | null;
  costAmount: number | null;
  shareRoles: string[];
}

const responseSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', nullable: true },
    category: { type: 'string', nullable: true },
    projectName: { type: 'string', nullable: true },
    description: { type: 'string' },
    costType: { type: 'string', enum: ['none', 'fixed', 'variable'], nullable: true },
    costAmount: { type: 'number', nullable: true },
    shareRoles: { type: 'array', items: { type: 'string', enum: ['contractor', 'consultant'] } },
  },
  required: ['description', 'shareRoles'],
};

const CATEGORY_LABELS = ['Design', 'Procurement', 'Financial', 'Contracts', 'Execution', 'Issues'];
const STATIC_ROLE_PHRASES = ['contractor', 'consultant', 'architect', 'client'];
const STATIC_CURRENCY_PHRASES = ['rupees', 'rupee', 'lakh', 'lakhs', 'crore', 'crores'];
const LANGUAGE_OPTIONS = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिंदी' },
] as const;

type Stage = 'idle' | 'listening' | 'transcribing' | 'review' | 'extracting' | 'review-final';
type TranscriptionMode = 'streaming' | 'fallback' | null;

const SILENCE_TIMEOUT_MS = 4000;
const VOLUME_THRESHOLD = 8; // 0-255 scale on average frequency-bin amplitude
const WS_CONNECT_TIMEOUT_MS = 1500;
const STREAM_TIMESLICE_MS = 250; // MediaRecorder chunk flush interval while streaming live
const RELAY_WS_URL: string = import.meta.env.VITE_SPEECH_RELAY_WS_URL || '';
const RELAY_HTTP_URL: string = RELAY_WS_URL
  ? RELAY_WS_URL.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://').replace(/\/stream\/?$/, '')
  : '';

function resolveCategory(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  const match = CATEGORY_LABELS.find(c => c.toLowerCase() === lower);
  return match ?? null;
}

function resolveProject(name: string | null, projects: VoiceProject[]): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const exact = projects.find(p => p.name.toLowerCase() === lower);
  if (exact) return exact.id;
  const substring = projects.filter(p => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase()));
  if (substring.length === 1) return substring[0].id;
  const firstWordMatches = projects.filter(p => p.name.toLowerCase().split(/\s+/)[0] === lower.split(/\s+/)[0]);
  if (firstWordMatches.length === 1) return firstWordMatches[0].id;
  return null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoiceApprovalDialog({ open, onOpenChange, projects, defaultProjectId, onExtracted }: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  // State mirror of finalTranscriptRef — refs don't trigger re-renders, so the live
  // caption box renders this; the ref stays authoritative for stop/disconnect logic.
  const [liveFinalTranscript, setLiveFinalTranscript] = useState('');
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>(null);
  const [languageCode, setLanguageCode] = useState<string>(LANGUAGE_OPTIONS[0].code);
  const [extractedFields, setExtractedFields] = useState<VoiceExtractedFields | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const openRef = useRef(open);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const wsReadyRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const transcriptionModeRef = useRef<TranscriptionMode>(null);

  const supported = useMemo(() => isVoiceInputSupported(), []);

  const phraseHints = useMemo(() => [
    ...projects.map(p => p.name),
    ...CATEGORY_LABELS,
    ...STATIC_ROLE_PHRASES,
    ...STATIC_CURRENCY_PHRASES,
  ], [projects]);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setStage('idle');
      setTranscript('');
      setInterimTranscript('');
      finalTranscriptRef.current = '';
      setLiveFinalTranscript('');
      setTranscriptionMode(null);
      transcriptionModeRef.current = null;
      setExtractedFields(null);
    } else {
      teardownAudioResources();
    }
    return () => teardownAudioResources();
  }, [open]);

  const updateTranscriptionMode = (mode: TranscriptionMode) => {
    transcriptionModeRef.current = mode;
    setTranscriptionMode(mode);
  };

  const teardownAudioResources = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    silenceStartRef.current = null;
    if (wsRef.current) {
      try { wsRef.current.close(1000); } catch { /* already closed */ }
      wsRef.current = null;
    }
    wsReadyRef.current = false;
    sessionActiveRef.current = false;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { /* already closed */ });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch { /* already stopped */ }
      }
      mediaRecorderRef.current = null;
    }
  };

  const setupVoiceActivityDetection = (audioContext: AudioContext, source: MediaStreamAudioSourceNode) => {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const poll = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      const now = performance.now();

      if (avg > VOLUME_THRESHOLD) {
        silenceStartRef.current = null;
      } else {
        if (silenceStartRef.current === null) silenceStartRef.current = now;
        else if (now - silenceStartRef.current >= SILENCE_TIMEOUT_MS) {
          stopListening();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(poll);
    };
    silenceStartRef.current = performance.now();
    rafRef.current = requestAnimationFrame(poll);
  };

  // Single MediaRecorder-based capture path used for both live streaming and the plain
  // fallback — both now use the same browser-native WEBM_OPUS encoder (no custom PCM
  // resampling), and every chunk is kept in chunksRef regardless of streaming mode so it
  // can be re-run through the more accurate non-streaming pass once the user stops.
  const startMediaRecorderCapture = (stream: MediaStream, streamToRelay: boolean) => {
    const mimeType = getSupportedAudioMimeType();
    if (!mimeType) {
      toast.error('Could not start recording');
      teardownAudioResources();
      setStage('idle');
      onOpenChange(false);
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = e => {
      if (e.data.size === 0) return;
      chunksRef.current.push(e.data);
      if (streamToRelay && wsReadyRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(e.data);
      }
    };
    recorder.start(streamToRelay ? STREAM_TIMESLICE_MS : undefined);
  };

  const installSteadyStateHandlers = (ws: WebSocket) => {
    ws.onmessage = (evt) => {
      let msg: { type?: string; transcript?: string; isFinal?: boolean } = {};
      try { msg = JSON.parse(evt.data); } catch { return; }
      if (msg.type === 'transcript') {
        if (msg.isFinal) {
          finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + (msg.transcript || '')).trim();
          setLiveFinalTranscript(finalTranscriptRef.current);
          setInterimTranscript('');
        } else {
          setInterimTranscript(msg.transcript || '');
        }
      } else if (msg.type === 'error') {
        handleRelayDisconnect();
      }
    };
    ws.onerror = () => handleRelayDisconnect();
    ws.onclose = () => handleRelayDisconnect();
  };

  const handleRelayDisconnect = () => {
    if (!sessionActiveRef.current) return;
    sessionActiveRef.current = false;

    const captured = finalTranscriptRef.current.trim();
    if (captured) {
      const chunks = chunksRef.current;
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      teardownAudioResources();
      if (chunks.length === 0) {
        setTranscript(captured);
        setStage('review');
        return;
      }
      setStage('transcribing');
      void (async () => {
        const refined = await refineStreamedTranscript(chunks, mimeType);
        if (!openRef.current) return;
        setTranscript(refined || captured);
        setStage('review');
      })();
      return;
    }

    // Nothing usable yet — the MediaRecorder is already running into chunksRef regardless
    // of streaming mode, so we don't need to restart capture, just stop forwarding to the
    // (now-dead) socket and switch the UI/stop-path over to the fallback behavior.
    toast.error('Live transcription lost the connection — recording instead.');
    wsRef.current = null;
    wsReadyRef.current = false;
    updateTranscriptionMode('fallback');
  };

  const connectRelay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      void (async () => {
        if (!RELAY_WS_URL) { resolve(false); return; }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { resolve(false); return; }

        let settled = false;
        let ws: WebSocket;
        try {
          ws = new WebSocket(RELAY_WS_URL);
        } catch {
          resolve(false);
          return;
        }
        ws.binaryType = 'arraybuffer';

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          try { ws.close(); } catch { /* ignore */ }
          resolve(false);
        }, WS_CONNECT_TIMEOUT_MS);

        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'start',
            token: session.access_token,
            languageCode,
            phraseHints,
          }));
        };

        ws.onmessage = (evt) => {
          if (settled) return;
          let msg: { type?: string } = {};
          try { msg = JSON.parse(evt.data); } catch { return; }
          if (msg.type === 'ready') {
            settled = true;
            clearTimeout(timer);
            wsRef.current = ws;
            wsReadyRef.current = true;
            sessionActiveRef.current = true;
            installSteadyStateHandlers(ws);
            resolve(true);
          } else if (msg.type === 'error') {
            settled = true;
            clearTimeout(timer);
            try { ws.close(); } catch { /* ignore */ }
            resolve(false);
          }
        };

        ws.onerror = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(false);
        };
        ws.onclose = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(false);
        };
      })();
    });
  };

  const startListening = async () => {
    teardownAudioResources();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);

      setupVoiceActivityDetection(audioContext, source);

      finalTranscriptRef.current = '';
      setLiveFinalTranscript('');
      setInterimTranscript('');

      const streamingOk = isStreamingCaptureSupported() ? await connectRelay() : false;

      updateTranscriptionMode(streamingOk ? 'streaming' : 'fallback');
      startMediaRecorderCapture(stream, streamingOk);

      setStage('listening');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Microphone access denied — enable it in your browser settings');
      } else {
        toast.error('Could not start recording');
      }
      teardownAudioResources();
      setStage('idle');
      onOpenChange(false);
    }
  };

  const refineStreamedTranscript = async (chunks: Blob[], mimeType: string): Promise<string | null> => {
    if (!RELAY_HTTP_URL) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      const blob = new Blob(chunks, { type: mimeType });
      const audioBase64 = await blobToBase64(blob);

      const res = await fetch(`${RELAY_HTTP_URL}/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ audioBase64, languageCode }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.transcript === 'string' && data.transcript.trim() ? data.transcript.trim() : null;
    } catch {
      return null;
    }
  };

  const stopStreamingSession = () => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'stop' })); } catch { /* ignore */ }
    }
    sessionActiveRef.current = false;

    const streamedTranscript = finalTranscriptRef.current.trim();
    const chunks = chunksRef.current;
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    teardownAudioResources();

    if (!streamedTranscript && chunks.length === 0) {
      toast.error("Didn't catch that — try speaking a bit louder");
      setStage('idle');
      return;
    }

    if (chunks.length === 0) {
      setTranscript(streamedTranscript);
      setStage('review');
      return;
    }

    // Live captions already gave the user instant feedback — this one extra pass through
    // Chirp 3 (which sees the whole utterance at once, unlike the streaming pass) only delays
    // the moment they land in the editable review box, not the speaking experience itself.
    // Falls back to the streamed text if this pass fails.
    setStage('transcribing');
    void (async () => {
      const refined = await refineStreamedTranscript(chunks, mimeType);
      if (!openRef.current) return;
      const finalText = refined || streamedTranscript;
      if (!finalText) {
        toast.error("Didn't catch that — try speaking a bit louder");
        setStage('idle');
        return;
      }
      setTranscript(finalText);
      setStage('review');
    })();
  };

  const stopListening = () => {
    if (transcriptionModeRef.current === 'streaming') {
      stopStreamingSession();
      return;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        teardownAudioResources();
        void transcribeBlob(blob);
      };
      recorder.stop();
    } else {
      teardownAudioResources();
      setStage('idle');
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    setStage('transcribing');

    // Prefer Chirp via the relay even in fallback mode — "fallback" usually means the live
    // *stream* failed, not that the relay is unreachable. Only if Chirp also fails does the
    // older v1 edge function get the last word.
    const chirpTranscript = await refineStreamedTranscript([blob], blob.type || 'audio/webm');
    if (!openRef.current) return;
    if (chirpTranscript) {
      setTranscript(chirpTranscript);
      setStage('review');
      return;
    }

    try {
      const audioBase64 = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audioBase64, mimeType: blob.type, phraseHints, languageCode },
      });

      if (!openRef.current) return;

      if (error) {
        let message = 'Could not transcribe — check your connection and try again';
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx?.json) {
            const parsedBody = await ctx.json();
            if (parsedBody?.message) message = parsedBody.message;
          }
        } catch { /* keep generic message */ }
        toast.error(message);
        setStage('idle');
        return;
      }

      if (data?.error === 'no_speech_detected' || !data?.transcript) {
        toast.error(data?.message || "Didn't catch that — try speaking a bit louder");
        setStage('idle');
        return;
      }

      setTranscript(data.transcript);
      setStage('review');
    } catch {
      if (!openRef.current) return;
      toast.error('Something went wrong while transcribing — please try again');
      setStage('idle');
    }
  };

  const tryAgain = () => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    setLiveFinalTranscript('');
    updateTranscriptionMode(null);
    setStage('idle');
  };

  const extract = async () => {
    if (!transcript.trim()) return;
    setStage('extracting');
    try {
      const systemInstruction = `You extract a construction-project approval request from a spoken transcript.
Only fill a field if it is explicitly stated or unambiguously implied — never invent or guess.
Leave "title" null rather than inventing one if the transcript doesn't clearly state what the request is for.
For "costType": return 'none' only if the speaker explicitly says cost doesn't matter or there is no cost;
return null if cost is simply not mentioned at all (null means "didn't catch it", not "doesn't apply").
"category" must be one of exactly: ${CATEGORY_LABELS.join(', ')} — or null if unclear.
"projectName" is your best-guess reading of whatever project name was spoken, verbatim-ish — or null if none was mentioned.
"shareRoles" is a subset of ['contractor', 'consultant'] — only include a role if the speaker explicitly asked to share with them.
"description" should capture the substance of the request in a sentence or two, always filled from the transcript.
The transcript may be in English, Hindi, or a Hindi-English mix (Hinglish), and may contain speech-recognition
artifacts. Translate and normalize "title" and "description" into clear English for a UI. Preserve proper nouns
exactly as spoken — project names, company names, and person names — never translate or "correct" a proper noun
into a similar-sounding English phrase.
Cost amounts may use the Indian numbering system: "lakh" = 100,000 and "crore" = 10,000,000. Combine compound
phrases correctly, e.g. "2 lakh 40 thousand" = 240000, "1.5 crore" = 15000000, "50 thousand" = 50000. Always
return costAmount as a plain number (no lakh/crore in the numeric value).`;

      const prompt = `Transcript:\n"""${transcript}"""`;

      const result = await getModel({ responseSchema, systemInstruction }).generateContent(prompt);
      const parsed = parseAIJson<RawExtracted>(result.response.text());

      const category = resolveCategory(parsed.category);
      const projectId = resolveProject(parsed.projectName, projects);
      const costType = parsed.costType ?? null;
      const costAmount = typeof parsed.costAmount === 'number' ? parsed.costAmount : null;

      const flagged: string[] = [];
      if (!parsed.title) flagged.push('title');
      if (!category) flagged.push('category');
      if (!projectId) flagged.push('project');
      const costWasMentioned = /\b(rupee|rupees|inr|dollar|dollars|usd|rs\.?|₹|\$|cost|price|budget|amount|lakh|lakhs|crore|crores)\b/i.test(transcript);
      if (costWasMentioned && (costType === null || (costType !== 'none' && costAmount === null))) {
        flagged.push('cost');
      }

      setExtractedFields({
        title: parsed.title,
        category,
        projectId,
        description: parsed.description || transcript,
        costType,
        costAmount,
        shareRoles: (parsed.shareRoles || []).filter(r => r === 'contractor' || r === 'consultant'),
        flaggedFields: flagged,
      });
      setStage('review-final');
    } catch {
      toast.error('Could not parse that — using your transcript as the description instead');
      setExtractedFields({
        title: null,
        category: null,
        projectId: null,
        description: transcript,
        costType: null,
        costAmount: null,
        shareRoles: [],
        flaggedFields: ['title', 'category', 'project', 'cost'],
      });
      setStage('review-final');
    }
  };

  const missingSummary = useMemo(() => {
    if (!extractedFields) return '';
    const caught: string[] = [];
    const missing: string[] = [];
    const labels: Record<string, string> = { title: 'title', category: 'category', project: 'project', cost: 'cost' };
    (['title', 'category', 'project', 'cost'] as const).forEach(key => {
      if (extractedFields.flaggedFields.includes(key)) missing.push(labels[key]);
      else caught.push(labels[key]);
    });
    if (missing.length === 0) return 'Got everything — review the details before creating the request.';
    const caughtStr = caught.length ? `Got it — I caught ${caught.join(', ')}.` : "Couldn't catch much from that.";
    return `${caughtStr} Please fill in the ${missing.join(' and ')} yourself.`;
  }, [extractedFields]);

  const useThis = () => {
    if (!extractedFields) return;
    onExtracted({
      ...extractedFields,
      projectId: extractedFields.projectId ?? (defaultProjectId || null),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" /> Speak to create a request
          </DialogTitle>
          <DialogDescription>
            Describe the approval you need naturally — we'll transcribe it and pre-fill the form.
          </DialogDescription>
        </DialogHeader>

        {!supported && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-xl p-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Voice input needs microphone access — try a recent Chrome, Edge, Firefox, or Safari.
          </div>
        )}

        {supported && (stage === 'idle' || stage === 'listening') && (
          <div className="bg-muted/40 border border-border/60 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Mention as many of these as you can
            </p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              {[
                { label: 'Title', hint: 'what it\'s for' },
                { label: 'Category', hint: CATEGORY_LABELS.join(' / ') },
                { label: 'Project', hint: 'which project' },
                { label: 'Description', hint: 'context or specs' },
                { label: 'Cost', hint: 'fixed or approximate' },
                { label: 'Share with', hint: 'contractor / consultant' },
              ].map(({ label, hint }) => (
                <li key={label} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span><span className="font-medium text-foreground">{label}</span> — {hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AnimatePresence mode="wait">
        {supported && stage === 'listening' && (
          <motion.div
            key="listening"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4">
            <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
              <div className="relative w-3 h-3 shrink-0">
                <div className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-75" />
                <div className="absolute inset-0 bg-destructive rounded-full" />
              </div>
              <div className="flex items-center gap-[2px] h-6 flex-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-destructive/60"
                    animate={{ height: [4, Math.random() * 20 + 4, 4] }}
                    transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.05 }}
                  />
                ))}
              </div>
              <Mic className="w-4 h-4 text-destructive shrink-0" />
            </div>
            <div className="min-h-[60px] text-sm bg-background/40 border border-border/60 rounded-xl p-3">
              {liveFinalTranscript || interimTranscript ? (
                <span className="text-foreground">
                  {liveFinalTranscript}
                  {interimTranscript && (
                    <span className="text-muted-foreground">{liveFinalTranscript ? ' ' : ''}{interimTranscript}</span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {transcriptionMode === 'fallback' ? "Recording — we'll transcribe once you stop." : 'Listening…'}
                </span>
              )}
            </div>
            <p className="text-center text-[10px] text-muted-foreground/70">
              {transcriptionMode === 'fallback' ? 'Transcript appears once you stop.' : 'Live captions — speak naturally.'}
            </p>
            <div className="flex justify-end">
              <Button onClick={stopListening} size="sm" variant="outline" className="h-9 text-xs">
                <Square className="w-3.5 h-3.5" /> Stop
              </Button>
            </div>
          </motion.div>
        )}

        {supported && stage === 'transcribing' && (
          <motion.div
            key="transcribing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> Transcribing…
          </motion.div>
        )}

        {supported && stage === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <Textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              className="min-h-[100px] text-sm"
              placeholder="Your transcript will appear here…"
            />
            <div className="flex justify-end gap-2">
              <Button onClick={tryAgain} size="sm" variant="outline" className="h-9 text-xs">
                Try again
              </Button>
              <Button onClick={extract} disabled={!transcript.trim()} size="sm" className="gradient-primary text-primary-foreground h-9 text-xs">
                Sounds right → Continue
              </Button>
            </div>
          </motion.div>
        )}

        {supported && stage === 'extracting' && (
          <motion.div
            key="extracting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> Extracting details…
          </motion.div>
        )}

        {supported && stage === 'review-final' && extractedFields && (
          <motion.div
            key="review-final"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/15 rounded-xl p-3">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{missingSummary}</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 bg-background/40 border border-border/60 rounded-xl p-3">
              <p><span className="font-semibold text-foreground">Title:</span> {extractedFields.title || '—'}</p>
              <p><span className="font-semibold text-foreground">Category:</span> {extractedFields.category || '—'}</p>
              <p><span className="font-semibold text-foreground">Project:</span> {projects.find(p => p.id === extractedFields.projectId)?.name || '—'}</p>
              <p><span className="font-semibold text-foreground">Description:</span> {extractedFields.description}</p>
              <p><span className="font-semibold text-foreground">Cost:</span> {extractedFields.costType && extractedFields.costType !== 'none' ? `${extractedFields.costType}${extractedFields.costAmount ? ` — ${extractedFields.costAmount}` : ''}` : '—'}</p>
              {extractedFields.shareRoles.length > 0 && (
                <p><span className="font-semibold text-foreground">Shared with:</span> {extractedFields.shareRoles.join(', ')}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => { setExtractedFields(null); setStage('review'); }}
                size="sm"
                variant="outline"
                className="h-9 text-xs"
              >
                Back
              </Button>
              <Button onClick={useThis} size="sm" className="gradient-primary text-primary-foreground h-9 text-xs">
                Use this
              </Button>
            </div>
          </motion.div>
        )}

        {supported && stage === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <div className="flex items-center gap-1.5 bg-muted/60 border border-border/60 rounded-xl p-1">
              {LANGUAGE_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLanguageCode(opt.code)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    languageCode === opt.code
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button onClick={() => void startListening()} size="sm" className="gradient-primary text-primary-foreground h-9 text-xs">
              <Mic className="w-3.5 h-3.5" /> Start speaking
            </Button>
          </motion.div>
        )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

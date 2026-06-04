import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, X, Send, Loader2 } from 'lucide-react';

interface Props {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
}

export default function VoiceRecorder({ onSend, onCancel, isRecording, setIsRecording }: Props) {
  const [duration, setDuration] = useState(0);
  const [sending, setSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    }
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      onCancel();
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCancel = () => {
    mediaRecorderRef.current?.stop();
    stopStream();
    setIsRecording(false);
    onCancel();
  };

  const handleSend = () => {
    if (!mediaRecorderRef.current) return;
    setSending(true);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      stopStream();
      setIsRecording(false);
      onSend(blob, duration);
    };
    mediaRecorderRef.current.stop();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="flex items-center gap-3 w-full"
        >
          <button
            onClick={handleCancel}
            className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-2.5">
            <div className="relative w-3 h-3">
              <div className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-75" />
              <div className="absolute inset-0 bg-destructive rounded-full" />
            </div>

            {/* Waveform bars */}
            <div className="flex items-center gap-[2px] h-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-destructive/60"
                  animate={{
                    height: [4, Math.random() * 20 + 4, 4],
                  }}
                  transition={{
                    duration: 0.5 + Math.random() * 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>

            <span className="text-sm font-mono text-destructive font-medium ml-auto">
              {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            className="gradient-primary p-2.5 rounded-xl text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

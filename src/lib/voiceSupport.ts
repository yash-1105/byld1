export const RECORDER_MIME_TYPE = 'audio/webm;codecs=opus';

// Only the opus-in-webm type is returned deliberately — the speech-to-text edge
// function hardcodes `encoding: 'WEBM_OPUS'`, so widening this would need a
// matching change there too.
export function getSupportedAudioMimeType(): string | null {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') return null;
  return MediaRecorder.isTypeSupported(RECORDER_MIME_TYPE) ? RECORDER_MIME_TYPE : null;
}

export function isVoiceInputSupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
  return getSupportedAudioMimeType() !== null;
}

// Gates the live-streaming capture path (WebSocket relay). Falls back to the
// MediaRecorder + REST transcription path when unavailable or when the relay itself
// can't be reached.
export function isStreamingCaptureSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined';
}

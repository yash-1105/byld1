import speech from '@google-cloud/speech';
import { speechClientV2, RECOGNIZER } from './recognize.js';
import { MAX_SESSION_DURATION_MS, STOP_GRACE_MS, MAX_PHRASES, PHRASE_BOOST, CHIRP_MODEL } from './config.js';

const speechClient = new speech.v1.SpeechClient();

let sessionCounter = 0;

// Dual-stream design: Google's fast v1 model emits word-by-word interim results but
// transcribes Indian English poorly; Chirp 3 (v2) transcribes it near-perfectly but only
// emits finalized segments at natural pauses. So audio is fed to BOTH — v1's interims give
// the instant live tail, and only Chirp's accurate finals are committed to the transcript.
// The client protocol already separates interim from final, so it needs no changes.
export class TranscriptionSession {
  constructor(ws, { languageCode, phraseHints }) {
    this.ws = ws;
    this.languageCode = languageCode;
    this.phraseHints = Array.isArray(phraseHints) ? phraseHints.slice(0, MAX_PHRASES) : [];
    this.interimStream = null; // v1, latest_long — interims only
    this.finalStream = null; // v2, chirp_3 — finals only
    this.stopped = false;
    this.maxDurationTimer = null;
    this.id = ++sessionCounter;
    this.chunkCount = 0;
    this.byteCount = 0;
    this.interimEventCount = 0;
    this.finalEventCount = 0;
    console.log(`[s${this.id}] session start: lang=${languageCode} hints=${this.phraseHints.length}`);
  }

  send(payload) {
    if (this.ws.readyState === this.ws.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  startInterimStream() {
    const request = {
      config: {
        encoding: 'WEBM_OPUS',
        // The streaming API requires the rate declared explicitly for WEBM_OPUS
        // (unlike the REST endpoint). Opus in WebM always runs at 48kHz internally.
        sampleRateHertz: 48000,
        languageCode: this.languageCode,
        model: 'latest_long',
        enableAutomaticPunctuation: true,
        maxAlternatives: 1,
        ...(this.phraseHints.length > 0
          ? { speechContexts: [{ phrases: this.phraseHints, boost: PHRASE_BOOST }] }
          : {}),
      },
      interimResults: true,
      singleUtterance: false,
    };

    this.interimStream = speechClient
      .streamingRecognize(request)
      .on('error', (err) => {
        // Interim stream dying only degrades the live tail — Chirp finals and the
        // client's post-stop batch pass still deliver the real transcript.
        console.error(`[s${this.id}] interim (v1) stream error:`, err.message);
        this.interimStream = null;
      })
      .on('data', (data) => {
        const result = data.results?.[0];
        const transcript = result?.alternatives?.[0]?.transcript;
        if (transcript && !result.isFinal) {
          this.interimEventCount++;
          this.send({ type: 'transcript', transcript, isFinal: false });
        }
        // v1 finals are deliberately dropped — Chirp's finals are the committed text.
      });
  }

  startFinalStream() {
    // NOTE: the public `streamingRecognize()` on the v2 client is a v1-style helper that
    // re-wraps written messages (sending {recognizer, streamingConfig} through it yields
    // INVALID_ARGUMENT). The raw gapic bidi method `_streamingRecognize()` takes v2-shaped
    // messages verbatim: config message first, then {audio} messages.
    this.finalStream = speechClientV2
      ._streamingRecognize()
      .on('error', (err) => {
        console.error(`[s${this.id}] final (chirp) stream error:`, err.message);
        this.finalStream = null;
      })
      .on('data', (data) => {
        const result = data.results?.[0];
        const transcript = result?.alternatives?.[0]?.transcript;
        if (transcript && result.isFinal) {
          this.finalEventCount++;
          console.log(`[s${this.id}] chirp final #${this.finalEventCount}: len=${transcript.length}`);
          this.send({ type: 'transcript', transcript, isFinal: true });
        }
      });

    this.finalStream.write({
      recognizer: RECOGNIZER,
      streamingConfig: {
        config: {
          autoDecodingConfig: {},
          model: CHIRP_MODEL,
          languageCodes: [this.languageCode],
          features: { enableAutomaticPunctuation: true },
        },
        streamingFeatures: { interimResults: true },
      },
    });
  }

  start() {
    this.startInterimStream();
    this.startFinalStream();
    this.maxDurationTimer = setTimeout(() => this.stop('max_duration'), MAX_SESSION_DURATION_MS);
  }

  pushAudio(chunk) {
    if (this.stopped) return;
    this.chunkCount++;
    this.byteCount += chunk.length;
    if (this.chunkCount === 1) {
      console.log(`[s${this.id}] first chunk: ${chunk.length}B magic=${chunk.subarray(0, 4).toString('hex')} (EBML=1a45dfa3)`);
    } else if (this.chunkCount % 40 === 0) {
      console.log(`[s${this.id}] chunks=${this.chunkCount} bytes=${this.byteCount} interims=${this.interimEventCount} finals=${this.finalEventCount}`);
    }
    if (this.interimStream) {
      try {
        this.interimStream.write(chunk);
      } catch (err) {
        console.error(`[s${this.id}] interim write failed:`, err.message);
        this.interimStream = null;
      }
    }
    if (this.finalStream) {
      try {
        this.finalStream.write({ audio: chunk });
      } catch (err) {
        console.error(`[s${this.id}] final write failed:`, err.message);
        this.finalStream = null;
      }
    }
  }

  stop(reason) {
    if (this.stopped) return;
    this.stopped = true;
    console.log(`[s${this.id}] stop(${reason}): chunks=${this.chunkCount} bytes=${this.byteCount} interims=${this.interimEventCount} finals=${this.finalEventCount}`);
    if (this.maxDurationTimer) clearTimeout(this.maxDurationTimer);

    for (const stream of [this.interimStream, this.finalStream]) {
      if (stream) {
        try {
          stream.end();
        } catch {
          // already ended
        }
      }
    }

    setTimeout(() => {
      this.send({ type: 'closed', reason });
      try {
        this.ws.close(1000);
      } catch {
        // already closed
      }
    }, STOP_GRACE_MS);
  }
}

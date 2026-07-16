import speech from '@google-cloud/speech';
import { GCP_PROJECT_ID, CHIRP_LOCATION, CHIRP_MODEL } from './config.js';

// Chirp 3 is v2-API-only and only hosted in the us/eu multi-regions — the client for this
// call must be pinned to that regional endpoint (v1's default global endpoint doesn't serve it).
// Shared by both the batch /recognize route and the streaming session's accurate-finals stream.
export const speechClientV2 = new speech.v2.SpeechClient({
  apiEndpoint: `${CHIRP_LOCATION}-speech.googleapis.com`,
});

export const RECOGNIZER = `projects/${GCP_PROJECT_ID}/locations/${CHIRP_LOCATION}/recognizers/_`;

export async function recognizeWithChirp(audioBuffer, languageCode) {
  const [response] = await speechClientV2.recognize({
    recognizer: RECOGNIZER,
    config: {
      autoDecodingConfig: {},
      model: CHIRP_MODEL,
      languageCodes: [languageCode],
      features: { enableAutomaticPunctuation: true },
    },
    content: audioBuffer,
  });

  const transcript = (response.results ?? [])
    .map((r) => r.alternatives?.[0]?.transcript ?? '')
    .filter(Boolean)
    .join(' ')
    .trim();

  return transcript;
}

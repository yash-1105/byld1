import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PHRASE_BOOST = 15;
const MAX_PHRASES = 500;
const MIN_AUDIO_BYTES = 800; // near-silent stub recordings never carry real speech
const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // GCP synchronous recognize cap for inline audio

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioBase64, phraseHints, languageCode, encoding, sampleRateHertz } = await req.json();

    if (!audioBase64) {
      return jsonResponse({ error: 'audioBase64 is required' }, 400);
    }

    const base64Data = String(audioBase64).replace(/^data:audio\/[a-zA-Z0-9.+-]+;base64,/, '');
    const approxBytes = base64Data.length * 0.75;

    if (approxBytes < MIN_AUDIO_BYTES) {
      return jsonResponse({ error: 'no_audio', message: 'Recording was too short to transcribe' }, 422);
    }
    if (approxBytes > MAX_AUDIO_BYTES) {
      return jsonResponse({ error: 'audio_too_long', message: 'Recording is too long — try a shorter request' }, 413);
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'GOOGLE_CLOUD_API_KEY is not set in edge function secrets' }, 500);
    }

    const hints: string[] = Array.isArray(phraseHints) ? phraseHints.filter((p) => typeof p === 'string' && p.trim()) : [];

    // The client now picks an explicit language up front rather than relying on
    // alternativeLanguageCodes auto-detect — detection added a noticeable delay and
    // ambiguity, so a single declared language is both faster and more accurate.
    const resolvedLanguageCode = typeof languageCode === 'string' && languageCode ? languageCode : 'en-IN';

    // WEBM_OPUS (the MediaRecorder fallback path) carries its own rate in the container header,
    // so sampleRateHertz is omitted there. LINEAR16 (raw PCM, from the streaming relay's final
    // accuracy pass) is headerless and must declare its rate explicitly.
    const resolvedEncoding = encoding === 'LINEAR16' ? 'LINEAR16' : 'WEBM_OPUS';
    const config: Record<string, unknown> = {
      encoding: resolvedEncoding,
      languageCode: resolvedLanguageCode,
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      maxAlternatives: 1,
      ...(resolvedEncoding === 'LINEAR16'
        ? { sampleRateHertz: typeof sampleRateHertz === 'number' ? sampleRateHertz : 16000 }
        : {}),
    };
    if (hints.length > 0) {
      config.speechContexts = [{ phrases: hints.slice(0, MAX_PHRASES), boost: PHRASE_BOOST }];
    }

    const sttResponse = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, audio: { content: base64Data } }),
    });

    if (!sttResponse.ok) {
      const errorData = await sttResponse.text();
      console.error('Speech-to-Text API Error:', errorData);
      return jsonResponse({ error: 'stt_api_error', message: `Speech API responded with ${sttResponse.status}` }, 502);
    }

    const data = await sttResponse.json();
    const results = data.results ?? [];

    if (results.length === 0) {
      return jsonResponse({ transcript: '', error: 'no_speech_detected', message: "Didn't catch any speech in that recording" });
    }

    const transcript = results
      .map((r: { alternatives?: { transcript?: string }[] }) => r.alternatives?.[0]?.transcript ?? '')
      .filter(Boolean)
      .join(' ')
      .trim();

    const detectedLanguageCode = results[0]?.languageCode;

    return jsonResponse({ transcript, languageCode: detectedLanguageCode });
  } catch (error) {
    console.error('Error processing speech:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

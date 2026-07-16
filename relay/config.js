export const PORT = process.env.PORT || 8080;
export const MAX_SESSION_DURATION_MS = 60_000; // app-level safety cap; Google's own streaming cap is ~5 min
export const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'byld-drive-integration';
export const CHIRP_LOCATION = 'us'; // Chirp 3 is only hosted in the `us`/`eu` multi-regions
export const CHIRP_MODEL = 'chirp_3';
export const MAX_RECOGNIZE_AUDIO_BYTES = 10 * 1024 * 1024;
export const STOP_GRACE_MS = 800; // wait this long after stop before force-closing, for a trailing final result
export const CONNECT_ACK_TIMEOUT_MS = 5000; // client's first JSON message must arrive within this window
export const MAX_PHRASES = 500;
export const MAX_PHRASE_LENGTH = 100;
export const PHRASE_BOOST = 15;
export const ALLOWED_LANGUAGE_CODES = ['en-IN', 'hi-IN'];
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
export const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL || '';
export const SUPABASE_PROJECT_URL = (process.env.SUPABASE_PROJECT_URL || '').replace(/\/+$/, '');
export const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || null;

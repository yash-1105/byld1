import { createRemoteJWKSet, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';
import { SUPABASE_JWKS_URL, SUPABASE_PROJECT_URL, SUPABASE_JWT_SECRET } from './config.js';

const jwks = SUPABASE_JWKS_URL ? createRemoteJWKSet(new URL(SUPABASE_JWKS_URL)) : null;
const issuer = SUPABASE_PROJECT_URL ? `${SUPABASE_PROJECT_URL}/auth/v1` : undefined;

async function verifyWithJwks(token) {
  const { payload } = await jwtVerify(token, jwks, { issuer, audience: 'authenticated' });
  return payload;
}

function verifyWithSecret(token) {
  return jwt.verify(token, SUPABASE_JWT_SECRET, { algorithms: ['HS256'], audience: 'authenticated', issuer });
}

// Supabase projects on the newer asymmetric (ES256) signing keys can be verified against
// the public JWKS with no shared secret. Older projects still sign with a symmetric HS256
// secret, which never appears in JWKS — try JWKS first, fall back to the shared secret only
// if it's configured. See relay/README.md for how to tell which one this project uses.
export async function verifySupabaseToken(token) {
  if (!token || typeof token !== 'string') throw new Error('Missing token');

  if (jwks) {
    try {
      const payload = await verifyWithJwks(token);
      return { sub: payload.sub };
    } catch (err) {
      if (!SUPABASE_JWT_SECRET) throw err;
    }
  }

  if (SUPABASE_JWT_SECRET) {
    const payload = verifyWithSecret(token);
    return { sub: payload.sub };
  }

  throw new Error('No verification method available');
}

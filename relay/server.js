import http from 'node:http';
import { WebSocketServer } from 'ws';
import { verifySupabaseToken } from './auth.js';
import { TranscriptionSession } from './session.js';
import { recognizeWithChirp } from './recognize.js';
import {
  PORT,
  ALLOWED_LANGUAGE_CODES,
  ALLOWED_ORIGINS,
  MAX_PHRASES,
  MAX_PHRASE_LENGTH,
  CONNECT_ACK_TIMEOUT_MS,
  MAX_RECOGNIZE_AUDIO_BYTES,
} from './config.js';

function corsHeadersFor(req) {
  const origin = req.headers.origin;
  const allowed = ALLOWED_ORIGINS.length === 0 || (origin && ALLOWED_ORIGINS.includes(origin));
  return {
    'Access-Control-Allow-Origin': allowed && origin ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handleRecognize(req, res) {
  const headers = corsHeadersFor(req);
  try {
    const bodyBuffer = await readBody(req, MAX_RECOGNIZE_AUDIO_BYTES + 1024);
    const body = JSON.parse(bodyBuffer.toString('utf8'));
    const { audioBase64, languageCode } = body;

    if (!audioBase64) {
      res.writeHead(400, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'audioBase64 is required' }));
      return;
    }

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    try {
      await verifySupabaseToken(token);
    } catch (err) {
      console.error('Auth failed (recognize):', err.message);
      res.writeHead(401, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'auth_failed' }));
      return;
    }

    const resolvedLanguageCode = ALLOWED_LANGUAGE_CODES.includes(languageCode) ? languageCode : ALLOWED_LANGUAGE_CODES[0];
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const transcript = await recognizeWithChirp(audioBuffer, resolvedLanguageCode);
    res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ transcript }));
  } catch (err) {
    console.error('Recognize error:', err.message);
    res.writeHead(500, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Unknown error' }));
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (req.url === '/recognize' && req.method === 'OPTIONS') {
    res.writeHead(204, corsHeadersFor(req));
    res.end();
    return;
  }

  if (req.url === '/recognize' && req.method === 'POST') {
    void handleRecognize(req, res);
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/stream') {
    socket.destroy();
    return;
  }
  if (ALLOWED_ORIGINS.length > 0) {
    const origin = req.headers.origin;
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      socket.destroy();
      return;
    }
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

function sanitizePhraseHints(hints) {
  if (!Array.isArray(hints)) return [];
  return hints
    .filter((p) => typeof p === 'string' && p.trim())
    .map((p) => p.trim().slice(0, MAX_PHRASE_LENGTH))
    .slice(0, MAX_PHRASES);
}

wss.on('connection', (ws) => {
  let session = null;
  let started = false;

  const connectTimer = setTimeout(() => {
    if (!started) {
      ws.send(JSON.stringify({ type: 'error', code: 'connect_timeout', message: 'No start message received' }));
      ws.close(1008);
    }
  }, CONNECT_ACK_TIMEOUT_MS);

  ws.on('message', async (data, isBinary) => {
    if (!started) {
      if (isBinary) return; // ignore stray binary frames before handshake completes

      clearTimeout(connectTimer);
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', code: 'bad_request', message: 'Invalid JSON' }));
        ws.close(1008);
        return;
      }

      if (msg.type !== 'start') {
        ws.send(JSON.stringify({ type: 'error', code: 'bad_request', message: 'Expected start message' }));
        ws.close(1008);
        return;
      }

      const languageCode = ALLOWED_LANGUAGE_CODES.includes(msg.languageCode) ? msg.languageCode : ALLOWED_LANGUAGE_CODES[0];

      try {
        await verifySupabaseToken(msg.token);
      } catch (err) {
        console.error('Auth failed:', err.message);
        ws.send(JSON.stringify({ type: 'error', code: 'auth_failed', message: 'Authentication failed' }));
        ws.close(1008);
        return;
      }

      started = true;
      session = new TranscriptionSession(ws, { languageCode, phraseHints: sanitizePhraseHints(msg.phraseHints) });
      session.start();
      ws.send(JSON.stringify({ type: 'ready' }));
      return;
    }

    if (isBinary) {
      session?.pushAudio(data);
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'stop') session?.stop('client_stop');
    } catch {
      // ignore malformed control messages once a session is running
    }
  });

  ws.on('close', () => {
    clearTimeout(connectTimer);
    session?.stop('ws_closed');
  });

  ws.on('error', () => {
    session?.stop('ws_closed');
  });
});

server.listen(PORT, () => {
  console.log(`Speech relay listening on ${PORT}`);
});

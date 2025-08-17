import express from 'express';
import cors from 'cors';

// Ensure Admin SDK is initialized before anything touches Firestore/Auth
import './firebase-init.js';

import requestsRoute from './routes/requests.js';
import messagesRoute from './routes/messages.js';
import { verifyAuth } from './auth.js';

const app = express();

/** ---- CORS (deterministic, supports FRONTALLOWED and Authorization header) ---- */
const rawAllowed = process.env.FRONTALLOWED || '';
const allowedList = rawAllowed
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true; // same-origin / curl
  for (const pat of allowedList) {
    if (pat === '*') return true;
    if (pat.startsWith('*.')) {
      const suffix = pat.slice(1); // ".vercel.app"
      if (origin.endsWith(suffix)) return true;
    }
    if (origin === pat) return true;
  }
  return false;
}

const corsOptions = {
  origin(origin, cb) {
    cb(null, isOriginAllowed(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/** ---- Body parsing ---- */
app.use(express.json());

/** ---- Lightweight request log for debugging token issues ---- */
app.use((req, _res, next) => {
  const hasBearer = /^Bearer\s+.+/i.test(req.get('authorization') || '');
  console.log({
    tag: 'req',
    method: req.method,
    path: req.originalUrl,
    hasBearer,
    origin: req.headers.origin,
  });
  next();
});

/** ---- Auth (non-blocking) ---- */
app.use(verifyAuth);

/** ---- Health ---- */
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

/** ---- API routes ---- */
app.use('/api/requests', requestsRoute);
app.use('/api/messages', messagesRoute);

/** ---- 404 ---- */
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

/** ---- Error normalizer (map Firestore 16 -> 401) ---- */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err?.code, err?.message || err);
  const msg = String(err?.message || '');
  if (err?.code === 16 || /UNAUTHENTICATED/i.test(msg)) {
    return res.status(401).json({ error: 'UNAUTHENTICATED' });
  }
  return res.status(500).json({ error: 'INTERNAL', details: msg.slice(0, 200) });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
});

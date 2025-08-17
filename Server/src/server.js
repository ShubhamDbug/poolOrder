// Server/src/server.js
import express from 'express';
import cors from 'cors';
import './firebase-init.js';
import requestsRoute from './routes/requests.js';
import messagesRoute from './routes/messages.js';
// import { verifyAuth } from './auth.js';

const app = express();

// --- Build allowlist from env, with a safe fallback if empty ---
function parseAllowed(val) {
  return (val || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}
const ENV_ALLOWED = parseAllowed(process.env.FRONTEND_ORIGIN);

// ✅ Fallback if env var not set
const FALLBACK_ALLOWED = [
  'https://poolorder.onrender.com',
  'http://localhost:5173',
  '*.vercel.app', // optional wildcard host match
];

const ALLOWED = ENV_ALLOWED.length ? ENV_ALLOWED : FALLBACK_ALLOWED;

function isAllowedOrigin(origin) {
  if (!origin) return true; // allow curl/postman
  let u;
  try { u = new URL(origin); } catch { return false; }
  const host = u.hostname;
  return ALLOWED.some(rule => {
    if (rule.startsWith('http')) return origin === rule;     // exact full URL
    if (rule.startsWith('*.')) return host.endsWith(rule.slice(1)); // wildcard host
    return host === rule;                                    // exact host
  });
}

// Sanitize Access-Control-Request-Headers to avoid ERR_INVALID_CHAR
function sanitizeRequestHeaders(req) {
  const raw = req.headers['access-control-request-headers'];
  if (!raw) return ['Authorization', 'Content-Type'];
  return raw
    .split(',')
    .map(h => h.trim())
    .filter(h => /^[A-Za-z0-9-]+$/.test(h) && h.length);
}

const corsOptions = {
  origin(origin, cb) { cb(null, isAllowedOrigin(origin)); },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: (req, cb) => cb(null, sanitizeRequestHeaders(req)),
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// If you have auth middleware, never gate OPTIONS
// app.use((req, _res, next) => req.method === 'OPTIONS' ? next() : next());
// app.use(verifyAuth);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/requests', requestsRoute);
app.use('/api/messages', messagesRoute);

app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Allowed CORS origins:', ALLOWED);
  console.log(`Server ready on http://localhost:${PORT}`);
});

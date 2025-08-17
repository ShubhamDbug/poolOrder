// Server/src/server.js
import express from 'express';
import cors from 'cors';
import './firebase-init.js';
import requestsRoute from './routes/requests.js';
import messagesRoute from './routes/messages.js';
import { verifyAuth } from './auth.js';

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
  'http://127.0.0.1:5173',
  'http://localhost:3000',
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
  origin(origin, cb) {
    const allowed = isAllowedOrigin(origin);
    if (allowed) return cb(null, true);
    // return explicit error so the cors middleware doesn't silently fail
    return cb(new Error('CORS origin denied: ' + String(origin)));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  // keep headers minimal and explicit; allow Authorization for bearer tokens
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Ensure caches/proxies vary by Origin so responses differ per allowed origin
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

// Lightweight explicit preflight responder (works even if other middleware errors)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(corsOptions.optionsSuccessStatus || 204);
  }
  next();
});

// If you have auth middleware, never gate OPTIONS
// app.use((req, _res, next) => req.method === 'OPTIONS' ? next() : next());
// app.use(verifyAuth);
// Ensure OPTIONS bypasses auth and attach auth for other requests
app.use((req, _res, next) => (req.method === 'OPTIONS' ? next() : next()));
app.use(verifyAuth);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/requests', requestsRoute);
app.use('/api/messages', messagesRoute);

app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Allowed CORS origins:', ALLOWED);
  console.log(`Server ready on http://localhost:${PORT}`);
});

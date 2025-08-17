// Server/src/server.js
import express from 'express';
import cors from 'cors';
import './firebase-init.js';
import requestsRoute from './routes/requests.js';
import messagesRoute from './routes/messages.js';
// import { verifyAuth } from './auth.js'; // if you use it, see note below

const app = express();

const ALLOWED_ORIGINS = [
  'https://poolorder.onrender.com',
  'https://poolorder.vercel.app',
  'http://localhost:5173', // dev
];

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/postman
    cb(null, ALLOWED_ORIGINS.includes(origin));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  // Mirror requested headers to avoid preflight rejections
  allowedHeaders: (req, cb) =>
    cb(null, req.header('access-control-request-headers') || 'Authorization,Content-Type'),
  optionsSuccessStatus: 204,
}));

app.options('*', cors()); // make sure preflight gets the CORS headers

app.use(express.json());

// If you use verifyAuth, keep it AFTER CORS and let OPTIONS pass through:
/// app.use((req, _res, next) => req.method === 'OPTIONS' ? next() : next());
/// app.use(verifyAuth);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/requests', requestsRoute);
app.use('/api/messages', messagesRoute);

app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

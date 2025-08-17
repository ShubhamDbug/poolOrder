// Server/src/server.js
import express from 'express';
import cors from 'cors';

// Ensure Firebase Admin is initialized before auth middleware
import './firebase-init.js';

import requestsRoute from './routes/requests.js';
import messagesRoute from './routes/messages.js';
import { verifyAuth } from './auth.js';

const app = express();

// CORS: allow the deployed frontend to send Authorization header
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://*';
const corsOptions = {
  origin: (origin, callback) => {
    // Allow no origin (e.g., curl/postman) and the configured one(s)
    if (!origin) return callback(null, true);
    // If env provides multiple, split by comma
    const allowed = FRONTEND_ORIGIN.split(',').map(s => s.trim());
    if (allowed.some(a => a === '*' || origin === a || (a.endsWith('.vercel.app') && origin.endsWith(a)))) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Authorization','Content-Type'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Attach req.user = { uid, displayName } to every request (non-blocking)
app.use(verifyAuth);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// API routes
app.use('/api/requests', requestsRoute);
app.use('/api/messages', messagesRoute);

// 404
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
});

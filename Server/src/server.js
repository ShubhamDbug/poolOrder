// Server/src/server.js
import express from 'express';
import cors from 'cors';

// Ensure Firebase Admin is initialized before auth middleware
import './firebase-init.js';

import requestsRoute from './routes/requests.js';
import messagesRoute from './routes/messages.js';
import { verifyAuth } from './auth.js';

const app = express();

// Permissive CORS for dev; tighten as needed
app.use(cors());
app.use(express.json());

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

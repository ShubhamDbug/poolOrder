import express from 'express';
import cors from 'cors';
import requestsRoute from './routes/requests.js';
import messagesRoute from './routes/messages.js';

const app = express();

// Very permissive for simplicity (frontend should just work)
app.use(cors());
app.use(express.json());

// Super-light "auth stub": if a Bearer token exists, fabricate a uid from it.
// This keeps your existing frontend flows happy without real verification.
app.use((req, _res, next) => {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    const raw = auth.slice(7);
    const uid = 'uid_' + (raw.slice(-8) || 'anon');
    req.user = { uid, displayName: 'User' };
  } else {
    req.user = { uid: 'anon', displayName: 'User' };
  }
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Route mounts
app.use('/api/requests', requestsRoute);
app.use('/api/messages', messagesRoute);

// Fallback 404
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
});

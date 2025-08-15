import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import requests from './routes/requests.js';
import messages from './routes/messages.js';
import { startCleanupJob } from './jobs/cleanup.js';

const app = express();

// Comma-separated origins in env: https://app.example.com,https://staging.example.com
const origins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.length ? origins : false, // false => block all if not configured
    credentials: true
  })
);

app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api/requests', requests);
app.use('/api/messages', messages);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  startCleanupJob();
});

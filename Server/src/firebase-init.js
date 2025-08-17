import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function loadServiceAccount() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const candidates = [
    '/etc/secrets/serviceAccountKey.json',                 // Render Secret File (always)
    path.resolve(__dirname, '../serviceAccountKey.json'),  // Local dev (your current layout)
    path.resolve(__dirname, '../../serviceAccountKey.json')// If Render mounts at repo root
  ];
  for (const p of candidates) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
  }
  throw new Error('serviceAccountKey.json not found');
}

const sa = loadServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: sa.project_id,
  });
}

export const db = admin.firestore();
export const Timestamp = admin.firestore.Timestamp;

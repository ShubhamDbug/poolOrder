// Server/src/firebase-init.js
import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function tryReadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try Render secret path first, then local dev fallbacks
const candidatePaths = [
  '/etc/secrets/serviceAccountKey.json',                 // Render Secret File
  path.resolve(__dirname, '../serviceAccountKey.json'),  // Local dev (Server/serviceAccountKey.json)
  path.resolve(__dirname, '../../serviceAccountKey.json')// Repo root (some hosts mount here)
];

let serviceAccount = null;
for (const p of candidatePaths) {
  serviceAccount = tryReadJSON(p);
  if (serviceAccount) {
    // Optional: uncomment for debugging (prints path only, not secrets)
    // console.log('[firebase-init] Loaded service account from:', p);
    break;
  }
}

if (!serviceAccount) {
  throw new Error('serviceAccountKey.json not found in any known location');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export const db = admin.firestore();
export const Timestamp = admin.firestore.Timestamp;

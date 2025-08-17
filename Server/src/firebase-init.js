// Server/src/firebase-init.js
import fs from 'node:fs';
import admin from 'firebase-admin';

function loadServiceAccount() {
  // A) Plain JSON in env var
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  // B) Base64-encoded JSON in env var
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  // C) File path to JSON (e.g., Render Secret File)
  const pathEnv = process.env.SERVICE_ACCOUNT_PATH;

  // Common default for Render Secret File name
  const defaultPaths = [
    pathEnv,
    '/etc/secrets/serviceAccountKey.json',
    './serviceAccountKey.json',
  ].filter(Boolean);

  let json = null;

  if (raw && raw.trim().startsWith('{')) {
    json = raw.trim();
  } else if (b64) {
    try { json = Buffer.from(b64, 'base64').toString('utf8'); } catch {}
  } else {
    for (const p of defaultPaths) {
      try {
        if (p && fs.existsSync(p)) {
          json = fs.readFileSync(p, 'utf8');
          break;
        }
      } catch { /* ignore */ }
    }
  }

  if (!json) return null;

  const obj = JSON.parse(json);
  if (typeof obj.private_key === 'string' && obj.private_key.includes('\\n')) {
    obj.private_key = obj.private_key.replace(/\\n/g, '\n');
  }
  return obj;
}

if (!admin.apps.length) {
  const sa = loadServiceAccount();
  if (!sa) {
    throw new Error(
      'Missing Firebase Admin service account. ' +
      'Set FIREBASE_SERVICE_ACCOUNT (JSON), FIREBASE_SERVICE_ACCOUNT_BASE64, or SERVICE_ACCOUNT_PATH.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: sa.project_id, // keeps token audience/issuer checks aligned
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('[firebase-admin] initialized for project:', sa.project_id);
  }
}

export default admin;
export const db = admin.firestore();
export const fbAuth = admin.auth();

// Robust Admin SDK init that works locally and in production platforms.
import admin from 'firebase-admin';

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing');
  }

  // If it looks like JSON, use it. Otherwise try base64 decode -> JSON.
  let jsonStr = raw.trim();
  if (!jsonStr.startsWith('{')) {
    try {
      jsonStr = Buffer.from(jsonStr, 'base64').toString('utf8').trim();
    } catch {
      /* ignore; will fail on JSON.parse below */
    }
  }

  const svc = JSON.parse(jsonStr);

  // Handle platforms that store literal "\n" sequences.
  if (typeof svc.private_key === 'string') {
    svc.private_key = svc.private_key.replace(/\\n/g, '\n');
  }

  return svc;
}

if (!admin.apps.length) {
  const svc = loadServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(svc),
    projectId: svc.project_id, // ensure project is explicit in prod
  });
}

export const db = admin.firestore();
export const Timestamp = admin.firestore.Timestamp;
export const auth = admin.auth();

// Server/src/firebase-init.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

function loadServiceAccountRaw() {
  // 1) Full JSON string from env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // 2) Path provided via env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
    const p = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    } catch (e) {
      console.warn('Failed to read FIREBASE_SERVICE_ACCOUNT_KEY_PATH:', e && e.message);
    }
  }

  // 2b) Common Google env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const p2 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    try {
      if (fs.existsSync(p2)) return fs.readFileSync(p2, 'utf8');
    } catch (e) {
      console.warn('Failed to read GOOGLE_APPLICATION_CREDENTIALS path:', e && e.message);
    }
  }

  // 3) Local fallback file inside the repo (Server/FIREBASE_SERVICE_ACCOUNT_KEY.json)
  try {
    const fallback = path.resolve(process.cwd(), 'Server', 'FIREBASE_SERVICE_ACCOUNT_KEY.json');
    if (fs.existsSync(fallback)) return fs.readFileSync(fallback, 'utf8');
  } catch (e) {
    // ignore
  }

  return null;
}

function initializeFirebase() {
  const serviceAccountKeyString = loadServiceAccountRaw();

  if (!serviceAccountKeyString) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set!');
      process.exit(1);
    }
    // In development, allow running without Firebase credentials (useful for CORS/local testing)
    console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY not set; skipping initialization in non-production mode.');
    return;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKeyString);

    if (typeof serviceAccount.private_key === 'string') {
      // Convert escaped newlines and normalize CRLF -> LF
      if (serviceAccount.private_key.includes('\\n')) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      serviceAccount.private_key = serviceAccount.private_key.replace(/\r\n/g, '\n').trim();
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log('[firebase-admin] initialized for project:', serviceAccount.project_id);
      }
    }

  // Firebase Admin SDK initialized
  } catch (e) {
    console.error('Failed to parse the service account key JSON:', e && e.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
    // In dev, continue without admin but warn.
    console.warn('[firebase-admin] continuing without initialization in development.');
  }
}

// Call the initialization function when the module is imported
initializeFirebase();

// Only create firestore/auth handles if firebase-admin initialized an app
let db = null;
let fbAuth = null;

try {
  if (admin.apps && admin.apps.length) {
    db = admin.firestore();
    fbAuth = admin.auth();
  }
} catch (e) {
  console.warn('[firebase-admin] firestore/auth not available:', e && e.message);
}

export default admin;
export { db, fbAuth };
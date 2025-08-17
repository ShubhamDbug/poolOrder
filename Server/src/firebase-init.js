// Server/src/firebase-init.js
import fs from 'node:fs';
import admin from 'firebase-admin';

function loadServiceAccount() {
  // A. Whole JSON in an env var
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  // B. Base64 of the JSON
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  // C. File path (e.g., Render "Secret File" path)
  const filePath = process.env.SERVICE_ACCOUNT_PATH;

  let json = null;

  if (raw && raw.trim().startsWith('{')) {
    json = raw.trim();
  } else if (b64) {
    try { json = Buffer.from(b64, 'base64').toString('utf8'); } catch {}
  } else if (filePath && fs.existsSync(filePath)) {
    json = fs.readFileSync(filePath, 'utf8');
  }
  if (!json) return null;

  const obj = JSON.parse(json);
    console.log("OBJ  FOR INIT :: " , obj) ;

  if (typeof obj.private_key === 'string' && obj.private_key.includes('\\n')) {
    obj.private_key = obj.private_key.replace(/\\n/g, '\n');
  }
  return obj;
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      'Missing Firebase Admin service account. ' +
      'Set FIREBASE_SERVICE_ACCOUNT (JSON), FIREBASE_SERVICE_ACCOUNT_BASE64, or SERVICE_ACCOUNT_PATH.'
    );
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id, // keep issuer/audience checks aligned
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('[firebase-admin] initialized for project:', serviceAccount.project_id);
  }
}

export default admin;
export const db = admin.firestore();
export const fbAuth = admin.auth();

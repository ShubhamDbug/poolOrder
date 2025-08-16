// Server/src/firebase-init.js
import admin from 'firebase-admin';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Keep the file at: Server/serviceAccountKey.json (one level up from /src)
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export const db = admin.firestore();
export const Timestamp = admin.firestore.Timestamp;

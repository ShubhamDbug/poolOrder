// src/config/firebase.js
import 'dotenv/config';
import admin from 'firebase-admin';

function getServiceAccount() {
  // Option A: base64-encoded JSON in FIREBASE_SERVICE_ACCOUNT_B64
  // Option B: raw JSON in FIREBASE_SERVICE_ACCOUNT_JSON
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_B64
    ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
    : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      'Missing service account. Set FIREBASE_SERVICE_ACCOUNT_B64 or FIREBASE_SERVICE_ACCOUNT_JSON.'
    );
  }

  // Some shells edit files adding quotes; strip them.
  raw = raw.trim().replace(/^['"]|['"]$/g, '');

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Service account JSON is invalid: ' + err.message);
  }
}

const serviceAccount = getServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
export const auth = admin.auth();

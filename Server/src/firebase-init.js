// Server/src/firebase-init.js
import admin from 'firebase-admin';

function initializeFirebase() {
  const serviceAccountKeyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKeyString) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set!');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKeyString);

    if (typeof serviceAccount.private_key === 'string' && serviceAccount.private_key.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
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

    console.log('Firebase Admin SDK initialized successfully.');

  } catch (e) {
    console.error('Failed to parse the service account key JSON:', e);
    process.exit(1);
  }
}

// Call the initialization function when the module is imported
initializeFirebase();

export default admin;
export const db = admin.firestore();
export const fbAuth = admin.auth();
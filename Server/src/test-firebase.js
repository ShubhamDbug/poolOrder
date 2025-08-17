import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

async function main() {
  try {
    const p = path.resolve(process.cwd(), 'Server', 'FIREBASE_SERVICE_ACCOUNT_KEY.json');
    if (!fs.existsSync(p)) {
      console.error('No local service account file at', p);
      process.exit(1);
    }
    const raw = fs.readFileSync(p, 'utf8');
    const key = JSON.parse(raw);
    if (typeof key.private_key === 'string' && key.private_key.includes('\\n')) {
      key.private_key = key.private_key.replace(/\\n/g, '\n');
    }
    console.log('Initializing admin for project', key.project_id);
    admin.initializeApp({ credential: admin.credential.cert(key), projectId: key.project_id });
    const db = admin.firestore();
    console.log('Calling Firestore to list collections...');
    const cols = await db.listCollections();
    console.log('Collections count:', cols.length);
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e && e.message);
    if (e && e.stack) console.error(e.stack);
    process.exit(1);
  }
}

main();

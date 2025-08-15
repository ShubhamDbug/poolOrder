import cron from 'node-cron';
import { db, Timestamp } from '../config/firebase.js';

// Every 5 minutes: delete expired requests (server-side enforcement)
export function startCleanupJob() {
  cron.schedule('*/5 * * * *', async () => {
    const now = Timestamp.now();
    try {
      const snap = await db.collection('requests').where('deleteAt', '<=', now).get();
      if (snap.empty) return;
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log(`cleanup: deleted ${snap.size} expired requests`);
    } catch (err) {
      console.error('cleanup job failed:', err && err.message ? err.message : err);
    }
    // (Optional) also delete subcollections via background trigger in Cloud Functions;
    // Firestore batch doesn't cascade. For demo simplicity we leave them.
  });
}

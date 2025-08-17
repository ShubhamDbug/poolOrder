import fs from 'fs';
import path from 'path';
import {JWT} from 'google-auth-library';

async function main() {
  try {
    const p = path.resolve(process.cwd(), 'Server', 'FIREBASE_SERVICE_ACCOUNT_KEY.json');
    if (!fs.existsSync(p)) {
      console.error('No local service account file at', p);
      process.exit(1);
    }
    const raw = fs.readFileSync(p, 'utf8');
    const key = JSON.parse(raw);
    console.log('Service account email:', key.client_email);
    const client = new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform']
    });
    const token = await client.authorize();
    console.log('Authorized token info:', Object.keys(token));
    console.log('access_token present:', typeof token.access_token === 'string');
    process.exit(0);
  } catch (e) {
    console.error('Token fetch failed:', e && e.message);
    if (e && e.stack) console.error(e.stack);
    process.exit(1);
  }
}

main();
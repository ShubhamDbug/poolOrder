// firebase-init.js

const admin = require('firebase-admin');

// Replace this with the path to your downloaded service account key file
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://YOUR_PROJECT_ID.firebaseio.com', // Replace with your project's database URL
});

// Export the initialized SDK
module.exports = admin;
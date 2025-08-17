import fs from 'fs';

// Read the original service account file
const serviceAccount = JSON.parse(fs.readFileSync('./FIREBASE_SERVICE_ACCOUNT_KEY.json', 'utf8'));

// Ensure private_key is properly escaped
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key
        .replace(/\r\n/g, '\n')  // Normalize line endings
        .replace(/\n/g, '\\n');   // Escape newlines
}

// Convert to single line JSON without whitespace
const formattedJson = JSON.stringify(serviceAccount);

// Output the formatted string
console.log('\nFormatted credential string for Render:\n');
console.log('FIREBASE_SERVICE_ACCOUNT_KEY=' + formattedJson);

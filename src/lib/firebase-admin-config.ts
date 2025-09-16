import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for the server side
if (!admin.apps.length) {
  try {
    // Ensure environment variables are loaded for server-side
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("FIREBASE_PRIVATE_KEY is not set.");
    }
      
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const adminDb = admin.firestore();

export { adminDb };

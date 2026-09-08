import admin from 'firebase-admin';
try {
  admin.initializeApp();
  console.log("Firebase Admin initialized");
} catch (e) {
  console.log("Error initializing:", e.message);
}

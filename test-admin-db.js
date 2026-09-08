import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();
admin.initializeApp();
const db = admin.firestore();
async function test() {
  const snapshot = await db.collection('products').limit(1).get();
  console.log(snapshot.docs.map(d => d.id));
}
test().catch(e => console.error(e.message));

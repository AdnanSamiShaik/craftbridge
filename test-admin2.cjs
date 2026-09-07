const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const config = require('./firebase-applet-config.json');
const app = initializeApp({ projectId: config.projectId });
console.log('Admin initialized');
getAuth(app).createCustomToken('test-uid').then(token => console.log('Token:', token)).catch(e => console.error(e));

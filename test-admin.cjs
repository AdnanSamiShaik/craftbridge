const admin = require('firebase-admin');
const config = require('./firebase-applet-config.json');
admin.initializeApp({ projectId: config.projectId });
console.log('Admin initialized');
admin.auth().createCustomToken('test-uid').then(token => console.log('Token:', token)).catch(e => console.error(e));

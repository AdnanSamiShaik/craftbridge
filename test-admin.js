const admin = require('firebase-admin');
admin.initializeApp({ projectId: require('./firebase-applet-config.json').projectId });
console.log('Admin initialized');

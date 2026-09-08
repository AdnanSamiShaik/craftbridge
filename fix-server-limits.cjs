const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace all express.json() with express.json({ limit: '50mb' })
code = code.replace(/express\.json\(\)/g, "express.json({ limit: '50mb' })");

fs.writeFileSync('server.ts', code);

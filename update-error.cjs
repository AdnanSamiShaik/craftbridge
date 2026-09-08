const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
  'res.status(500).json({ error: "Failed to process chat" });',
  'res.status(500).json({ error: "Failed to process chat", details: error.message || String(error) });'
);
fs.writeFileSync('server.ts', code);

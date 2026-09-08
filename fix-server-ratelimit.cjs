const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  'res.status(500).json({ error: "Failed to process chat", details: error.message || String(error) });',
  `if (error.message && error.message.includes('429')) {
      res.json({
        interactionId: prevId,
        message: "I am currently receiving too many requests. Please try again in a minute.",
        action: null,
        products: []
      });
    } else {
      res.status(500).json({ error: "Failed to process chat", details: error.message || String(error) });
    }`
);
fs.writeFileSync('server.ts', code);

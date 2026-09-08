const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  "if (error.message && error.message.includes('429')) {",
  "if (String(error).includes('429') || (error.message && String(error.message).includes('429'))) {"
);
fs.writeFileSync('server.ts', code);

const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
  '- product_name: string', 
  '- product_name_en: string\\n              - product_name_hi: string'
);
fs.writeFileSync('server.ts', code);

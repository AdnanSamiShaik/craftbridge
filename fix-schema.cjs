const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
  'properties: {\n        productId: { type: "string" as any }\n      },\n      required: ["productIds"]',
  'properties: {\n        productId: { type: "string" as any }\n      },\n      required: ["productId"]'
);
fs.writeFileSync('server.ts', code);

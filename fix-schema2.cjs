const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
  'properties: {\n        productIds: { type: "array" as any, items: { type: "string" as any } },\n        quantity: { type: "number" as any },\n        budget: { type: "number" as any },\n        location: { type: "string" as any },\n        message: { type: "string" as any }\n      },\n      required: ["productId"]',
  'properties: {\n        productIds: { type: "array" as any, items: { type: "string" as any } },\n        quantity: { type: "number" as any },\n        budget: { type: "number" as any },\n        location: { type: "string" as any },\n        message: { type: "string" as any }\n      },\n      required: ["productIds"]'
);
fs.writeFileSync('server.ts', code);

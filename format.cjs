const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf-8');
let depth = 0;
const lines = code.split('\n');
for (let i = 227; i < 326; i++) {
  const line = lines[i];
  const opens = (line.match(/\{/g) || []).length;
  const closes = (line.match(/\}/g) || []).length;
  depth += opens - closes;
  console.log(`[${i+1}] [Depth: ${depth}] ${line}`);
}

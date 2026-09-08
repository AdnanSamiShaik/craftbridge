const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');
code = code.replace(
  'const data = await res.json();\n      \n      setInteractionId(data.interactionId);',
  `const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to process chat");
      }
      
      setInteractionId(data.interactionId);`
);
fs.writeFileSync('src/components/CustomerMarketplace.tsx', code);

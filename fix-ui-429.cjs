const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');

code = code.replace(
  'setChatHistory(prev => [...prev, { role: "assistant", message: "Sorry, I encountered an error connecting to the server." }]);',
  `if (String(e).includes('429') || String(e).toLowerCase().includes('quota')) {
        setChatHistory(prev => [...prev, { role: "assistant", message: "I am receiving too many requests. Please wait a moment before trying again." }]);
      } else {
        setChatHistory(prev => [...prev, { role: "assistant", message: "Sorry, I encountered an error connecting to the server." }]);
      }`
);

fs.writeFileSync('src/components/CustomerMarketplace.tsx', code);

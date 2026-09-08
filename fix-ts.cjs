const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');
serverCode = serverCode.replace(/type: "function"/g, 'type: "function" as any');
serverCode = serverCode.replace(/type: "object"/g, 'type: "object" as any');
serverCode = serverCode.replace(/type: "string"/g, 'type: "string" as any');
serverCode = serverCode.replace(/type: "number"/g, 'type: "number" as any');
fs.writeFileSync('server.ts', serverCode);

let cmCode = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');
cmCode = cmCode.replace(/const handleSendChat = async \(\) => \{[\s\S]*?\}\n      \}\n    \}\);\n  \};\n/g, ''); // Try to remove original handleSendChat again
cmCode = cmCode.replace(/const confirmEnquiry = async \(\) => \{[\s\S]*?setChatMessage\(""\);\n      \} catch \(e\) \{\n        console\.error\(e\);\n      \}\n    \}\);\n  \};\n/g, ''); // Remove confirmEnquiry
fs.writeFileSync('src/components/CustomerMarketplace.tsx', cmCode);

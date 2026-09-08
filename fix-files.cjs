const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');
// Fix extra } at line 300
serverCode = serverCode.replace('        }\n        }\n           \n        // Feed tool result', '        }\n           \n        // Feed tool result');
fs.writeFileSync('server.ts', serverCode);

let cmCode = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');
// Fix extra catch block
cmCode = cmCode.replace(`      } catch (e) {
            console.error("Firestore error", e);
          }
        });
      }`, '');
      
cmCode = cmCode.replace(`    ;

  ;`, '');

fs.writeFileSync('src/components/CustomerMarketplace.tsx', cmCode);

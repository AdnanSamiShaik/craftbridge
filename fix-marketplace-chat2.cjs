const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');

// The original one is likely at 149, wait, line 97 was my new one, line 149 is the old one.
// Let's strip out the old handleSendChat and confirmEnquiry.

// Strip confirmEnquiry
const confirmEnquiryStart = code.indexOf('const confirmEnquiry = async () => {');
if (confirmEnquiryStart !== -1) {
  let end = code.indexOf('};', confirmEnquiryStart);
  // It has inner blocks, so let's find the matching brace.
  let braces = 0;
  for (let i = confirmEnquiryStart; i < code.length; i++) {
    if (code[i] === '{') braces++;
    if (code[i] === '}') {
      braces--;
      if (braces === 0) {
        code = code.substring(0, confirmEnquiryStart) + code.substring(i + 1);
        break;
      }
    }
  }
}

// Ensure there is only ONE handleSendChat.
const firstSendChat = code.indexOf('const handleSendChat = async () => {');
if (firstSendChat !== -1) {
  const secondSendChat = code.indexOf('const handleSendChat = async () => {', firstSendChat + 1);
  if (secondSendChat !== -1) {
    let braces = 0;
    for (let i = secondSendChat; i < code.length; i++) {
      if (code[i] === '{') braces++;
      if (code[i] === '}') {
        braces--;
        if (braces === 0) {
          code = code.substring(0, secondSendChat) + code.substring(i + 1);
          break;
        }
      }
    }
  }
}

fs.writeFileSync('src/components/CustomerMarketplace.tsx', code);

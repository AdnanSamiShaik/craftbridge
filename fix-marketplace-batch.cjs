const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');

code = code.replace(
  /if \(data.action && data.action.type === "create_enquiry"\) \{[\s\S]*?\}\);[\s\S]*?\}/,
  `if (data.action && data.action.type === "create_enquiry_batch") {
        import("firebase/firestore").then(async ({ doc, setDoc, writeBatch }) => {
          try {
            const batch = writeBatch(db);
            const payloads = data.action.payloads || [];
            
            payloads.forEach((payload: any) => {
              const enquiryId = crypto.randomUUID();
              const ref = doc(db, "enquiries", enquiryId);
              batch.set(ref, {
                buyerId: user?.uid,
                buyerName: user?.displayName || "Buyer",
                ...payload,
                status: "pending",
                source: "ai_chat",
                createdAt: Date.now()
              });
            });
            
            await batch.commit();
            alert(\`Enquiry sent successfully to \${payloads.length} artisan(s)!\`);
          } catch (e) {
            console.error("Firestore error", e);
          }
        });
      }`
);

fs.writeFileSync('src/components/CustomerMarketplace.tsx', code);

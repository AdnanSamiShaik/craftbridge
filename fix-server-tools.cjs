const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Update create_enquiry parameters
code = code.replace(
  'productId: { type: "string" as any },',
  'productIds: { type: "array" as any, items: { type: "string" as any } },'
);
code = code.replace('required: ["productId"]', 'required: ["productIds"]');

// Update execution of create_enquiry
code = code.replace(
  /else if \(name === "create_enquiry"\) \{[\s\S]*?\} else \{[\s\S]*?error: "Invalid product ID. Cannot create enquiry." \};\n          \}/,
  `else if (name === "create_enquiry") {
          let payloads = [];
          let groupedArtisans = new Set();
          
          let pIds = args.productIds || [];
          if (args.productId && !pIds.includes(args.productId)) pIds.push(args.productId);
          
          for (const pid of pIds.slice(0, 5)) {
            let product = (products || []).find(p => p.id === pid);
            if (product && !groupedArtisans.has(product.artisanId)) {
              groupedArtisans.add(product.artisanId);
              payloads.push({
                productId: product.id,
                productName: product.titleEn,
                artisanId: product.artisanId,
                artisanName: product.artisanName || "Artisan",
                quantity: args.quantity || 1,
                budget: args.budget || null,
                location: args.location || null,
                message: args.message || "I am interested in this product.",
                isBulk: true
              });
            }
          }
          
          if (payloads.length > 0) {
            finalAction = {
              type: "create_enquiry_batch",
              payloads: payloads
            };
            toolResult = { success: true, message: \`Enquiry draft created for \${payloads.length} artisans. User will confirm it.\` };
          } else {
            toolResult = { success: false, error: "Invalid product IDs. Cannot create enquiry." };
          }
        }`
);

fs.writeFileSync('server.ts', code);

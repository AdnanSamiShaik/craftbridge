const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

const startIdx = serverCode.indexOf('app.post("/api/ai/chat", express.json({ limit: \'50mb\' }), async (req, res) => {');
const endIdx = serverCode.indexOf('async function startServer() {');

const newChatRoute = `app.post("/api/ai/chat", express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { message, previousInteractionId, user, products } = req.body;
    let currentInput = message;
    let prevId = previousInteractionId;
    let finalAction = null;
    let recommendedProducts = [];

    // We will do a loop to handle function calls automatically
    for (let i = 0; i < 3; i++) {
      let interaction;
      if (!prevId) {
        interaction = await ai.interactions.create({
          model: "gemini-3.8-flash",
          input: SYSTEM_INSTRUCTION + "\\n\\nUser: " + currentInput,
          tools: tools
        });
      } else {
        interaction = await ai.interactions.create({
          model: "gemini-3.8-flash",
          input: currentInput,
          previous_interaction_id: prevId,
          tools: tools
        });
      }
      
      prevId = interaction.interaction_id;
      
      // Check for function call in the steps
      const functionCallStep = (interaction.steps || []).find((s: any) => s.type === 'function_call');
      
      if (functionCallStep) {
        const { name, arguments: args } = functionCallStep;
        let toolResult: any = {};
        
        if (name === "search_products") {
          let q = (args.query || "").toLowerCase();
          let cat = (args.category || "").toLowerCase();
          
          let results = (products || []).filter((p: any) => {
            let match = true;
            if (q && !p.titleEn.toLowerCase().includes(q) && !(p.desc || "").toLowerCase().includes(q)) match = false;
            if (cat && !(p.category || "").toLowerCase().includes(cat)) match = false;
            if (args.minPrice && p.price < args.minPrice) match = false;
            if (args.maxPrice && p.price > args.maxPrice) match = false;
            return match;
          }).slice(0, 5);
          
          recommendedProducts = results;
          toolResult = { success: true, matches: results.length, products: results.map((p: any) => ({ id: p.id, titleEn: p.titleEn, price: p.price, artisanName: p.artisanName })) };
        } 
        else if (name === "get_product_details") {
          let product = (products || []).find((p: any) => p.id === args.productId);
          if (product) {
            toolResult = { success: true, product };
            recommendedProducts = [product];
          } else {
            toolResult = { success: false, error: "Product not found" };
          }
        }
        else if (name === "create_enquiry") {
          let payloads: any[] = [];
          let groupedArtisans = new Set();
          
          let pIds = args.productIds || [];
          if (args.productId && !pIds.includes(args.productId)) pIds.push(args.productId);
          
          for (const pid of pIds.slice(0, 5)) {
            let product = (products || []).find((p: any) => p.id === pid);
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
        }
        
        // Feed tool result back to the model
        currentInput = "Tool execution result for " + name + ": " + JSON.stringify(toolResult);
        continue;
      }
      
      // If no function call, we have the final text response
      let responseText = interaction.text || "I'm not sure how to respond to that.";
      return res.json({
        interactionId: prevId,
        message: responseText,
        action: finalAction,
        products: recommendedProducts
      });
    }
    
    // Fallback if loop finishes
    res.json({
      interactionId: prevId,
      message: "I needed to think too much. Let's try something simpler."
    });
    
  } catch (error) {
    console.error("Chat error", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

`;

serverCode = serverCode.substring(0, startIdx) + newChatRoute + serverCode.substring(endIdx);
fs.writeFileSync('server.ts', serverCode);


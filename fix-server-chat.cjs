const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newChatEndpoint = `
const tools = [
  {
    type: "function",
    name: "search_products",
    description: "Search for products from the marketplace based on user requirements. Returns a list of matching product details.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        minPrice: { type: "number" },
        maxPrice: { type: "number" }
      }
    }
  },
  {
    type: "function",
    name: "get_product_details",
    description: "Get detailed information about a specific product by its ID.",
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string" }
      },
      required: ["productId"]
    }
  },
  {
    type: "function",
    name: "create_enquiry",
    description: "Create an enquiry for a specific product and route it to the artisan. USE THIS ONLY WHEN THE BUYER EXPLICITLY REQUESTS TO SEND AN ENQUIRY.",
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string" },
        quantity: { type: "number" },
        budget: { type: "number" },
        location: { type: "string" },
        message: { type: "string" }
      },
      required: ["productId"]
    }
  }
];

const SYSTEM_INSTRUCTION = \`You are Craft Bridge AI Sourcing Assistant. Help customers discover handcrafted products and help bulk buyers source products from real artisans. 
Use only real marketplace products. Never invent products, prices, or artisans. Ask only necessary questions. 
When the buyer explicitly requests an enquiry, use the create_enquiry tool. Do not create an enquiry just because they are searching.
If a user asks to search, use search_products. You must use the tools to look up actual data.\`;

app.post("/api/ai/chat", express.json({ limit: '50mb' }), async (req, res) => {
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
      const functionCallStep = (interaction.steps || []).find(s => s.type === 'function_call');
      
      if (functionCallStep) {
        const { name, arguments: args } = functionCallStep;
        let toolResult = {};
        
        if (name === "search_products") {
          let q = (args.query || "").toLowerCase();
          let cat = (args.category || "").toLowerCase();
          
          let results = (products || []).filter(p => {
            let match = true;
            if (q && !p.titleEn.toLowerCase().includes(q) && !(p.desc || "").toLowerCase().includes(q)) match = false;
            if (cat && !(p.category || "").toLowerCase().includes(cat)) match = false;
            if (args.minPrice && p.price < args.minPrice) match = false;
            if (args.maxPrice && p.price > args.maxPrice) match = false;
            return match;
          }).slice(0, 5);
          
          recommendedProducts = results;
          toolResult = { success: true, matches: results.length, products: results.map(p => ({ id: p.id, titleEn: p.titleEn, price: p.price, artisanName: p.artisanName })) };
        } 
        else if (name === "get_product_details") {
          let product = (products || []).find(p => p.id === args.productId);
          if (product) {
            toolResult = { success: true, product };
            recommendedProducts = [product];
          } else {
            toolResult = { success: false, error: "Product not found" };
          }
        }
        else if (name === "create_enquiry") {
          let product = (products || []).find(p => p.id === args.productId);
          if (product) {
            finalAction = {
              type: "create_enquiry",
              payload: {
                productId: product.id,
                productName: product.titleEn,
                artisanId: product.artisanId,
                artisanName: product.artisanName || "Artisan",
                quantity: args.quantity || 1,
                budget: args.budget || null,
                location: args.location || null,
                message: args.message || "I am interested in this product.",
                isBulk: true
              }
            };
            toolResult = { success: true, message: "Enquiry draft created successfully. User will confirm it." };
          } else {
            toolResult = { success: false, error: "Invalid product ID. Cannot create enquiry." };
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

code = code.replace('async function startServer()', newChatEndpoint + '\nasync function startServer()');

fs.writeFileSync('server.ts', code);

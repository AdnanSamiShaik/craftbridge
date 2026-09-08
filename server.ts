import express from "express";
import path from "path";
import multer from "multer";
import { ai } from "./src/lib/gemini.js";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// Gemini setup


// API Routes
app.post("/api/ai/image-enhance", upload.single("image"), async (req, res) => {
  try {
    // Mock for now, but would use Gemini to generate an enhanced description or image.
    // In this MVP, we simulate enhancement.
    res.json({ status: "success", message: "Image enhanced (Simulated)" });
  } catch (error) {
    res.status(500).json({ error: "Failed to enhance image" });
  }
});

app.post("/api/ai/transcribe-catalog", upload.single("audio"), async (req, res) => {
  try {
    const audioBuffer = req.file?.buffer;
    if (!audioBuffer) return res.status(400).json({ error: "No audio provided" });

    const base64Audio = audioBuffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Audio,
                mimeType: req.file?.mimetype || "audio/webm",
              },
            },
            {
              text: `Transcribe this audio, detect the language, translate it to English if needed, and generate structured catalog information.
              Return a JSON object with:
              - transcription_original: string
              - language_detected: string
              - product_name_en: string\n              - product_name_hi: string
              - category: string
              - material: string
              - craft_technique: string
              - description: string
              - keywords: string[]
              Only include fields supported by the transcript. Don't invent facts.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    console.error("Transcription error", error);
    res.status(500).json({ error: "Failed to transcribe and generate catalog" });
  }
});

app.post("/api/ai/pricing", express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { category, material, raw_material_cost, labour_cost, packaging_cost } = req.body;
    
    // Deterministic base cost
    const baseCost = Number(raw_material_cost) + Number(labour_cost) + Number(packaging_cost);
    
    // Call Gemini for pricing insights
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Suggest a pricing strategy for a handmade ${category} made of ${material} in India. The base cost is ₹${baseCost}. Return a JSON with: suggested_minimum (number), suggested_maximum (number), recommended_starting_price (number), and explanation (string).` }]
        }
      ],
      config: { responseMimeType: "application/json" }
    });
    
    const result = JSON.parse(response.text || "{}");
    result.base_cost = baseCost;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate pricing" });
  }
});

app.post("/api/ai/extract-requirements", express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { message } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Extract the following buyer requirements from this message: "${message}".
          Return a JSON object with these keys (use null if not specified):
          - product: string
          - quantity: number
          - budget: number
          - location: string
          - deadline: string
          - custom_requirements: string
          - is_bulk: boolean` }]
        }
      ],
      config: { responseMimeType: "application/json" }
    });
    
    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to extract requirements" });
  }
});


app.post("/api/ai/search-products", express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { message, products } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Given the user query: "${message}", find the best matching products from this list: ${JSON.stringify(products)}. Return a JSON object with a key 'matched_ids' containing an array of string product IDs that best match.` }]
        }
      ],
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to search products" });
  }
});


const tools = [
  {
    type: "function" as any,
    name: "search_products",
    description: "Search for products from the marketplace based on user requirements. Returns a list of matching product details.",
    parameters: {
      type: "object" as any,
      properties: {
        query: { type: "string" as any },
        category: { type: "string" as any },
        minPrice: { type: "number" as any },
        maxPrice: { type: "number" as any }
      }
    }
  },
  {
    type: "function" as any,
    name: "get_product_details",
    description: "Get detailed information about a specific product by its ID.",
    parameters: {
      type: "object" as any,
      properties: {
        productId: { type: "string" as any }
      },
      required: ["productId"]
    }
  },
  {
    type: "function" as any,
    name: "create_enquiry",
    description: "Create an enquiry for a specific product and route it to the artisan. USE THIS ONLY WHEN THE BUYER EXPLICITLY REQUESTS TO SEND AN ENQUIRY.",
    parameters: {
      type: "object" as any,
      properties: {
        productIds: { type: "array" as any, items: { type: "string" as any } },
        quantity: { type: "number" as any },
        budget: { type: "number" as any },
        location: { type: "string" as any },
        message: { type: "string" as any }
      },
      required: ["productIds"]
    }
  }
];

const SYSTEM_INSTRUCTION = `You are Craft Bridge AI Sourcing Assistant. Help customers discover handcrafted products and help bulk buyers source products from real artisans. 
Use only real marketplace products. Never invent products, prices, or artisans. Ask only necessary questions. 
When the buyer explicitly requests an enquiry, use the create_enquiry tool. Do not create an enquiry just because they are searching.
If a user asks to search, use search_products. You must use the tools to look up actual data.`;

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
          model: "gemini-3.6-flash",
          input: SYSTEM_INSTRUCTION + "\n\nUser: " + currentInput,
          tools: tools
        });
      } else {
        interaction = await ai.interactions.create({
          model: "gemini-3.6-flash",
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
            toolResult = { success: true, message: `Enquiry draft created for ${payloads.length} artisans. User will confirm it.` };
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
    if (String(error).includes('429') || (error.message && String(error.message).includes('429'))) {
      res.json({
        interactionId: prevId,
        message: "I am currently receiving too many requests. Please try again in a minute.",
        action: null,
        products: []
      });
    } else {
      res.status(500).json({ error: "Failed to process chat", details: error.message || String(error) });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  
  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {

    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

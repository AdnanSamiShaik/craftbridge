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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

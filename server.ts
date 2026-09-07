import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Gemini setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      model: "gemini-3.5-flash",
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
              - product_name: string
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

app.post("/api/ai/pricing", express.json(), async (req, res) => {
  try {
    const { category, material, raw_material_cost, labour_cost, packaging_cost } = req.body;
    
    // Deterministic base cost
    const baseCost = Number(raw_material_cost) + Number(labour_cost) + Number(packaging_cost);
    
    // Simple mock logic for prototype, mimicking the example
    const minMultiplier = 1.25;
    const maxMultiplier = 1.6;
    
    const suggestedMinimum = Math.round(baseCost * minMultiplier);
    const suggestedMaximum = Math.round(baseCost * maxMultiplier);
    const recommended = Math.round(baseCost * 1.4);

    res.json({
      base_cost: baseCost,
      suggested_minimum: suggestedMinimum,
      suggested_maximum: suggestedMaximum,
      recommended_starting_price: recommended,
      explanation: `Calculated from Base Cost (₹${baseCost}) + Category Margin`
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to calculate pricing" });
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

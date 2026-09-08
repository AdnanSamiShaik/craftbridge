import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "search for baskets",
      tools: [{
        type: "function",
        name: "search_products",
        description: "Search for products",
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } } }
      }]
    });
    console.dir(interaction, { depth: null });
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();

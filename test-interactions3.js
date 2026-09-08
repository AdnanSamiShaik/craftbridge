import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "I need 500 handmade baskets",
      tools: [{
        functionDeclarations: [
          {
            name: "search_products",
            description: "Search for products",
            parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } } }
          }
        ]
      }]
    });
    console.log(interaction);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();

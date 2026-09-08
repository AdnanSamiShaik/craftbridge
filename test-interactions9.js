import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "test",
      tool_results: [{ name: "search_products", result: { ok: true } }]
    });
    console.log("no error on tool_results parameter!");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();

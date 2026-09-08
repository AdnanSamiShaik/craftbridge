import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "result for search",
      previous_interaction_id: "some_id",
      tool_responses: [{ id: "call_870467", name: "search_products", result: { ok: true } }]
    });
    console.log("No error with tool_responses!");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();

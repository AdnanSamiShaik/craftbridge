import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "I need 500 handmade baskets",
      config: {
         systemInstruction: "You are Craft Bridge AI",
      }
    });
    console.log("Success:", interaction.text, interaction.interaction_id);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();

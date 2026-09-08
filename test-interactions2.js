import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "I need 500 handmade baskets"
    });
    console.log("Success:", interaction.text, interaction.interaction_id);
    console.dir(interaction, { depth: null });
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();

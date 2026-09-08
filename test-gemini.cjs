require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const tools = [
  {
    type: "function",
    name: "search_products",
    description: "Search products",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } }
    }
  }
];

async function run() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "Hello",
      tools: tools
    });
    console.log(interaction);
  } catch (e) {
    console.error(e.message || e);
  }
}
run();

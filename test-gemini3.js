import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const chat = ai.chats.create({
      model: "gemini-3.8-flash",
      config: {
        tools: [{
          functionDeclarations: [
            {
              name: "search_products",
              description: "Search for products based on user criteria",
              parameters: {
                type: Type.OBJECT,
                properties: { query: { type: Type.STRING } }
              }
            }
          ]
        }]
      }
    });
    const res = await chat.sendMessage({ message: "find baskets" });
    console.log(res.functionCalls);
  } catch (e) {
    console.error(e.message);
  }
}
test();

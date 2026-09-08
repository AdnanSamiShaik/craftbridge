const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Remove existing GoogleGenAI import and setup
code = code.replace('import { GoogleGenAI } from "@google/genai";', 'import { ai } from "./src/lib/gemini.js";');
code = code.replace('const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });', '');

fs.writeFileSync('server.ts', code);

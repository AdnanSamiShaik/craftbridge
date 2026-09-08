import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with the provided API key for server-side usage
export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyCDFXNtc0CWoCKG9FIksxyFGbhE0x8jcWc" 
});

// Utility functions for AI tasks can also go here if needed

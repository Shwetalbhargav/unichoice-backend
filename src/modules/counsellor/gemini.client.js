import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  // Don’t crash app at boot; we’ll fallback at runtime.
  console.warn("[GEMINI] GEMINI_API_KEY is missing. AI explanations will fallback.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function getGeminiModel() {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

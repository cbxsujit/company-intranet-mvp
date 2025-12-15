
import { GoogleGenAI } from "@google/genai";

export const askGemini = async (apiKey: string, prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated from AI.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error interacting with AI: ${error.message || "Unknown error"}`;
  }
};

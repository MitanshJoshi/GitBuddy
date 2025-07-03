import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getSummaryFromAI(prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt,
  });
  return response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
console.log('GEMINI_API_KEY:', GEMINI_API_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
export async function getBranchNameFromGemini(description) {
    const prompt = `
Given the following branch description, suggest a concise, lowercase, kebab-case git branch name using the 'type/short-description' convention (e.g., 'feat/login-page', 'fix/typo-in-readme'). Only output the branch name.

Description: "${description}"
Branch name:
  `.trim();
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
    });
    // @ts-ignore
    return response.text.trim().replace(/[`"' ]/g, '');
}

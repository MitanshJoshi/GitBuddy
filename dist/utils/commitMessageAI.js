import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getDefaultBranch } from '../commands/mergeWithMain.js';
dotenv.config({ path: '.env' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
export async function getCommitMessageFromAI(diff) {
    const prompt = `
    You are an expert software engineer and git user.
    
    Given the following git diff, analyze the code changes and generate:
    - A concise, conventional commit message (max 72 characters, imperative mood, e.g., "feat: add device support").
    - A clear, short description (1-3 sentences) explaining the purpose and intent of the change—what feature or fix is being implemented or improved, and why. Do NOT list filenames, file paths, or simply restate the diff. Focus on the high-level feature, bug fix, or enhancement.
    
    **Requirements:**
    - The commit message should summarize the main feature or fix being implemented, inferred from the diff.
    - The description should provide context about the feature or fix and its purpose.
    - Respond ONLY with a valid JSON object with two fields: "message" and "description".
    
    Example response:
    {
      "message": "feat(add feat or fix according to the diffs): add multi-device support",
      "description": "Introduces support for multiple devices, allowing users to manage and sync data across different hardware. This enhances flexibility and user experience."
    }
    
    Git diff:
    ${diff}
    `.trim();
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
    });
    let text = '';
    if (response.candidates &&
        response.candidates.length > 0 &&
        response.candidates[0].content &&
        response.candidates[0].content.parts &&
        response.candidates[0].content.parts.length > 0) {
        text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    }
    else {
        const defaultBranch = await getDefaultBranch();
        if (!defaultBranch) {
            console.error('❌ Could not determine default branch. Aborting.');
            return {
                message: 'default branch does not exists',
                description: 'Set a default branch to continue',
            };
        }
        return { message: `Merge ${defaultBranch} into feature branch`, description: "" };
    }
    // Remove code block formatting if present
    text = text.replace(/```json|```/g, '').trim();
    try {
        const json = JSON.parse(text);
        return {
            message: json.message,
            description: json.description,
        };
    }
    catch {
        const defaultBranch = await getDefaultBranch();
        if (!defaultBranch) {
            console.error('❌ Could not determine default branch. Aborting.');
            return {
                message: 'default branch does not exists',
                description: 'Set a default branch to continue',
            };
        }
        return { message: `Merge ${defaultBranch} into feature branch`, description: "" };
    }
}

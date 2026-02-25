import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// In a production app, the key should be on the backend
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ContentModerationResult {
    flagged: boolean;
    reason: string;
    category: 'harassment' | 'hate_speech' | 'sexually_explicit' | 'dangerous_content' | 'spam' | 'none';
    confidence: number;
}

export const moderateContent = async (text: string): Promise<ContentModerationResult> => {
    try {
        if (!text.trim()) return { flagged: false, reason: '', category: 'none', confidence: 0 };

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            You are a content moderator for a social app called "VibeMap".
            Analyze the following text for: Harassment, Hate Speech, Sexually Explicit content, Dangerous content, or Spam.
            
            Text: "${text}"

            Respond ONLY with a JSON object in this format:
            {
                "flagged": boolean,
                "reason": "short explanation",
                "category": "one of the categories listed above or none",
                "confidence": number (0-1)
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(jsonString);
            return data;
        } catch (parseError) {
            console.error("Failed to parse Gemini/AI response", parseError);
            return { flagged: false, reason: 'AI Parse Error', category: 'none', confidence: 0 };
        }

    } catch (e) {
        console.error("AI Moderation Error:", e);
        // Fail open (allow content) or fail closed (block) based on policy. MVP: allow but log.
        return { flagged: false, reason: 'Service Error', category: 'none', confidence: 0 };
    }
};

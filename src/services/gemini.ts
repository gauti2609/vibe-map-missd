import { GoogleGenerativeAI } from "@google/generative-ai";
import { LocationInfo } from "../types";

// Initialize Gemini Client
// WARNING: This client-side implementation exposes the API Key. 
// Ideally, requests should be proxied through a secure backend (e.g., Firebase Functions).
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) console.warn("Gemini API Key is missing!");
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1beta" }) : null;

export const extractAreaFromAddress = async (placeName: string, fullAddress: string): Promise<string> => {
  if (!model) return '';

  try {
    const prompt = `
      Identify the popular area, hub, sector, or zone name from this location details.
      Place Name: "${placeName}"
      Address: "${fullAddress}"

      Rules:
      1. Prioritize identifying famous hubs (e.g., "Cyber Hub", "Worldmark", "Khan Market").
      2. If inside a Tech Park or Mall, return that (e.g., "Vatika Business Centre", "Select Citywalk").
      3. If generic, fallback to "Sector X" or "Area Name" (e.g., "Sector 49", "Hauz Khas").
      4. DO NOT return specific building numbers (e.g., "Tower B", "Shop 5").
      5. Return ONLY the short name. No quotes, no explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Fallback if AI returns garbage or empty
    if (!text || text.length > 30) return '';

    return text;
  } catch (error) {
    console.error("Gemini Area Extraction Error:", error);
    return ''; // Fallback to regex logic
  }
};

/**
 * Generates quirky display names based on user input.
 */
export const generateUsernames = async (interests: string): Promise<string[]> => {
  if (!model) return ["NeonWanderer", "MidnightViber", "BassDropBot"];

  try {
    console.log("Generating usernames for:", interests);
    const prompt = `Generate 5 creative, quirky, and safe display names for a user on a social vibe-check app.
    The user describes their vibe as: "${interests}".
    
    Themes to explore:
    - Abstract concepts related to the description
    - Fun alliterations
    - Short, punchy handles (max 15 chars)
    - Avoid generic prefixes like "Real", "The", "Soul" unless unique.
    - Mix of cool, mysterious, and energetic tones.
    
    Output ONLY a JSON array of strings, e.g. ["NeonRider", "ZenMaster", "VibeSurfer"]. Do not include markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown if present
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const names = JSON.parse(jsonStr);
    return Array.isArray(names) ? names : ["NeonWanderer", "MidnightViber", "BassDropBot"];
  } catch (error) {
    console.error("Gemini Username Error:", error);

    // Fallback: Generate dynamic names based on input if API fails
    const keywords = interests.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (keywords.length > 0) {
      const keyword = keywords[0].replace(/\s+/g, ''); // Use first interest, remove spaces
      const randomSuffix = Math.floor(Math.random() * 1000);
      return [
        `Real${keyword}`,
        `The${keyword}Vibe`,
        `${keyword}Soul`,
        `Neon${keyword}`,
        `${keyword}${randomSuffix}`
      ];
    }

    return ["MysteryGuest", "CityLight", "VibeSeeker"];
  }
};

/**
 * Checks content for vulgarity or stalking behavior.
 * Returns true if safe, false if flagged.
 */
export const moderateContent = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  if (!model) return { safe: true };

  try {
    const prompt = `Analyze the following social media comment for vulgarity, harassment, or stalking behavior. 
    Comment: "${text}"
    Return ONLY a JSON object with: { "safe": boolean, "reason": string | null }. Do not include markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textRes = response.text();
    const jsonStr = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Moderation Error:", error);
    return { safe: true };
  }
};

/**
 * Suggests a vibe based on post text.
 */
export const suggestVibe = async (text: string): Promise<{ vibe: string | null, hashtags: string[] }> => {
  if (!model) return { vibe: null, hashtags: [] };

  try {
    const prompt = `Analyze this post text and suggest the single best matching vibe from this list: ['Dancing', 'Chilling', 'Partying', 'Networking', 'Dating']. 
    Also suggest 3 relevant hashtags.
    Text: "${text}"
    Return ONLY JSON: { "vibe": string, "hashtags": string[] }.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textRes = response.text();
    const jsonStr = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Vibe Suggestion Error:", error);
    return { vibe: null, hashtags: [] };
  }
};

/**
 * Mock Find Places (Client-side Maps will handle this in components)
 * This is kept for backward compatibility if needed, but components should prefer usePlacesAutocomplete.
 */


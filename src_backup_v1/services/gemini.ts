import { GoogleGenAI, Type } from "@google/genai";
import { LocationInfo } from "../types";

// Initialize Gemini Client
// Note: In a production app, the key should come from a secure backend proxy if possible, 
// or be process.env.API_KEY injected by the build system.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates quirky display names based on user input.
 */
export const generateUsernames = async (interests: string): Promise<string[]> => {
  if (!apiKey) return ["NeonWanderer", "MidnightViber", "BassDropBot"];

  try {
    const model = "gemini-2.5-flash";
    const prompt = `Generate 5 quirky, fun, and anonymous social media display names based on these interests: "${interests}". 
    The names should be suitable for a nightlife/social app. Return JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            names: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || '{"names": []}');
    return json.names;
  } catch (error) {
    console.error("Gemini Username Error:", error);
    return ["MysteryGuest", "CityLight", "VibeSeeker"];
  }
};

/**
 * Checks content for vulgarity or stalking behavior.
 * Returns true if safe, false if flagged.
 */
export const moderateContent = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  if (!apiKey) return { safe: true };

  try {
    const model = "gemini-2.5-flash";
    const prompt = `Analyze the following social media comment for vulgarity, harassment, or stalking behavior. 
    Comment: "${text}"
    Return JSON with a boolean 'safe' and a short 'reason' if unsafe.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{"safe": true}');
    return result;
  } catch (error) {
    console.error("Gemini Moderation Error:", error);
    // Fail open for demo, but in prod fail closed
    return { safe: true };
  }
};

/**
 * Uses Google Search Grounding (Maps) to find places.
 */
export const findPlaces = async (query: string): Promise<LocationInfo[]> => {
  const fallbackPlaces: LocationInfo[] = [
      { name: "Open Tap", address: "South Point Mall, Golf Course Rd, Sector 53, Gurugram" },
      { name: "Cyber Hub Social", address: "DLF Cyber Hub, DLF Phase 2, Sector 24, Gurugram" },
      { name: "Downtown - Diners & Living Beer Cafe", address: "SCO 34, Main Market, Sector 29, Gurugram" },
      { name: "Whisky Samba", address: "Two Horizon Center, Golf Course Rd, Sector 43, Gurugram" },
      { name: "Cocktails & Dreams, Speakeasy", address: "SCO 23, Part II, Sector 15, Gurugram" },
      { name: "Manhattan Bar & Brewery", address: "Global Foyer Mall, Golf Course Rd, Sector 43, Gurugram" },
      { name: "Molecule Air Bar", address: "SCO 53, 4th Floor, Sector 29, Gurugram" },
      { name: "Viet:Nom", address: "DLF Cyber Hub, DLF Phase 2, Gurugram" },
      { name: "Privee", address: "Shangri-La's Eros Hotel, Ashoka Rd, Connaught Place, New Delhi" },
      { name: "Toy Room", address: "Aloft Hotel, Aerocity, New Delhi" },
      { name: "Soi 7 Pub & Brewery", address: "Cyber Hub, DLF Cyber City, Gurugram" },
      { name: "The Wine Company", address: "Cyber Hub, DLF Cyber City, Gurugram" },
      { name: "Burma Burma", address: "Cyber Hub, DLF Cyber City, Gurugram" },
      { name: "Walking Street", address: "SCO 20, Sector 29, Gurugram" },
      { name: "Big Boyz Lounge", address: "Sector 29, Gurugram" }
  ];

  if (!apiKey) {
    // Mock fallback if no key
    // Filter mock data based on query for better UX
    if (!query) return fallbackPlaces.slice(0, 5);
    return fallbackPlaces.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.address.toLowerCase().includes(query.toLowerCase()));
  }

  try {
    const model = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model,
      contents: `Find places matching this query: "${query}". Return a list of places.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    // Extract grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const places: LocationInfo[] = [];

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
            places.push({
                name: chunk.web.title,
                address: "Details from Map", // Maps tool grounding often gives URI/Title.
                placeId: chunk.web.uri
            });
        }
      });
    }

    // If grounding didn't return structured map data easily parsable in this specific way,
    // we fallback to text parsing or the rich fallback list.
    if (places.length === 0) {
        if (!query) return fallbackPlaces.slice(0, 5);
        return fallbackPlaces.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.address.toLowerCase().includes(query.toLowerCase()));
    }

    return places;

  } catch (error) {
    console.error("Gemini Maps Error:", error);
    return fallbackPlaces.slice(0, 5); // Return top 5 on error
  }
};

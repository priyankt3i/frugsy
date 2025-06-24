import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RawGroceryItem, GroundingSource, IdentifiedStore } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

// 1. Access the API key using import.meta.env
// Make sure to add the VITE_ prefix as per Vite's convention
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  // Update the warning message to reflect the correct variable name
  console.error("Gemini API Key (import.meta.env.VITE_GEMINI_API_KEY) is not set. API calls will fail.");
}

// Ensure the apiKey is always a string, even if it's undefined
// The GoogleGenAI constructor might expect a string, so provide a fallback.
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_VITE_API_KEY_RUNTIME" });

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

const extractSources = (response: GenerateContentResponse | undefined): GroundingSource[] => {
  const sources: GroundingSource[] = [];
  const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks && Array.isArray(groundingChunks)) {
    groundingChunks.forEach((chunk: GroundingChunk) => {
      if (chunk.web && chunk.web.uri) {
        sources.push({
          uri: chunk.web.uri,
          title: chunk.web.title || chunk.web.uri,
        });
      }
    });
  }
  return sources;
};

// Step 2: Find a specific item in a specific store (Store identified by Google Maps API)
export const fetchGroceryPricesForItemInStore = async (
  itemName: string,
  store: IdentifiedStore,
  searchRadiusForContext: number // Original user radius, for context to AI
): Promise<{ item: RawGroceryItem | null, sources: GroundingSource[] }> => {
  // 2. Use the new API_KEY variable consistently
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured. Cannot fetch item price.");
  }

  const storeAddressContext = store.storeAddress ? ` (around ${store.storeAddress})` : '';
  const prompt = `
    You are an AI assistant. The user is looking for the item "${itemName}".
    Focus your search specifically on the store: "${store.storeName}"${storeAddressContext}.
    The user's general search area context is within a ${searchRadiusForContext}-mile radius of their specified location, but for this query, pinpoint the item AT THIS SPECIFIC STORE.

    Use Google Search to find real-time pricing and availability for "${itemName}" at "${store.storeName}".

    **Critical Output Instructions:**

    1.  **If the item AND its price are found at THIS specific store:** Respond ONLY with a single JSON object.
        The JSON object must have this structure:
        {
          "fullItemName": string,
          "storeName": "${store.storeName}",
          "storeAddress": "${store.storeAddress || ''}",
          "price": number,
          "currency": string,
          "productUrl": string (Full URL. If markdown [Text](URL), extract URL. Else "" or null),
          "imageUrl": string (Full URL to an image, if found. Else "" or null),
          "lastUpdated": string (Date/phrase of last price update. Else "" or null),
          "notes": string (Optional notes. Else "" or null)
        }
        Example (item found):
        { "fullItemName": "Chiquita Bananas, Organic, 2lb Bag", "storeName": "${store.storeName}", "storeAddress": "${store.storeAddress || ''}", "price": 3.99, "currency": "USD", "productUrl": "https://example.com/product", "imageUrl": "", "lastUpdated": "2024-08-01", "notes": "Price per bag." }

    2.  **If the item is NOT found at this specific store, OR if its price CANNOT be determined at this store:** Respond ONLY with the exact word "null" (all lowercase, no quotes, no markdown, no other surrounding text).
        ABSOLUTELY DO NOT provide explanations, apologies, or any other text if you cannot provide the JSON object. Just respond with "null". For example, do not say "Based on the search results, I cannot find...". Instead, simply output: null

    Your entire response MUST be either the single JSON object (if found) OR the word "null" (if not found/priced). No other text or formatting around these two allowed outputs.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.1,
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response) {
      console.error(`Gemini API call (item search for ${store.storeName}) returned a null or undefined response object.`);
      throw new Error(`Gemini API call (item search for ${store.storeName}) returned null or undefined.`);
    }

    const responseSources = extractSources(response);
    let foundItem: RawGroceryItem | null = null;
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof responseText === 'string' && responseText.trim() !== "") {
      let jsonStr = responseText.trim();
      const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }

      if (jsonStr === "null") {
        foundItem = null;
      } else {
        try {
          const parsedData = JSON.parse(jsonStr);
          if (parsedData && typeof parsedData.fullItemName === 'string' && typeof parsedData.price === 'number') {
            foundItem = {
              fullItemName: parsedData.fullItemName,
              storeName: parsedData.storeName || store.storeName,
              storeAddress: parsedData.storeAddress || store.storeAddress,
              price: parsedData.price,
              currency: parsedData.currency || "USD",
              productUrl: (typeof parsedData.productUrl === 'string' && parsedData.productUrl.trim() !== "" && parsedData.productUrl.toLowerCase() !== "null") ? parsedData.productUrl : undefined,
              imageUrl: (typeof parsedData.imageUrl === 'string' && parsedData.imageUrl.trim() !== "" && parsedData.imageUrl.toLowerCase() !== "null") ? parsedData.imageUrl : undefined,
              lastUpdated: (typeof parsedData.lastUpdated === 'string' && parsedData.lastUpdated.trim() !== "" && parsedData.lastUpdated.toLowerCase() !== "null") ? parsedData.lastUpdated : undefined,
              notes: (typeof parsedData.notes === 'string' && parsedData.notes.trim() !== "" && parsedData.notes.toLowerCase() !== "null") ? parsedData.notes : undefined,
            };
          } else {
            console.warn(`Parsed data from AI response (item search for ${store.storeName}) is not a valid item object. Response string:`, jsonStr.substring(0,200));
          }
        } catch (parseError) {
          console.error(`Failed to parse JSON from AI response (item search for ${store.storeName}):`, parseError, "Raw AI text:", responseText.substring(0,200));
        }
      }
    } else {
      console.warn(`Gemini API response (item search for ${store.storeName}) did not contain usable text or was empty.`);
    }
    return { item: foundItem, sources: responseSources };

  } catch (error) {
    console.error(`Error fetching item price for ${store.storeName} from Gemini API:`, error);
    // 3. Update error message if it still refers to API_KEY
    if (error instanceof Error && error.message.includes("API key not valid")) throw new Error("Invalid Gemini API Key. Ensure VITE_GEMINI_API_KEY is correctly set.");
    return { item: null, sources: [] };
  }
};


export const generateProductImage = async (itemName: string): Promise<string | null> => {
  // 4. Use the new API_KEY variable consistently
  if (!API_KEY) {
    console.warn("Gemini API Key is not configured. Cannot generate product image.");
    return null;
  }

  const prompt = `A clear, professional, well-lit studio product photo of "${itemName}" on a plain white or light neutral background. The item should be the main focus. Cropped to the product.`;

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response && response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      console.warn('Image generation did not return valid image bytes for item:', itemName, 'Response:', JSON.stringify(response).substring(0, 200) + "...");
      return null;
    }
  } catch (error) {
    console.error(`Error generating image for item "${itemName}":`, error);
    return null;
  }
};
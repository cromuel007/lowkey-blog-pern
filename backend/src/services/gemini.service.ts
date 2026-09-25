import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function generateGeminiContent(
  prompt: string,
  useWebSearch = false,
): Promise<string> {
  const response = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    ...(useWebSearch
      ? {
          tools: [
            {
              type: "google_search",
            },
          ],
        }
      : {}),
  });

  return response.output_text ?? "";
}
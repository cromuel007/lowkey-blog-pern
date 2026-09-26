import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

router.get("/research-test", async (_req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Reply with exactly: Hello",
    });

    return res.status(200).json({
      success: true,
      response: response.text,
    });
  } catch (error) {
    console.error("Gemini generateContent test error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
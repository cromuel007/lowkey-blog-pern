import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { saveResearchResults } from "../services/research.service.js";

const router = Router();

router.post("/research-test", requireAuth, async (_req, res) => {
  try {
    const testResearch = {
      discoveries: [
        {
          title: "Test Recent Technology Release",
          source: "Example Source",
          url: "https://example.com/test-recent-release",
          publishedAt: "2026-09-25T15:31:00Z",
          summary: "This is a test recent research discovery.",
          whyItMatters:
            "This verifies that recent AI research results can be saved correctly.",
          topic: "Developer Tools",
        },
        {
          title: "Test Old Technology Release",
          source: "Example Source",
          url: "https://example.com/test-old-release",
          publishedAt: "2026-09-11T15:31:00Z",
          summary: "This is a test old research discovery.",
          whyItMatters:
            "This verifies that discoveries older than 7 days are ignored.",
          topic: "Developer Tools",
        },
        {
          title: "Test Future Technology Release",
          source: "Example Source",
          url: "https://example.com/test-future-release",
          publishedAt: "2026-10-01T15:31:00Z",
          summary: "This is a test future research discovery.",
          whyItMatters:
            "This verifies that future-dated discoveries are ignored.",
          topic: "Developer Tools",
        },
      ],
    };

    const saved = await saveResearchResults(testResearch);

    return res.status(201).json({
      success: true,
      discovered: testResearch.discoveries.length,
      saved: saved.length,
      posts: saved,
    });
  } catch (error) {
    console.error("AI research test error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
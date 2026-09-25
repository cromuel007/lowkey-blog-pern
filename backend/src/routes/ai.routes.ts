import { Router } from "express";
import { generateGeminiContent } from "../services/gemini.service.js";
import { researchResponseSchema } from "../schemas/aiResearch.schema.js";
import { saveResearchResults } from "../services/research.service.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/research", requireAuth, async (_req, res) => {
  try {
    const result = await generateGeminiContent(
      `
You are the TubbyLab technology research agent.

Search the web for genuinely recent technology developments
published within the last 7 days relative to the current date.

Use the source's actual publication date and time when available.

Focus on:

- AI
- Web development
- JavaScript
- TypeScript
- React
- Node.js
- PHP
- Laravel
- PostgreSQL
- Supabase
- Docker
- Cloudflare
- Vercel
- Developer tools
- Open source

Prioritize:

- official announcements
- major releases
- framework updates
- developer tool releases
- security advisories
- significant open-source releases
- changes that materially affect developers

Prefer primary sources:

- official project blogs
- official documentation
- GitHub repositories
- GitHub releases
- official security advisories

Do NOT invent news.

Do NOT return generic technology trends.

Every discovery must be based on an actual web source.

Only return discoveries that you can verify from a web source.

Only include discoveries published within the last 7 days.

Do not include future-dated discoveries.

Return at most 5 discoveries.

For publishedAt:

- Use the original publication timestamp from the source.
- Return it in ISO 8601 datetime format.
- Example: "2026-09-25T15:31:00Z"
- Do not use the current time.
- Do not estimate or invent the publication timestamp.
- If the exact publication date/time cannot be verified, do not include that discovery.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "discoveries": [
    {
      "title": "string",
      "source": "string",
      "url": "https://example.com/article",
      "publishedAt": "2026-09-25T15:31:00Z",
      "summary": "What happened",
      "whyItMatters": "Why developers should care",
      "topic": "React"
    }
  ]
}

Do not wrap the JSON in markdown code fences.
      `,
      true,
    );

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(result);
    } catch {
      console.error("Gemini returned invalid JSON:", result);

      return res.status(502).json({
        success: false,
        error: "Gemini returned invalid JSON",
        raw: result,
      });
    }

    const validated = researchResponseSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.error("Invalid research response:", validated.error);

      return res.status(502).json({
        success: false,
        error: "Gemini returned an invalid research structure",
        details: validated.error.issues,
      });
    }

    const saved = await saveResearchResults(validated.data);

    return res.status(201).json({
      success: true,
      discovered: validated.data.discoveries.length,
      saved: saved.length,
      posts: saved,
    });
  } catch (error) {
    console.error("Gemini research error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
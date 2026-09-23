import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_URL = process.env.VITE_API_URL;

const SITE_URL = "https://blog.tubbylab.com";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    if (!API_URL) {
      throw new Error("VITE_API_URL is not configured");
    }

    const response = await fetch(`${API_URL}/api/posts`);

    if (!response.ok) {
      throw new Error(
        `Posts API returned ${response.status}`
      );
    }

    const posts = await response.json();

    const urls = [
      {
        loc: SITE_URL,
      },
      {
        loc: `${SITE_URL}/posts`,
      },
      ...posts.map((post: {
        slug: string;
        publishedAt?: string | null;
        updatedAt?: string | null;
      }) => ({
        loc: `${SITE_URL}/posts/${post.slug}`,
        lastmod: post.updatedAt ?? post.publishedAt,
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) => `  <url>
    <loc>${escapeXml(loc)}</loc>${
      lastmod
        ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>`
        : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader(
      "Content-Type",
      "application/xml; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap generation failed:", error);

    return res
      .status(500)
      .send("Failed to generate sitemap");
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
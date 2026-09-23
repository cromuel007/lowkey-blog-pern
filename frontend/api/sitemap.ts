import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE_URL = "https://blog.tubbylab.com";

type SitemapPost = {
    slug: string;
    updatedAt?: string | null;
    publishedAt?: string | null;
};

type SitemapUrl = {
    loc: string;
    lastmod?: string | null;
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
        return res.status(500).send("API_URL is not configured");
    }

    try {
        const response = await fetch(`${apiUrl}/api/posts`, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();

            console.error(
                "Posts API error:",
                response.status,
                response.url,
                errorBody
            );

            return res.status(response.status).send(
                `Failed to load posts: ${response.status} ${response.url}`
            );
        }

        const posts: SitemapPost[] = await response.json();

        const urls: SitemapUrl[] = [
            {
                loc: SITE_URL,
            },
            {
                loc: `${SITE_URL}/posts`,
            },
            ...posts
                .filter((post) => post.slug)
                .map((post) => ({
                    loc: `${SITE_URL}/posts/${encodeURIComponent(
                        post.slug
                    )}`,
                    lastmod:
                        post.updatedAt ||
                        post.publishedAt ||
                        null,
                })),
        ];

        const escapeXml = (value: string) =>
            String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
        ({ loc, lastmod }) => `    <url>
        <loc>${escapeXml(loc)}</loc>${
            lastmod
                ? `
        <lastmod>${new Date(lastmod).toISOString()}</lastmod>`
                : ""
        }
    </url>`
    )
    .join("\n")}
</urlset>`;

        res.setHeader(
            "Cache-Control",
            "public, s-maxage=300, stale-while-revalidate=600"
        );

        res.setHeader(
            "Content-Type",
            "application/xml; charset=utf-8"
        );

        return res.status(200).send(xml);
    } catch (error) {
        console.error("Sitemap error:", error);

        return res.status(500).send(
            `Sitemap error: ${
                error instanceof Error
                    ? error.message
                    : String(error)
            }`
        );
    }
}
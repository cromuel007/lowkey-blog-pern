import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE_URL = "https://blog.tubbylab.com";

type SitemapUrl = {
    loc: string;
    lastmod?: string | null;
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
        return res.status(500).send("API_URL is not configured");
    }

    const postsUrl =
        `${apiUrl.replace(/\/$/, "")}/api/posts`;

    console.log("Sitemap fetching:", postsUrl);

    try {
        const response = await fetch(postsUrl);

        console.log(
            "Posts API response:",
            response.status,
            response.statusText
        );

        if (!response.ok) {
            const errorBody = await response.text();

            console.error(
                "Posts API error:",
                errorBody
            );

            return res
                .status(500)
                .send(
                    `Failed to load posts: ${response.status} ${errorBody}`
                );
        }

        const posts = await response.json();

        if (!Array.isArray(posts)) {
            console.error(
                "Unexpected posts response:",
                posts
            );

            return res
                .status(500)
                .send("Posts API did not return an array");
        }

        const urls: SitemapUrl[] = [
            {
                loc: SITE_URL,
            },
            {
                loc: `${SITE_URL}/posts`,
            },
            ...posts.map((post) => ({
                loc: `${SITE_URL}/posts/${post.slug}`,
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
        console.error(
            "Sitemap fetch failed:",
            error
        );

        return res
            .status(500)
            .send(
                `Sitemap fetch failed: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`
            );
    }
}
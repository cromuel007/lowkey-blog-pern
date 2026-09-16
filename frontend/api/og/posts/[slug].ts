import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const { slug } = req.query;

    if (typeof slug !== "string") {
        return res.status(400).send("Invalid slug");
    }

    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
        return res.status(500).send("API_URL is not configured");
    }

    try {
        const response = await fetch(
            `${apiUrl}/api/posts/${encodeURIComponent(slug)}`
        );

        if (!response.ok) {
            return res.status(response.status).send("Post not found");
        }

        const post = await response.json();

        const title =
            post.seoTitle ||
            post.title ||
            "Cromuel - Lowkey Blogs";

        const description =
            post.seoDescription ||
            post.excerpt ||
            "";

        const url =
            `https://blog.tubbylab.com/posts/${post.slug}`;

        const image =
            post.coverImageUrl ||
            "https://blog.tubbylab.com/og-image.png";

        const escapeHtml = (value: string) =>
            value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        res.setHeader(
            "Content-Type",
            "text/html; charset=utf-8"
        );

        res.setHeader(
            "Cache-Control",
            "public, s-maxage=300, stale-while-revalidate=600"
        );

        return res.status(200).send(`
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />

    <title>${escapeHtml(title)}</title>

    <meta
        name="description"
        content="${escapeHtml(description)}"
    />

    <link
        rel="canonical"
        href="${escapeHtml(url)}"
    />

    <meta
        property="og:title"
        content="${escapeHtml(title)}"
    />

    <meta
        property="og:description"
        content="${escapeHtml(description)}"
    />

    <meta
        property="og:url"
        content="${escapeHtml(url)}"
    />

    <meta
        property="og:type"
        content="article"
    />

    <meta
        property="og:image"
        content="${escapeHtml(image)}"
    />

    <meta
        name="twitter:card"
        content="summary_large_image"
    />

    <meta
        name="twitter:title"
        content="${escapeHtml(title)}"
    />

    <meta
        name="twitter:description"
        content="${escapeHtml(description)}"
    />

    <meta
        name="twitter:image"
        content="${escapeHtml(image)}"
    />
</head>

<body>
    <p>${escapeHtml(title)}</p>
</body>
</html>
        `);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Failed to load post");
    }
}
declare const process: { env: { API_URL?: string; }; };

export default async function handler(
    req: Request
) {
    const url = new URL(req.url);
    const slug = url.pathname.split("/").pop();

    if (!slug) {
        return new Response("Invalid slug", {
            status: 400,
        });
    }

    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
        return new Response("API_URL is not configured", {
            status: 500,
        });
    }

    try {
        const response = await fetch(
            `${apiUrl}/api/posts/${encodeURIComponent(slug)}`
        );

        if (!response.ok) {
            return new Response("Post not found", {
                status: response.status,
            });
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

        const postUrl =
            `https://blog.tubbylab.com/posts/${post.slug}`;

        const image =
            post.coverImageUrl ||
            "https://blog.tubbylab.com/og-image.png";

        const escapeHtml = (value: string) =>
            String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const html = `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">

    <title>${escapeHtml(title)}</title>

    <meta
        name="description"
        content="${escapeHtml(description)}"
    >

    <link
        rel="canonical"
        href="${escapeHtml(postUrl)}"
    >

    <meta
        property="og:title"
        content="${escapeHtml(title)}"
    >

    <meta
        property="og:description"
        content="${escapeHtml(description)}"
    >

    <meta
        property="og:url"
        content="${escapeHtml(postUrl)}"
    >

    <meta
        property="og:type"
        content="article"
    >

    <meta
        property="og:image"
        content="${escapeHtml(image)}"
    >

    <meta
        name="twitter:card"
        content="summary_large_image"
    >

    <meta
        name="twitter:title"
        content="${escapeHtml(title)}"
    >

    <meta
        name="twitter:description"
        content="${escapeHtml(description)}"
    >

    <meta
        name="twitter:image"
        content="${escapeHtml(image)}"
    >
</head>

<body>
    <h1>${escapeHtml(title)}</h1>
</body>
</html>
`;

        return new Response(html, {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control":
                    "public, s-maxage=300, stale-while-revalidate=600",
            },
        });
    } catch (error) {
        console.error(error);

        return new Response("Failed to load post", {
            status: 500,
        });
    }
}
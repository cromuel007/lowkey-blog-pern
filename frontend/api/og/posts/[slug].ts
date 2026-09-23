import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const slug = req.query.slug;

    if (!slug || Array.isArray(slug)) {
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

        const postUrl =
            `https://blog.tubbylab.com/posts/${post.slug}`;

        const image =
            post.coverImageUrl ||
            "https://blog.tubbylab.com/og-image.png";

        const author = post.authorName || "Cromuel";

        const publishedAt =
            post.publishedAt || null;

        const modifiedAt =
            post.updatedAt ||
            post.publishedAt ||
            null;

        const escapeHtml = (value: string) =>
            String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const escapeJsonLd = (value: unknown) =>
            JSON.stringify(value)
                .replace(/</g, "\\u003c")
                .replace(/>/g, "\\u003e")
                .replace(/&/g, "\\u0026");

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: title,
            description,
            image: [image],
            url: postUrl,
            ...(publishedAt && {
                datePublished: publishedAt,
            }),
            ...(modifiedAt && {
                dateModified: modifiedAt,
            }),
            author: {
                "@type": "Person",
                name: author,
            },
            publisher: {
                "@type": "Person",
                name: author,
            },
            mainEntityOfPage: {
                "@type": "WebPage",
                "@id": postUrl,
            },
        };

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

    ${
        publishedAt
            ? `
    <meta
        property="article:published_time"
        content="${escapeHtml(publishedAt)}"
    >
    `
            : ""
    }

    ${
        modifiedAt
            ? `
    <meta
        property="article:modified_time"
        content="${escapeHtml(modifiedAt)}"
    >
    `
            : ""
    }

    <meta
        property="article:author"
        content="${escapeHtml(author)}"
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

    <script type="application/ld+json">
        ${escapeJsonLd(jsonLd)}
    </script>
</head>

<body>
    <article>
        <h1>${escapeHtml(title)}</h1>

        <p>
            By ${escapeHtml(author)}
        </p>

        ${
            publishedAt
                ? `
        <time datetime="${escapeHtml(publishedAt)}">
            Published ${escapeHtml(publishedAt)}
        </time>
        `
                : ""
        }
    </article>
</body>
</html>
`;

        res.setHeader(
            "Cache-Control",
            "public, s-maxage=300, stale-while-revalidate=600"
        );

        res.setHeader(
            "Content-Type",
            "text/html; charset=utf-8"
        );

        return res.status(200).send(html);
    } catch (error) {
        console.error(error);

        return res.status(500).send("Failed to load post");
    }
}


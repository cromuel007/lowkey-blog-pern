import type { ResearchResponse } from "../schemas/aiResearch.schema.js";
import { prisma } from "../lib/prisma.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function truncateSeoDescription(value: string, maxLength = 320): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
}

async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (
    await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function saveResearchResults(
  research: ResearchResponse,
) {
  const saved = [];

  const now = new Date();

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const discovery of research.discoveries) {
    const publishedAt = new Date(discovery.publishedAt);

    // Ignore articles older than 7 days.
    if (publishedAt < sevenDaysAgo) {
      continue;
    }

    // Ignore articles with a future publication date.
    if (publishedAt > now) {
      continue;
    }

    // Prevent the same source from being inserted multiple times.
    const existingPost = await prisma.post.findFirst({
      where: {
        content: {
          contains: discovery.url,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    if (existingPost) {
      continue;
    }

    const slug = await generateUniqueSlug(discovery.title);

    const content = `
${discovery.summary}

## Why it matters

${discovery.whyItMatters}

## Source

[${discovery.source}](${discovery.url})
`.trim();

    const post = await prisma.post.create({
      data: {
        title: discovery.title,
        slug,
        excerpt: discovery.summary,
        content,
        seoTitle: discovery.title,
        seoDescription: truncateSeoDescription(discovery.summary),
        published: false,
        publishedAt,
      },
    });

    saved.push(post);
  }

  return saved;
}

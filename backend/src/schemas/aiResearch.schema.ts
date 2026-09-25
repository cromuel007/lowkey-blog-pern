import { z } from "zod";

export const researchItemSchema = z.object({
  title: z.string().min(1),
  source: z.string().min(1),
  url: z.url(),
  publishedAt: z.iso.datetime(),
  summary: z.string().min(1),
  whyItMatters: z.string().min(1),
  topic: z.string().min(1),
});

export const researchResponseSchema = z.object({
  discoveries: z.array(researchItemSchema).max(5),
});

export type ResearchResponse = z.infer<typeof researchResponseSchema>;
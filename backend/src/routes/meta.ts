import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

router.get("/categories", async (_req, res) => {
  res.json(await prisma.category.findMany({ orderBy: { name: "asc" } }));
});

router.post("/categories", requireAuth, async (req, res) => {
  const parsed = z.object({ name: z.string().min(1).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid category." });

  const slug = parsed.data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  res.status(201).json(await prisma.category.create({ data: { name: parsed.data.name, slug } }));
});

router.get("/tags", async (_req, res) => {
  res.json(await prisma.tag.findMany({ orderBy: { name: "asc" } }));
});

router.post("/tags", requireAuth, async (req, res) => {
  const parsed = z.object({ name: z.string().min(1).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid tag." });

  const slug = parsed.data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  res.status(201).json(await prisma.tag.create({ data: { name: parsed.data.name, slug } }));
});

export default router;

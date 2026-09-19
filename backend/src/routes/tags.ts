import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/tags
 * Get all tags
 */
router.get("/", requireAuth, async (req, res) => {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: {
                name: "asc",
            },
            include: {
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        });

        res.json(tags);
    } catch (error) {
        console.error("Get tags error:", error);

        res.status(500).json({
            message: "Could not fetch tags.",
        });
    }
});

/**
 * GET /api/tags/:id
 * Get a single tag
 */
router.get("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid tag ID.",
            });
        }

        const tag = await prisma.tag.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        });

        if (!tag) {
            return res.status(404).json({
                message: "Tag not found.",
            });
        }

        res.json(tag);
    } catch (error) {
        console.error("Get tag error:", error);

        res.status(500).json({
            message: "Could not fetch tag.",
        });
    }
});

/**
 * POST /api/tags
 * Create a tag
 */
router.post("/", requireAuth, async (req, res) => {
    try {
        const name =
            typeof req.body.name === "string"
                ? req.body.name.trim()
                : "";

        const slug =
            typeof req.body.slug === "string"
                ? req.body.slug.trim().toLowerCase()
                : "";

        if (!name) {
            return res.status(400).json({
                message: "Tag name is required.",
            });
        }

        if (!slug) {
            return res.status(400).json({
                message: "Tag slug is required.",
            });
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                slug,
            },
        });

        res.status(201).json(tag);
    } catch (error: any) {
        console.error("Create tag error:", error);

        if (error?.code === "P2002") {
            return res.status(409).json({
                message: "A tag with this name or slug already exists.",
            });
        }

        res.status(500).json({
            message: "Could not create tag.",
        });
    }
});

/**
 * PUT /api/tags/:id
 * Update a tag
 */
router.put("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid tag ID.",
            });
        }

        const existingTag = await prisma.tag.findUnique({
            where: {
                id,
            },
        });

        if (!existingTag) {
            return res.status(404).json({
                message: "Tag not found.",
            });
        }

        const name =
            typeof req.body.name === "string"
                ? req.body.name.trim()
                : "";

        const slug =
            typeof req.body.slug === "string"
                ? req.body.slug.trim().toLowerCase()
                : "";

        if (!name) {
            return res.status(400).json({
                message: "Tag name is required.",
            });
        }

        if (!slug) {
            return res.status(400).json({
                message: "Tag slug is required.",
            });
        }

        const tag = await prisma.tag.update({
            where: {
                id,
            },
            data: {
                name,
                slug,
            },
        });

        res.json(tag);
    } catch (error: any) {
        console.error("Update tag error:", error);

        if (error?.code === "P2002") {
            return res.status(409).json({
                message: "A tag with this name or slug already exists.",
            });
        }

        res.status(500).json({
            message: "Could not update tag.",
        });
    }
});

/**
 * DELETE /api/tags/:id
 * Delete a tag
 */
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid tag ID.",
            });
        }

        const tag = await prisma.tag.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        });

        if (!tag) {
            return res.status(404).json({
                message: "Tag not found.",
            });
        }

        if (tag._count.posts > 0) {
            return res.status(409).json({
                message:
                    "Cannot delete this tag because it is assigned to posts.",
            });
        }

        await prisma.tag.delete({
            where: {
                id,
            },
        });

        res.status(204).send();
    } catch (error: any) {
        console.error("Delete tag error:", error);

        if (error?.code === "P2003") {
            return res.status(409).json({
                message:
                    "Cannot delete this tag because it is assigned to posts.",
            });
        }

        res.status(500).json({
            message: "Could not delete tag.",
        });
    }
});

export default router;
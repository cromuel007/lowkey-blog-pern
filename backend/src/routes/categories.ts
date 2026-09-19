import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/categories
 * Get all categories
 */
router.get("/", requireAuth, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
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

        res.json(categories);
    } catch (error) {
        console.error("Get categories error:", error);

        res.status(500).json({
            message: "Could not fetch categories.",
        });
    }
});

/**
 * GET /api/categories/:id
 * Get a single category
 */
router.get("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid category ID.",
            });
        }

        const category = await prisma.category.findUnique({
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

        if (!category) {
            return res.status(404).json({
                message: "Category not found.",
            });
        }

        res.json(category);
    } catch (error) {
        console.error("Get category error:", error);

        res.status(500).json({
            message: "Could not fetch category.",
        });
    }
});

/**
 * POST /api/categories
 * Create a category
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
                message: "Category name is required.",
            });
        }

        if (!slug) {
            return res.status(400).json({
                message: "Category slug is required.",
            });
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
            },
        });

        res.status(201).json(category);
    } catch (error: any) {
        console.error("Create category error:", error);

        if (error?.code === "P2002") {
            return res.status(409).json({
                message: "A category with this name or slug already exists.",
            });
        }

        res.status(500).json({
            message: "Could not create category.",
        });
    }
});

/**
 * PUT /api/categories/:id
 * Update a category
 */
router.put("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid category ID.",
            });
        }

        const existingCategory = await prisma.category.findUnique({
            where: {
                id,
            },
        });

        if (!existingCategory) {
            return res.status(404).json({
                message: "Category not found.",
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
                message: "Category name is required.",
            });
        }

        if (!slug) {
            return res.status(400).json({
                message: "Category slug is required.",
            });
        }

        const category = await prisma.category.update({
            where: {
                id,
            },
            data: {
                name,
                slug,
            },
        });

        res.json(category);
    } catch (error: any) {
        console.error("Update category error:", error);

        if (error?.code === "P2002") {
            return res.status(409).json({
                message: "A category with this name or slug already exists.",
            });
        }

        res.status(500).json({
            message: "Could not update category.",
        });
    }
});

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid category ID.",
            });
        }

        const category = await prisma.category.findUnique({
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

        if (!category) {
            return res.status(404).json({
                message: "Category not found.",
            });
        }

        if (category._count.posts > 0) {
            return res.status(409).json({
                message:
                    "Cannot delete this category because it is assigned to posts.",
            });
        }

        await prisma.category.delete({
            where: {
                id,
            },
        });

        res.status(204).send();
    } catch (error: any) {
        console.error("Delete category error:", error);

        if (error?.code === "P2003") {
            return res.status(409).json({
                message:
                    "Cannot delete this category because it is assigned to posts.",
            });
        }

        res.status(500).json({
            message: "Could not delete category.",
        });
    }
});

export default router;
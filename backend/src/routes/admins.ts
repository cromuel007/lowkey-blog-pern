import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/admins
 * Get all admins
 */
router.get("/", requireAuth, async (req, res) => {
    try {
        const admins = await prisma.admin.findMany({
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json(admins);
    } catch (error) {
        console.error("Get admins error:", error);

        res.status(500).json({
            message: "Could not fetch admins.",
        });
    }
});

/**
 * GET /api/admins/:id
 * Get a single admin
 */
router.get("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid admin ID.",
            });
        }

        const admin = await prisma.admin.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found.",
            });
        }

        res.json(admin);
    } catch (error) {
        console.error("Get admin error:", error);

        res.status(500).json({
            message: "Could not fetch admin.",
        });
    }
});

/**
 * POST /api/admins
 * Create an admin
 */
router.post("/", requireAuth, async (req, res) => {
    try {
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password =
            typeof req.body.password === "string"
                ? req.body.password
                : "";

        if (!email) {
            return res.status(400).json({
                message: "Admin email is required.",
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Admin password is required.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const admin = await prisma.admin.create({
            data: {
                email,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(201).json(admin);
    } catch (error: any) {
        console.error("Create admin error:", error);

        if (error?.code === "P2002") {
            return res.status(409).json({
                message: "An admin with this email already exists.",
            });
        }

        res.status(500).json({
            message: "Could not create admin.",
        });
    }
});

/**
 * PUT /api/admins/:id
 * Update an admin
 */
router.put("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid admin ID.",
            });
        }

        const existingAdmin = await prisma.admin.findUnique({
            where: {
                id,
            },
        });

        if (!existingAdmin) {
            return res.status(404).json({
                message: "Admin not found.",
            });
        }

        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password =
            typeof req.body.password === "string"
                ? req.body.password
                : "";

        if (!email) {
            return res.status(400).json({
                message: "Admin email is required.",
            });
        }

        const data: {
            email: string;
            passwordHash?: string;
        } = {
            email,
        };

        if (password) {
            data.passwordHash = await bcrypt.hash(password, 12);
        }

        const admin = await prisma.admin.update({
            where: {
                id,
            },
            data,
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json(admin);
    } catch (error: any) {
        console.error("Update admin error:", error);

        if (error?.code === "P2002") {
            return res.status(409).json({
                message: "An admin with this email already exists.",
            });
        }

        res.status(500).json({
            message: "Could not update admin.",
        });
    }
});

/**
 * DELETE /api/admins/:id
 * Delete an admin
 */
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid admin ID.",
            });
        }

        const admin = await prisma.admin.findUnique({
            where: {
                id,
            },
        });

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found.",
            });
        }

        await prisma.admin.delete({
            where: {
                id,
            },
        });

        res.status(204).send();
    } catch (error: any) {
        console.error("Delete admin error:", error);

        if (error?.code === "P2003") {
            return res.status(409).json({
                message: "Cannot delete this admin.",
            });
        }

        res.status(500).json({
            message: "Could not delete admin.",
        });
    }
});

export default router;
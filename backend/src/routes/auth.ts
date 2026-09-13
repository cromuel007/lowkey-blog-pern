import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.post("/login", async (req, res) => {
  const parsed = z.object({
    email: z.email(),
    password: z.string().min(1)
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid credentials." });
  }

  const admin = await prisma.admin.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (!admin || !(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = jwt.sign(
    { sub: String(admin.id), email: admin.email },
    process.env.JWT_SECRET || "super-secret",
    { expiresIn: "7d" }
  );

  return res.json({
    token,
    admin: { id: admin.id, email: admin.email }
  });
});

export default router;

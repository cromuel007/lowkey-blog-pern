import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  adminId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET || "super-secret");

    if (typeof payload !== "object" || !payload.sub) {
      return res.status(401).json({ message: "Invalid token." });
    }

    req.adminId = Number(payload.sub);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

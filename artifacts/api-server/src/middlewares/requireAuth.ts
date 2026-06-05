import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = (auth?.sessionClaims?.userId as string) || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).userId = userId;
  next();
}

export function requireBearer(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  (req as any).bearerToken = authHeader.slice(7);
  next();
}

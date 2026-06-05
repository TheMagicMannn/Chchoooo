import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { syncUser } from "./syncUser";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = (auth?.sessionClaims?.userId as string) || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).userId = userId;

  // Lazy-sync: ensure this user has a row in the users table.
  // Fire syncUser as the next step in the middleware chain.
  syncUser(req, res, next);
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

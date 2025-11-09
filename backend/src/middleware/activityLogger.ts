import { Request, Response, NextFunction } from "express";

// 📝 Simple middleware to log user activity
export const activityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
}

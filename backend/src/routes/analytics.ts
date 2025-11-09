import express, { Request, Response } from "express";
const router = express.Router();

// 📊 Example analytics route
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Analytics route active ✅",
    visitors: Math.floor(Math.random() * 1000),
    activeUsers: Math.floor(Math.random() * 500),
    transactions: Math.floor(Math.random() * 200),
  });
});

export default router;

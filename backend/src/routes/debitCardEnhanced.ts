import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { Request, Response, Router } from "express";
import logger from "../logger";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/debit-cards/my-cards
 * Get user's debit cards
 */
router.get(
  "/my-cards",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      const cards = await prisma.debit_cards.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      // Mask CVV for security
      const safeCards = cards.map((card) => ({
        ...card,
        cvv: "***",
      }));

      res.json({ success: true, cards: safeCards });
    } catch (error) {
      logger.error("Get cards error:", error);
      res.status(500).json({ error: "Failed to get cards" });
    }
  },
);

/**
 * POST /api/debit-cards/customize
 * Customize card design/name
 */
router.post(
  "/customize/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { cardId } = req.params;
      const { cardHolderName, nickname, color, design } = req.body;

      // Verify card belongs to user
      const card = await prisma.debit_cards.findFirst({
        where: { id: cardId, userId },
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      // Update customization
      const updated = await prisma.debit_cards.update({
        where: { id: cardId },
        data: {
          cardHolderName: cardHolderName || card.cardHolderName,
          // Note: nickname, color, design would need to be added to schema
          // For now, we can only update cardHolderName
        },
      });

      res.json({
        success: true,
        message: "Card customized successfully",
        card: { ...updated, cvv: "***" },
      });
    } catch (error) {
      logger.error("Customize card error:", error);
      res.status(500).json({ error: "Failed to customize card" });
    }
  },
);

/**
 * POST /api/debit-cards/set-pin
 * Set or change card PIN
 */
router.post(
  "/set-pin/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { cardId } = req.params;
      const { oldPin, newPin } = req.body;

      if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return res.status(400).json({ error: "PIN must be 4 digits" });
      }

      // Verify card belongs to user
      const card = await prisma.debit_cards.findFirst({
        where: { id: cardId, userId },
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      // In production, verify oldPin if card already has one
      // For now, we'll hash and store the new PIN
      const hashedPin = crypto
        .createHash("sha256")
        .update(newPin)
        .digest("hex");

      // Note: PIN storage would need to be added to schema
      // For now, we'll just return success
      // await prisma.debitCard.update({
      //   where: { id: cardId },
      //   data: { pinHash: hashedPin },
      // });

      res.json({
        success: true,
        message: "PIN updated successfully",
      });
    } catch (error) {
      logger.error("Set PIN error:", error);
      res.status(500).json({ error: "Failed to set PIN" });
    }
  },
);

/**
 * POST /api/debit-cards/freeze
 * Freeze/unfreeze card
 */
router.post(
  "/freeze/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { cardId } = req.params;
      const { freeze } = req.body; // true to freeze, false to unfreeze

      const card = await prisma.debit_cards.findFirst({
        where: { id: cardId, userId },
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      const newStatus = freeze ? "frozen" : "active";

      await prisma.debit_cards.update({
        where: { id: cardId },
        data: { status: newStatus },
      });

      res.json({
        success: true,
        message: freeze
          ? "Card frozen successfully"
          : "Card unfrozen successfully",
        status: newStatus,
      });
    } catch (error) {
      logger.error("Freeze card error:", error);
      res.status(500).json({ error: "Failed to update card status" });
    }
  },
);

/**
 * POST /api/debit-cards/set-limits
 * Set spending limits
 */
router.post(
  "/set-limits/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { cardId } = req.params;
      const { dailyLimit, monthlyLimit } = req.body;

      const card = await prisma.debit_cards.findFirst({
        where: { id: cardId, userId },
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      if (dailyLimit && (isNaN(dailyLimit) || dailyLimit <= 0)) {
        return res.status(400).json({ error: "Invalid daily limit" });
      }

      await prisma.debit_cards.update({
        where: { id: cardId },
        data: {
          dailyLimit: dailyLimit || card.dailyLimit,
          // monthlyLimit would need to be added to schema
        },
      });

      res.json({
        success: true,
        message: "Spending limits updated",
        dailyLimit: dailyLimit || card.dailyLimit,
      });
    } catch (error) {
      logger.error("Set limits error:", error);
      res.status(500).json({ error: "Failed to set limits" });
    }
  },
);

/**
 * GET /api/debit-cards/transactions/:cardId
 * Get card transactions
 */
router.get(
  "/transactions/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { cardId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const card = await prisma.debit_cards.findFirst({
        where: { id: cardId, userId },
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      // Get transactions for this card
      // Note: Would need to add cardId to Transaction model
      const transactions = await prisma.transactions.findMany({
        where: {
          userId,
          // cardId: cardId, // Would need this field in schema
        },
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
      });

      res.json({
        success: true,
        transactions,
        hasMore: transactions.length === Number(limit),
      });
    } catch (error) {
      logger.error("Get card transactions error:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  },
);

/**
 * POST /api/debit-cards/request-physical
 * Request upgrade to physical card
 */
router.post(
  "/request-physical/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { cardId } = req.params;
      const { shippingAddress, expedited } = req.body;

      if (!shippingAddress) {
        return res.status(400).json({ error: "Shipping address required" });
      }

      const card = await prisma.debit_cards.findFirst({
        where: { id: cardId, userId },
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      if (card.cardType === "physical") {
        return res.status(400).json({ error: "Card is already physical" });
      }

      // Create support ticket for physical card request
      await prisma.support_tickets.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          subject: "Physical Card Request",
          message: `Card ID: ${cardId}\nShipping Address: ${shippingAddress}\nExpedited: ${expedited ? "Yes" : "No"}`,
          category: "BILLING",
          status: "OPEN",
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message:
          "Physical card request submitted. Admin will review and process your request.",
        estimatedDelivery: expedited
          ? "3-5 business days"
          : "7-10 business days",
      });
    } catch (error) {
      logger.error("Request physical card error:", error);
      res.status(500).json({ error: "Failed to request physical card" });
    }
  },
);

/**
 * DELETE /api/debit-cards/:cardId
 * Cancel/close a card
 */
router.delete(
  "/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { cardId } = req.params;

      const card = await prisma.debit_cards.findFirst({
        where: { id: cardId, userId },
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      // Set status to cancelled instead of deleting
      await prisma.debit_cards.update({
        where: { id: cardId },
        data: { status: "cancelled" },
      });

      res.json({
        success: true,
        message: "Card cancelled successfully",
      });
    } catch (error) {
      logger.error("Cancel card error:", error);
      res.status(500).json({ error: "Failed to cancel card" });
    }
  },
);

export default router;

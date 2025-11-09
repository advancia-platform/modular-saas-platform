// RPA Module - Chatbot Integration
// Botpress-powered AI chatbot for automated user support

import prisma from "../prismaClient";
import { rpaConfig } from "./config";

interface ChatbotRequest {
  userId: string;
  message: string;
  sessionId?: string;
}

interface ChatbotResponse {
  reply: string;
  data?: any;
  suggestions?: string[];
}

export class ChatbotSupport {
  /**
   * Get user balance for chatbot
   */
  async getUserBalance(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { usdBalance: true },
      });

      return user ? Number(user.usdBalance) : 0;
    } catch (error) {
      console.error("[Chatbot] Error fetching user balance:", error);
      return 0;
    }
  }

  /**
   * Get recent transactions for chatbot
   */
  async getRecentTransactions(userId: string, limit: number = 5) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          status: true,
          createdAt: true,
        },
      });

      return transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        status: t.status,
        date: t.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error("[Chatbot] Error fetching transactions:", error);
      return [];
    }
  }

  /**
   * Get KYC status for chatbot
   */
  async getKYCStatus(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return { verified: false, status: "Not found" };
      }

      // Check if user has admin role (simplified KYC check)
      const isVerified = user.role === "ADMIN";

      return {
        verified: isVerified,
        status: isVerified ? "Verified" : "Pending",
        accountAge: Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    } catch (error) {
      console.error("[Chatbot] Error fetching KYC status:", error);
      return { verified: false, status: "Error" };
    }
  }

  /**
   * Get crypto orders for chatbot
   */
  async getCryptoOrders(userId: string, limit: number = 5) {
    try {
      const orders = await prisma.cryptoOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          cryptoType: true,
          cryptoAmount: true,
          usdAmount: true,
          status: true,
          createdAt: true,
        },
      });

      return orders.map((o) => ({
        id: o.id,
        crypto: o.cryptoType,
        cryptoAmount: Number(o.cryptoAmount),
        usdAmount: Number(o.usdAmount),
        status: o.status,
        date: o.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error("[Chatbot] Error fetching crypto orders:", error);
      return [];
    }
  }

  /**
   * Handle FAQ queries
   */
  async handleFAQ(question: string): Promise<ChatbotResponse> {
    const faqDatabase = {
      "how to deposit": {
        reply: "To deposit funds:\n1. Go to Dashboard\n2. Click 'Add Funds'\n3. Choose payment method (Card/Bank)\n4. Enter amount\n5. Confirm payment",
        suggestions: ["Check balance", "View transactions"],
      },
      "how to withdraw": {
        reply: "To withdraw funds:\n1. Go to Dashboard\n2. Click 'Withdraw'\n3. Enter amount\n4. Choose withdrawal method\n5. Confirm (minimum $10)",
        suggestions: ["Check balance", "Transaction history"],
      },
      "kyc verification": {
        reply: "KYC Verification:\n1. Upload government-issued ID\n2. Take a selfie\n3. Wait 1-3 business days\n4. Get notified via email",
        suggestions: ["Check KYC status", "Contact support"],
      },
      "buy crypto": {
        reply: "To buy cryptocurrency:\n1. Go to 'Crypto' section\n2. Select crypto type (BTC, ETH, etc.)\n3. Enter amount\n4. Review exchange rate\n5. Confirm purchase",
        suggestions: ["View crypto orders", "Check balance"],
      },
      "forgot password": {
        reply: "To reset your password:\n1. Click 'Forgot Password' on login\n2. Enter your email\n3. Check inbox for reset link\n4. Click link and set new password",
        suggestions: ["Login help", "Security tips"],
      },
      "account locked": {
        reply: "If your account is locked:\n1. Check email for security alerts\n2. Contact support@advancia.com\n3. Provide account details\n4. Our team will verify and unlock",
        suggestions: ["Contact support", "Security help"],
      },
      "transaction pending": {
        reply: "Pending transactions usually complete within:\n• Card payments: 1-5 minutes\n• Bank transfers: 1-3 business days\n• Crypto: 10-30 minutes\n\nIf longer, contact support.",
        suggestions: ["View transactions", "Contact support"],
      },
    };

    // Simple keyword matching
    const lowerQuestion = question.toLowerCase();
    
    for (const [key, value] of Object.entries(faqDatabase)) {
      if (lowerQuestion.includes(key)) {
        return value;
      }
    }

    return {
      reply: "I'm not sure about that. Let me connect you with a human agent, or you can browse our FAQ section.",
      suggestions: ["Talk to human", "View FAQ", "Main menu"],
    };
  }

  /**
   * Create support ticket
   */
  async createSupportTicket(userId: string, message: string): Promise<string> {
    try {
      // Log to audit trail
      await prisma.auditLog.create({
        data: {
          userId,
          action: "chatbot_support_ticket",
          resourceType: "Support",
          resourceId: "system",
          metadata: JSON.stringify({ message }),
          ipAddress: "Chatbot-System",
          userAgent: "Chatbot-RPA",
          timestamp: new Date(),
        },
      });

      // In production, integrate with ticketing system (Zendesk, Freshdesk, etc.)
      console.log(`[Chatbot] Support ticket created for user ${userId}`);
      
      return "Support ticket #" + Date.now().toString().slice(-6);
    } catch (error) {
      console.error("[Chatbot] Error creating support ticket:", error);
      throw error;
    }
  }

  /**
   * Process chatbot webhook from Botpress
   */
  async processWebhook(payload: any): Promise<any> {
    try {
      const { userId, message, action } = payload;

      console.log(`[Chatbot] Processing webhook - Action: ${action}, User: ${userId}`);

      switch (action) {
        case "get_balance":
          const balance = await this.getUserBalance(userId);
          return { balance };

        case "get_transactions":
          const transactions = await this.getRecentTransactions(userId);
          return { transactions };

        case "get_kyc_status":
          const kycStatus = await this.getKYCStatus(userId);
          return { kyc: kycStatus };

        case "get_crypto_orders":
          const orders = await this.getCryptoOrders(userId);
          return { orders };

        case "create_ticket":
          const ticketId = await this.createSupportTicket(userId, message);
          return { ticketId };

        case "faq":
          const faqResponse = await this.handleFAQ(message);
          return faqResponse;

        default:
          return { error: "Unknown action" };
      }
    } catch (error) {
      console.error("[Chatbot] Webhook processing error:", error);
      return { error: "Processing failed" };
    }
  }

  /**
   * Get chatbot analytics
   */
  async getAnalytics(startDate: Date, endDate: Date) {
    try {
      const interactions = await prisma.auditLog.count({
        where: {
          action: { startsWith: "chatbot_" },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const supportTickets = await prisma.auditLog.count({
        where: {
          action: "chatbot_support_ticket",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return {
        totalInteractions: interactions,
        supportTickets,
        automationRate: interactions > 0 
          ? ((interactions - supportTickets) / interactions * 100).toFixed(1)
          : 0,
      };
    } catch (error) {
      console.error("[Chatbot] Error fetching analytics:", error);
      return { totalInteractions: 0, supportTickets: 0, automationRate: 0 };
    }
  }
}

export default new ChatbotSupport();

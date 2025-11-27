/**
 * NOWPayments Service - Complete withdrawal and webhook implementation
 */

import axios from "axios";
import { logger } from "../logger";
import prisma from "../prismaClient";

const API_BASE = "https://api.nowpayments.io/v1";
const SANDBOX_BASE = "https://api-sandbox.nowpayments.io/v1";
const API_KEY = process.env.NOWPAYMENTS_API_KEY;
const IS_SANDBOX = process.env.NODE_ENV !== "production";

interface PayoutRequest {
  address: string;
  amount: number;
  currency: string;
  ipn_callback_url?: string;
  partially_acceptable?: boolean;
}

interface PayoutResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  address: string;
  hash?: string;
  network_fee?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create a payout via NOWPayments
 */
export async function createPayout(
  amount: number,
  currency: string,
  address: string,
  callbackUrl?: string,
): Promise<PayoutResponse> {
  if (!API_KEY) {
    throw new Error("NOWPayments API key not configured");
  }

  const baseUrl = IS_SANDBOX ? SANDBOX_BASE : API_BASE;

  try {
    const payload: PayoutRequest = {
      address,
      amount,
      currency: currency.toLowerCase(),
      ipn_callback_url: callbackUrl,
      partially_acceptable: false,
    };

    logger.info(
      {
        amount,
        currency,
        address: address.substring(0, 10) + "...", // Mask address for security
        sandbox: IS_SANDBOX,
      },
      "Creating NOWPayments payout",
    );

    const response = await axios.post(`${baseUrl}/payout`, payload, {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    logger.info("NOWPayments payout created successfully", {
      payoutId: response.data.id,
      status: response.data.status,
    });

    return response.data;
  } catch (error: any) {
    logger.error("NOWPayments payout creation failed", {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    throw new Error(
      error.response?.data?.message || "Failed to create NOWPayments payout",
    );
  }
}

/**
 * Get payout status
 */
export async function getPayoutStatus(
  payoutId: string,
): Promise<PayoutResponse> {
  if (!API_KEY) {
    throw new Error("NOWPayments API key not configured");
  }

  const baseUrl = IS_SANDBOX ? SANDBOX_BASE : API_BASE;

  try {
    const response = await axios.get(`${baseUrl}/payout/${payoutId}`, {
      headers: {
        "x-api-key": API_KEY,
      },
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        payoutId,
        response: error.response?.data,
      },
      "Failed to get NOWPayments payout status",
    );

    throw new Error("Failed to get payout status");
  }
}

/**
 * Handle NOWPayments webhook for payout status updates
 */
export async function handleNOWPaymentsWebhook(
  data: any,
): Promise<{ success: boolean; message: string }> {
  try {
    const { payout_id, status, currency, amount, hash, network_fee } = data;

    if (!payout_id) {
      logger.warn({ data }, "NOWPayments webhook missing payout_id");
      return { success: false, message: "Missing payout_id" };
    }

    logger.info(
      {
        payoutId: payout_id,
        status,
        currency,
        amount,
      },
      "Processing NOWPayments webhook",
    );

    // Find the withdrawal record by txId (which stores the NOWPayments payout_id)
    const withdrawal = await prisma.crypto_withdrawals.findFirst({
      where: { txHash: payout_id },
      include: { user: true },
    });

    if (!withdrawal) {
      logger.warn(
        { payoutId: payout_id },
        "No withdrawal found for NOWPayments payout",
      );
      return { success: false, message: "Withdrawal not found" };
    }

    // Update withdrawal status based on NOWPayments status
    let withdrawalStatus = withdrawal.status;
    let completedAt = null;

    switch (status) {
      case "confirming":
      case "sending":
        withdrawalStatus = "processing";
        break;
      case "finished":
        withdrawalStatus = "completed";
        completedAt = new Date();
        break;
      case "failed":
      case "refunded":
      case "expired":
        withdrawalStatus = "failed";
        break;
      default:
        logger.warn({ status }, "Unknown NOWPayments payout status");
        break;
    }

    // Update the withdrawal record
    const updatedWithdrawal = await prisma.crypto_withdrawals.update({
      where: { id: withdrawal.id },
      data: {
        status: withdrawalStatus,
        txHash: hash || withdrawal.txHash,
        networkFee: network_fee
          ? parseFloat(network_fee.toString())
          : withdrawal.networkFee,
        completedAt,
        updatedAt: new Date(),
      },
    });

    logger.info(
      {
        withdrawalId: withdrawal.id,
        userId: withdrawal.userId,
        oldStatus: withdrawal.status,
        newStatus: withdrawalStatus,
        txHash: hash,
      },
      "Withdrawal status updated from NOWPayments webhook",
    );

    // TODO: Emit socket event for real-time updates
    // TODO: Send email notification to user

    return { success: true, message: "Webhook processed successfully" };
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        webhookData: data,
      },
      "Failed to process NOWPayments webhook",
    );

    return { success: false, message: "Internal server error" };
  }
}

/**
 * Get available currencies from NOWPayments
 */
export async function getAvailableCurrencies(): Promise<string[]> {
  if (!API_KEY) {
    throw new Error("NOWPayments API key not configured");
  }

  const baseUrl = IS_SANDBOX ? SANDBOX_BASE : API_BASE;

  try {
    const response = await axios.get(`${baseUrl}/payout-currencies`, {
      headers: {
        "x-api-key": API_KEY,
      },
      timeout: 30000,
    });

    return response.data.currencies || [];
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        response: error.response?.data,
      },
      "Failed to get NOWPayments currencies",
    );

    // Return fallback currencies if API fails
    return ["btc", "eth", "usdt", "bnb", "ltc", "doge"];
  }
}

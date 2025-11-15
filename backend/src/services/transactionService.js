import prisma from "../prismaClient.js";

/**
 * Record a new transaction in the DB
 * @param {Object} params - Transaction parameters
 * @param {string} params.provider - Payment provider (stripe/cryptomus)
 * @param {string} params.orderId - Unique order identifier
 * @param {number} params.amount - Transaction amount
 * @param {string} params.currency - Currency code (USD, USDT, etc.)
 * @param {string} params.status - Transaction status
 * @param {string} params.userId - User ID
 * @param {string} [params.description] - Optional description
 * @returns {Promise<Object>} Created transaction record
 */
export async function recordTransaction({
  provider,
  orderId,
  amount,
  currency,
  status = "confirmed",
  userId,
  description,
}) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        orderId,
        provider,
        amount,
        currency: currency || "USD",
        type: "credit",
        description:
          description || `Payment via ${provider} - Order: ${orderId}`,
        category: `${provider}_payment`,
        status,
      },
    });

    console.log(
      `✅ Transaction recorded: ${provider} - ${amount} ${currency} for user ${userId}`
    );
    return transaction;
  } catch (error) {
    console.error("Error recording transaction:", error);
    throw error;
  }
}

/**
 * Credit the admin wallet balance
 * @param {number} amount - Amount to credit
 * @param {string} currency - Currency code
 * @returns {Promise<Object>} Updated admin wallet record
 */
export async function creditAdminWallet(amount, currency) {
  try {
    // Find existing wallet for currency
    let wallet = await prisma.adminWallet.findFirst({
      where: { currency: currency.toUpperCase() },
    });

    if (wallet) {
      // Update existing wallet
      wallet = await prisma.adminWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          totalIn: { increment: amount },
        },
      });
    } else {
      // Create new wallet if it doesn't exist
      wallet = await prisma.adminWallet.create({
        data: {
          currency: currency.toUpperCase(),
          balance: amount,
          totalIn: amount,
          totalOut: 0,
        },
      });
    }

    console.log(
      `💰 Admin wallet credited: +${amount} ${currency} (Balance: ${wallet.balance})`
    );
    return wallet;
  } catch (error) {
    console.error("Error crediting admin wallet:", error);
    throw error;
  }
}

/**
 * Credit a user's crypto wallet
 * @param {string} userId - User ID
 * @param {number} amount - Amount to credit
 * @param {string} currency - Currency code
 * @returns {Promise<Object>} Updated crypto wallet record
 */
export async function creditUserCryptoWallet(userId, amount, currency) {
  try {
    let userWallet = await prisma.cryptoWallet.findFirst({
      where: {
        userId: userId,
        currency: currency.toUpperCase(),
      },
    });

    if (!userWallet) {
      userWallet = await prisma.cryptoWallet.create({
        data: {
          userId: userId,
          currency: currency.toUpperCase(),
          balance: 0,
          address: "",
        },
      });
    }

    const updatedWallet = await prisma.cryptoWallet.update({
      where: { id: userWallet.id },
      data: {
        balance: { increment: amount },
      },
    });

    console.log(
      `👤 User ${userId} crypto wallet credited: +${amount} ${currency} (Balance: ${updatedWallet.balance})`
    );
    return updatedWallet;
  } catch (error) {
    console.error("Error crediting user crypto wallet:", error);
    throw error;
  }
}

/**
 * Credit a user's USD balance
 * @param {string} userId - User ID
 * @param {number} amount - Amount to credit
 * @returns {Promise<Object>} Updated user record
 */
export async function creditUserUsdBalance(userId, amount) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        usdBalance: { increment: amount },
      },
    });

    console.log(
      `💵 User ${userId} USD balance credited: +${amount} (Balance: ${updatedUser.usdBalance})`
    );
    return updatedUser;
  } catch (error) {
    console.error("Error crediting user USD balance:", error);
    throw error;
  }
}

/**
 * Get transaction by order ID
 * @param {string} orderId - Order identifier
 * @returns {Promise<Object|null>} Transaction record or null
 */
export async function getTransactionByOrderId(orderId) {
  try {
    // Try regular transactions first
    const transaction = await prisma.transaction.findFirst({
      where: {
        description: {
          contains: `Order: ${orderId}`,
        },
      },
    });

    if (transaction) {
      return transaction;
    }

    // Try crypto payments
    const cryptoPayment = await prisma.cryptoPayments.findFirst({
      where: {
        order_id: orderId,
      },
    });

    return cryptoPayment;
  } catch (error) {
    console.error("Error getting transaction by order ID:", error);
    throw error;
  }
}

export function emitPaymentNotification(userId, paymentData) {
  const io = global.io;
  if (io) {
    io.to(`user-${userId}`).emit("payment_confirmed", paymentData);
    console.log(`📡 Payment notification sent to user ${userId}`);
  }
}

import { requireAdmin, unauthorizedResponse } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const adminUser = await requireAdmin(request);
    if (!adminUser) {
      return unauthorizedResponse();
    }

    const { userId, amount } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json(
        { error: "User ID and amount are required" },
        { status: 400 }
      );
    }

    // Update user credits (assuming you have a credits field)
    const user = await prisma.user.update({
      where: { id: userId },
      data: { usdBalance: { increment: amount } }, // Adjust field name as needed
    });

    // Record the admin credit transaction
    await prisma.adminWalletTransaction.create({
      data: {
        adminWalletId: "usd-wallet", // You'll need to get the actual admin wallet ID
        userId,
        amount: amount,
        currency: "USD",
        type: "credit",
        description: `Admin credit to user ${userId}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        usdBalance: user.usdBalance,
      },
    });
  } catch (error) {
    console.error("Error crediting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

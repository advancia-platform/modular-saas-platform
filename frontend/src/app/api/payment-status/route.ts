import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    // Query the transaction by orderId
    // Since Transaction model doesn't have orderId field, we'll search by description
    const transaction = await prisma.transaction.findFirst({
      where: {
        description: {
          contains: `Order: ${orderId}`,
        },
      },
      select: {
        id: true,
        status: true,
        amount: true,
        type: true,
        createdAt: true,
        description: true,
      },
    });

    if (!transaction) {
      // Also check crypto payments table
      const cryptoPayment = await prisma.cryptoPayments.findFirst({
        where: {
          order_id: orderId,
        },
        select: {
          id: true,
          status: true,
          amount: true,
          created_at: true,
          paid_at: true,
        },
      });

      if (!cryptoPayment) {
        return NextResponse.json({ status: "not_found" }, { status: 404 });
      }

      // Map crypto payment status to unified status
      const unifiedStatus =
        cryptoPayment.status === "paid"
          ? "confirmed"
          : cryptoPayment.status === "pending"
          ? "pending"
          : "failed";

      return NextResponse.json({
        status: unifiedStatus,
        amount: cryptoPayment.amount,
        createdAt: cryptoPayment.created_at,
        paidAt: cryptoPayment.paid_at,
      });
    }

    return NextResponse.json({
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      description: transaction.description,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

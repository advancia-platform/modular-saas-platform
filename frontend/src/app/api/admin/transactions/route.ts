import { requireAdmin, unauthorizedResponse } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminUser = await requireAdmin(request);
    if (!adminUser) {
      return unauthorizedResponse();
    }

    // Get all transactions for admin view
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Limit for admin view
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

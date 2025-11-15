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

    // Get all admin wallets
    const wallets = await prisma.adminWallet.findMany({
      select: {
        id: true,
        currency: true,
        balance: true,
      },
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error("Error fetching admin wallets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

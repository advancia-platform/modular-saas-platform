import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get("Authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your cron job logic here
  try {
    console.log("Cron job executed at:", new Date().toISOString());

    // Example: Call backend API, send notifications, etc.
    // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-task`);

    return NextResponse.json({
      ok: true,
      message: "Cron job completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Cron job failed",
      },
      { status: 500 }
    );
  }
}

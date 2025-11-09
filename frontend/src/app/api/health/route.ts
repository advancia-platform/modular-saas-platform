import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check API Route
 * GET /api/health
 * 
 * Returns the health status of the application including uptime, timestamp, and memory usage.
 */
export async function GET(_request: NextRequest) {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      status: 'ok',
      uptime: Math.floor(uptime),
      timestamp: new Date().toISOString(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import type { TaskResponse } from '../../../../types/models';
import type { ErrorResponse, PaginatedResponse } from '../../../../types/responses';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') ?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 10);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          projectId: true,
          assigneeId: true,
          reporterId: true,
          priority: true,
          tags: true,
          dueDate: true,
          completedAt: true,
          estimatedHours: true,
          actualHours: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.task.count(),
    ]);

    const response: PaginatedResponse<TaskResponse> = {
      data: tasks.map((t) => ({
        ...t,
        dueDate: t.dueDate?.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })) as TaskResponse[],
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize),
        hasPrevPage: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    const error: ErrorResponse = {
      error: {
        code: 'SERVER_ERROR',
        message: err.message || 'Failed to fetch tasks',
      },
    };
    return NextResponse.json(error, { status: 500 });
  }
}

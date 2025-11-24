import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import type { ProjectResponse } from '../../../../types/models';
import type { ErrorResponse, PaginatedResponse } from '../../../../types/responses';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') ?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 10);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          teamId: true,
          ownerId: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.project.count(),
    ]);

    const response: PaginatedResponse<ProjectResponse> = {
      data: projects.map((project) => ({
        ...project,
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      })) as ProjectResponse[],
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
        message: err.message || 'Failed to fetch projects',
      },
    };
    return NextResponse.json(error, { status: 500 });
  }
}

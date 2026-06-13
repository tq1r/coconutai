import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import {
  createWorkspaceProject,
  deleteWorkspaceProject,
  listWorkspaceProjects,
  updateWorkspaceProject,
} from '@/lib/workspace-projects';
import type { NextRequest } from 'next/server';

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const workspaceName = request.nextUrl.searchParams.get('workspace_name') ?? 'Coconut AI Workspace';
    const projects = await listWorkspaceProjects(context.userId, workspaceName);
    return NextResponse.json(apiSuccess(projects), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/workspace/projects:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const workspaceName = body.workspace_name ?? 'Coconut AI Workspace';
    const name = body.name?.trim();
    const description = body.description?.trim();

    if (!name) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_MISSING_FIELD), { status: 400 });
    }

    const project = await createWorkspaceProject(context.userId, workspaceName, {
      name,
      description,
      metadata: body.metadata ?? null,
    });

    if (!project) {
      return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(apiSuccess(project), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in POST /api/workspace/projects:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
});

export const PATCH = withAuth(async (request: NextRequest, context) => {
  const body = await request.json();
  const projectId = body.project_id?.trim();

  if (!projectId) {
    return NextResponse.json(apiError(ErrorCodes.VALIDATION_MISSING_FIELD), { status: 400 });
  }

  const project = await updateWorkspaceProject(context.userId, projectId, {
    name: body.name?.trim(),
    description: body.description?.trim(),
    metadata: body.metadata ?? undefined,
  });

  if (!project) {
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(apiSuccess(project), { status: 200 });
});

export const DELETE = withAuth(async (request: NextRequest, context) => {
  const projectId = request.nextUrl.searchParams.get('project_id')?.trim();

  if (!projectId) {
    return NextResponse.json(apiError(ErrorCodes.VALIDATION_MISSING_FIELD), { status: 400 });
  }

  const deleted = await deleteWorkspaceProject(context.userId, projectId);
  if (!deleted) {
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(apiSuccess({ project_id: projectId }), { status: 200 });
});

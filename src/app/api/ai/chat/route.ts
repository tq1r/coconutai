import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { generateAIResponse } from '@/lib/ai-service';
import type { NextRequest } from 'next/server';

export const POST = withAuth(async (request: NextRequest, context) => {
  const body = await request.json();
  const { prompt, modelId, workspaceName, projectId, projectName, sessionCode } = body;

  if (!prompt || typeof prompt !== 'string' || !modelId || typeof modelId !== 'string') {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const selectedWorkspace = typeof workspaceName === 'string' && workspaceName.trim().length > 0
    ? workspaceName.trim()
    : 'Coconut AI Workspace';

  try {
    const aiResponse = await generateAIResponse(
      prompt.trim(),
      modelId,
      context.userId,
      context.role,
      context.subscriptionActive,
      context.subscriptionExpiresAt,
      selectedWorkspace,
      typeof projectId === 'string' && projectId.trim().length > 0 ? projectId.trim() : undefined,
      typeof projectName === 'string' && projectName.trim().length > 0 ? projectName.trim() : undefined,
      typeof sessionCode === 'string' && sessionCode.trim().length > 0 ? sessionCode.trim() : undefined
    );
    return NextResponse.json({ success: true, data: aiResponse }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'AI generation failed' }, { status: 500 });
  }
});

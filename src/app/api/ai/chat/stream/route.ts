import { withAuth } from '@/lib/auth-utils';
import { aiModels, getModelById } from '@/lib/ai-models';
import type { NextRequest } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GITHUB_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const GITHUB_COMPATIBLE: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
  'gpt-4': 'gpt-4',
  'mistral': 'Mistral-large',
  'gemini-flash': 'gpt-4o-mini',
  'llama-3.1-405b': 'Llama-3.1-405B-Instruct',
};
const SYSPROMPT = `You are Coconut AI, a world-class AI assistant who knows everything. You are a master of every domain: software engineering, game development, math, science, history, literature, art, music, pop culture, and general knowledge. You respond naturally and conversationally — like a brilliant friend who happens to know everything. You can answer any question: casual chat, weather, advice, coding, writing, analysis, you name it. When the user asks for code, write clean production-quality code. When they ask about the weather or random topics, answer helpfully. Be warm, direct, and never robotic.`;

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();
  const { prompt, modelId } = body;
  if (!prompt || typeof prompt !== 'string' || !modelId || typeof modelId !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const provider = GITHUB_TOKEN ? 'github' : OPENROUTER_API_KEY ? 'openrouter' : null;
  if (!provider) {
    return new Response(JSON.stringify({ error: 'No API key configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const model = getModelById(modelId);
  let resolvedModel = model?.id || modelId;
  if (provider === 'github' && !GITHUB_COMPATIBLE[resolvedModel]) resolvedModel = 'gpt-4o-mini';

  const endpoint = provider === 'github' ? GITHUB_ENDPOINT : OPENROUTER_ENDPOINT;
  const token = provider === 'github' ? GITHUB_TOKEN : OPENROUTER_API_KEY;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    headers['X-Title'] = 'Coconut AI';
  }

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: resolvedModel,
        messages: [{ role: 'system', content: SYSPROMPT }, { role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => 'stream failed');
      return new Response(JSON.stringify({ error: errText }), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const data = trimmed.slice(5).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip malformed */ }
            }
          }
        } catch { /* stream read error */ }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Stream failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

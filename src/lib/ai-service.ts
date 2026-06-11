import axios from 'axios';
import { aiModels, getModelById } from './ai-models';
import { insertUsage, generateId, now } from './db';
import type { AIResponse, AIModel } from '@/types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const sampleFallback = (model: AIModel, prompt: string) => {
  return `-- ${model.name} response for Roblox\n-- Prompt: ${prompt}\n\nlocal module = {}\n\nfunction module.hello()\n\tprint("Hello from Roblox!")\nend\n\nreturn module`;
};

async function requestOpenAI(prompt: string, model: AIModel): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    return { model: model.name, provider: model.provider, output: sampleFallback(model, prompt), usage: { prompt_tokens: prompt.length, completion_tokens: 64, total_tokens: prompt.length + 64 } };
  }
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: model.id, messages: [{ role: 'user', content: prompt }],
    temperature: 0.2, max_tokens: 800,
  }, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
  });
  const output = response.data.choices?.[0]?.message?.content ?? '';
  const usage = response.data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  return { model: model.name, provider: model.provider, output, usage };
}

async function requestAnthropic(prompt: string, model: AIModel): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    return { model: model.name, provider: model.provider, output: sampleFallback(model, prompt), usage: { prompt_tokens: prompt.length, completion_tokens: 64, total_tokens: prompt.length + 64 } };
  }
  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 800,
  }, {
    headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
  });
  const output = response.data.content?.[0]?.text ?? '';
  const u = response.data.usage || {};
  const usage = { prompt_tokens: u.input_tokens || 0, completion_tokens: u.output_tokens || 0, total_tokens: (u.input_tokens || 0) + (u.output_tokens || 0) };
  return { model: model.name, provider: model.provider, output, usage };
}

async function requestGeneric(prompt: string, model: AIModel): Promise<AIResponse> {
  return { model: model.name, provider: model.provider, output: sampleFallback(model, prompt), usage: { prompt_tokens: prompt.length, completion_tokens: 64, total_tokens: prompt.length + 64 } };
}

export async function generateAIResponse(
  prompt: string, modelId: string, userId: string, role: string,
  subscriptionActive: boolean, subscriptionExpiresAt: string | null,
  workspaceName = 'Coconut AI Workspace', projectId?: string, projectName?: string
): Promise<AIResponse> {
  const selectedModel = getModelById(modelId);
  if (!selectedModel) throw new Error('Unsupported model selected');

  if (selectedModel.premium) {
    const valid = subscriptionActive && (!subscriptionExpiresAt || new Date(subscriptionExpiresAt) > new Date());
    if (!valid && role !== 'admin') throw new Error('This model is reserved for premium subscribers.');
  }

  let result: AIResponse;
  switch (selectedModel.provider) {
    case 'openai': result = await requestOpenAI(prompt, selectedModel); break;
    case 'anthropic': result = await requestAnthropic(prompt, selectedModel); break;
    default: result = await requestGeneric(prompt, selectedModel); break;
  }

  insertUsage({
    id: generateId(), user_id: userId, type: 'ai_generation', value: result.usage.total_tokens,
    meta: JSON.stringify({ model: selectedModel.id, provider: selectedModel.provider, prompt_length: prompt.length, project_id: projectId, project_name: projectName }),
    created_at: now(),
  });

  const { createOrUpdateWorkspaceSession } = await import('./workspace');
  const existing = await createOrUpdateWorkspaceSession(userId, workspaceName, { metadata: {} });
  if (existing) {
    const existingMeta = existing.metadata || {};
    const mergedHistory = [
      ...(Array.isArray(existingMeta.history) ? existingMeta.history : []),
      { role: 'user' as const, text: prompt, timestamp: now() },
      { role: 'assistant' as const, text: result.output, timestamp: now() },
    ].slice(-20);

    await createOrUpdateWorkspaceSession(userId, workspaceName, {
      status: 'active', last_synced_at: now(),
      metadata: {
        ...existingMeta, last_prompt: prompt, last_response: result.output.slice(0, 300),
        model: selectedModel.name, provider: selectedModel.provider,
        history: mergedHistory, active_project_id: projectId, active_project_name: projectName,
      },
    });
  }

  return result;
}

export function getAvailableModels() {
  return aiModels;
}

import type { AIModel } from '@/types';

export const aiModels: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openrouter',
    description: 'OpenAI\'s flagship model — fast, smart, great for full Roblox systems.',
    premium: true,
    context_window: 128000,
    tags: ['openai', 'reasoning', 'premium'],
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus',
    provider: 'openrouter',
    description: 'Anthropic\'s most capable model — excels at complex scripting and architecture.',
    premium: true,
    context_window: 200000,
    tags: ['anthropic', 'premium', 'architecture'],
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    provider: 'openrouter',
    description: 'Best price-performance balance for daily Roblox development.',
    premium: false,
    context_window: 200000,
    tags: ['anthropic', 'balanced', 'prototyping'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openrouter',
    description: 'Lightweight and fast — ideal for quick scripts and iterations.',
    premium: false,
    context_window: 128000,
    tags: ['openai', 'fast', 'lightweight'],
  },
  {
    id: 'grok-3',
    name: 'Grok-3',
    provider: 'openrouter',
    description: 'xAI\'s latest — creative and unfiltered for unique game mechanics.',
    premium: false,
    context_window: 131072,
    tags: ['xai', 'creative', 'experimental'],
  },
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'openrouter',
    description: 'Google\'s fast model — great for rapid prototyping.',
    premium: false,
    context_window: 1048576,
    tags: ['google', 'fast', 'prototyping'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    provider: 'openrouter',
    description: 'Open-source efficient model for straightforward scripting tasks.',
    premium: false,
    context_window: 32000,
    tags: ['mistral', 'open-source', 'efficient'],
  },
  {
    id: 'txmo',
    name: 'TXMO',
    provider: 'local',
    description: 'Premium local AI model. Ultra-fast inference, no external API calls. Exclusive to premium subscribers.',
    premium: true,
    context_window: 16000,
    tags: ['local', 'premium', 'fast', 'exclusive'],
  },
];

export function getModelById(modelId: string) {
  return aiModels.find((model) => model.id === modelId) ?? null;
}

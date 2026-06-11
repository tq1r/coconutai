import type { AIModel } from '@/types';

export const aiModels: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'High-speed reasoning and generative power for Roblox systems.',
    premium: true,
    context_window: 8192,
    tags: ['openai', 'reasoning', 'premium'],
  },
  {
    id: 'gpt-4turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Optimized for fast generation and high throughput.',
    premium: true,
    context_window: 4096,
    tags: ['openai', 'fast', 'gaming'],
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus',
    provider: 'anthropic',
    description: 'Advanced creative reasoning for worldbuilding and scripting.',
    premium: true,
    context_window: 9000,
    tags: ['anthropic', 'creative', 'worldbuilding'],
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    provider: 'anthropic',
    description: 'Balanced reasoning for prototyping gameplay systems.',
    premium: false,
    context_window: 7000,
    tags: ['anthropic', 'balanced', 'prototyping'],
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    description: 'Premium reasoning for polished game systems.',
    premium: true,
    context_window: 8000,
    tags: ['google', 'pro', 'systems'],
  },
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'google',
    description: 'Fast, lightweight responses for quick iterations.',
    premium: false,
    context_window: 4096,
    tags: ['google', 'fast', 'lightweight'],
  },
  {
    id: 'grok-3',
    name: 'Grok-3',
    provider: 'xai',
    description: 'Experimental AI for rapid game mechanic discovery.',
    premium: false,
    context_window: 4096,
    tags: ['xai', 'experimental', 'rapid'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    provider: 'mistral',
    description: 'Open-source style model for flexible scripting ideas.',
    premium: false,
    context_window: 4096,
    tags: ['mistral', 'open-source', 'creative'],
  },
];

export function getModelById(modelId: string) {
  return aiModels.find((model) => model.id === modelId) ?? null;
}

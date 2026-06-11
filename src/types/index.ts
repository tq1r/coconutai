export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role: 'user' | 'premium' | 'admin';
  subscription_tier: 'free' | 'plus' | 'pro';
  subscription_active: boolean;
  subscription_expires_at?: string;
  roblox_id?: string;
  roblox_username?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User | null;
  session: { access_token: string; refresh_token?: string; expires_at?: number } | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  username: string;
  display_name: string;
}

export interface SubscriptionTier {
  id: 'free' | 'plus' | 'pro';
  name: string;
  price: number;
  features: string[];
  limits: { generations_per_month: number; max_context_length: number; supported_models: string[] };
}

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'local';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  premium: boolean;
  context_window: number;
  tags: string[];
}

export interface AIResponse {
  model: string;
  provider: AIProvider;
  output: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface WorkspaceHistoryEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface WorkspaceSessionMetadata {
  last_prompt?: string;
  last_response?: string;
  model?: string;
  provider?: AIProvider;
  history?: WorkspaceHistoryEntry[];
  active_project_id?: string;
  active_project_name?: string;
  [key: string]: any;
}

export interface WorkspaceSession {
  id: string;
  user_id: string;
  workspace_name: string;
  status: string;
  last_synced_at: string | null;
  metadata: WorkspaceSessionMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceProject {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  status: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type AuthProvider = 'email' | 'google' | 'github' | 'discord' | 'apple';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface RobloxUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface ScriptFile {
  id: string;
  name: string;
  content: string;
  language: 'lua' | 'luau' | 'json' | 'yaml';
  projectId: string;
  updatedAt: string;
}

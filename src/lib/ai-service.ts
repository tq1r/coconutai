import axios from 'axios';
import { aiModels, getModelById } from './ai-models';
import { insertUsage, generateId, now } from './db';
import type { AIResponse, AIModel } from '@/types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const GITHUB_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

function hasAnyKey(): boolean {
  return !!(GITHUB_TOKEN || OPENROUTER_API_KEY);
}

function getProvider(): 'github' | 'openrouter' | null {
  if (GITHUB_TOKEN) return 'github';
  if (OPENROUTER_API_KEY) return 'openrouter';
  return null;
}

const SYSTEM_PROMPT = `You are Coconut AI, a world-class AI assistant who knows everything. You are a master of every domain: software engineering, game development, math, science, history, literature, art, music, pop culture, and general knowledge. You respond naturally and conversationally — like a brilliant friend who happens to know everything. You can answer any question: casual chat, weather, advice, coding, writing, analysis, you name it. When the user asks for code, write clean production-quality code. When they ask about the weather or random topics, answer helpfully. Be warm, direct, and never robotic.

You also have the ability to push code into Roblox Studio through a plugin connection. When connected, you can create and edit scripts, generate builds, create animations, apply VFX, and more — all live inside the user's Roblox Studio. The user will enter a session code from the Coconut AI Studio Plugin to connect.`;

const GITHUB_FALLBACK_MODEL = 'gpt-4o-mini';

const GITHUB_COMPATIBLE: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
  'gpt-4': 'gpt-4',
  'mistral': 'Mistral-large',
  'gemini-flash': 'gpt-4o-mini',
};

async function requestAI(prompt: string, model: AIModel, sessionCode?: string): Promise<AIResponse> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No API key configured. Set GITHUB_TOKEN (free, from github.com) or OPENROUTER_API_KEY in Vercel env vars.');
  }

  let connectionContext = '';
  if (sessionCode && sessionCode.trim().length === 6) {
    try {
      const { findPluginSession } = await import('./db');
      const session = await findPluginSession(sessionCode.trim());
      if (session && session.status === 'active') {
        connectionContext = 'You are CURRENTLY CONNECTED to the user\'s Roblox Studio via the plugin session. This means you can create and edit scripts, generate builds, animate, apply VFX, and push code directly into their Roblox Studio project. The user will see your work appear live.';
      } else {
        connectionContext = 'You are NOT connected to Roblox Studio. The user has not entered a valid session code yet. Tell them they need to paste a session code from the Coconut AI Studio Plugin to enable live code pushes.';
      }
    } catch {
      connectionContext = '';
    }
  }

  const systemPrompt = connectionContext
    ? SYSTEM_PROMPT + '\n\n---\n' + connectionContext
    : SYSTEM_PROMPT;

  const endpoint = provider === 'github' ? GITHUB_ENDPOINT : OPENROUTER_ENDPOINT;
  const token = provider === 'github' ? GITHUB_TOKEN : OPENROUTER_API_KEY;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    headers['X-Title'] = 'Coconut AI';
  }

  let modelId = model.id;
  if (provider === 'github' && !GITHUB_COMPATIBLE[model.id]) {
    modelId = GITHUB_FALLBACK_MODEL;
  }

  try {
    const response = await axios.post(
      endpoint,
      {
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      },
      { headers }
    );

    const output = response.data.choices?.[0]?.message?.content ?? '';
    const u = response.data.usage || {};
    const usage = {
      prompt_tokens: u.prompt_tokens || 0,
      completion_tokens: u.completion_tokens || 0,
      total_tokens: (u.prompt_tokens || 0) + (u.completion_tokens || 0),
    };
    const displayModel = modelId === model.id ? model.name : `${model.name} (via ${modelId})`;
    return { model: displayModel, provider, output, usage };
  } catch (err: any) {
    if (provider === 'github' && modelId !== GITHUB_FALLBACK_MODEL) {
      const fallbackResp = await axios.post(
        endpoint,
        {
          model: GITHUB_FALLBACK_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        },
        { headers }
      );
      const fb = fallbackResp.data.choices?.[0]?.message?.content ?? '';
      const u = fallbackResp.data.usage || {};
      return {
        model: `${model.name} (via ${GITHUB_FALLBACK_MODEL})`,
        provider,
        output: fb,
        usage: { prompt_tokens: u.prompt_tokens || 0, completion_tokens: u.completion_tokens || 0, total_tokens: (u.prompt_tokens || 0) + (u.completion_tokens || 0) },
      };
    }
    throw err;
  }
}

async function requestLocal(prompt: string, model: AIModel): Promise<AIResponse> {
  if (hasAnyKey()) {
    try {
      return await requestAI(prompt, model);
    } catch { /* fall through to local */ }
  }

  const categories: [RegExp, string][] = [
    [/combat|fight|damage|sword|weapon|attack|enemy|health/, `-- Combat System (TXMO)
local CombatService = {}

function CombatService.dealDamage(target, damage)
\tlocal humanoid = target:FindFirstChildOfClass("Humanoid")
\tif humanoid then humanoid:TakeDamage(damage); return true end
\treturn false
end

function CombatService.createHitbox(character, range)
\tlocal root = character:FindFirstChild("HumanoidRootPart")
\tif not root then return end
\tlocal params = RaycastParams.new()
\tparams.FilterDescendantsInstances = {character}
\tparams.FilterType = Enum.RaycastFilterType.Blacklist
\tlocal result = workspace:Raycast(root.Position, root.CFrame.LookVector * range, params)
\treturn result
end

function CombatService.createProjectile(startPos, direction, speed, damage)
\tlocal proj = Instance.new("Part")
\tproj.Size, proj.Anchored, proj.CanCollide = Vector3.new(1,1,1), true, false
\tproj.BrickColor = BrickColor.new("Bright red")
\tproj.Position = startPos
\tlocal bv = Instance.new("BodyVelocity")
\tbv.Velocity, bv.MaxForce = direction * speed, Vector3.new(1,1,1) * math.huge
\tbv.Parent = proj
\tproj.Parent = workspace
\tcoroutine.wrap(function() task.wait(5); proj:Destroy() end)()
\tproj.Touched:Connect(function(hit)
\t\tlocal hum = hit.Parent:FindFirstChildOfClass("Humanoid")
\t\tif hum then hum:TakeDamage(damage); proj:Destroy() end
\tend)
\treturn proj
end

return CombatService`],
    [/gui|ui|screen|button|frame|menu|hud|dashboard/, `-- UI System (TXMO)
local function createFrame(name, parent, size, pos, color, trans)
\tlocal f = Instance.new("Frame")
\tf.Name, f.Parent, f.Size, f.Position = name, parent, size or UDim2.new(0,200,0,100), pos or UDim2.new(0.5,-100,0.5,-50)
\tf.BackgroundColor3, f.BackgroundTransparency, f.BorderSizePixel = color or Color3.fromRGB(30,30,40), trans or 0, 0
\treturn f
end

local function createButton(name, parent, size, pos, text, color)
\tlocal btn = Instance.new("TextButton")
\tbtn.Name, btn.Parent, btn.Size, btn.Position = name, parent, size or UDim2.new(0,150,0,40), pos or UDim2.new(0,0,0,0)
\tbtn.Text, btn.TextColor3, btn.TextSize, btn.Font = text or "Button", Color3.fromRGB(255,255,255), 16, Enum.Font.GothamSemibold
\tbtn.BackgroundColor3, btn.BorderSizePixel = color or Color3.fromRGB(20,184,166), 0
\treturn btn
end

local sg = Instance.new("ScreenGui")
sg.Name, sg.Parent = "CoconutUI", game.Players.LocalPlayer:WaitForChild("PlayerGui")

local main = createFrame("Main", sg, UDim2.new(0,400,0,500), UDim2.new(0.5,-200,0.5,-250), Color3.fromRGB(25,25,35))
local title = Instance.new("TextLabel")
title.Size, title.Position = UDim2.new(1,-20,0,40), UDim2.new(0,10,0,10)
title.Text, title.TextColor3, title.TextSize, title.Font = "Game Menu", Color3.fromRGB(255,255,255), 22, Enum.Font.GothamBold
title.BackgroundTransparency, title.Parent = 1, main

local btn = createButton("Play", main, UDim2.new(0,200,0,45), UDim2.new(0.5,-100,0,80), "Play", Color3.fromRGB(20,184,166))
btn.MouseButton1Click:Connect(function() print("Play!") end)

print("TXMO: UI generated")`],
    [/move|walk|run|speed|character|dash|jump|sprint/, `-- Movement System (TXMO)
local Movement = {}

function Movement.setWalkSpeed(char, speed)
\tlocal hum = char:FindFirstChildOfClass("Humanoid")
\tif hum then hum.WalkSpeed = speed end
end

function Movement.setJumpPower(char, power)
\tlocal hum = char:FindFirstChildOfClass("Humanoid")
\tif hum then hum.JumpPower = power end
end

function Movement.createDash(char, dist, dur)
\tlocal root, hum = char:FindFirstChild("HumanoidRootPart"), char:FindFirstChildOfClass("Humanoid")
\tif not root or not hum then return end
\thum.WalkSpeed = dist / dur
\ttask.wait(dur)
\thum.WalkSpeed = 16
end

function Movement.createSprint(char, sprintSpeed)
\tlocal uis = game:GetService("UserInputService")
\tlocal hum = char:FindFirstChildOfClass("Humanoid")
\tif not hum then return end
\tlocal normal = hum.WalkSpeed
\tuis.InputBegan:Connect(function(input)
\t\tif input.KeyCode == Enum.KeyCode.LeftShift then hum.WalkSpeed = sprintSpeed end
\tend)
\tuis.InputEnded:Connect(function(input)
\t\tif input.KeyCode == Enum.KeyCode.LeftShift then hum.WalkSpeed = normal end
\tend)
end

return Movement`],
    [/leaderboard|currency|shop|money|coins|score|points|economy/, `-- Economy System (TXMO)
local Economy = {}
local data = {}

function Economy:getData(player)
\tif not data[player.UserId] then
\t\tdata[player.UserId] = {coins=0, gems=0, exp=0, level=1, inv={}}
\tend
\treturn data[player.UserId]
end

function Economy:addCoins(player, amt)
\tlocal d = self:getData(player)
\td.coins += amt
\treturn d.coins
end

function Economy:spendCoins(player, amt)
\tlocal d = self:getData(player)
\tif d.coins >= amt then d.coins -= amt; return true end
\treturn false
end

function Economy:addExp(player, amt)
\tlocal d = self:getData(player)
\td.exp += amt
\twhile d.exp >= d.level * 100 do d.exp -= d.level * 100; d.level += 1 end
\treturn d.level
end

function Economy:addItem(player, name, qty)
\tlocal d = self:getData(player)
\td.inv[name] = (d.inv[name] or 0) + (qty or 1)
end

return Economy`],
  ];

  for (const [regex, code] of categories) {
    if (regex.test(p)) {
      return { model: model.name, provider: 'local', output: code, usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
    }
  }

  return {
    model: model.name, provider: 'local',
    output: `-- Generated by TXMO
-- Prompt: ${prompt}

local module = {}

function module.setup()
\tprint("TXMO generating: ${prompt}")
end

return module`,
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

export async function generateAIResponse(
  prompt: string, modelId: string, userId: string, role: string,
  subscriptionActive: boolean, subscriptionExpiresAt: string | null,
  workspaceName = 'Coconut AI Workspace', projectId?: string, projectName?: string,
  sessionCode?: string
): Promise<AIResponse> {
  const selectedModel = getModelById(modelId);
  if (!selectedModel) throw new Error('Unsupported model selected');

  if (selectedModel.premium) {
    const valid = subscriptionActive && (!subscriptionExpiresAt || new Date(subscriptionExpiresAt) > new Date());
    if (!valid && role !== 'admin') throw new Error('This model is reserved for premium subscribers.');
  }

  let result: AIResponse;
  if (selectedModel.provider === 'local') {
    result = await requestLocal(prompt, selectedModel);
  } else {
    result = await requestAI(prompt, selectedModel, sessionCode);
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

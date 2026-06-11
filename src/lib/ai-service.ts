import axios from 'axios';
import { aiModels, getModelById } from './ai-models';
import { insertUsage, generateId, now } from './db';
import type { AIResponse, AIModel } from '@/types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function requestOpenRouter(prompt: string, model: AIModel): Promise<AIResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in your environment variables.');
  }
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: model.id,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Roblox (Luau) developer. Generate clean, production-ready Luau code.\n- Use lowercase 2-space indentation\n- Use `game:GetService()` pattern\n- Prefer `Enum` values over raw numbers\n- Return only the code, no explanation unless the user asks',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Coconut AI',
      },
    }
  );
  const output = response.data.choices?.[0]?.message?.content ?? '';
  const u = response.data.usage || {};
  const usage = {
    prompt_tokens: u.prompt_tokens || 0,
    completion_tokens: u.completion_tokens || 0,
    total_tokens: (u.prompt_tokens || 0) + (u.completion_tokens || 0),
  };
  return { model: model.name, provider: 'openrouter', output, usage };
}

async function requestLocal(prompt: string, model: AIModel): Promise<AIResponse> {
  const p = prompt.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'sup', 'yo', 'whats up', 'how are you', 'good morning', 'good evening'];
  const isGreeting = (s: string) => greetings.some(g => s === g || s.startsWith(g + ' ') || s.startsWith(g + '?'));
  if (isGreeting(p) || p.includes('who are you') || p.includes('what are you') || p.includes('what can you')) {
    return {
      model: model.name, provider: 'local',
      output: "I'm Coconut AI's TXMO model — a local inference engine for Roblox development. I can generate combat systems, UI frameworks, movement scripts, economy systems, and more. Describe what you want to build!",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  const categories: [RegExp, string][] = [
    [/combat|fight|damage|sword|weapon|attack|enemy|health/, `-- Combat System (TXMO local)
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
    [/gui|ui|screen|button|frame|menu|hud|dashboard/, `-- UI System (TXMO local)
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
    [/move|walk|run|speed|character|dash|jump|sprint/, `-- Movement System (TXMO local)
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
    [/leaderboard|currency|shop|money|coins|score|points|economy/, `-- Economy System (TXMO local)
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
    output: `-- Generated by TXMO (local model)
-- Prompt: ${prompt}

local module = {}

function module.setup()
\tprint("TXMO generating: ${prompt}")
\t-- Add your custom logic here
end

return module`,
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
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
  if (selectedModel.provider === 'local') {
    result = await requestLocal(prompt, selectedModel);
  } else {
    result = await requestOpenRouter(prompt, selectedModel);
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

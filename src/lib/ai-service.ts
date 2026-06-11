import axios from 'axios';
import { aiModels, getModelById } from './ai-models';
import { insertUsage, generateId, now } from './db';
import type { AIResponse, AIModel } from '@/types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function detectIntent(prompt: string): 'chat' | 'code' {
  const p = prompt.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'sup', 'yo', 'wsp', 'whats up', 'how are you', 'good morning', 'good evening', 'howdy', 'whats good', 'wassup'];
  if (greetings.some(g => p === g || p.startsWith(g + ' ') || p.startsWith(g + '?'))) return 'chat';
  if (p.includes('who are you') || p.includes('what are you') || p.includes('what can you') || p === 'who are you?' || p === 'who r u') return 'chat';
  if (p.includes('thanks') || p.includes('thank you') || p.includes('ty') || p.includes('appreciate')) return 'chat';
  if (/^(ok|okay|kk|alright|sure|yes|no|yeah|nah|nope|yep)\s*$/.test(p)) return 'chat';
  if (/^(yo|lol|lmao|lmfao|nice|cool|awesome|sick|dope|bet|facts)\s*$/.test(p)) return 'chat';

  const hasCodeKeywords = /combat|fight|damage|sword|weapon|attack|enemy|health|gui|ui|screen|button|frame|menu|hud|move|walk|run|speed|dash|jump|sprint|leaderboard|currency|shop|money|coins|score|economy|tower|defense|game|script|code|function|local|module|loop|spawn|wave|enemy|projectile|bullet|gun|system/i.test(p);
  const isShortChat = p.split(/\s+/).length <= 4 && !hasCodeKeywords;

  if (isShortChat) return 'chat';
  if (hasCodeKeywords) return 'code';

  if (p.length < 15) return 'chat';

  return 'code';
}

function chatResponse(prompt: string): string {
  const p = prompt.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'sup', 'yo', 'wsp', 'whats up', 'how are you', 'good morning', 'good evening'];
  if (greetings.some(g => p === g || p.startsWith(g + ' ') || p.startsWith(g + '?'))) {
    return [
      "Hey! What are we building today? Combat, UI, animations, a building system, NPCs, vehicles — name it.",
      "Yo! Ready to build something sick. Tell me what you want — scripts, UI, animations, game systems, anything.",
      "Hey! I build Roblox games full-stack. Combat, UI, animations, building mechanics, NPCs, VFX — your call.",
    ][Math.floor(Math.random() * 3)];
  }
  if (p.includes('who are you') || p.includes('what are you') || p.includes('what can you')) {
    return "I'm Coconut AI — a Roblox dev who ships. I build:\n\n- Combat (damage, hitboxes, projectiles, weapons)\n- UI/UX (menus, HUDs, shop interfaces, settings screens)\n- Animations (tweens, keyframes, IK, motor6D rigging)\n- Building systems (grid placement, parts, terrain editing)\n- NPCs (pathfinding, behavior trees, dialogue)\n- Physics (vehicles, ragdolls, constraints)\n- VFX (beams, particles, lighting)\n- Audio (dynamic soundscapes, positional audio)\n- Economy (currencies, shops, leaderboards, XP)\n- Full game modes (tower defense, obby, tycoon, RPG, racing)\n\nTell me what you want to build. I'll generate the code or walk you through it.";
  }
  if (p.includes('thanks') || p.includes('thank you') || p.includes('ty')) {
    return "No problem! Anything else you want me to build?";
  }
  if (/^(ok|okay|kk|alright|sure|yes|no|yeah|nah)\s*$/.test(p)) {
    return "Alright. What are we building? Drop a prompt and I'll handle it.";
  }
  return "I build Roblox games — all of it. Try:\n- \"Tower defense with 5 enemy types and wave system\"\n- \"Racing game with vehicle physics and drift\"\n- \"Building system with grid placement and snapping\"\n- \"NPC with patrol, chase, and dialogue\"\n- \"Full obby with checkpoints, leaderboard, timer\"";
}

async function requestOpenRouter(prompt: string, model: AIModel): Promise<AIResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in your environment variables.');
  }

  const intent = detectIntent(prompt);
  if (intent === 'chat') {
    return {
      model: model.name, provider: 'openrouter',
      output: chatResponse(prompt),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  const systemMsg = intent === 'code'
    ? 'You are a world-class Roblox developer who has built and shipped top-earning games. You are a master of every domain: combat, UI, animations, building systems, NPCs, physics, audio, VFX, monetization, data persistence, vehicle physics, procedural generation, and more. You do not produce "AI slop" — every line of code you write is production-quality, optimized, and follows Roblox best practices.\n\nRules:\n- Use `game:GetService("ServiceName")` pattern\n- Use lowercase 2-space indentation\n- Prefer Enum values over raw numbers\n- Modules use the `local Module = {}; return Module` pattern\n- Return ONLY raw Luau code. No markdown, no backticks, no explanation.\n- The code must work when pasted directly into Roblox Studio.'
    : 'You are a world-class Roblox developer who shipped top-earning games and you are also a great teammate. You master EVERY field: combat systems, UI/UX design, animations & tweens, building & construction mechanics, NPC behavior & pathfinding, physics simulations, audio systems, VFX & lighting, monetization & economy, data persistence, vehicle physics, procedural generation, and game architecture. When the user chats casually, respond naturally and conversationally — like an experienced dev giving advice to a teammate. You can explain concepts, suggest approaches, discuss tradeoffs, and help them think through their game design. When they ask for help, give real, actionable advice based on your experience.';

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: model.id,
      messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: prompt }],
      temperature: intent === 'code' ? 0.2 : 0.5,
      max_tokens: 2000,
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

  if (detectIntent(p) === 'chat') {
    return {
      model: model.name, provider: 'local',
      output: chatResponse(prompt),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
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

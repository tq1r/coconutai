--[[
	Coconut AI Studio Plugin
	Version 2.1.0

	Installation: Save to %localappdata%/Roblox/Plugins/CoconutAI.lua

	Features:
	- Real-time code sync from web app to Studio
	- Automatic script injection into your project
	- Output console mirroring
	- Session management with auto-reconnect
	- Asset library: stores AI-generated scripts, models, UI, animations, etc.
	- Professional UI with dark/light mode
--]]

local PLUGIN_NAME = "Coconut AI"
local API_BASE = "https://coconutai.vercel.app/api/plugin"
local POLL_INTERVAL = 2

local plugin = Plugin()
local toolbar = plugin:CreateToolbar(PLUGIN_NAME)
local toggleBtn = toolbar:CreateButton(PLUGIN_NAME, "Toggle Coconut AI panel", "")

-- Colors
local C = {
	primary = Color3.fromRGB(255, 107, 53),
	primaryDark = Color3.fromRGB(220, 80, 30),
	primaryLight = Color3.fromRGB(255, 140, 90),
	bg = Color3.fromRGB(248, 250, 250),
	bgDark = Color3.fromRGB(28, 30, 34),
	surface = Color3.fromRGB(255, 255, 255),
	surfaceDark = Color3.fromRGB(35, 38, 42),
	text = Color3.fromRGB(41, 37, 36),
	textDark = Color3.fromRGB(230, 225, 220),
	textSec = Color3.fromRGB(120, 113, 108),
	textSecDark = Color3.fromRGB(168, 162, 158),
	textMuted = Color3.fromRGB(168, 162, 158),
	success = Color3.fromRGB(0, 255, 136),
	error = Color3.fromRGB(255, 51, 85),
	warning = Color3.fromRGB(255, 187, 0),
	border = Color3.fromRGB(230, 225, 220),
	borderDark = Color3.fromRGB(55, 58, 64),
	codeBg = Color3.fromRGB(245, 247, 250),
	-- Type colors
	typeModel = Color3.fromRGB(99, 102, 241),
	typeAnim = Color3.fromRGB(236, 72, 153),
	typeGP = Color3.fromRGB(255, 187, 0),
	typeUI = Color3.fromRGB(0, 255, 136),
	typeScript = Color3.fromRGB(56, 189, 248),
	typeVFX = Color3.fromRGB(191, 64, 255),
}

local LIBRARY_TYPES = {
	model = { label = "Model", color = C.typeModel },
	animation = { label = "Animation", color = C.typeAnim },
	gamepass = { label = "Game Pass", color = C.typeGP },
	ui = { label = "UI", color = C.typeUI },
	script = { label = "Script", color = C.typeScript },
	vfx = { label = "VFX", color = C.typeVFX },
}

-- State
local state = {
	sessionCode = nil,
	isPolling = false,
	outputLines = {},
	libraryItems = {},
	isDark = false,
	activeTab = "output",
}

-- Helpers
local function ui(class, props, children)
	local obj = Instance.new(class)
	for k, v in pairs(props or {}) do
		obj[k] = v
	end
	for _, c in ipairs(children or {}) do
		c.Parent = obj
	end
	return obj
end

local function corner(r)
	return ui("UICorner", { CornerRadius = UDim.new(0, r or 8) })
end

local function stroke(c, t)
	return ui("UIStroke", {
		Color = c or C.border,
		Thickness = t or 1,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

local function padding(l, r, t, b)
	return ui("UIPadding", {
		PaddingLeft = UDim.new(0, l or 12),
		PaddingRight = UDim.new(0, r or 12),
		PaddingTop = UDim.new(0, t or 8),
		PaddingBottom = UDim.new(0, b or 8),
	})
end

local function applyTheme()
	local bg = if state.isDark then C.bgDark else C.bg
	local surf = if state.isDark then C.surfaceDark else C.surface
	local txt = if state.isDark then C.textDark else C.text
	local tSec = if state.isDark then C.textSecDark else C.textSec
	local bdr = if state.isDark then C.borderDark else C.border
	mainFrame.BackgroundColor3 = bg
	headerFrame.BackgroundColor3 = surf
	headerStroke.Color = bdr
	statusFrame.BackgroundColor3 = surf
	statusStroke.Color = bdr
	sessionFrame.BackgroundColor3 = surf
	sessionStroke.Color = bdr
	codeLabel.TextColor3 = C.primary
	codeLabel.BackgroundColor3 = if state.isDark then C.bgDark else C.codeBg
	codeLabelStroke.Color = C.primary
	tabBar.BackgroundColor3 = surf
	outputHeader.BackgroundColor3 = surf
	outputStroke.Color = bdr
	outputLabel.TextColor3 = txt
	outputContainer.BackgroundColor3 = surf
	outputContainerStroke.Color = bdr
	for _, line in ipairs(state.outputLines) do
		line.TextColor3 = line:GetAttribute("color") or tSec
	end
	libraryFrame.BackgroundColor3 = surf
	libraryFrameStroke.Color = bdr
	libEmptyText.TextColor3 = tSec
end

-- Widget Setup
local dockInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false, false,
	360, 560,
	360, 640
)
local widget = plugin:CreateDockWidgetPluginGui(PLUGIN_NAME, dockInfo)
widget.Title = "Coconut AI"

-- Build UI
local mainFrame = ui("Frame", {
	BackgroundColor3 = C.bg,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 1, 0),
})

-- Header
local headerFrame = ui("Frame", {
	BackgroundColor3 = C.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 48),
}, {
	corner(12), stroke(),
	padding(14, 14, 0, 0),
	ui("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0, 10),
	}),
	ui("TextLabel", {
		BackgroundTransparency = 1,
		Text = "CA",
		TextSize = 22,
		Size = UDim2.new(0, 30, 0, 30),
	}),
	ui("TextLabel", {
		BackgroundTransparency = 1,
		Text = "Coconut AI",
		TextSize = 16,
		Font = Enum.Font.GothamBold,
		TextColor3 = C.primary,
		Size = UDim2.new(0, 0, 0, 20),
		AutomaticSize = Enum.AutomaticSize.X,
	}),
	ui("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, -200, 0, 0) }),
	local versionLabel = ui("TextLabel", {
		BackgroundTransparency = 1,
		Text = "v2.2",
		TextSize = 10,
		Font = Enum.Font.GothamMedium,
		TextColor3 = C.textMuted,
		Size = UDim2.new(0, 30, 0, 16),
	}),
})

-- Status bar
local statusFrame = ui("Frame", {
	BackgroundColor3 = C.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 28),
}, {
	corner(8), stroke(),
	padding(10, 10, 0, 0),
	ui("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0, 6),
	}),
})

local statusDot = ui("Frame", {
	BackgroundColor3 = C.textMuted,
	Size = UDim2.new(0, 7, 0, 7),
}, { corner(4) })
statusDot.Parent = statusFrame

local statusText = ui("TextLabel", {
	BackgroundTransparency = 1,
	Text = "Ready",
	TextSize = 11,
	Font = Enum.Font.Gotham,
	TextColor3 = C.textSec,
	Size = UDim2.new(0, 0, 0, 16),
	AutomaticSize = Enum.AutomaticSize.X,
})
statusText.Parent = statusFrame

-- Session section
local sessionFrame = ui("Frame", {
	BackgroundColor3 = C.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 96),
}, {
	corner(10), stroke(),
	padding(14, 14, 10, 10),
	ui("UIListLayout", {
		FillDirection = Enum.FillDirection.Vertical,
		Padding = UDim.new(0, 8),
	}),
})

ui("TextLabel", {
	BackgroundTransparency = 1,
	Text = "SESSION",
	TextSize = 9,
	Font = Enum.Font.GothamBold,
	TextColor3 = C.textMuted,
	LetterSpacing = 2,
	Size = UDim2.new(1, 0, 0, 12),
}).Parent = sessionFrame

local codeRow = ui("Frame", {
	BackgroundTransparency = 1,
	Size = UDim2.new(1, 0, 0, 36),
}, {
	ui("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0, 8),
	}),
})
codeRow.Parent = sessionFrame

local codeLabel = ui("TextLabel", {
	BackgroundColor3 = C.codeBg,
	Text = "---",
	TextSize = 22,
	Font = Enum.Font.GothamBold,
	TextColor3 = C.primary,
	Size = UDim2.new(0, 140, 0, 36),
}, { corner(8), stroke(C.primary, 1) })
codeLabel.Parent = codeRow

local createBtn = ui("TextButton", {
	BackgroundColor3 = C.primary,
	Text = "Create Session",
	TextSize = 12,
	Font = Enum.Font.GothamSemibold,
	TextColor3 = Color3.fromRGB(255, 255, 255),
	Size = UDim2.new(0, 130, 0, 36),
	AutoButtonColor = false,
}, { corner(8) })
createBtn.Parent = codeRow

local disconnectBtn = ui("TextButton", {
	BackgroundColor3 = C.error,
	Text = "Disconnect",
	TextSize = 11,
	Font = Enum.Font.GothamSemibold,
	TextColor3 = Color3.fromRGB(255, 255, 255),
	Size = UDim2.new(0, 0, 0, 30),
	AutomaticSize = Enum.AutomaticSize.X,
	Visible = false,
	AutoButtonColor = false,
}, { corner(8) })
disconnectBtn.Parent = sessionFrame

-- Tab bar
local tabBar = ui("Frame", {
	BackgroundColor3 = C.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 28),
}, {
	ui("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0, 0),
	}),
})

local function makeTab(name, id)
	local btn = ui("TextButton", {
		BackgroundTransparency = 1,
		Text = name,
		TextSize = 10,
		Font = Enum.Font.GothamSemibold,
		TextColor3 = C.textMuted,
		Size = UDim2.new(0, 0, 0, 28),
		AutomaticSize = Enum.AutomaticSize.X,
		AutoButtonColor = false,
		BorderSizePixel = 0,
	})
	btn.Parent = tabBar
	-- indicator
	local ind = ui("Frame", {
		BackgroundColor3 = C.primary,
		BorderSizePixel = 0,
		Size = UDim2.new(1, 0, 0, 2),
		Position = UDim2.new(0, 0, 1, -2),
		Visible = state.activeTab == id,
	})
	ind.Parent = btn

	btn.MouseButton1Click:Connect(function()
		state.activeTab = id
		-- Update all indicators
		for _, child in ipairs(tabBar:GetChildren()) do
			if child:IsA("TextButton") then
				local indicator = child:FindFirstChildOfClass("Frame")
				if indicator then
					indicator.Visible = (child == btn)
				end
				child.TextColor3 = (child == btn) and C.primary or C.textMuted
			end
		end
		outputContainer.Visible = (id == "output")
		libraryFrame.Visible = (id == "library")
		if id == "library" and state.sessionCode then
			fetchLibrary()
		end
	end)

	return btn
end

local tabSpacer = ui("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, -140, 0, 0) })
tabSpacer.Parent = tabBar

local outputTab = makeTab("OUTPUT", "output")
local libTab = makeTab("LIBRARY", "library")

-- Output header
local outputHeader = ui("Frame", {
	BackgroundColor3 = C.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 24),
}, {
	corner(8), stroke(),
	padding(8, 6, 0, 0),
	ui("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
	}),
	ui("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, -70, 0, 0) }),
	local clearOutputBtn = ui("TextButton", {
		BackgroundTransparency = 1,
		Text = "Clear",
		TextSize = 10,
		Font = Enum.Font.GothamSemibold,
		TextColor3 = C.textMuted,
		Size = UDim2.new(0, 50, 0, 20),
	}),
})

local outputLabel = ui("TextLabel", {
	BackgroundTransparency = 1,
	Text = "OUTPUT",
	TextSize = 9,
	Font = Enum.Font.GothamBold,
	TextColor3 = C.textMuted,
	LetterSpacing = 2,
	Size = UDim2.new(0, 0, 0, 12),
	AutomaticSize = Enum.AutomaticSize.X,
})
outputLabel.Parent = outputHeader

-- Output container
local outputContainer = ui("ScrollingFrame", {
	BackgroundColor3 = C.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 1, -240),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ScrollBarThickness = 6,
	ScrollBarImageColor3 = C.border,
	ElasticBehavior = Enum.ScrollingFrameElasticBehavior.Never,
}, {
	corner(10), stroke(),
})

local outputLayout = ui("UIListLayout", {
	Padding = UDim.new(0, 1),
	HorizontalAlignment = Enum.HorizontalAlignment.Left,
})
outputLayout.Parent = outputContainer

-- Library frame
local function createLibraryUI()
	local frame = ui("ScrollingFrame", {
		BackgroundColor3 = C.surface,
		BorderSizePixel = 0,
		Size = UDim2.new(1, 0, 1, -240),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ScrollBarThickness = 6,
		ScrollBarImageColor3 = C.border,
		ElasticBehavior = Enum.ScrollingFrameElasticBehavior.Never,
		Visible = false,
	}, {
		corner(10), stroke(),
	})

	local layout = ui("UIListLayout", {
		Padding = UDim.new(0, 4),
		FillDirection = Enum.FillDirection.Vertical,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
	})
	layout.Parent = frame

	local emptyText = ui("TextLabel", {
		BackgroundTransparency = 1,
		Text = "No saved items. AI-generated assets will appear here.",
		TextSize = 11,
		Font = Enum.Font.Gotham,
		TextColor3 = C.textSec,
		Size = UDim2.new(1, -20, 0, 40),
		TextWrapped = true,
	})
	emptyText.Parent = frame

	return frame, layout, emptyText
end

local libraryFrame, libraryLayout, libEmptyText = createLibraryUI()

-- Assembly
local bodyLayout = ui("UIListLayout", { Padding = UDim.new(0, 6) })
bodyLayout.Parent = mainFrame
ui("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10), PaddingBottom = UDim.new(0, 50) }).Parent = mainFrame

headerFrame.Parent = mainFrame
statusFrame.Parent = mainFrame
sessionFrame.Parent = mainFrame
tabBar.Parent = mainFrame
outputHeader.Parent = mainFrame
outputContainer.Parent = mainFrame
libraryFrame.Parent = mainFrame
widget.Content = mainFrame

-- Logging
local function addLog(text, color, isBold, timestamp)
	local timeStr = if timestamp then os.date("%H:%M:%S") else ""
	local prefix = if timeStr ~= "" then "[" .. timeStr .. "] " else ""
	local line = ui("TextLabel", {
		BackgroundTransparency = 1,
		Text = prefix .. text,
		TextSize = 10,
		Font = if isBold then Enum.Font.GothamSemibold else Enum.Font.Gotham,
		TextColor3 = color or C.textSec,
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(1, -8, 0, 16),
		RichText = true,
	})
	line:SetAttribute("color", color)
	table.insert(state.outputLines, line)
	line.Parent = outputContainer
	local children = outputContainer:GetChildren()
	if #children > 201 then
		children[2]:Destroy()
		table.remove(state.outputLines, 1)
	end
	outputContainer.CanvasPosition = Vector2.new(0, outputLayout.AbsoluteContentSize.Y)
end

local function setStatus(text, color, dotColor)
	statusText.Text = text
	statusText.TextColor3 = color or C.textSec
	statusDot.BackgroundColor3 = dotColor or C.textMuted
end

-- Library API
local function fetchLibrary()
	if not state.sessionCode then return end
	local ok, result = pcall(function()
		local http = game:GetService("HttpService")
		local resp = http:GetAsync(API_BASE .. "/library?code=" .. http:UrlEncode(state.sessionCode))
		return http:JSONDecode(resp)
	end)
	if not ok or not result or not result.success then return end

	state.libraryItems = result.data or {}
	-- Rebuild library UI
	for _, child in ipairs(libraryFrame:GetChildren()) do
		if child:IsA("Frame") or child:IsA("TextLabel") then
			child:Destroy()
		end
	end
	ui("UIPadding", { PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8), PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6) }).Parent = libraryFrame

	local items = state.libraryItems
	if #items == 0 then
		local empty = ui("TextLabel", {
			BackgroundTransparency = 1,
			Text = "No saved items. AI-generated assets will appear here.",
			TextSize = 11,
			Font = Enum.Font.Gotham,
			TextColor3 = C.textSec,
			Size = UDim2.new(1, -20, 0, 40),
			TextWrapped = true,
		})
		empty.Parent = libraryFrame
		return
	end

	-- Group by type
	local grouped = {}
	local typeOrder = { "model", "animation", "gamepass", "ui", "script", "vfx" }
	for _, item in ipairs(items) do
		local t = item.type or "script"
		if not grouped[t] then grouped[t] = {} end
		table.insert(grouped[t], item)
	end

	for _, t in ipairs(typeOrder) do
		local group = grouped[t]
		if group and #group > 0 then
			-- Type header
			local typeInfo = LIBRARY_TYPES[t] or { label = t, color = C.textMuted }
			local header = ui("TextLabel", {
				BackgroundTransparency = 1,
				Text = typeInfo.label:upper(),
				TextSize = 9,
				Font = Enum.Font.GothamBold,
				TextColor3 = typeInfo.color,
				LetterSpacing = 2,
				Size = UDim2.new(1, 0, 0, 18),
				TextXAlignment = Enum.TextXAlignment.Left,
			})
			header.Parent = libraryFrame

			for _, item in ipairs(group) do
				local card = ui("Frame", {
					BackgroundColor3 = if state.isDark then C.bgDark else C.codeBg,
					BorderSizePixel = 0,
					Size = UDim2.new(1, 0, 0, 36),
				}, { corner(6) })
				card.Parent = libraryFrame

				ui("UIListLayout", {
					FillDirection = Enum.FillDirection.Horizontal,
					VerticalAlignment = Enum.VerticalAlignment.Center,
					Padding = UDim.new(0, 6),
				}).Parent = card

				-- Type badge
				ui("Frame", {
					BackgroundColor3 = typeInfo.color,
					Size = UDim2.new(0, 36, 0, 20),
					BorderSizePixel = 0,
				}, {
					corner(4),
					ui("TextLabel", {
						BackgroundTransparency = 1,
						Text = t:sub(1, 4):upper(),
						TextSize = 8,
						Font = Enum.Font.GothamBold,
						TextColor3 = Color3.fromRGB(255, 255, 255),
						Size = UDim2.new(1, 0, 1, 0),
					}),
				}).Parent = card

				-- Name
				ui("TextLabel", {
					BackgroundTransparency = 1,
					Text = item.name or "Untitled",
					TextSize = 10,
					Font = Enum.Font.GothamMedium,
					TextColor3 = if state.isDark then C.textDark else C.text,
					TextXAlignment = Enum.TextXAlignment.Left,
					Size = UDim2.new(0.5, -50, 0, 20),
				}).Parent = card

				-- Insert button
				local insertBtn = ui("TextButton", {
					BackgroundColor3 = C.primary,
					Text = "Insert",
					TextSize = 9,
					Font = Enum.Font.GothamSemibold,
					TextColor3 = Color3.fromRGB(255, 255, 255),
					Size = UDim2.new(0, 50, 0, 22),
					AutoButtonColor = false,
				}, { corner(4) })
				insertBtn.Parent = card
				insertBtn.MouseButton1Click:Connect(function()
					local s, err = pcall(function()
						local fn, e = loadstring(item.content)
						if not fn then error(e) end
						return fn()
					end)
					if s then
						addLog("OK Inserted: " .. item.name, C.success, true, true)
					else
						addLog("X Insert failed: " .. tostring(err), C.error, false, true)
					end
				end)
			end
		end
	end
end

-- Save to library
local function saveToLibrary(name, itemType, content, description)
	if not state.sessionCode then return end
	local ok, result = pcall(function()
		local http = game:GetService("HttpService")
		local body = http:JSONEncode({
			session_code = state.sessionCode,
			type = itemType,
			name = name,
			description = description or "",
			content = content,
		})
		local resp = http:PostAsync(API_BASE .. "/library", body, Enum.HttpContentType.ApplicationJson)
		return http:JSONDecode(resp)
	end)
	if ok and result and result.success then
		addLog("OK Saved to library: " .. name, C.success, true, true)
		if state.activeTab == "library" then
			fetchLibrary()
		end
	else
		local errMsg = if ok then (result and result.error or "unknown") else tostring(result)
		addLog("X Save to library failed: " .. errMsg, C.error, false, true)
	end
end

-- Session Management
local function stopPolling()
	state.isPolling = false
	state.sessionCode = nil
	codeLabel.Text = "---"
	createBtn.Visible = true
	disconnectBtn.Visible = false
	setStatus("Ready", C.textSec, C.textMuted)
end

-- Explorer Tree
local function getExplorerTree()
	local function buildTree(instance, depth)
		depth = depth or 0
		if depth > 20 then return nil end
		local children = instance:GetChildren()
		local items = {}
		for _, child in ipairs(children) do
			local className = child.ClassName
			local name = child.Name
			local item = { name = name, className = className, children = {} }
			local sub = buildTree(child, depth + 1)
			if sub then item.children = sub end
			table.insert(items, item)
		end
		return items
	end

	local rootServices = {
		game:GetService("Workspace"),
		game:GetService("Players"),
		game:GetService("Lighting"),
		game:GetService("ReplicatedStorage"),
		game:GetService("ServerStorage"),
		game:GetService("ServerScriptService"),
		game:GetService("StarterGui"),
		game:GetService("StarterPack"),
		game:GetService("SoundService"),
	}
	local tree = {}
	for _, svc in ipairs(rootServices) do
		table.insert(tree, {
			name = svc.Name,
			className = svc.ClassName,
			children = buildTree(svc) or {},
		})
	end
	return tree
end

local function startPolling(code)
	state.sessionCode = code
	codeLabel.Text = code
	createBtn.Visible = false
	disconnectBtn.Visible = true
	disconnectBtn.Text = "Disconnect"
	disconnectBtn.BackgroundColor3 = C.error
	setStatus("Listening for commands...", C.primary, C.primary)
	addLog("Session " .. code .. " active", C.primary, true, true)

	state.isPolling = true
	task.spawn(function()
		while state.isPolling do
			task.wait(POLL_INTERVAL)
			if not state.isPolling then break end

			local ok, result = pcall(function()
				local http = game:GetService("HttpService")
				local encodedCode = http:UrlEncode(state.sessionCode)
				local resp = http:GetAsync(API_BASE .. "/poll?code=" .. encodedCode)
				return http:JSONDecode(resp)
			end)

			if ok and result and result.success then
				if result.commands and #result.commands > 0 then
					for _, cmd in ipairs(result.commands) do
						if cmd.type == "report_explorer" then
							addLog("> Reporting explorer tree", C.warning, false, true)
							local s, err = pcall(function()
								local http = game:GetService("HttpService")
								local tree = getExplorerTree()
								local json = http:JSONEncode(tree)
								http:PostAsync(API_BASE .. "/explorer", json, Enum.HttpContentType.ApplicationJson)
							end)
							if s then
								addLog("OK Explorer tree sent", C.success, true, true)
							else
								addLog("X Failed to report explorer: " .. tostring(err), C.error, false, true)
							end
						else
							local scriptName = cmd.name or ("Script " .. tostring(#state.libraryItems + 1))
							local scriptType = cmd.type or "script"
							local scriptContent = cmd.code or cmd

							addLog("> Received script from web app", C.warning, false, true)
							local s, err = pcall(function()
								local fn, e = loadstring(scriptContent)
								if not fn then error(e) end
								return fn()
							end)
							if s then
								addLog("OK Script executed successfully", C.success, true, true)
								-- Auto-save to library
								saveToLibrary(scriptName, scriptType, scriptContent, "Generated by Coconut AI")
							else
								addLog("X Script error: " .. tostring(err), C.error, false, true)
							end
						end
					end
				end
				setStatus("Connected - " .. state.sessionCode, C.primary, C.primary)
				disconnectBtn.BackgroundColor3 = C.error
				disconnectBtn.Text = "Disconnect"
			elseif not ok then
				local errMsg = tostring(result)
				if errMsg:find("401") or errMsg:find("403") then
					addLog("Authentication failed - reconnect the plugin", C.error, false, true)
					stopPolling()
				elseif errMsg:find("50%d") then
					addLog("Server error (500) - try again later", C.error, false, true)
				elseif errMsg:find("failed") or errMsg:find("refused") or errMsg:find("timeout") then
					addLog("Network error - check your connection", C.error, false, true)
				else
					addLog("Connection error: " .. errMsg, C.error, false, true)
				end
				setStatus("Connection lost", C.error, C.error)
				disconnectBtn.BackgroundColor3 = C.warning
				disconnectBtn.Text = "Reconnecting"
			else
				setStatus("Connection lost", C.error, C.error)
				disconnectBtn.BackgroundColor3 = C.warning
				disconnectBtn.Text = "Reconnecting"
			end
		end
	end)
end

-- Button Handlers
createBtn.MouseButton1Click:Connect(function()
	addLog("Creating session...", C.textSec, false, true)
	createBtn.Text = "Creating..."
	createBtn.BackgroundColor3 = C.textMuted
	createBtn.Active = false

	local ok, result = pcall(function()
		local http = game:GetService("HttpService")
		local resp = http:PostAsync(API_BASE .. "/create", "", Enum.HttpContentType.ApplicationJson)
		return http:JSONDecode(resp)
	end)

	createBtn.Text = "Create Session"
	createBtn.BackgroundColor3 = C.primary
	createBtn.Active = true

	if ok and result and result.success then
		startPolling(result.code)
		addLog("Session created! Enter code in web app", C.success, true, true)
	elseif not ok then
		local errMsg = tostring(result)
		if errMsg:find("401") or errMsg:find("403") then
			addLog("Authentication failed - reconnect the plugin", C.error, true, true)
		elseif errMsg:find("50%d") then
			addLog("Server error (500) - try again later", C.error, true, true)
		elseif errMsg:find("failed") or errMsg:find("refused") or errMsg:find("timeout") then
			addLog("Network error - check your connection", C.error, true, true)
		else
			addLog("Failed to create session: " .. errMsg, C.error, true, true)
		end
		setStatus("Error", C.error, C.error)
	else
		addLog("Server rejected request", C.error, true, true)
		setStatus("Error", C.error, C.error)
	end
end)

disconnectBtn.MouseButton1Click:Connect(function()
	stopPolling()
	addLog("Disconnected", C.textMuted, false, true)
end)

clearOutputBtn.MouseButton1Click:Connect(function()
	outputContainer:ClearAllChildren()
	outputLayout.Parent = outputContainer
	state.outputLines = {}
	addLog("Output cleared", C.textMuted, false, true)
end)

toggleBtn.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

-- Startup
addLog("Coconut AI v2.1 loaded", C.primary, true)
addLog("Click 'Create Session' and enter the code in the web app to connect", C.textSec, false)
setStatus("Ready", C.textSec, C.textMuted)

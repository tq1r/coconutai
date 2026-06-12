--[[
	Coconut AI Studio Plugin
	Version 2.0.0

	Installation: Save to %localappdata%/Roblox/Plugins/CoconutAI.lua

	Features:
	- Real-time code sync from web app to Studio
	- Automatic script injection into your project
	- Output console mirroring
	- Session management with auto-reconnect
	- Professional UI with dark/light mode
--]]

local PLUGIN_NAME = "Coconut AI"
local API_BASE = "https://coconutai.vercel.app/api/plugin"
local POLL_INTERVAL = 2

local plugin = Plugin()
local toolbar = plugin:CreateToolbar(PLUGIN_NAME)
local toggleBtn = toolbar:CreateButton(PLUGIN_NAME, "Toggle Coconut AI panel", "")

-- ── Colors ─────────────────────────────────────────────
local C = {
	primary = Color3.fromRGB(20, 184, 166),
	primaryDark = Color3.fromRGB(13, 148, 136),
	primaryLight = Color3.fromRGB(45, 212, 191),
	bg = Color3.fromRGB(248, 250, 250),
	bgDark = Color3.fromRGB(28, 30, 34),
	surface = Color3.fromRGB(255, 255, 255),
	surfaceDark = Color3.fromRGB(35, 38, 42),
	text = Color3.fromRGB(41, 37, 36),
	textDark = Color3.fromRGB(230, 225, 220),
	textSec = Color3.fromRGB(120, 113, 108),
	textSecDark = Color3.fromRGB(168, 162, 158),
	textMuted = Color3.fromRGB(168, 162, 158),
	success = Color3.fromRGB(52, 211, 153),
	error = Color3.fromRGB(248, 113, 113),
	warning = Color3.fromRGB(251, 191, 36),
	border = Color3.fromRGB(230, 225, 220),
	borderDark = Color3.fromRGB(55, 58, 64),
	codeBg = Color3.fromRGB(245, 247, 250),
}

-- ── State ──────────────────────────────────────────────
local state = {
	sessionCode = nil,
	isPolling = false,
	outputLines = {},
	isDark = false,
}

-- ── Helpers ────────────────────────────────────────────
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
	outputHeader.BackgroundColor3 = surf
	outputStroke.Color = bdr
	outputLabel.TextColor3 = txt
	outputContainer.BackgroundColor3 = surf
	outputContainerStroke.Color = bdr
	for _, line in ipairs(state.outputLines) do
		line.TextColor3 = line:GetAttribute("color") or tSec
	end
end

-- ── Widget Setup ───────────────────────────────────────
local dockInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false, false,
	360, 520,
	360, 600
)
local widget = plugin:CreateDockWidgetPluginGui(PLUGIN_NAME, dockInfo)
widget.Title = "Coconut AI"

-- ── Build UI ───────────────────────────────────────────
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
		Text = "v2.0",
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

-- Output header
local outputHeader = ui("Frame", {
	BackgroundColor3 = C.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 28),
}, {
	corner(8), stroke(),
	padding(10, 6, 0, 0),
	ui("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
	}),
	ui("TextLabel", {
		BackgroundTransparency = 1,
		Text = "OUTPUT",
		TextSize = 9,
		Font = Enum.Font.GothamBold,
		TextColor3 = C.textMuted,
		LetterSpacing = 2,
		Size = UDim2.new(0, 0, 0, 12),
		AutomaticSize = Enum.AutomaticSize.X,
	}),
	ui("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, -130, 0, 0) }),
	local clearOutputBtn = ui("TextButton", {
		BackgroundTransparency = 1,
		Text = "Clear",
		TextSize = 10,
		Font = Enum.Font.GothamSemibold,
		TextColor3 = C.textMuted,
		Size = UDim2.new(0, 50, 0, 20),
	}),
})

-- Output container
local outputContainer = ui("ScrollingFrame", {
	BackgroundColor3 = C.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 1, -210),
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

-- Assembly
local bodyLayout = ui("UIListLayout", { Padding = UDim.new(0, 6) })
bodyLayout.Parent = mainFrame
ui("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10), PaddingBottom = UDim.new(0, 50) }).Parent = mainFrame

headerFrame.Parent = mainFrame
statusFrame.Parent = mainFrame
sessionFrame.Parent = mainFrame
outputHeader.Parent = mainFrame
outputContainer.Parent = mainFrame
widget.Content = mainFrame

-- ── Logging ────────────────────────────────────────────
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

-- ── Session Management ─────────────────────────────────
local function stopPolling()
	state.isPolling = false
	state.sessionCode = nil
	codeLabel.Text = "---"
	createBtn.Visible = true
	disconnectBtn.Visible = false
	setStatus("Ready", C.textSec, C.textMuted)
end

-- ── Explorer Tree ───────────────────────────────────────
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
							addLog("> Received script from web app", C.warning, false, true)
							local s, err = pcall(function()
								local fn, e = loadstring(cmd.code or cmd)
								if not fn then error(e) end
								return fn()
							end)
							if s then
								addLog("OK Script executed successfully", C.success, true, true)
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

-- ── Button Handlers ────────────────────────────────────
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

-- ── Startup ────────────────────────────────────────────
addLog("Coconut AI v2.0 loaded", C.primary, true)
addLog("Click 'Create Session' and enter the code in the web app to connect", C.textSec, false)
setStatus("Ready", C.textSec, C.textMuted)

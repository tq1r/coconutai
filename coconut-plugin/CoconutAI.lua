--[[
	Coconut AI Studio Plugin
	Version 1.0.0
	
	Installation:
	1. Save this file to: %localappdata%/Roblox/Plugins/CoconutAI.lua
	2. Restart Roblox Studio
	3. Find "Coconut AI" in the Plugins tab
	
	For updates, visit: https://coconutai.vercel.app
--]]

local PLUGIN_NAME = "Coconut AI"
local API_BASE = "https://coconutai.vercel.app/api/plugin"

local plugin = Plugin()
local toolbar = plugin:CreateToolbar(PLUGIN_NAME)
local toggleButton = toolbar:CreateButton(
	PLUGIN_NAME,
	"Toggle Coconut AI panel - AI-powered Roblox scripting",
	"rbxassetid://0"
)

-- Color palette
local COLORS = {
	primary = Color3.fromRGB(20, 184, 166),
	primaryDark = Color3.fromRGB(13, 148, 136),
	primaryLight = Color3.fromRGB(45, 212, 191),
	bg = Color3.fromRGB(248, 250, 250),
	bgDark = Color3.fromRGB(30, 32, 35),
	surface = Color3.fromRGB(255, 255, 255),
	surfaceDark = Color3.fromRGB(38, 40, 45),
	text = Color3.fromRGB(41, 37, 36),
	textSecondary = Color3.fromRGB(120, 113, 108),
	textMuted = Color3.fromRGB(168, 162, 158),
	success = Color3.fromRGB(52, 211, 153),
	error = Color3.fromRGB(248, 113, 113),
	warning = Color3.fromRGB(251, 191, 36),
	border = Color3.fromRGB(230, 225, 220),
}

-- Create dock widget
local dockWidgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false, false,
	340, 500,
	340, 500
)

local widget = plugin:CreateDockWidgetPluginGui(PLUGIN_NAME, dockWidgetInfo)
widget.Title = "🥥 Coconut AI"

-- Helper: Create UI elements
local function create(class, props, children)
	local obj = Instance.new(class)
	for k, v in pairs(props or {}) do
		obj[k] = v
	end
	for _, child in ipairs(children or {}) do
		child.Parent = obj
	end
	return obj
end

local function createCorner(radius)
	return create("UICorner", { CornerRadius = UDim.new(0, radius or 8) })
end

local function createStroke(color, thickness)
	return create("UIStroke", {
		Color = color or COLORS.border,
		Thickness = thickness or 1,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

-- Build UI
local mainFrame = create("Frame", {
	BackgroundColor3 = COLORS.bg,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 1, 0),
}, {
	createCorner(0),
})

-- Header
local header = create("Frame", {
	BackgroundColor3 = COLORS.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 48),
}, {
	createCorner(12),
	createStroke(),
	create("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		Padding = UDim.new(0, 12),
		VerticalAlignment = Enum.VerticalAlignment.Center,
	}),
	create("Frame", {
		BackgroundTransparency = 1,
		Size = UDim2.new(0, 8, 0, 0),
	}),
	create("TextLabel", {
		BackgroundTransparency = 1,
		Text = "🥥",
		TextSize = 20,
		Size = UDim2.new(0, 28, 0, 28),
	}),
	create("TextLabel", {
		BackgroundTransparency = 1,
		Text = "Coconut AI",
		TextSize = 16,
		Font = Enum.Font.GothamBold,
		TextColor3 = COLORS.primary,
		Size = UDim2.new(0, 0, 0, 20),
		AutomaticSize = Enum.AutomaticSize.X,
	}),
})

-- Status bar
local statusBar = create("Frame", {
	BackgroundColor3 = COLORS.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 32),
}, {
	createCorner(8),
	createStroke(),
	create("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0, 6),
	}),
	create("Frame", { BackgroundTransparency = 1, Size = UDim2.new(0, 10, 0, 0) }),
})

local statusDot = create("Frame", {
	BackgroundColor3 = COLORS.textMuted,
	Size = UDim2.new(0, 8, 0, 8),
}, { createCorner(4) })
statusDot.Parent = statusBar

local statusText = create("TextLabel", {
	BackgroundTransparency = 1,
	Text = "Ready",
	TextSize = 12,
	Font = Enum.Font.Gotham,
	TextColor3 = COLORS.textSecondary,
	Size = UDim2.new(0, 0, 0, 16),
	AutomaticSize = Enum.AutomaticSize.X,
})
statusText.Parent = statusBar

-- Session section
local sessionFrame = create("Frame", {
	BackgroundColor3 = COLORS.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 90),
}, {
	createCorner(10),
	createStroke(),
	create("UIPadding", { PaddingTop = UDim.new(0, 10), PaddingLeft = UDim.new(0, 12), PaddingRight = UDim.new(0, 12) }),
	create("UIListLayout", {
		FillDirection = Enum.FillDirection.Vertical,
		Padding = UDim.new(0, 6),
	}),
})

local sessionLabel = create("TextLabel", {
	BackgroundTransparency = 1,
	Text = "SESSION",
	TextSize = 10,
	Font = Enum.Font.GothamBold,
	TextColor3 = COLORS.textMuted,
	Size = UDim2.new(1, 0, 0, 14),
})
sessionLabel.Parent = sessionFrame

local codeRow = create("Frame", {
	BackgroundTransparency = 1,
	Size = UDim2.new(1, 0, 0, 32),
}, {
	create("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0, 8),
	}),
})
codeRow.Parent = sessionFrame

local codeBox = create("TextLabel", {
	BackgroundColor3 = COLORS.bg,
	Text = "---",
	TextSize = 20,
	Font = Enum.Font.GothamBold,
	TextColor3 = COLORS.primary,
	Size = UDim2.new(0, 130, 0, 32),
}, { createCorner(8), createStroke(COLORS.primary, 1) })
codeBox.Parent = codeRow

local createBtn = create("TextButton", {
	BackgroundColor3 = COLORS.primary,
	Text = "Create Session",
	TextSize = 12,
	Font = Enum.Font.GothamSemibold,
	TextColor3 = Color3.fromRGB(255, 255, 255),
	Size = UDim2.new(0, 120, 0, 32),
	AutoButtonColor = false,
}, { createCorner(8) })
createBtn.Parent = codeRow

local connectBtn = create("TextButton", {
	BackgroundColor3 = COLORS.success,
	Text = "Connected",
	TextSize = 12,
	Font = Enum.Font.GothamSemibold,
	TextColor3 = Color3.fromRGB(255, 255, 255),
	Size = UDim2.new(1, -12, 0, 30),
	Visible = false,
	AutoButtonColor = false,
}, { createCorner(8) })
connectBtn.Parent = sessionFrame

-- Log section
local logHeader = create("Frame", {
	BackgroundColor3 = COLORS.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 0, 28),
}, {
	createCorner(8),
	createStroke(),
	create("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		VerticalAlignment = Enum.VerticalAlignment.Center,
	}),
	create("Frame", { BackgroundTransparency = 1, Size = UDim2.new(0, 10, 0, 0) }),
	create("TextLabel", {
		BackgroundTransparency = 1,
		Text = "OUTPUT",
		TextSize = 10,
		Font = Enum.Font.GothamBold,
		TextColor3 = COLORS.textMuted,
		Size = UDim2.new(0, 0, 0, 14),
		AutomaticSize = Enum.AutomaticSize.X,
	}),
	create("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, -120, 0, 0) }),
	local clearLogBtn = create("TextButton", {
		BackgroundTransparency = 1,
		Text = "Clear",
		TextSize = 10,
		Font = Enum.Font.GothamSemibold,
		TextColor3 = COLORS.textMuted,
		Size = UDim2.new(0, 50, 0, 20),
	}),
})

local logContainer = create("ScrollingFrame", {
	BackgroundColor3 = COLORS.surface,
	BorderSizePixel = 0,
	Size = UDim2.new(1, 0, 1, -230),
	CanvasSize = UDim2.new(0, 0, 0, 0),
	ScrollBarThickness = 4,
	ScrollBarImageColor3 = COLORS.border,
}, {
	createCorner(10),
	createStroke(),
})

local logLayout = create("UIListLayout", {
	Padding = UDim.new(0, 2),
	HorizontalAlignment = Enum.HorizontalAlignment.Left,
})
logLayout.Parent = logContainer

-- Layout assembly
local bodyLayout = create("UIListLayout", {
	Padding = UDim.new(0, 6),
	VerticalAlignment = Enum.VerticalAlignment.Top,
})
bodyLayout.Parent = mainFrame

local bodyPadding = create("UIPadding", {
	PaddingTop = UDim.new(0, 6),
	PaddingLeft = UDim.new(0, 10),
	PaddingRight = UDim.new(0, 10),
	PaddingBottom = UDim.new(0, 50),
})
bodyPadding.Parent = mainFrame

header.Parent = mainFrame
statusBar.Parent = mainFrame
sessionFrame.Parent = mainFrame
logHeader.Parent = mainFrame
logContainer.Parent = mainFrame

widget.Content = mainFrame

-- Plugin state
local sessionCode = nil
local isPolling = false
local pollConnection = nil

-- Log helper
local function addLog(text, color, isBold)
	local line = create("TextLabel", {
		BackgroundTransparency = 1,
		Text = text,
		TextSize = 11,
		Font = if isBold then Enum.Font.GothamSemibold else Enum.Font.Gotham,
		TextColor3 = color or COLORS.textSecondary,
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(1, -8, 0, 18),
		RichText = true,
	})
	line.Parent = logContainer
	logContainer.CanvasSize = UDim2.new(0, 0, 0, logLayout.AbsoluteContentSize.Y + 4)
	task.wait(0.02)
	logContainer.CanvasPosition = Vector2.new(0, logLayout.AbsoluteContentSize.Y)
end

local function setStatus(text, color, dotColor)
	statusText.Text = text
	statusText.TextColor3 = color or COLORS.textSecondary
	statusDot.BackgroundColor3 = dotColor or COLORS.textMuted
end

local function stopPolling()
	isPolling = false
	if pollConnection then
		pollConnection:Disconnect()
		pollConnection = nil
	end
	sessionCode = nil
	codeBox.Text = "---"
	codeBox.TextColor3 = COLORS.primary
	createBtn.Visible = true
	connectBtn.Visible = false
	setStatus("Disconnected", COLORS.textMuted, COLORS.textMuted)
end

local function startPolling(code)
	sessionCode = code
	codeBox.Text = code
	codeBox.TextColor3 = COLORS.primary
	createBtn.Visible = false
	connectBtn.Visible = true
	connectBtn.Text = "Connected"
	connectBtn.BackgroundColor3 = COLORS.success
	setStatus("Listening for commands...", COLORS.primary, COLORS.primary)
	addLog("🌴 Session " .. code .. " active", COLORS.primary, true)

	isPolling = true
	pollConnection = game:GetService("RunService").Heartbeat:Connect(function()
		if not isPolling then return end
		task.wait(3)

		local success, result = pcall(function()
			local httpService = game:GetService("HttpService")
			local url = API_BASE .. "/poll?code=" .. sessionCode
			local response = httpService:GetAsync(url)
			return httpService:JSONDecode(response)
		end)

		if success and result and result.success then
			if result.commands and #result.commands > 0 then
				for _, scriptCode in ipairs(result.commands) do
					addLog("→ Executing generated code...", COLORS.warning)
					local execOk, execResult = pcall(function()
						local fn, err = loadstring(scriptCode)
						if not fn then error(err) end
						return fn()
					end)
					if execOk then
						addLog("✓ Executed successfully", COLORS.success, true)
					else
						addLog("✗ Error: " .. tostring(execResult), COLORS.error)
					end
				end
			end
			setStatus("Connected · " .. sessionCode, COLORS.primary, COLORS.primary)
			connectBtn.BackgroundColor3 = COLORS.success
			connectBtn.Text = "Connected"
		else
			setStatus("Connection lost", COLORS.error, COLORS.error)
			connectBtn.BackgroundColor3 = COLORS.error
			connectBtn.Text = "Reconnecting..."
		end
	end)
end

-- Button handlers
createBtn.MouseButton1Click:Connect(function()
	addLog("Creating session...", COLORS.textSecondary)
	createBtn.Text = "..."
	createBtn.BackgroundColor3 = COLORS.textMuted

	local success, result = pcall(function()
		local httpService = game:GetService("HttpService")
		local response = httpService:PostAsync(API_BASE .. "/create", "", Enum.HttpContentType.ApplicationJson)
		return httpService:JSONDecode(response)
	end)

	createBtn.Text = "Create Session"
	createBtn.BackgroundColor3 = COLORS.primary

	if success and result and result.success then
		startPolling(result.code)
		addLog("⚡ Session created! Enter code on website", COLORS.success, true)
	else
		addLog("✗ Failed to create session", COLORS.error, true)
		setStatus("Error creating session", COLORS.error, COLORS.error)
	end
end)

connectBtn.MouseButton1Click:Connect(function()
	stopPolling()
	addLog("Session disconnected", COLORS.textMuted)
end)

clearLogBtn.MouseButton1Click:Connect(function()
	logContainer:ClearAllChildren()
	logLayout.Parent = logContainer
	addLog("Output cleared", COLORS.textMuted)
end)

toggleButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

-- Startup
addLog("🥥 Coconut AI v1.0 loaded", COLORS.primary, true)
addLog("Click 'Create Session' to connect to the web app", COLORS.textSecondary)
setStatus("Ready", COLORS.textSecondary, COLORS.textMuted)

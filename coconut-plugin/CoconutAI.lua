-- Coconut AI Studio Plugin
-- Place in %localappdata%/Roblox/Plugins/ or install via Studio

local plugin = script.Parent
local toolbar = plugin:CreateToolbar("Coconut AI")
local toggleBtn = toolbar:CreateButton("Coconut AI", "Toggle Coconut AI panel", "rbxassetid://0")

local dockWidget = plugin:CreateDockWidgetPluginGui(
	"CoconutAI",
	DockWidgetPluginGuiInfo.new(
		Enum.InitialDockState.Float,
		true, false, 300, 400
	)
)
dockWidget.Title = "Coconut AI"

-- UI
local frame = Instance.new("Frame")
frame.Size = UDim2.new(1, 0, 1, 0)
frame.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
frame.Parent = dockWidget

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 8)
layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
layout.VerticalAlignment = Enum.VerticalAlignment.Top
layout.Parent = frame

local titleLabel = Instance.new("TextLabel")
titleLabel.Size = UDim2.new(1, -16, 0, 32)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "🥥 Coconut AI"
titleLabel.TextColor3 = Color3.fromRGB(45, 212, 191)
titleLabel.TextSize = 18
titleLabel.Font = Enum.Font.GothamBold
titleLabel.Parent = frame

-- Session code display
local codeLabel = Instance.new("TextLabel")
codeLabel.Size = UDim2.new(1, -16, 0, 20)
codeLabel.BackgroundTransparency = 1
codeLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
codeLabel.TextSize = 12
codeLabel.Font = Enum.Font.Gotham
codeLabel.Text = "Session Code: ---"
codeLabel.Parent = frame

-- Buttons row
local btnRow = Instance.new("Frame")
btnRow.Size = UDim2.new(1, -16, 0, 32)
btnRow.BackgroundTransparency = 1
btnRow.Parent = frame

local createBtn = Instance.new("TextButton")
createBtn.Size = UDim2.new(0.5, -4, 1, 0)
createBtn.BackgroundColor3 = Color3.fromRGB(20, 184, 166)
createBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
createBtn.Text = "Create Session"
createBtn.TextSize = 14
createBtn.Font = Enum.Font.GothamSemibold
createBtn.BorderSizePixel = 0
createBtn.Parent = btnRow

local stopBtn = Instance.new("TextButton")
stopBtn.Size = UDim2.new(0.5, -4, 1, 0)
stopBtn.Position = UDim2.new(0.5, 4, 0, 0)
stopBtn.BackgroundColor3 = Color3.fromRGB(220, 60, 60)
stopBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
stopBtn.Text = "Stop"
stopBtn.TextSize = 14
stopBtn.Font = Enum.Font.GothamSemibold
stopBtn.BorderSizePixel = 0
stopBtn.Parent = btnRow

-- Status
local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, -16, 0, 18)
statusLabel.BackgroundTransparency = 1
statusLabel.TextColor3 = Color3.fromRGB(150, 150, 150)
statusLabel.TextSize = 11
statusLabel.Font = Enum.Font.Gotham
statusLabel.Text = "Status: Idle"
statusLabel.Parent = frame

-- Output
local outputBox = Instance.new("ScrollingFrame")
outputBox.Size = UDim2.new(1, -16, 0, 200)
outputBox.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
outputBox.BorderSizePixel = 0
outputBox.CanvasSize = UDim2.new(0, 0, 0, 0)
outputBox.ScrollBarThickness = 4
outputBox.Parent = frame

local outputLayout = Instance.new("UIListLayout")
outputLayout.Padding = UDim.new(0, 2)
outputLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
outputLayout.Parent = outputBox

local function addOutput(text, color)
	local line = Instance.new("TextLabel")
	line.Size = UDim2.new(1, -8, 0, 16)
	line.BackgroundTransparency = 1
	line.Text = text
	line.TextColor3 = color or Color3.fromRGB(200, 200, 200)
	line.TextSize = 11
	line.Font = Enum.Font.Gotham
	line.TextXAlignment = Enum.TextXAlignment.Left
	line.Parent = outputBox
	outputBox.CanvasSize = UDim2.new(0, 0, 0, outputLayout.AbsoluteContentSize.Y)
	task.wait(0.05)
	outputBox.CanvasPosition = Vector2.new(0, outputLayout.AbsoluteContentSize.Y)
end

local activeCode = nil
local polling = false
local connection = nil

local function stopPolling()
	polling = false
	if connection then connection:Disconnect() connection = nil end
	statusLabel.Text = "Status: Idle"
	codeLabel.Text = "Session Code: ---"
	activeCode = nil
end

local function pollForCommands()
	if not activeCode then return end
	local success, result = pcall(function()
		local http = game:GetService("HttpService")
		local url = "https://coconutai.vercel.app/api/plugin/poll?code=" .. activeCode
		local response = http:GetAsync(url)
		local data = http:JSONDecode(response)
		return data
	end)

	if success and result and result.success then
		if result.commands and #result.commands > 0 then
			for _, scriptCode in ipairs(result.commands) do
				addOutput("→ Executing command...", Color3.fromRGB(45, 212, 191))
				local execSuccess, execResult = pcall(function()
					local func = loadstring(scriptCode)
					if func then return func() end
				end)
				if execSuccess then
					addOutput("✓ Executed successfully", Color3.fromRGB(80, 200, 120))
				else
					addOutput("✗ Error: " .. tostring(execResult), Color3.fromRGB(255, 100, 100))
				end
			end
		end
		statusLabel.Text = "Status: Connected"
	else
		statusLabel.Text = "Status: Error polling"
	end
end

createBtn.MouseButton1Click:Connect(function()
	stopPolling()
	addOutput("Creating session...", Color3.fromRGB(150, 150, 150))

	local success, result = pcall(function()
		local http = game:GetService("HttpService")
		local response = http:PostAsync("https://coconutai.vercel.app/api/plugin/create", "", Enum.HttpContentType.ApplicationJson)
		return http:JSONDecode(response)
	end)

	if success and result and result.success then
		activeCode = result.code
		codeLabel.Text = "Session Code: " .. activeCode
		addOutput("Session created: " .. activeCode, Color3.fromRGB(45, 212, 191))
		statusLabel.Text = "Status: Polling"
		polling = true

		-- Poll every 3 seconds
		connection = game:GetService("RunService").Heartbeat:Connect(function()
			if not polling then return end
			pollForCommands()
			task.wait(3)
		end)
	else
		addOutput("Failed to create session", Color3.fromRGB(255, 100, 100))
	end
end)

stopBtn.MouseButton1Click:Connect(stopPolling)

toggleBtn.Click:Connect(function()
	dockWidget.Enabled = not dockWidget.Enabled
end)

addOutput("Coconut AI plugin loaded.", Color3.fromRGB(100, 200, 255))
addOutput("Click 'Create Session' to start.", Color3.fromRGB(150, 150, 150))

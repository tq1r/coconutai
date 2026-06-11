# Coconut AI - Roblox Studio Plugin

Connect your Roblox Studio to Coconut AI for AI-powered script generation.

## Installation

1. **Copy the file**  
   Place `CoconutAI.lua` in your Roblox Plugins folder:
   - Windows: `%localappdata%/Roblox/Plugins/`
   - Mac: `~/Library/Application Support/Roblox/Plugins/`

2. **Restart Roblox Studio**

3. **Find the plugin**  
   Look for the **Coconut AI** button in the Plugins tab (or the toolbar).

## Usage

### In Roblox Studio
1. Click the **Coconut AI** toolbar button to open the panel
2. Click **Create Session** — a 6-character code appears
3. The plugin starts polling for commands automatically

### On the Website
1. Sign in at [coconutai.vercel.app](https://coconutai.vercel.app)
2. Click the **Studio Sync** button in the top navigation bar
3. Enter the 6-character session code
4. Generate scripts with AI — they auto-execute in Studio!

## Features
- Real-time code execution from web to Studio
- Professional UI with session management
- Output log with execution status
- Auto-reconnect on connection loss
- Secure session-based pairing

## Files
- `CoconutAI.lua` — Main plugin script (drag into Plugins folder)
- `CoconutAI.rbxmx` — Model file (drag into Studio viewport)

## Updates
The plugin auto-updates when you reconnect. Always check [coconutai.vercel.app](https://coconutai.vercel.app) for the latest version.

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
const commands_1 = require("./commands");
dotenv_1.default.config();
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
if (!token || !clientId || !guildId) {
    console.error('Missing environment variables for Discord bot.');
    process.exit(1);
}
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
const rest = new discord_js_1.REST({ version: '10' }).setToken(token);
async function registerCommands() {
    try {
        console.log('Registering Discord slash commands...');
        await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), {
            body: commands_1.botCommands.map((command) => command.data.toJSON()),
        });
        console.log('Discord slash commands registered successfully.');
    }
    catch (error) {
        console.error('Failed to register slash commands:', error);
    }
}
client.once(discord_js_1.Events.ClientReady, async () => {
    console.log(`🥥 Coconut AI Bot Online: ${client.user?.tag}`);
    await registerCommands();
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    const command = commands_1.botCommands.find((cmd) => cmd.data.name === interaction.commandName);
    if (!command) {
        await interaction.reply({ content: 'Command not found.', ephemeral: true });
        return;
    }
    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error('Command execution failed:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
        }
    }
});
client.login(token);

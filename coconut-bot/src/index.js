const dotenv = require("dotenv");
const { Client, GatewayIntentBits, REST, Routes, Events } = require("discord.js");
const { botCommands } = require("./commands");

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error("Missing environment variables for Discord bot.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const rest = new REST({ version: "10" }).setToken(token);

async function registerCommands() {
  try {
    console.log("Registering Discord slash commands...");
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: botCommands.map((command) => command.data.toJSON()),
    });
    console.log("Discord slash commands registered successfully.");
  } catch (error) {
    console.error("Failed to register slash commands:", error);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`[CA] Coconut AI Bot Online: ${client.user?.tag}`);
  await registerCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = botCommands.find((cmd) => cmd.data.name === interaction.commandName);
  if (!command) {
    await interaction.reply({ content: "Command not found.", ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Command execution failed:", error);
    if (interaction.deferred) {
      await interaction.editReply({ content: "There was an error executing that command." });
    } else if (!interaction.replied) {
      await interaction.reply({ content: "There was an error executing that command.", ephemeral: true });
    }
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

client.login(token);

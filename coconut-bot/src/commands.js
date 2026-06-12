const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID || "";
const API_URL = process.env.COCONUT_API_URL || "https://coconutai.vercel.app";

const isAdmin = (userId) => userId === ADMIN_DISCORD_ID;

async function adminApiCall(endpoint, method = "GET", body) {
  try {
    const config = { method, url: `${API_URL}/api/admin/${endpoint}`, headers: { "Content-Type": "application/json" } };
    if (body) config.data = body;
    const res = await axios(config);
    return res.data;
  } catch (err) {
    return { error: err?.response?.data?.error || err.message };
  }
}

const botCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("add")
      .setDescription("Grant premium to a user by email")
      .addStringOption((opt) =>
        opt.setName("type").setDescription("Type of grant")
          .setRequired(true)
          .addChoices({ name: "premium", value: "premium" }))
      .addStringOption((opt) =>
        opt.setName("email").setDescription("The user's email on Coconut AI").setRequired(true))
      .addStringOption((opt) =>
        opt.setName("duration").setDescription("How long?")
          .setRequired(true)
          .addChoices(
            { name: "monthly (30 days)", value: "monthly" },
            { name: "lifetime (never expires)", value: "lifetime" },
          )),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: "❌ You are not authorized to use this command.", ephemeral: true });
        return;
      }
      const type = interaction.options.getString("type", true);
      const email = interaction.options.getString("email", true);
      const duration = interaction.options.getString("duration", true);

      if (type === "premium") {
        const expiresAt = duration === "lifetime" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const result = await adminApiCall("user", "PATCH", {
          targetUserId: email,
          role: "premium",
          subscription_tier: "pro",
          subscription_active: true,
          subscription_expires_at: expiresAt,
        });
        const durationText = duration === "lifetime" ? "**Lifetime**" : "**30 days (monthly)**";
        if (result.success) {
          await interaction.reply({
            content: `✅ **${email}** granted ${durationText} premium!\nThey can now use all premium AI models.`,
          });
        } else {
          await interaction.reply({
            content: `❌ Failed: ${result.error}\nMake sure the user has registered on ${API_URL} with that email.`,
            ephemeral: true,
          });
        }
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("remove")
      .setDescription("Remove premium from a user by email")
      .addStringOption((opt) =>
        opt.setName("email").setDescription("The user's email on Coconut AI").setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: "❌ Not authorized.", ephemeral: true });
        return;
      }
      const email = interaction.options.getString("email", true);
      const result = await adminApiCall("user", "PATCH", {
        targetUserId: email,
        subscription_active: false,
        role: "user",
      });
      await interaction.reply({
        content: result.success
          ? `✅ Premium removed from **${email}**`
          : `❌ ${result.error}`,
        ephemeral: true,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("lookup")
      .setDescription("Look up a user by email")
      .addStringOption((opt) =>
        opt.setName("email").setDescription("The user's email on Coconut AI").setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: "❌ Not authorized.", ephemeral: true });
        return;
      }
      const email = interaction.options.getString("email", true);
      const result = await adminApiCall(`user?targetUserId=${encodeURIComponent(email)}`, "GET");
      const userInfo = result.user
        ? `Email: ${result.user.email || "N/A"}\nUsername: ${result.user.username || "N/A"}\nRole: ${result.user.role || "user"}\nPremium: ${result.user.subscription_active ? "✅ Active" : "❌ Inactive"}\nExpires: ${result.user.subscription_expires_at ? new Date(result.user.subscription_expires_at).toLocaleDateString() : "Never"}`
        : "No account found with that email.";
      await interaction.reply({
        content: `🔍 **${email}**\n\`\`\`${userInfo}\`\`\``,
        ephemeral: true,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Show platform statistics"),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: "❌ Not authorized.", ephemeral: true });
        return;
      }
      await interaction.reply({ content: "📊 Check the dashboard for usage stats.", ephemeral: true });
    },
  },
];

module.exports = { botCommands };

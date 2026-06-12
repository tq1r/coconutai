const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID || "";
const API_URL = process.env.COCONUT_API_URL || "https://coconutai.vercel.app";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";
const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

const isAdmin = (userId) => userId === ADMIN_DISCORD_ID;

async function adminApiCall(endpoint, method = "GET", body) {
  try {
    const config = { method, url: `${API_URL}/api/admin/${endpoint}`, headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_API_KEY } };
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
        await interaction.reply({ content: "You are not authorized to use this command.", ephemeral: true });
        return;
      }
      const type = interaction.options.getString("type", true);
      const email = interaction.options.getString("email", true);
      const duration = interaction.options.getString("duration", true);

      if (!isValidEmail(email)) {
        await interaction.reply({ content: "Invalid email format.", ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      if (type === "premium") {
        const expiresAt = duration === "lifetime" ? null : new Date(Date.now() + PREMIUM_DURATION_MS).toISOString();
        const result = await adminApiCall("user", "PATCH", {
          targetUserId: email,
          role: "premium",
          subscription_tier: "pro",
          subscription_active: true,
          subscription_expires_at: expiresAt,
        });
        const durationText = duration === "lifetime" ? "Lifetime" : "30 days (monthly)";
        if (result.success) {
          const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle("Premium Added")
            .addFields(
              { name: "User", value: email, inline: true },
              { name: "Duration", value: durationText, inline: true },
              { name: "Expires", value: expiresAt ? new Date(expiresAt).toLocaleDateString() : "Never", inline: true }
            )
            .setTimestamp()
            .setFooter({ text: "Coconut AI" });
          await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle("Error")
            .setDescription(`${result.error}\nMake sure the user has registered on ${API_URL} with that email.`)
            .setTimestamp()
            .setFooter({ text: "Coconut AI" });
          await interaction.editReply({ embeds: [embed] });
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
        await interaction.reply({ content: "Not authorized.", ephemeral: true });
        return;
      }
      const email = interaction.options.getString("email", true);

      if (!isValidEmail(email)) {
        await interaction.reply({ content: "Invalid email format.", ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const result = await adminApiCall("user", "PATCH", {
        targetUserId: email,
        subscription_active: false,
        role: "user",
      });
      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("Premium Removed")
          .addFields({ name: "User", value: email })
          .setTimestamp()
          .setFooter({ text: "Coconut AI" });
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("Error")
          .setDescription(result.error)
          .setTimestamp()
          .setFooter({ text: "Coconut AI" });
        await interaction.editReply({ embeds: [embed] });
      }
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
        await interaction.reply({ content: "Not authorized.", ephemeral: true });
        return;
      }
      const email = interaction.options.getString("email", true);

      if (!isValidEmail(email)) {
        await interaction.reply({ content: "Invalid email format.", ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const result = await adminApiCall(`user?targetUserId=${encodeURIComponent(email)}`, "GET");
      if (result.user) {
        const u = result.user;
        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("User Lookup")
          .addFields(
            { name: "Email", value: u.email || "N/A", inline: true },
            { name: "Username", value: u.username || "N/A", inline: true },
            { name: "Role", value: u.role || "user", inline: true },
            { name: "Premium Status", value: u.subscription_active ? "Active" : "Inactive", inline: true },
            { name: "Expires", value: u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString() : "Never", inline: true }
          )
          .setTimestamp()
          .setFooter({ text: "Coconut AI" });
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("Error")
          .setDescription("No account found with that email.")
          .setTimestamp()
          .setFooter({ text: "Coconut AI" });
        await interaction.editReply({ embeds: [embed] });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Show platform statistics"),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: "Not authorized.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("Usage Statistics")
        .setDescription("Check the dashboard for usage stats.")
        .setTimestamp()
        .setFooter({ text: "Coconut AI" });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    },
  },
];

module.exports = { botCommands };

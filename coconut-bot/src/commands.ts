import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import axios from 'axios';

const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface BotCommand {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

const isAdmin = (userId: string) => userId === ADMIN_DISCORD_ID;

async function adminApiCall(endpoint: string, method: 'GET' | 'PATCH' = 'GET', body?: any) {
  try {
    const res = await axios({
      method,
      url: `${API_URL}/api/admin/${endpoint}`,
      data: body,
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (err: any) {
    return { error: err?.response?.data?.error || err.message };
  }
}

export const botCommands: BotCommand[] = [
  {
    data: new SlashCommandBuilder()
      .setName('premium')
      .setDescription('Grant premium access to a user')
      .addStringOption((opt) => opt.setName('email').setDescription('User email').setRequired(true))
      .addStringOption((opt) => opt.setName('tier').setDescription('Tier (plus/pro)').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const email = interaction.options.getString('email', true);
      const tier = interaction.options.getString('tier', true);
      const result = await adminApiCall('user', 'PATCH', { targetUserId: email, subscription_tier: tier, subscription_active: true });
      await interaction.reply({ content: result.success ? `✅ Premium ${tier} granted to ${email}` : `❌ ${result.error}`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('removepremium')
      .setDescription('Remove premium access from a user')
      .addStringOption((opt) => opt.setName('email').setDescription('User email').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const email = interaction.options.getString('email', true);
      const result = await adminApiCall('user', 'PATCH', { targetUserId: email, subscription_active: false });
      await interaction.reply({ content: result.success ? `✅ Premium removed from ${email}` : `❌ ${result.error}`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('admin')
      .setDescription('Grant admin role to a user')
      .addStringOption((opt) => opt.setName('email').setDescription('User email').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const email = interaction.options.getString('email', true);
      const result = await adminApiCall('user', 'PATCH', { targetUserId: email, role: 'admin' });
      await interaction.reply({ content: result.success ? `✅ Admin granted to ${email}` : `❌ ${result.error}`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('removeadmin')
      .setDescription('Remove admin role from a user')
      .addStringOption((opt) => opt.setName('email').setDescription('User email').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const email = interaction.options.getString('email', true);
      const result = await adminApiCall('user', 'PATCH', { targetUserId: email, role: 'user' });
      await interaction.reply({ content: result.success ? `✅ Admin removed from ${email}` : `❌ ${result.error}`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('user')
      .setDescription('Look up a user account')
      .addStringOption((opt) => opt.setName('email').setDescription('User email').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const email = interaction.options.getString('email', true);
      // This would need a GET /api/admin/user endpoint
      await interaction.reply({ content: `🔍 Lookup for ${email} - API integration ready.`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('stats')
      .setDescription('Show platform statistics'),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      await interaction.reply({ content: '📊 Platform stats coming soon.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a user')
      .addStringOption((opt) => opt.setName('email').setDescription('User email').setRequired(true))
      .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const email = interaction.options.getString('email', true);
      const reason = interaction.options.getString('reason') || 'No reason';
      const result = await adminApiCall('user', 'PATCH', { targetUserId: email, role: 'banned' });
      await interaction.reply({ content: result.success ? `✅ ${email} banned. Reason: ${reason}` : `❌ ${result.error}`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Unban a user')
      .addStringOption((opt) => opt.setName('email').setDescription('User email').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const email = interaction.options.getString('email', true);
      const result = await adminApiCall('user', 'PATCH', { targetUserId: email, role: 'user' });
      await interaction.reply({ content: result.success ? `✅ ${email} unbanned.` : `❌ ${result.error}`, ephemeral: true });
    },
  },
];

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

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Lifetime';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days >= 365) return `${Math.floor(days / 365)} year(s)`;
  if (days >= 30) return `${Math.floor(days / 30)} month(s)`;
  return `${days} day(s)`;
}

export const botCommands: BotCommand[] = [
  {
    data: new SlashCommandBuilder()
      .setName('add')
      .setDescription('Grant premium to a user')
      .addStringOption((opt) =>
        opt.setName('type').setDescription('Type of grant')
          .setRequired(true)
          .addChoices(
            { name: 'premium', value: 'premium' },
          ))
      .addUserOption((opt) =>
        opt.setName('user').setDescription('The Discord user').setRequired(true))
      .addStringOption((opt) =>
        opt.setName('duration').setDescription('How long?')
          .setRequired(true)
          .addChoices(
            { name: 'monthly (30 days)', value: 'monthly' },
            { name: 'lifetime (never expires)', value: 'lifetime' },
          )),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
        return;
      }
      const type = interaction.options.getString('type', true);
      const targetUser = interaction.options.getUser('user', true);
      const duration = interaction.options.getString('duration', true);

      if (type === 'premium') {
        const expiresAt = duration === 'lifetime' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const result = await adminApiCall('user', 'PATCH', {
          targetUserId: targetUser.email || targetUser.username,
          role: 'premium',
          subscription_tier: 'pro',
          subscription_active: true,
          subscription_expires_at: expiresAt,
        });
        const durationText = duration === 'lifetime' ? '**Lifetime**' : '**30 days (monthly)**';
        if (result.success) {
          await interaction.reply({
            content: `✅ **${targetUser.tag}** has been granted ${durationText} premium access!\nThey can now use all premium AI models including TXMO.`,
          });
        } else {
          await interaction.reply({
            content: `❌ Failed: ${result.error}\nMake sure the user has a Coconut AI account linked to their Discord.`,
            ephemeral: true,
          });
        }
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('remove')
      .setDescription('Remove premium from a user')
      .addStringOption((opt) =>
        opt.setName('type').setDescription('Type').setRequired(true)
          .addChoices({ name: 'premium', value: 'premium' }))
      .addUserOption((opt) =>
        opt.setName('user').setDescription('The Discord user').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const targetUser = interaction.options.getUser('user', true);
      const result = await adminApiCall('user', 'PATCH', {
        targetUserId: targetUser.email || targetUser.username,
        subscription_active: false,
        role: 'user',
      });
      await interaction.reply({
        content: result.success
          ? `✅ Premium removed from **${targetUser.tag}**`
          : `❌ ${result.error}`,
        ephemeral: true,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('lookup')
      .setDescription('Look up a user by Discord username or email')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('The Discord user').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
        return;
      }
      const targetUser = interaction.options.getUser('user', true);
      const result = await adminApiCall('user', 'GET');
      const userInfo = result.user
        ? `Email: ${result.user.email || 'N/A'}\nRole: ${result.user.role || 'user'}\nPremium: ${result.user.subscription_active ? '✅ Active' : '❌ Inactive'}\nExpires: ${result.user.subscription_expires_at ? new Date(result.user.subscription_expires_at).toLocaleDateString() : 'Never'}`
        : 'No account found. User may not have registered on the website.';
      await interaction.reply({
        content: `🔍 **${targetUser.tag}**\n\`\`\`${userInfo}\`\`\``,
        ephemeral: true,
      });
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
];

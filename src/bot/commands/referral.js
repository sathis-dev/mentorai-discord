import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { User } from '../../database/models/User.js';
import { COLORS, createProgressBar } from '../../config/designSystem.js';
import { animateLoading } from '../../utils/animations.js';

export const data = new SlashCommandBuilder()
  .setName('referral')
  .setDescription('🎁 Invite friends, earn XP, unlock exclusive rewards!')
  .addSubcommand(sub =>
    sub.setName('link')
      .setDescription('Get your personal referral link & code'))
  .addSubcommand(sub =>
    sub.setName('stats')
      .setDescription('View your referral statistics & progress'))
  .addSubcommand(sub =>
    sub.setName('claim')
      .setDescription('Claim pending referral rewards'))
  .addSubcommand(sub =>
    sub.setName('leaderboard')
      .setDescription('See top referrers'));

// Referral rewards
const REFERRAL_REWARDS = {
  perInvite: 100,        // XP per friend who joins
  bonus5: 250,           // Bonus at 5 referrals
  bonus10: 500,          // Bonus at 10 referrals
  bonus25: 1000,         // Bonus at 25 referrals
  friendBonus: 50        // XP the friend gets too
};

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'link':
      await showReferralLink(interaction);
      break;
    case 'stats':
      await showReferralStats(interaction);
      break;
    case 'claim':
      await claimRewards(interaction);
      break;
    case 'leaderboard':
      await showReferralLeaderboard(interaction);
      break;
  }
}

async function showReferralLink(interaction) {
  await interaction.deferReply();
  
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const referrals = user.referrals || 0;
  
  // Generate referral code (simple: base64 of discord ID)
  const referralCode = Buffer.from(interaction.user.id).toString('base64').slice(0, 8);
  const botInvite = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=277025508416&scope=bot%20applications.commands`;
  const rank = getReferralRank(referrals);

  const embed = new EmbedBuilder()
    .setTitle('🎁 Referral Program')
    .setColor(rank.color)
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 512 }))
    .setDescription(
      '```ansi\n' +
      '\u001b[1;32m╔═══════════════════════════════════╗\u001b[0m\n' +
      '\u001b[1;32m║\u001b[0m   🎁 INVITE & EARN REWARDS 🎁  \u001b[1;32m║\u001b[0m\n' +
      '\u001b[1;32m╚═══════════════════════════════════╝\u001b[0m\n' +
      '```\n\n' +
      '### 🎫 Your Referral Code\n' +
      '```fix\n' + referralCode + '\n```'
    )
    .addFields(
      { name: '━━━━ REWARDS ━━━━', value: '\u200b', inline: false },
      { 
        name: '🎁 Per Invite', 
        value: '```diff\n+ ' + REFERRAL_REWARDS.perInvite + ' XP (You)\n+ ' + REFERRAL_REWARDS.friendBonus + ' XP (Friend)\n```', 
        inline: true 
      },
      { 
        name: rank.badge + ' Your Rank', 
        value: '```\n' + rank.name + '\n```', 
        inline: true 
      },
      { 
        name: '👥 Referrals', 
        value: '```\n' + referrals + '\n```', 
        inline: true 
      },
      { 
        name: '🏆 Milestone Bonuses', 
        value: getMilestoneDisplay(referrals),
        inline: false 
      },
      {
        name: '📤 How It Works',
        value: '1️⃣ Share the invite link below\n' +
               '2️⃣ Friend joins and uses `/daily`\n' +
               '3️⃣ Both earn XP automatically!',
        inline: false
      }
    )
    .setFooter({ text: '🎓 MentorAI Referral Program | Spread the knowledge!' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🌐 Share Bot Invite')
      .setStyle(ButtonStyle.Link)
      .setURL(botInvite),
    new ButtonBuilder()
      .setCustomId('referral_stats')
      .setLabel('My Stats')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📊'),
    new ButtonBuilder()
      .setCustomId('referral_leaderboard')
      .setLabel('Top Referrers')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏆')
  );

  await interaction.editReply({ embeds: [embed], components: [buttons] });
}

function getMilestoneDisplay(referrals) {
  const milestones = [
    { count: 5, reward: REFERRAL_REWARDS.bonus5, badge: '🟢' },
    { count: 10, reward: REFERRAL_REWARDS.bonus10, badge: '🟡' },
    { count: 25, reward: REFERRAL_REWARDS.bonus25, badge: '🌟' }
  ];
  
  return milestones.map(m => {
    const achieved = referrals >= m.count;
    const icon = achieved ? '✅' : '⬜';
    return `${icon} **${m.count} invites:** +${m.reward} XP ${achieved ? '(CLAIMED!)' : ''}`;
  }).join('\n');
}

async function showReferralStats(interaction) {
  // Show loading animation
  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(COLORS.PRIMARY_BLUE)
      .setDescription(animateLoading('Calculating your referral impact'))
    ]
  });

  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const referrals = user.referrals || 0;
  const referralXpEarned = user.referralXpEarned || 0;
  const rank = getReferralRank(referrals);

  // Calculate progress to next milestone
  let nextMilestone, progress;
  if (referrals < 5) {
    nextMilestone = 5;
    progress = (referrals / 5) * 100;
  } else if (referrals < 10) {
    nextMilestone = 10;
    progress = ((referrals - 5) / 5) * 100;
  } else if (referrals < 25) {
    nextMilestone = 25;
    progress = ((referrals - 10) / 15) * 100;
  } else {
    nextMilestone = null;
    progress = 100;
  }

  const progressBarVisual = createProgressBar(progress, 12);

  // Build premium stats display
  let statsDisplay = 
    '```ansi\n' +
    '\u001b[1;36m╔══════════════════════════════════════╗\u001b[0m\n' +
    '\u001b[1;36m║\u001b[0m   📊 YOUR REFERRAL DASHBOARD 📊    \u001b[1;36m║\u001b[0m\n' +
    '\u001b[1;36m╠══════════════════════════════════════╣\u001b[0m\n' +
    '\u001b[1;36m║\u001b[0m                                      \u001b[1;36m║\u001b[0m\n' +
    '\u001b[1;36m║\u001b[0m  👥 REFERRALS: \u001b[1;33m' + String(referrals).padEnd(18) + '\u001b[0m \u001b[1;36m║\u001b[0m\n' +
    '\u001b[1;36m║\u001b[0m  ✨ XP EARNED:  \u001b[1;32m+' + referralXpEarned.toLocaleString().padEnd(17) + '\u001b[0m \u001b[1;36m║\u001b[0m\n' +
    '\u001b[1;36m║\u001b[0m  🏅 RANK:       \u001b[1;35m' + rank.name.padEnd(18) + '\u001b[0m \u001b[1;36m║\u001b[0m\n' +
    '\u001b[1;36m║\u001b[0m                                      \u001b[1;36m║\u001b[0m\n' +
    '\u001b[1;36m╚══════════════════════════════════════╝\u001b[0m\n' +
    '```';

  let progressSection = '';
  if (nextMilestone) {
    progressSection = 
      `\n**🎯 Next Milestone: ${nextMilestone} referrals**\n` +
      `${progressBarVisual} **${Math.round(progress)}%**\n` +
      `_${nextMilestone - referrals} more invite${nextMilestone - referrals !== 1 ? 's' : ''} to go!_`;
  } else {
    progressSection = 
      '\n```ansi\n' +
      '\u001b[1;33m★★★ INFLUENCER STATUS ACHIEVED ★★★\u001b[0m\n' +
      '```\n' +
      '_You\'ve reached the highest referral rank! 🎉_';
  }

  const embed = new EmbedBuilder()
    .setTitle(`${rank.badge} Referral Stats`)
    .setColor(rank.color)
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setDescription(statsDisplay + progressSection)
    .addFields({
      name: '🏆 Rank Progression',
      value: getMilestoneDisplay(referrals),
      inline: false
    })
    .setFooter({ text: '🎓 MentorAI | Every invite helps grow our community!' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('referral_link')
      .setLabel('Get My Link')
      .setEmoji('🔗')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('referral_leaderboard')
      .setLabel('Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [buttons] });
}

async function claimRewards(interaction) {
  // Show claiming animation
  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(COLORS.XP_GOLD)
      .setDescription(animateLoading('Processing your rewards'))
    ],
    ephemeral: true
  });

  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const pendingRewards = user.pendingReferralRewards || 0;

  if (pendingRewards <= 0) {
    const noRewardsEmbed = new EmbedBuilder()
      .setColor(COLORS.ERROR_RED)
      .setDescription(
        '```ansi\n' +
        '\u001b[1;31m╔════════════════════════════════╗\u001b[0m\n' +
        '\u001b[1;31m║\u001b[0m  ❌ NO PENDING REWARDS        \u001b[1;31m║\u001b[0m\n' +
        '\u001b[1;31m╚════════════════════════════════╝\u001b[0m\n' +
        '```\n' +
        '_Invite more friends to earn XP!_\n\n' +
        '💡 Use `/referral link` to get your invite link'
      );
    return interaction.editReply({ embeds: [noRewardsEmbed] });
  }

  // Claim rewards
  await user.addXp(pendingRewards);
  user.pendingReferralRewards = 0;
  user.referralXpEarned = (user.referralXpEarned || 0) + pendingRewards;
  await user.save();

  const embed = new EmbedBuilder()
    .setTitle('🎁 Rewards Claimed!')
    .setColor(COLORS.SUCCESS_GREEN)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;32m╔════════════════════════════════════╗\u001b[0m\n' +
      '\u001b[1;32m║\u001b[0m  🎉 CONGRATULATIONS! 🎉          \u001b[1;32m║\u001b[0m\n' +
      '\u001b[1;32m╠════════════════════════════════════╣\u001b[0m\n' +
      '\u001b[1;32m║\u001b[0m                                    \u001b[1;32m║\u001b[0m\n' +
      '\u001b[1;32m║\u001b[0m      ✨  \u001b[1;33m+' + String(pendingRewards).padEnd(6) + ' XP\u001b[0m  ✨       \u001b[1;32m║\u001b[0m\n' +
      '\u001b[1;32m║\u001b[0m                                    \u001b[1;32m║\u001b[0m\n' +
      '\u001b[1;32m╚════════════════════════════════════╝\u001b[0m\n' +
      '```\n' +
      '🚀 Thanks for spreading the word about MentorAI!\n' +
      '_Keep inviting for more rewards!_'
    )
    .setFooter({ text: '🎓 MentorAI | Total earned: ' + user.referralXpEarned.toLocaleString() + ' XP from referrals' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function showReferralLeaderboard(interaction) {
  await interaction.deferReply();

  // Get top referrers
  const users = await User.find({ referrals: { $gt: 0 } })
    .sort({ referrals: -1 })
    .limit(10)
    .lean();

  const medals = ['🥇', '🥈', '🥉'];
  let leaderboardText = '';

  if (users.length === 0) {
    leaderboardText = '_No referrals yet! Be the first!_';
  } else {
    users.forEach((user, index) => {
      const medal = medals[index] || `\`${index + 1}.\``;
      const rank = getReferralRank(user.referrals || 0);
      leaderboardText += `${medal} **${user.username}** — ${user.referrals} invites ${rank.badge}\n`;
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🏆 Top Referrers')
    .setColor(COLORS.XP_GOLD)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;33m╔═══════════════════════════════════╗\u001b[0m\n' +
      '\u001b[1;33m║\u001b[0m   🏆 REFERRAL HALL OF FAME 🏆   \u001b[1;33m║\u001b[0m\n' +
      '\u001b[1;33m╚═══════════════════════════════════╝\u001b[0m\n' +
      '```\n\n' +
      leaderboardText
    )
    .addFields({
      name: '💡 Join the Leaderboard',
      value: 'Use `/referral link` to get your referral code and start inviting!',
      inline: false
    })
    .setFooter({ text: '🎓 MentorAI | Spread the knowledge, earn rewards!' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('referral_link')
      .setLabel('Get My Link')
      .setEmoji('🔗')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('referral_stats')
      .setLabel('My Stats')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [buttons] });
}

function getReferralRank(referrals) {
  if (referrals >= 25) return { name: 'INFLUENCER', badge: '🌟', color: 0xFF00FF };
  if (referrals >= 10) return { name: 'AMBASSADOR', badge: '💎', color: 0x00D9FF };
  if (referrals >= 5) return { name: 'ADVOCATE', badge: '💜', color: 0x9B59B6 };
  if (referrals >= 1) return { name: 'SUPPORTER', badge: '💚', color: 0x2ECC71 };
  return { name: 'NEWCOMER', badge: '⚪', color: 0x99AAB5 };
}

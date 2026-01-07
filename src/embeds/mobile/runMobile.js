// src/embeds/mobile/runMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { MOBILE } from '../../utils/mobileUI.js';

// Language selection (mobile)
export function createMobileRunSelectEmbed() {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setTitle('💻 Run Code')
    .setDescription(`
${MOBILE.separators.thin}

Select a language:

🐍 Python
⚡ JavaScript  
💚 Node.js
☕ Java
⚙️ C++

${MOBILE.separators.thin}

💡 *Tap to start coding*
    `)
    .setFooter({ text: '📝 Opens code editor' });

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('run_python')
        .setLabel('🐍 Python')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('run_javascript')
        .setLabel('⚡ JS')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('run_nodejs')
        .setLabel('💚 Node')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('run_java')
        .setLabel('☕ Java')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('run_cpp')
        .setLabel('⚙️ C++')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('run_more')
        .setLabel('📋 More')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row1, row2] };
}

// Code input modal (mobile-friendly)
export function createMobileCodeModal(language) {
  const placeholders = {
    python: 'print("Hello!")',
    javascript: 'console.log("Hello!");',
    nodejs: 'console.log("Hello!");',
    java: 'System.out.println("Hello!");',
    cpp: 'cout << "Hello!";'
  };

  return new ModalBuilder()
    .setCustomId(`code_modal_${language}`)
    .setTitle(`💻 ${language} Code`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('code_input')
          .setLabel('Your Code')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder(placeholders[language] || 'Enter code...')
          .setRequired(true)
          .setMaxLength(1500) // Shorter for mobile
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('stdin_input')
          .setLabel('Input (optional)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Program input...')
          .setRequired(false)
          .setMaxLength(200)
      )
    );
}

// Running/loading state (mobile)
export function createMobileRunLoadingEmbed(language) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setDescription(`
╭─────────────╮
│             │
│ ⚙️ Running  │
│   ${(language || 'code').substring(0, 8)}...  │
│             │
│  ▰▰▰▱▱▱▱▱  │
│             │
╰─────────────╯
    `);

  return { embeds: [embed], components: [] };
}

// Code execution result (mobile)
export function createMobileRunResultEmbed(success, code, output, language, executionTime, user) {
  const color = success ? MOBILE.colors.SUCCESS : MOBILE.colors.ERROR;
  const statusIcon = success ? '✅' : '❌';
  const statusText = success ? 'Success' : 'Error';
  
  // Truncate for mobile
  const mobileCode = code?.length > 300 
    ? code.substring(0, 297) + '...' 
    : code || '';
  
  const mobileOutput = output?.length > 400 
    ? output.substring(0, 397) + '...' 
    : output || '(No output)';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `💻 ${language || 'Code'}`
    })
    .setTitle(`${statusIcon} ${statusText}`)
    .setDescription(`
**📝 Code:**
\`\`\`${language || ''}
${mobileCode}
\`\`\`

**📤 Output:**
\`\`\`
${mobileOutput}
\`\`\`
    `)
    .addFields({
      name: '📊 Stats',
      value: `⏱️ ${executionTime || 0}ms • ✨ +15 XP`,
      inline: false
    })
    .setFooter({
      text: `💡 ${getCodeTip(language)}`
    });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('run_edit')
        .setLabel('✏️ Edit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('run_new')
        .setLabel('📝 New')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`debug_${language}`)
        .setLabel('🐛 Debug')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

function getCodeTip(language) {
  const tips = {
    python: 'Use list comprehensions!',
    javascript: 'Try arrow functions!',
    nodejs: 'Use async/await!',
    java: 'Remember semicolons!',
    cpp: 'Watch your pointers!'
  };
  return tips[language] || 'Keep practicing!';
}

// More languages selection (mobile)
export function createMobileMoreLanguagesEmbed() {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setTitle('📋 More Languages')
    .setDescription(`
${MOBILE.separators.thin}

**Available:**

🦀 Rust
🐹 Go
💎 Ruby
🐘 PHP
🔷 TypeScript
⚡ C#

${MOBILE.separators.thin}

💡 *More coming soon!*
    `)
    .setFooter({ text: '👇 Select language' });

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('run_rust')
        .setLabel('🦀 Rust')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('run_go')
        .setLabel('🐹 Go')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('run_ruby')
        .setLabel('💎 Ruby')
        .setStyle(ButtonStyle.Secondary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('run_php')
        .setLabel('🐘 PHP')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('run_typescript')
        .setLabel('🔷 TS')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('run_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row1, row2] };
}

export default {
  createMobileRunSelectEmbed,
  createMobileCodeModal,
  createMobileRunLoadingEmbed,
  createMobileRunResultEmbed,
  createMobileMoreLanguagesEmbed
};

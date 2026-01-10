/**
 * Certificate Generator - PDF & Text Certificates
 * 
 * Features:
 * - PDF certificate generation
 * - Multiple templates (completion, achievement, mastery)
 * - Unique certificate IDs
 * - Text fallback for Discord
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CertificateGenerator {
  constructor() {
    this.templates = {
      completion: {
        title: 'Certificate of Completion',
        subtitle: 'has successfully completed',
        color: '#2C3E50',
        accentColor: '#3498DB',
        borderColor: '#2980B9'
      },
      achievement: {
        title: 'Achievement Certificate',
        subtitle: 'has earned the achievement',
        color: '#8B4513',
        accentColor: '#D4AF37',
        borderColor: '#B8860B'
      },
      mastery: {
        title: 'Certificate of Mastery',
        subtitle: 'has demonstrated mastery in',
        color: '#1A1A2E',
        accentColor: '#FFD700',
        borderColor: '#DAA520'
      },
      milestone: {
        title: 'Milestone Certificate',
        subtitle: 'has reached an incredible milestone',
        color: '#2E4057',
        accentColor: '#57CC99',
        borderColor: '#38A3A5'
      }
    };
  }

  /**
   * Generate PDF certificate
   * @param {Object} user - User data
   * @param {Object} achievement - Achievement data
   * @param {string} type - Certificate type
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateCertificate(user, achievement, type = 'completion') {
    const template = this.templates[type] || this.templates.completion;
    
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on('error', reject);

      try {
        // Draw certificate
        this.drawCertificate(doc, user, achievement, template);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw certificate content
   */
  drawCertificate(doc, user, achievement, template) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;

    // Background gradient effect (using rectangles)
    doc.rect(0, 0, pageWidth, pageHeight)
       .fill('#FAFAFA');

    // Decorative corner elements
    this.drawCornerDecorations(doc, pageWidth, pageHeight, margin, template);

    // Main border
    doc.strokeColor(template.borderColor)
       .lineWidth(4)
       .rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
       .stroke();

    // Inner border
    doc.strokeColor(template.accentColor)
       .lineWidth(2)
       .rect(margin + 15, margin + 15, pageWidth - margin * 2 - 30, pageHeight - margin * 2 - 30)
       .stroke();

    // Title
    doc.font('Helvetica-Bold')
       .fontSize(42)
       .fillColor(template.color)
       .text(template.title, 0, 100, { align: 'center', width: pageWidth });

    // Decorative line under title
    const lineY = 155;
    doc.strokeColor(template.accentColor)
       .lineWidth(2)
       .moveTo(pageWidth / 2 - 150, lineY)
       .lineTo(pageWidth / 2 + 150, lineY)
       .stroke();

    // "This certifies that"
    doc.font('Helvetica')
       .fontSize(18)
       .fillColor('#666666')
       .text('This certifies that', 0, 190, { align: 'center', width: pageWidth });

    // User's name
    doc.font('Helvetica-Bold')
       .fontSize(48)
       .fillColor(template.color)
       .text(user.username || 'Unknown User', 0, 225, { align: 'center', width: pageWidth });

    // Subtitle
    doc.font('Helvetica')
       .fontSize(18)
       .fillColor('#666666')
       .text(template.subtitle, 0, 290, { align: 'center', width: pageWidth });

    // Achievement name
    doc.font('Helvetica-Bold')
       .fontSize(32)
       .fillColor(template.accentColor)
       .text(achievement.name || 'Achievement', 0, 325, { align: 'center', width: pageWidth });

    // Description
    if (achievement.description) {
      doc.font('Helvetica')
         .fontSize(14)
         .fillColor('#333333')
         .text(achievement.description, 100, 380, { 
           align: 'center',
           width: pageWidth - 200
         });
    }

    // Stats line
    const statsY = 430;
    const totalXp = user.prestige?.totalXpEarned || user.totalXp || user.xp || 0;
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#666666')
       .text(`Level ${user.level || 1} • ${totalXp.toLocaleString()} Total XP • ${new Date().toLocaleDateString()}`, 
         0, statsY, { align: 'center', width: pageWidth });

    // Certificate ID
    const certId = this.generateCertId(user, achievement);
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#999999')
       .text(`Certificate ID: ${certId}`, 0, statsY + 25, { align: 'center', width: pageWidth });

    // Signature area
    const signY = 490;
    
    // Left signature line
    doc.strokeColor('#333333')
       .lineWidth(1)
       .moveTo(150, signY)
       .lineTo(350, signY)
       .stroke();
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#333333')
       .text('MentorAI Learning Platform', 150, signY + 10, { width: 200, align: 'center' });

    // Right signature line
    doc.moveTo(pageWidth - 350, signY)
       .lineTo(pageWidth - 150, signY)
       .stroke();
    
    doc.text('Verified Achievement', pageWidth - 350, signY + 10, { width: 200, align: 'center' });

    // Seal/Badge
    this.drawSeal(doc, pageWidth / 2, signY - 20, template);
  }

  /**
   * Draw corner decorations
   */
  drawCornerDecorations(doc, pageWidth, pageHeight, margin, template) {
    const cornerSize = 40;
    
    // Top-left
    doc.path(`M ${margin} ${margin + cornerSize} L ${margin} ${margin} L ${margin + cornerSize} ${margin}`)
       .lineWidth(3)
       .strokeColor(template.accentColor)
       .stroke();

    // Top-right
    doc.path(`M ${pageWidth - margin - cornerSize} ${margin} L ${pageWidth - margin} ${margin} L ${pageWidth - margin} ${margin + cornerSize}`)
       .stroke();

    // Bottom-left
    doc.path(`M ${margin} ${pageHeight - margin - cornerSize} L ${margin} ${pageHeight - margin} L ${margin + cornerSize} ${pageHeight - margin}`)
       .stroke();

    // Bottom-right
    doc.path(`M ${pageWidth - margin - cornerSize} ${pageHeight - margin} L ${pageWidth - margin} ${pageHeight - margin} L ${pageWidth - margin} ${pageHeight - margin - cornerSize}`)
       .stroke();
  }

  /**
   * Draw verification seal
   */
  drawSeal(doc, x, y, template) {
    const radius = 30;

    // Outer circle
    doc.circle(x, y, radius)
       .fillAndStroke(template.accentColor, template.borderColor);

    // Inner circle
    doc.circle(x, y, radius - 5)
       .stroke(template.borderColor);

    // Star in center
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('#FFFFFF')
       .text('✓', x - 8, y - 12);
  }

  /**
   * Generate unique certificate ID
   * @param {Object} user - User data
   * @param {Object} achievement - Achievement data
   * @returns {string} Certificate ID
   */
  generateCertId(user, achievement) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const userId = (user.discordId || 'UNKNOWN').slice(-4).toUpperCase();
    const achievementId = (achievement.id || 'ACH').slice(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `CERT-${timestamp}-${userId}-${achievementId}-${random}`;
  }

  /**
   * Generate text certificate for Discord
   * @param {Object} user - User data
   * @param {Object} achievement - Achievement data
   * @param {string} type - Certificate type
   * @returns {string} Text certificate
   */
  generateTextCertificate(user, achievement, type = 'completion') {
    const template = this.templates[type] || this.templates.completion;
    const certId = this.generateCertId(user, achievement);
    const totalXp = user.prestige?.totalXpEarned || user.totalXp || user.xp || 0;

    const border = '═'.repeat(40);
    const thinBorder = '─'.repeat(40);

    return `
╔${border}╗
║      📜 **${template.title}**      ║
╠${border}╣

           *This certifies that*

        **${user.username || 'Unknown User'}**

           ${template.subtitle}

        🏆 **${achievement.name || 'Achievement'}**

${achievement.description ? `*${achievement.description}*\n` : ''}
${thinBorder}

📊 **Stats at Achievement:**
   • Level: ${user.level || 1}
   • Total XP: ${totalXp.toLocaleString()}
   • Date: ${new Date().toLocaleDateString()}

${thinBorder}

🔐 Certificate ID: \`${certId}\`

╚${border}╝

*Verified by MentorAI Learning Platform* ✓
    `.trim();
  }

  /**
   * Generate milestone certificate
   * @param {Object} user - User data
   * @param {Object} milestone - Milestone data
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateMilestoneCertificate(user, milestone) {
    const achievement = {
      id: `milestone_${milestone.type}`,
      name: milestone.name,
      description: milestone.description
    };

    return this.generateCertificate(user, achievement, 'milestone');
  }

  /**
   * Generate mastery certificate
   * @param {Object} user - User data
   * @param {Object} skill - Mastered skill
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateMasteryCertificate(user, skill) {
    const achievement = {
      id: `mastery_${skill.id}`,
      name: skill.name,
      description: `Demonstrated complete mastery of ${skill.name} by completing all learning objectives and achieving expert-level proficiency.`
    };

    return this.generateCertificate(user, achievement, 'mastery');
  }
}

export const certificateGenerator = new CertificateGenerator();
export default certificateGenerator;

/**
 * Skill Service - Skill Tree System
 * 
 * Features:
 * - Topic-to-skill mapping
 * - Skill progression tracking
 * - Skill tree visualization data
 * - Mastery levels
 */

export class SkillService {
  constructor() {
    /**
     * Skill Tree Structure
     * Each skill has prerequisites, XP requirements, and benefits
     */
    this.skillTree = {
      // ============== PROGRAMMING FUNDAMENTALS ==============
      programming_basics: {
        id: 'programming_basics',
        name: '💻 Programming Basics',
        description: 'Foundation of all programming',
        category: 'programming',
        tier: 1,
        prerequisites: [],
        xpToMaster: 500,
        topics: ['variables', 'data-types', 'operators', 'syntax', 'basics'],
        benefits: {
          xpBonus: 0.05  // 5% XP bonus for related topics
        }
      },
      control_flow: {
        id: 'control_flow',
        name: '🔀 Control Flow',
        description: 'Conditionals and loops',
        category: 'programming',
        tier: 2,
        prerequisites: ['programming_basics'],
        xpToMaster: 750,
        topics: ['if-else', 'loops', 'switch', 'conditionals', 'iteration'],
        benefits: {
          xpBonus: 0.05
        }
      },
      functions: {
        id: 'functions',
        name: '⚡ Functions',
        description: 'Modular code with functions',
        category: 'programming',
        tier: 2,
        prerequisites: ['programming_basics'],
        xpToMaster: 750,
        topics: ['functions', 'parameters', 'return', 'scope', 'closures'],
        benefits: {
          xpBonus: 0.05
        }
      },
      data_structures: {
        id: 'data_structures',
        name: '📊 Data Structures',
        description: 'Arrays, lists, and collections',
        category: 'programming',
        tier: 3,
        prerequisites: ['control_flow', 'functions'],
        xpToMaster: 1000,
        topics: ['arrays', 'lists', 'stacks', 'queues', 'trees', 'graphs', 'hash-tables'],
        benefits: {
          xpBonus: 0.10
        }
      },
      algorithms: {
        id: 'algorithms',
        name: '🧮 Algorithms',
        description: 'Problem-solving patterns',
        category: 'programming',
        tier: 4,
        prerequisites: ['data_structures'],
        xpToMaster: 1500,
        topics: ['sorting', 'searching', 'recursion', 'dynamic-programming', 'big-o'],
        benefits: {
          xpBonus: 0.10,
          quizSpeedBonus: 1.1  // 10% more speed bonus
        }
      },
      oop: {
        id: 'oop',
        name: '🏗️ Object-Oriented Programming',
        description: 'Classes, objects, and OOP principles',
        category: 'programming',
        tier: 3,
        prerequisites: ['functions'],
        xpToMaster: 1000,
        topics: ['classes', 'objects', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction'],
        benefits: {
          xpBonus: 0.10
        }
      },

      // ============== WEB DEVELOPMENT ==============
      html_css: {
        id: 'html_css',
        name: '🎨 HTML & CSS',
        description: 'Web page structure and styling',
        category: 'web',
        tier: 1,
        prerequisites: [],
        xpToMaster: 500,
        topics: ['html', 'css', 'styling', 'layout', 'flexbox', 'grid'],
        benefits: {
          xpBonus: 0.05
        }
      },
      javascript: {
        id: 'javascript',
        name: '🌐 JavaScript',
        description: 'Web programming language',
        category: 'web',
        tier: 2,
        prerequisites: ['html_css', 'programming_basics'],
        xpToMaster: 1000,
        topics: ['javascript', 'js', 'dom', 'events', 'es6', 'async', 'promises'],
        benefits: {
          xpBonus: 0.10
        }
      },
      react: {
        id: 'react',
        name: '⚛️ React',
        description: 'React framework mastery',
        category: 'web',
        tier: 3,
        prerequisites: ['javascript'],
        xpToMaster: 1500,
        topics: ['react', 'components', 'hooks', 'state', 'props', 'jsx'],
        benefits: {
          xpBonus: 0.10
        }
      },
      nodejs: {
        id: 'nodejs',
        name: '🚀 Node.js',
        description: 'Server-side JavaScript',
        category: 'web',
        tier: 3,
        prerequisites: ['javascript'],
        xpToMaster: 1500,
        topics: ['nodejs', 'node', 'express', 'api', 'backend', 'server'],
        benefits: {
          xpBonus: 0.10
        }
      },
      databases: {
        id: 'databases',
        name: '🗄️ Databases',
        description: 'Data storage and retrieval',
        category: 'web',
        tier: 3,
        prerequisites: ['javascript'],
        xpToMaster: 1200,
        topics: ['sql', 'mongodb', 'database', 'queries', 'nosql', 'postgres'],
        benefits: {
          xpBonus: 0.10
        }
      },

      // ============== PYTHON ==============
      python_basics: {
        id: 'python_basics',
        name: '🐍 Python Basics',
        description: 'Python programming fundamentals',
        category: 'python',
        tier: 1,
        prerequisites: [],
        xpToMaster: 500,
        topics: ['python', 'python-basics', 'pip', 'virtual-env'],
        benefits: {
          xpBonus: 0.05
        }
      },
      python_advanced: {
        id: 'python_advanced',
        name: '🐍 Python Advanced',
        description: 'Advanced Python concepts',
        category: 'python',
        tier: 3,
        prerequisites: ['python_basics', 'oop'],
        xpToMaster: 1200,
        topics: ['decorators', 'generators', 'metaclasses', 'async-python'],
        benefits: {
          xpBonus: 0.10
        }
      },
      data_science: {
        id: 'data_science',
        name: '📈 Data Science',
        description: 'Data analysis and visualization',
        category: 'python',
        tier: 4,
        prerequisites: ['python_advanced', 'algorithms'],
        xpToMaster: 2000,
        topics: ['pandas', 'numpy', 'matplotlib', 'data-analysis', 'statistics'],
        benefits: {
          xpBonus: 0.15
        }
      },
      machine_learning: {
        id: 'machine_learning',
        name: '🤖 Machine Learning',
        description: 'ML algorithms and models',
        category: 'python',
        tier: 5,
        prerequisites: ['data_science'],
        xpToMaster: 3000,
        topics: ['machine-learning', 'ml', 'tensorflow', 'pytorch', 'neural-networks', 'ai'],
        benefits: {
          xpBonus: 0.20
        }
      },

      // ============== GENERAL SKILLS ==============
      git: {
        id: 'git',
        name: '📂 Git & Version Control',
        description: 'Code versioning and collaboration',
        category: 'tools',
        tier: 1,
        prerequisites: [],
        xpToMaster: 400,
        topics: ['git', 'github', 'version-control', 'branches', 'merge', 'pull-request'],
        benefits: {
          xpBonus: 0.05
        }
      },
      testing: {
        id: 'testing',
        name: '🧪 Testing',
        description: 'Writing and running tests',
        category: 'tools',
        tier: 3,
        prerequisites: ['functions'],
        xpToMaster: 800,
        topics: ['testing', 'unit-tests', 'jest', 'mocha', 'tdd', 'test-driven'],
        benefits: {
          xpBonus: 0.10
        }
      },
      devops: {
        id: 'devops',
        name: '☁️ DevOps',
        description: 'Deployment and infrastructure',
        category: 'tools',
        tier: 4,
        prerequisites: ['git', 'nodejs'],
        xpToMaster: 1500,
        topics: ['docker', 'kubernetes', 'ci-cd', 'aws', 'deployment', 'cloud'],
        benefits: {
          xpBonus: 0.15
        }
      }
    };

    /**
     * Mastery levels
     */
    this.masteryLevels = [
      { level: 1, name: 'Novice', xpPercent: 0, emoji: '🌱' },
      { level: 2, name: 'Apprentice', xpPercent: 25, emoji: '📚' },
      { level: 3, name: 'Practitioner', xpPercent: 50, emoji: '⚡' },
      { level: 4, name: 'Expert', xpPercent: 75, emoji: '🌟' },
      { level: 5, name: 'Master', xpPercent: 100, emoji: '👑' }
    ];
  }

  /**
   * Get skill by ID
   * @param {string} skillId - Skill ID
   * @returns {Object|null} Skill data
   */
  getSkill(skillId) {
    return this.skillTree[skillId] || null;
  }

  /**
   * Find skill by topic
   * @param {string} topic - Topic name
   * @returns {Object|null} Matching skill
   */
  findSkillByTopic(topic) {
    const normalizedTopic = topic.toLowerCase().trim();

    for (const skill of Object.values(this.skillTree)) {
      if (skill.topics.some(t => 
        normalizedTopic.includes(t) || 
        t.includes(normalizedTopic)
      )) {
        return skill;
      }
    }

    return null;
  }

  /**
   * Get user's skill progress
   * @param {Object} user - User document
   * @param {string} skillId - Skill ID
   * @returns {Object} Progress data
   */
  getSkillProgress(user, skillId) {
    const skill = this.getSkill(skillId);
    if (!skill) return null;

    const userSkills = user.skills || {};
    const skillData = userSkills[skillId] || { xp: 0, mastered: false };

    const xpProgress = Math.min(skillData.xp / skill.xpToMaster, 1);
    const masteryLevel = this.getMasteryLevel(xpProgress * 100);

    return {
      skill,
      xp: skillData.xp,
      xpToMaster: skill.xpToMaster,
      progress: xpProgress,
      progressPercent: Math.round(xpProgress * 100),
      mastered: skillData.mastered || xpProgress >= 1,
      masteryLevel,
      prerequisitesMet: this.hasPrerequisites(user, skillId)
    };
  }

  /**
   * Get mastery level from XP percentage
   * @param {number} xpPercent - XP percentage (0-100)
   * @returns {Object} Mastery level
   */
  getMasteryLevel(xpPercent) {
    for (let i = this.masteryLevels.length - 1; i >= 0; i--) {
      if (xpPercent >= this.masteryLevels[i].xpPercent) {
        return this.masteryLevels[i];
      }
    }
    return this.masteryLevels[0];
  }

  /**
   * Check if user has prerequisites for a skill
   * @param {Object} user - User document
   * @param {string} skillId - Skill ID
   * @returns {boolean}
   */
  hasPrerequisites(user, skillId) {
    const skill = this.getSkill(skillId);
    if (!skill || skill.prerequisites.length === 0) return true;

    const userSkills = user.skills || {};

    return skill.prerequisites.every(prereqId => {
      const prereqData = userSkills[prereqId];
      const prereqSkill = this.getSkill(prereqId);
      
      if (!prereqData || !prereqSkill) return false;
      
      // Require at least 50% progress in prerequisite
      return (prereqData.xp / prereqSkill.xpToMaster) >= 0.5;
    });
  }

  /**
   * Add XP to a skill based on topic
   * @param {Object} user - User document
   * @param {string} topic - Topic studied
   * @param {number} xpAmount - XP to add
   * @returns {Object} Result with skill updates
   */
  async addSkillXp(user, topic, xpAmount) {
    const skill = this.findSkillByTopic(topic);
    if (!skill) return { skillUpdated: false };

    if (!user.skills) {
      user.skills = {};
    }

    if (!user.skills[skill.id]) {
      user.skills[skill.id] = { xp: 0, mastered: false, unlockedAt: new Date() };
    }

    const skillData = user.skills[skill.id];
    const previousXp = skillData.xp;
    const previousMastery = this.getMasteryLevel((previousXp / skill.xpToMaster) * 100);

    skillData.xp += xpAmount;

    const newProgress = (skillData.xp / skill.xpToMaster) * 100;
    const newMastery = this.getMasteryLevel(newProgress);

    const result = {
      skillUpdated: true,
      skill: skill,
      previousXp,
      newXp: skillData.xp,
      xpGained: xpAmount,
      progress: Math.min(newProgress, 100),
      masteryLevel: newMastery
    };

    // Check for mastery level up
    if (newMastery.level > previousMastery.level) {
      result.masteryLevelUp = true;
      result.previousMasteryLevel = previousMastery;
      result.newMasteryLevel = newMastery;
    }

    // Check for full mastery
    if (skillData.xp >= skill.xpToMaster && !skillData.mastered) {
      skillData.mastered = true;
      skillData.masteredAt = new Date();
      result.newlyMastered = true;
    }

    // Mark skills as modified for Mongoose
    user.markModified('skills');
    await user.save();

    return result;
  }

  /**
   * Get all skills for a category
   * @param {string} category - Category name
   * @returns {Array} Skills in category
   */
  getSkillsByCategory(category) {
    return Object.values(this.skillTree)
      .filter(skill => skill.category === category)
      .sort((a, b) => a.tier - b.tier);
  }

  /**
   * Get all categories
   * @returns {Array} Category names
   */
  getCategories() {
    const categories = new Set();
    for (const skill of Object.values(this.skillTree)) {
      categories.add(skill.category);
    }
    return Array.from(categories);
  }

  /**
   * Get user's skill tree visualization data
   * @param {Object} user - User document
   * @returns {Object} Visualization data
   */
  getSkillTreeData(user) {
    const categories = {};
    const userSkills = user.skills || {};

    for (const [skillId, skill] of Object.entries(this.skillTree)) {
      if (!categories[skill.category]) {
        categories[skill.category] = {
          name: this.getCategoryName(skill.category),
          emoji: this.getCategoryEmoji(skill.category),
          skills: [],
          totalMastered: 0,
          totalSkills: 0
        };
      }

      const skillData = userSkills[skillId] || { xp: 0 };
      const progress = (skillData.xp / skill.xpToMaster) * 100;
      const masteryLevel = this.getMasteryLevel(progress);
      const prerequisitesMet = this.hasPrerequisites(user, skillId);

      categories[skill.category].skills.push({
        ...skill,
        xp: skillData.xp,
        progress: Math.min(progress, 100),
        mastered: skillData.mastered || progress >= 100,
        masteryLevel,
        prerequisitesMet,
        locked: !prerequisitesMet
      });

      categories[skill.category].totalSkills++;
      if (skillData.mastered || progress >= 100) {
        categories[skill.category].totalMastered++;
      }
    }

    // Sort skills within categories by tier
    for (const cat of Object.values(categories)) {
      cat.skills.sort((a, b) => a.tier - b.tier);
    }

    return categories;
  }

  /**
   * Get category display name
   * @param {string} category - Category key
   * @returns {string} Display name
   */
  getCategoryName(category) {
    const names = {
      programming: 'Programming',
      web: 'Web Development',
      python: 'Python',
      tools: 'Developer Tools'
    };
    return names[category] || category;
  }

  /**
   * Get category emoji
   * @param {string} category - Category key
   * @returns {string} Emoji
   */
  getCategoryEmoji(category) {
    const emojis = {
      programming: '💻',
      web: '🌐',
      python: '🐍',
      tools: '🛠️'
    };
    return emojis[category] || '📚';
  }

  /**
   * Calculate XP bonus from mastered skills
   * @param {Object} user - User document
   * @param {string} topic - Topic for bonus
   * @returns {number} Multiplier (1.0 = no bonus)
   */
  getSkillXpBonus(user, topic) {
    const skill = this.findSkillByTopic(topic);
    if (!skill) return 1.0;

    const userSkills = user.skills || {};
    const skillData = userSkills[skill.id];

    if (!skillData) return 1.0;

    const progress = skillData.xp / skill.xpToMaster;
    
    // Partial bonus based on progress
    if (progress >= 1) {
      return 1 + skill.benefits.xpBonus;
    } else if (progress >= 0.5) {
      return 1 + (skill.benefits.xpBonus * 0.5);
    }

    return 1.0;
  }

  /**
   * Get recommended next skills
   * @param {Object} user - User document
   * @param {number} limit - Max recommendations
   * @returns {Array} Recommended skills
   */
  getRecommendedSkills(user, limit = 3) {
    const userSkills = user.skills || {};
    const recommendations = [];

    for (const [skillId, skill] of Object.entries(this.skillTree)) {
      const skillData = userSkills[skillId] || { xp: 0 };
      const progress = skillData.xp / skill.xpToMaster;
      
      // Skip mastered skills
      if (progress >= 1) continue;

      // Check if prerequisites are met
      if (!this.hasPrerequisites(user, skillId)) continue;

      // Calculate priority (skills with some progress > new skills)
      let priority = 0;
      if (progress > 0) {
        priority = progress + 0.5; // Prioritize in-progress skills
      } else {
        priority = 0.1 * (5 - skill.tier); // Lower tier = higher priority for new skills
      }

      recommendations.push({
        skill,
        progress: progress * 100,
        priority
      });
    }

    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
      .map(r => ({
        ...r.skill,
        progress: Math.round(r.progress)
      }));
  }

  /**
   * Get user's total skill statistics
   * @param {Object} user - User document
   * @returns {Object} Statistics
   */
  getSkillStats(user) {
    const userSkills = user.skills || {};
    const totalSkills = Object.keys(this.skillTree).length;
    let masteredCount = 0;
    let inProgressCount = 0;
    let totalSkillXp = 0;

    for (const [skillId, skill] of Object.entries(this.skillTree)) {
      const skillData = userSkills[skillId];
      if (!skillData) continue;

      totalSkillXp += skillData.xp;
      const progress = skillData.xp / skill.xpToMaster;

      if (progress >= 1 || skillData.mastered) {
        masteredCount++;
      } else if (progress > 0) {
        inProgressCount++;
      }
    }

    return {
      totalSkills,
      mastered: masteredCount,
      inProgress: inProgressCount,
      notStarted: totalSkills - masteredCount - inProgressCount,
      totalSkillXp,
      completionPercent: Math.round((masteredCount / totalSkills) * 100)
    };
  }
}

export default SkillService;

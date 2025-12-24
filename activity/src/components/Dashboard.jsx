import React, { useState, useEffect } from 'react';
import ProgressRing from './ProgressRing';
import './Dashboard.css';

const Dashboard = ({ user, onBack }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/progress/${user?.id}`);
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="spinner"></div>
        <p>Loading your stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-container">
        <p>Failed to load stats. Please try again.</p>
        <button className="premium-button" onClick={onBack}>Back</button>
      </div>
    );
  }

  const xpProgress = Math.floor((stats.xpProgress / stats.xpNeeded) * 100);
  const accuracyColor = stats.accuracy >= 80 ? '#22c55e' : stats.accuracy >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="dashboard-container">
      <button className="back-button" onClick={onBack}>← Back</button>

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header animate-slide-down">
          <div className="user-avatar-large">
            <img 
              src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png`} 
              alt="Avatar"
              onError={(e) => e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png'}
            />
          </div>
          <h1 className="dashboard-title">
            {user?.global_name || user?.username}'s <span className="text-gradient">Learning Journey</span>
          </h1>
          <p className="dashboard-subtitle">Level {stats.level} • {getLevelTitle(stats.level)}</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Level Progress */}
          <div className="stat-card-large glass-card animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-card-header">
              <h3>📊 Level Progress</h3>
            </div>
            <div className="level-progress-content">
              <ProgressRing progress={xpProgress} size={160} strokeWidth={10} />
              <div className="level-info">
                <div className="current-level">Level {stats.level}</div>
                <div className="next-level">Next: Level {stats.level + 1}</div>
                <div className="xp-text">
                  {stats.xpProgress.toLocaleString()} / {stats.xpNeeded.toLocaleString()} XP
                </div>
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="stat-card-large glass-card animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-card-header">
              <h3>🔥 Streak</h3>
            </div>
            <div className="streak-content">
              <div className="streak-flames">
                {Array.from({ length: Math.min(stats.streak, 7) }).map((_, i) => (
                  <span key={i} className="flame-icon float" style={{ animationDelay: `${i * 0.2}s` }}>
                    🔥
                  </span>
                ))}
              </div>
              <div className="streak-number">{stats.streak} Days</div>
              <div className="streak-best">Best: {stats.longestStreak} days</div>
              {stats.streak >= 7 && (
                <div className="streak-badge">
                  <span className="badge-icon">⭐</span>
                  Week Warrior!
                </div>
              )}
            </div>
          </div>

          {/* Total XP */}
          <div className="stat-card glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon-large">⭐</div>
            <div className="stat-value-large text-gradient-gold">{formatNumber(stats.totalXp)}</div>
            <div className="stat-label">Total XP</div>
          </div>

          {/* Lessons */}
          <div className="stat-card glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon-large">📚</div>
            <div className="stat-value-large">{stats.lessonsCompleted}</div>
            <div className="stat-label">Lessons Completed</div>
          </div>

          {/* Quizzes */}
          <div className="stat-card glass-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon-large">🧠</div>
            <div className="stat-value-large">{stats.quizzesPassed}/{stats.quizzesCompleted}</div>
            <div className="stat-label">Quizzes Passed</div>
          </div>

          {/* Accuracy */}
          <div className="stat-card glass-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="stat-icon-large">🎯</div>
            <div className="stat-value-large" style={{ color: accuracyColor }}>
              {stats.accuracy}%
            </div>
            <div className="stat-label">Accuracy</div>
          </div>
        </div>

        {/* Recent Achievements */}
        {stats.recentAchievements && stats.recentAchievements.length > 0 && (
          <div className="achievements-section animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="section-title">🏆 Recent Achievements</h2>
            <div className="achievements-grid">
              {stats.recentAchievements.map((achievement, index) => (
                <div 
                  key={achievement.id}
                  className="achievement-card glass-card"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="achievement-icon">{achievement.emoji}</div>
                  <div className="achievement-info">
                    <div className="achievement-name">{achievement.name}</div>
                    <div className="achievement-desc">{achievement.description}</div>
                  </div>
                  <div className="achievement-xp">+{achievement.xpReward} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Level Rewards Preview */}
        <div className="rewards-section animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <h2 className="section-title">🎁 Next Level Rewards</h2>
          <div className="rewards-card glass-card">
            <div className="reward-level">Level {stats.level + 1}</div>
            <div className="rewards-list">
              {getNextLevelRewards(stats.level + 1).map((reward, index) => (
                <div key={index} className="reward-item">
                  <span className="reward-icon">✨</span>
                  <span className="reward-text">{reward}</span>
                </div>
              ))}
            </div>
            <div className="xp-needed">
              {stats.xpNeeded - stats.xpProgress} XP to go!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Functions
function getLevelTitle(level) {
  if (level >= 50) return 'Legendary Master';
  if (level >= 40) return 'Grand Scholar';
  if (level >= 30) return 'Expert Learner';
  if (level >= 20) return 'Advanced Student';
  if (level >= 10) return 'Rising Scholar';
  if (level >= 5) return 'Eager Student';
  return 'Beginner';
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getNextLevelRewards(level) {
  const rewards = [
    `+${level * 10}% XP Boost`,
    'New Achievement Badge',
    `Access to Level ${level} Content`
  ];
  
  if (level % 5 === 0) {
    rewards.push('🎉 Milestone Reward!');
  }
  if (level % 10 === 0) {
    rewards.push('💎 Rare Title Unlocked!');
  }
  
  return rewards;
}

export default Dashboard;

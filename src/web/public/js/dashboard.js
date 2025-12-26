// State
let currentPage = 'dashboard';
let usersData = { users: [], pagination: {} };
let charts = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initNavigation();
  initEventListeners();
  loadDashboard();
});

// Auth check
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/verify', { credentials: 'include' });
    const data = await response.json();
    
    if (!data.authenticated) {
      window.location.href = '/';
      return;
    }
    
    document.getElementById('userName').textContent = data.user.username;
  } catch (error) {
    window.location.href = '/';
  }
}

// Navigation
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      switchPage(page);
    });
  });
}

function switchPage(page) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  
  // Update pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });
  
  // Update header
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Welcome to your admin control center' },
    users: { title: 'User Management', subtitle: 'Manage and monitor all users' },
    analytics: { title: 'Analytics', subtitle: 'Detailed performance metrics' },
    viral: { title: 'Viral Features', subtitle: 'Track referrals, shares, and engagement' },
    leaderboard: { title: 'Leaderboard', subtitle: 'Top performing users' },
    broadcast: { title: 'Broadcast', subtitle: 'Send announcements to all servers' },
    settings: { title: 'Settings', subtitle: 'Configure bot settings' },
    'access-keys': { title: '🔐 Access Keys', subtitle: 'Generate and manage beta access keys' },
    'beta-users': { title: '👥 Beta Testers', subtitle: 'View and manage beta users' }
  };
  
  document.getElementById('pageTitle').textContent = titles[page]?.title || page;
  document.getElementById('pageSubtitle').textContent = titles[page]?.subtitle || '';
  
  currentPage = page;
  
  // Load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'users': loadUsers(); break;
    case 'analytics': loadAnalytics(); break;
    case 'viral': loadViralFeatures(); break;
    case 'leaderboard': loadLeaderboard(); break;
    case 'access-keys': loadAccessKeys(); break;
    case 'beta-users': loadBetaUsers(); break;
  }
}

// Event Listeners
function initEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  });
  
  // Refresh
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadDashboard();
    showToast('Data refreshed!', 'success');
  });
  
  // Mobile menu
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  
  // User search
  document.getElementById('userSearch')?.addEventListener('input', debounce((e) => {
    loadUsers(1, e.target.value);
  }, 300));
  
  // User sort
  document.getElementById('userSort')?.addEventListener('change', (e) => {
    loadUsers(1, '', e.target.value);
  });
  
  // Modal close
  document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('userModal').classList.remove('active');
  });
  
  // Broadcast form
  document.getElementById('broadcastForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await sendBroadcast();
  });
  
  // Initialize access keys listeners
  initAccessKeysListeners();
}

// Dashboard
async function loadDashboard() {
  try {
    const response = await fetch('/api/stats', { credentials: 'include' });
    const data = await response.json();
    
    // Update stats
    document.getElementById('totalUsers').textContent = data.users.total.toLocaleString();
    document.getElementById('activeUsers').textContent = data.users.activeToday.toLocaleString();
    document.getElementById('newUsersToday').textContent = `+${data.users.newToday} today`;
    document.getElementById('totalXp').textContent = formatNumber(data.metrics.totalXp);
    document.getElementById('totalQuizzes').textContent = data.metrics.totalQuizzes.toLocaleString();
    
    // System info
    document.getElementById('uptime').textContent = formatUptime(data.system.uptime);
    document.getElementById('memory').textContent = `${(data.system.memory.heapUsed / 1024 / 1024).toFixed(1)} MB`;
    document.getElementById('nodeVersion').textContent = data.system.nodeVersion;
    
    // Charts
    initCharts(data);
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    showToast('Failed to load dashboard data', 'error');
  }
}

function initCharts(data) {
  // User Growth Chart
  const userCtx = document.getElementById('userGrowthChart')?.getContext('2d');
  if (userCtx) {
    if (charts.userGrowth) charts.userGrowth.destroy();
    
    charts.userGrowth = new Chart(userCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'New Users',
          data: [5, 8, 6, 12, 15, 10, data.users.newToday],
          borderColor: '#5865F2',
          backgroundColor: 'rgba(88, 101, 242, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
  
  // Activity Chart
  const activityCtx = document.getElementById('activityChart')?.getContext('2d');
  if (activityCtx) {
    if (charts.activity) charts.activity.destroy();
    
    charts.activity = new Chart(activityCtx, {
      type: 'doughnut',
      data: {
        labels: ['Quizzes', 'Lessons', 'Daily Claims'],
        datasets: [{
          data: [data.metrics.totalQuizzes, Math.floor(data.metrics.totalQuizzes * 0.6), Math.floor(data.users.total * 0.3)],
          backgroundColor: ['#5865F2', '#57F287', '#FEE75C'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#b0b0b0' } }
        }
      }
    });
  }
}

// Users
async function loadUsers(page = 1, search = '', sortBy = 'level') {
  try {
    const params = new URLSearchParams({ page, limit: 20, search, sortBy, sortOrder: 'desc' });
    const response = await fetch(`/api/users?${params}`, { credentials: 'include' });
    usersData = await response.json();
    
    renderUsersTable();
    renderPagination();
  } catch (error) {
    console.error('Failed to load users:', error);
    showToast('Failed to load users', 'error');
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = usersData.users.map(user => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="user-avatar">${(user.username || 'U')[0].toUpperCase()}</div>
          <div>
            <strong>${user.username || 'Unknown'}</strong>
            <br><small style="color: var(--text-muted)">${user.discordId}</small>
          </div>
        </div>
      </td>
      <td><span style="color: var(--accent-primary)">⭐ ${user.level || 1}</span></td>
      <td>${(user.xp || 0).toLocaleString()}</td>
      <td>🔥 ${user.streak || 0}</td>
      <td>${user.quizzesTaken || 0}</td>
      <td>${user.totalQuestions > 0 ? Math.round((user.correctAnswers / user.totalQuestions) * 100) : 0}%</td>
      <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
      <td>
        <button class="action-btn view" onclick="viewUser('${user.discordId}')">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" onclick="editUser('${user.discordId}')">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderPagination() {
  const container = document.getElementById('usersPagination');
  if (!container) return;
  
  const { page, pages } = usersData.pagination;
  
  let html = `
    <button onclick="loadUsers(1)" ${page === 1 ? 'disabled' : ''}>«</button>
    <button onclick="loadUsers(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹</button>
  `;
  
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
    html += `<button onclick="loadUsers(${i})" class="${i === page ? 'active' : ''}">${i}</button>`;
  }
  
  html += `
    <button onclick="loadUsers(${page + 1})" ${page === pages ? 'disabled' : ''}>›</button>
    <button onclick="loadUsers(${pages})" ${page === pages ? 'disabled' : ''}>»</button>
  `;
  
  container.innerHTML = html;
}

async function viewUser(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`, { credentials: 'include' });
    const user = await response.json();
    
    const modal = document.getElementById('userModal');
    const body = document.getElementById('userModalBody');
    
    body.innerHTML = `
      <div class="user-detail-grid">
        <div class="user-detail-item">
          <div class="user-detail-label">Username</div>
          <div class="user-detail-value">${user.username || 'Unknown'}</div>
        </div>
        <div class="user-detail-item">
          <div class="user-detail-label">Discord ID</div>
          <div class="user-detail-value">${user.discordId}</div>
        </div>
        <div class="user-detail-item">
          <div class="user-detail-label">Level</div>
          <div class="user-detail-value">⭐ ${user.level || 1}</div>
        </div>
        <div class="user-detail-item">
          <div class="user-detail-label">XP</div>
          <div class="user-detail-value">${(user.xp || 0).toLocaleString()}</div>
        </div>
        <div class="user-detail-item">
          <div class="user-detail-label">Streak</div>
          <div class="user-detail-value">🔥 ${user.streak || 0} days</div>
        </div>
        <div class="user-detail-item">
          <div class="user-detail-label">Quizzes</div>
          <div class="user-detail-value">${user.quizzesTaken || 0}</div>
        </div>
        <div class="user-detail-item">
          <div class="user-detail-label">Accuracy</div>
          <div class="user-detail-value">${user.totalQuestions > 0 ? Math.round((user.correctAnswers / user.totalQuestions) * 100) : 0}%</div>
        </div>
        <div class="user-detail-item">
          <div class="user-detail-label">Achievements</div>
          <div class="user-detail-value">${user.achievements?.length || 0}</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-give-xp" onclick="giveXp('${user.discordId}')">
          <i class="fas fa-star"></i> Give XP
        </button>
        <button class="btn-reset" onclick="resetUser('${user.discordId}')">
          <i class="fas fa-redo"></i> Reset
        </button>
        <button class="btn-ban" onclick="banUser('${user.discordId}')">
          <i class="fas fa-ban"></i> Ban
        </button>
      </div>
    `;
    
    modal.classList.add('active');
  } catch (error) {
    showToast('Failed to load user details', 'error');
  }
}

async function giveXp(userId) {
  const amount = prompt('Enter XP amount to give:');
  if (!amount || isNaN(amount)) return;
  
  try {
    await fetch(`/api/users/${userId}/give-xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount: parseInt(amount) })
    });
    showToast(`Gave ${amount} XP to user!`, 'success');
    loadUsers();
  } catch (error) {
    showToast('Failed to give XP', 'error');
  }
}

async function resetUser(userId) {
  if (!confirm('Are you sure you want to reset this user\'s progress?')) return;
  
  try {
    await fetch(`/api/users/${userId}/reset`, {
      method: 'POST',
      credentials: 'include'
    });
    showToast('User progress reset!', 'success');
    document.getElementById('userModal').classList.remove('active');
    loadUsers();
  } catch (error) {
    showToast('Failed to reset user', 'error');
  }
}

async function banUser(userId) {
  if (!confirm('Are you sure you want to ban this user?')) return;
  
  try {
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ banned: true })
    });
    showToast('User banned!', 'warning');
    document.getElementById('userModal').classList.remove('active');
    loadUsers();
  } catch (error) {
    showToast('Failed to ban user', 'error');
  }
}

// Analytics
async function loadAnalytics() {
  try {
    const response = await fetch('/api/stats', { credentials: 'include' });
    const data = await response.json();
    
    document.getElementById('avgLevel').textContent = data.metrics.avgLevel;
    document.getElementById('avgStreak').textContent = data.metrics.avgStreak;
    document.getElementById('weeklyGrowth').textContent = `+${data.users.newThisWeek}`;
    document.getElementById('monthlyGrowth').textContent = `+${data.users.newThisMonth}`;
    
    // Analytics chart
    const ctx = document.getElementById('analyticsChart')?.getContext('2d');
    if (ctx) {
      if (charts.analytics) charts.analytics.destroy();
      
      charts.analytics = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: 'New Users',
            data: [15, 22, 18, data.users.newThisWeek],
            backgroundColor: '#5865F2'
          }, {
            label: 'Quizzes Taken',
            data: [45, 60, 55, data.metrics.totalQuizzes / 4],
            backgroundColor: '#57F287'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { color: '#b0b0b0' } } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  } catch (error) {
    showToast('Failed to load analytics', 'error');
  }
}

// Leaderboard
async function loadLeaderboard() {
  try {
    const response = await fetch('/api/analytics/leaderboard?limit=10', { credentials: 'include' });
    const users = await response.json();
    
    const container = document.getElementById('leaderboardList');
    if (!container) return;
    
    container.innerHTML = users.map((user, i) => `
      <div class="leaderboard-item ${i < 3 ? `top-${i + 1}` : ''}">
        <div class="leaderboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">
          ${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
        </div>
        <div class="leaderboard-user">
          <h4>${user.username || 'Unknown'}</h4>
          <p>Joined ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div class="leaderboard-stats">
          <div class="leaderboard-stat">
            <div class="leaderboard-stat-value">${user.level || 1}</div>
            <div class="leaderboard-stat-label">Level</div>
          </div>
          <div class="leaderboard-stat">
            <div class="leaderboard-stat-value">${(user.xp || 0).toLocaleString()}</div>
            <div class="leaderboard-stat-label">XP</div>
          </div>
          <div class="leaderboard-stat">
            <div class="leaderboard-stat-value">${user.streak || 0}</div>
            <div class="leaderboard-stat-label">Streak</div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    showToast('Failed to load leaderboard', 'error');
  }
}

// Broadcast
async function sendBroadcast() {
  const title = document.getElementById('broadcastTitle').value;
  const message = document.getElementById('broadcastMessage').value;
  const type = document.getElementById('broadcastType').value;
  
  try {
    await fetch('/api/system/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, message, type })
    });
    showToast('Broadcast sent successfully!', 'success');
    document.getElementById('broadcastForm').reset();
  } catch (error) {
    showToast('Failed to send broadcast', 'error');
  }
}

// Utilities
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Make functions globally available
window.viewUser = viewUser;
window.editUser = viewUser;
window.giveXp = giveXp;
window.resetUser = resetUser;
window.banUser = banUser;
window.loadUsers = loadUsers;
window.loadViralFeatures = loadViralFeatures;

// Viral Features
async function loadViralFeatures() {
  try {
    // Fetch viral analytics data
    const [viralResponse, referrersResponse, quickQuizResponse] = await Promise.all([
      fetch('/api/analytics/viral', { credentials: 'include' }),
      fetch('/api/analytics/referrers?limit=5', { credentials: 'include' }),
      fetch('/api/analytics/quickquiz?limit=5', { credentials: 'include' })
    ]);
    
    const viral = await viralResponse.json();
    const referrers = await referrersResponse.json();
    const quickQuizzers = await quickQuizResponse.json();
    
    // Update main stats
    const viralReferrals = document.getElementById('viralReferrals');
    const viralShares = document.getElementById('viralShares');
    const viralQuickQuiz = document.getElementById('viralQuickQuiz');
    const viralFunFacts = document.getElementById('viralFunFacts');
    
    if (viralReferrals) viralReferrals.textContent = viral.referrals?.total?.toLocaleString() || '0';
    if (viralShares) viralShares.textContent = viral.shares?.total?.toLocaleString() || '0';
    if (viralQuickQuiz) viralQuickQuiz.textContent = viral.quickQuiz?.total?.toLocaleString() || '0';
    if (viralFunFacts) viralFunFacts.textContent = viral.funFacts?.total?.toLocaleString() || '0';
    
    // Update referral stats
    const activeReferrers = document.getElementById('viralActiveReferrers');
    const referralXP = document.getElementById('viralReferralXP');
    if (activeReferrers) activeReferrers.textContent = viral.referrals?.activeReferrers || '0';
    if (referralXP) referralXP.textContent = formatNumber(viral.referrals?.xpDistributed || 0);
    
    // Update quick quiz stats
    const quickCorrect = document.getElementById('viralQuickCorrect');
    const quickAccuracy = document.getElementById('viralQuickAccuracy');
    if (quickCorrect) quickCorrect.textContent = viral.quickQuiz?.correct?.toLocaleString() || '0';
    if (quickAccuracy) quickAccuracy.textContent = (viral.quickQuiz?.accuracy || 0) + '%';
    
    // Update share stats
    const sharesToday = document.getElementById('viralSharesToday');
    const uniqueSharers = document.getElementById('viralUniqueSharers');
    if (sharesToday) sharesToday.textContent = viral.shares?.today || '0';
    if (uniqueSharers) uniqueSharers.textContent = viral.shares?.uniqueSharers || '0';
    
    // Update weekly stats
    const weeklyWins = document.getElementById('viralWeeklyWins');
    const weeklyParticipations = document.getElementById('viralWeeklyParticipations');
    if (weeklyWins) weeklyWins.textContent = viral.weekly?.wins || '0';
    if (weeklyParticipations) weeklyParticipations.textContent = viral.weekly?.participations || '0';
    
    // Render top referrers
    renderTopReferrers(referrers);
    
    // Render top quick quizzers
    renderTopQuickQuizzers(quickQuizzers);
    
  } catch (error) {
    console.error('Failed to load viral features:', error);
    showToast('Failed to load viral features data', 'error');
  }
}

function renderTopReferrers(referrers) {
  const container = document.getElementById('topReferrersContainer');
  if (!container) return;
  
  if (!referrers || referrers.length === 0) {
    container.innerHTML = '<div class="empty-small"><i class="fas fa-users"></i> No referrers yet</div>';
    return;
  }
  
  container.innerHTML = referrers.map((user, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default';
    const rankLabel = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1);
    return `
      <div class="referrer-item">
        <div class="referrer-rank ${rankClass}">${rankLabel}</div>
        <div class="referrer-info">
          <div class="referrer-name">${user.username || 'Unknown'}</div>
          <div class="referrer-meta">+${(user.referralXpEarned || 0).toLocaleString()} XP earned</div>
        </div>
        <div class="referrer-count">${user.referrals || 0}</div>
      </div>
    `;
  }).join('');
}

function renderTopQuickQuizzers(quizzers) {
  const container = document.getElementById('topQuickQuizContainer');
  if (!container) return;
  
  if (!quizzers || quizzers.length === 0) {
    container.innerHTML = '<div class="empty-small"><i class="fas fa-brain"></i> No quick quizzes yet</div>';
    return;
  }
  
  container.innerHTML = quizzers.map((user, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default';
    const rankLabel = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1);
    const accuracy = user.quickQuizzesTaken > 0 ? Math.round((user.quickQuizCorrect / user.quickQuizzesTaken) * 100) : 0;
    return `
      <div class="referrer-item">
        <div class="referrer-rank ${rankClass}">${rankLabel}</div>
        <div class="referrer-info">
          <div class="referrer-name">${user.username || 'Unknown'}</div>
          <div class="referrer-meta">${accuracy}% accuracy • Best streak: ${user.quickQuizBestStreak || 0}</div>
        </div>
        <div class="referrer-count">${user.quickQuizCorrect || 0}</div>
      </div>
    `;
  }).join('');
}

// ==========================================
//  🔐 BETA ACCESS KEY MANAGEMENT
// ==========================================

let accessKeysData = [];
let betaUsersData = [];

async function loadAccessKeys() {
  try {
    const response = await fetch('/api/access-keys', { credentials: 'include' });
    const data = await response.json();
    
    accessKeysData = data.keys || [];
    
    // Update stats
    updateAccessKeyStats(data.stats);
    
    // Render keys table
    renderAccessKeysTable(accessKeysData);
  } catch (error) {
    console.error('Failed to load access keys:', error);
    showToast('Failed to load access keys', 'error');
  }
}

function updateAccessKeyStats(stats) {
  // Match HTML element IDs
  const totalEl = document.getElementById('keysTotal');
  const activeEl = document.getElementById('keysActive');
  const usedEl = document.getElementById('keysUsed');
  const revokedEl = document.getElementById('keysRevoked');
  
  if (totalEl) totalEl.textContent = stats?.total || 0;
  if (activeEl) activeEl.textContent = stats?.active || 0;
  if (usedEl) usedEl.textContent = stats?.used || 0;
  if (revokedEl) revokedEl.textContent = stats?.revoked || 0;
}

function renderAccessKeysTable(keys) {
  const container = document.getElementById('accessKeysTable');
  if (!container) return;
  
  const filter = document.getElementById('keyFilter')?.value || 'all';
  
  // Filter keys
  let filteredKeys = keys;
  if (filter !== 'all') {
    filteredKeys = keys.filter(k => k.status === filter);
  }
  
  if (filteredKeys.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fas fa-key"></i>
          <p>No access keys found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  container.innerHTML = filteredKeys.map(key => {
    const statusBadge = {
      active: '<span class="badge badge-green">🟢 Active</span>',
      used: '<span class="badge badge-blue">🔵 Used</span>',
      revoked: '<span class="badge badge-red">🔴 Revoked</span>',
      expired: '<span class="badge badge-gray">⚫ Expired</span>'
    }[key.status] || '<span class="badge">Unknown</span>';
    
    const createdDate = new Date(key.createdAt).toLocaleDateString();
    const usedBy = key.activatedByUsername || key.activatedBy || '-';
    
    return `
      <tr data-key="${key.key}">
        <td>
          <code style="background:rgba(88,101,242,0.2);padding:4px 8px;border-radius:4px;font-size:12px;color:#a8b4ff;">${key.key}</code>
          <button class="btn-icon" title="Copy" onclick="copyToClipboard('${key.key}')" style="margin-left:8px;background:none;border:none;color:var(--text-muted);cursor:pointer;">
            <i class="fas fa-copy"></i>
          </button>
        </td>
        <td><span class="badge badge-yellow">${(key.keyType || 'beta').toUpperCase()}</span></td>
        <td>${statusBadge}</td>
        <td>${createdDate}</td>
        <td>${usedBy}</td>
        <td style="color:var(--text-muted);font-size:12px;">${key.note || '-'}</td>
        <td>
          ${key.status === 'active' ? `
            <button class="btn btn-danger btn-sm" onclick="revokeAccessKey('${key.key}')">
              <i class="fas fa-ban"></i> Revoke
            </button>
          ` : key.status === 'used' ? `
            <button class="btn btn-warning btn-sm" onclick="revokeUserAccessByKey('${key.key}', '${key.activatedBy}')">
              <i class="fas fa-user-slash"></i> Revoke User
            </button>
          ` : '-'}
        </td>
      </tr>
    `;
  }).join('');
}

async function generateAccessKeys() {
  console.log('generateAccessKeys called');
  const countInput = document.getElementById('keyCount');
  const typeInput = document.getElementById('keyType');
  const noteInput = document.getElementById('keyNote');
  
  const count = parseInt(countInput?.value) || 1;
  const keyType = typeInput?.value || 'beta';
  const note = noteInput?.value || '';
  
  console.log('Generating:', { count, keyType, note });
  
  if (count < 1 || count > 50) {
    showToast('Please enter 1-50 keys', 'error');
    return;
  }
  
  const btn = document.getElementById('generateKeysBtn');
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    const response = await fetch('/api/access-keys/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ count, keyType, note })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success) {
      showToast(`✨ Generated ${data.keys.length} access key(s)!`, 'success');
      
      // Show generated keys in modal
      showGeneratedKeysModal(data.keys);
      
      // Reload keys
      loadAccessKeys();
      
      // Clear form
      if (noteInput) noteInput.value = '';
      if (countInput) countInput.value = '1';
    } else {
      showToast(data.error || 'Failed to generate keys', 'error');
    }
  } catch (error) {
    console.error('Failed to generate keys:', error);
    showToast('Failed to generate keys: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-magic"></i> Generate Keys';
  }
}

function showGeneratedKeysModal(keys) {
  // Create modal if doesn't exist
  let modal = document.getElementById('generatedKeysModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'generatedKeysModal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  
  const keysHTML = keys.map(k => `
    <div style="background:rgba(88,101,242,0.15);border:1px solid rgba(88,101,242,0.3);padding:12px 16px;border-radius:8px;margin-bottom:8px;">
      <code style="color:#a8b4ff;font-size:14px;letter-spacing:1px;">${k.key}</code>
    </div>
  `).join('');
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px;">
      <div class="modal-header">
        <span class="modal-title"><i class="fas fa-key"></i> Generated Access Keys</span>
        <button class="close-btn" onclick="closeGeneratedKeysModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="max-height:300px;overflow-y:auto;margin-bottom:16px;">
          ${keysHTML}
        </div>
        <button class="btn btn-success" style="width:100%;" onclick="copyAllKeys(${JSON.stringify(keys.map(k => k.key)).replace(/"/g, '&quot;')})">
          <i class="fas fa-copy"></i> Copy All Keys
        </button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeGeneratedKeysModal() {
  const modal = document.getElementById('generatedKeysModal');
  if (modal) modal.classList.remove('active');
}

function copyAllKeys(keys) {
  const text = keys.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    showToast('All keys copied to clipboard!', 'success');
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Key copied!', 'success');
  });
}

async function revokeAccessKey(key) {
  if (!confirm(`Are you sure you want to revoke this key?\n\n${key}\n\nThis cannot be undone.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/access-keys/${key}/revoke`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('🔴 Key revoked successfully', 'success');
      loadAccessKeys();
    } else {
      showToast(data.error || 'Failed to revoke key', 'error');
    }
  } catch (error) {
    console.error('Failed to revoke key:', error);
    showToast('Failed to revoke key', 'error');
  }
}

async function revokeUserAccessByKey(key, userId) {
  if (!confirm(`Revoke access for this user?\n\nTheir access key will be invalidated and they'll need a new key to use the bot.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/users/${userId}/revoke-access`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('🔴 User access revoked', 'success');
      loadAccessKeys();
      loadBetaUsers();
    } else {
      showToast(data.error || 'Failed to revoke access', 'error');
    }
  } catch (error) {
    console.error('Failed to revoke user access:', error);
    showToast('Failed to revoke user access', 'error');
  }
}

// Beta Users Management
async function loadBetaUsers() {
  try {
    const response = await fetch('/api/access-keys/users', { credentials: 'include' });
    const users = await response.json();
    
    // API returns array directly
    betaUsersData = Array.isArray(users) ? users : (users.users || []);
      renderBetaUsersTable(betaUsersData);
    }
  } catch (error) {
    console.error('Failed to load beta users:', error);
    showToast('Failed to load beta users', 'error');
  }
}

function renderBetaUsersTable(users) {
  const container = document.getElementById('betaUsersTable');
  const countEl = document.getElementById('betaUsersCount');
  
  if (countEl) countEl.textContent = `${users.length} users`;
  
  if (!container) return;
  
  if (users.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fas fa-users"></i>
          <p>No beta testers yet</p>
        </td>
      </tr>
    `;
    return;
  }
  
  container.innerHTML = users.map(user => {
    const grantedDate = user.accessGrantedAt ? new Date(user.accessGrantedAt).toLocaleDateString() : '-';
    const expiresDate = user.accessExpiresAt ? new Date(user.accessExpiresAt).toLocaleDateString() : 'Never';
    
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;background:linear-gradient(135deg,#5865F2,#7289DA);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">
              ${(user.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style="font-weight:600;">${user.username || 'Unknown'}</div>
              <div style="font-size:11px;color:var(--text-muted);font-family:monospace;">${user.discordId}</div>
            </div>
          </div>
        </td>
        <td><code style="background:rgba(88,101,242,0.15);padding:3px 6px;border-radius:4px;font-size:10px;color:#a8b4ff;">${user.accessKey || '-'}</code></td>
        <td><span class="badge badge-yellow">${(user.accessType || 'beta').toUpperCase()}</span></td>
        <td>${grantedDate}</td>
        <td>${expiresDate}</td>
        <td><span class="badge badge-blue">Lvl ${user.level || 1}</span></td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="revokeUserAccess('${user.discordId}')">
            <i class="fas fa-user-slash"></i> Revoke
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function revokeUserAccess(userId) {
  if (!confirm(`Revoke access for this user?\n\nThey will need a new access key to use the bot.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/users/${userId}/revoke-access`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('🔴 User access revoked', 'success');
      loadBetaUsers();
      loadAccessKeys();
    } else {
      showToast(data.error || 'Failed to revoke access', 'error');
    }
  } catch (error) {
    console.error('Failed to revoke access:', error);
    showToast('Failed to revoke access', 'error');
  }
}

// Initialize access keys event listeners
function initAccessKeysListeners() {
  // Generate keys button
  document.getElementById('generateKeysBtn')?.addEventListener('click', generateAccessKeys);
  
  // Key filter
  document.getElementById('keyFilter')?.addEventListener('change', () => {
    renderAccessKeysTable(accessKeysData);
  });
  
  // Enter key on form
  document.getElementById('keyNote')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateAccessKeys();
  });
}

// Expose functions to global scope for onclick handlers
window.generateAccessKeys = generateAccessKeys;
window.copyToClipboard = copyToClipboard;
window.copyAllKeys = copyAllKeys;
window.closeGeneratedKeysModal = closeGeneratedKeysModal;
window.revokeAccessKey = revokeAccessKey;
window.revokeUserAccessByKey = revokeUserAccessByKey;
window.revokeUserAccess = revokeUserAccess;

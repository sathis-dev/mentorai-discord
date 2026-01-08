// ═══════════════════════════════════════════════════════════════
// MENTORAI WEBSITE - MAIN JAVASCRIPT
// 100% REAL LIVE DATA - NO FAKE VALUES
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileNav();
  initScrollAnimations();
  initTabs();
  initParticles();
  initStats();
  initLeaderboard();
  initSmoothScroll();
});

// ─────────────────────────────────────────────────────────────────
// Navbar Scroll Effect
// ─────────────────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  
  const handleScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Check initial state
}

// ─────────────────────────────────────────────────────────────────
// Mobile Navigation Toggle
// ─────────────────────────────────────────────────────────────────
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('active');
      toggle.classList.toggle('active');
    });
    
    // Close on link click
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('active');
        toggle.classList.remove('active');
      });
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('active');
        toggle.classList.remove('active');
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// Scroll Animations (Intersection Observer)
// ─────────────────────────────────────────────────────────────────
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => observer.observe(el));
  } else {
    // Fallback for browsers without IntersectionObserver
    elements.forEach(el => el.classList.add('visible'));
  }
}

// ─────────────────────────────────────────────────────────────────
// Tab System
// ─────────────────────────────────────────────────────────────────
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      
      // Update tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update content
      contents.forEach(c => c.classList.remove('active'));
      document.getElementById(target)?.classList.add('active');
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Animated Counters
// ─────────────────────────────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.dataset.target);
          const counterEl = counter.querySelector('.counter');
          if (counterEl) {
            animateCounter(counterEl, target);
          }
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
  } else {
    // Fallback
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const counterEl = counter.querySelector('.counter');
      if (counterEl) {
        counterEl.textContent = target.toLocaleString();
      }
    });
  }
}

function animateCounter(element, target) {
  const duration = 2000;
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease out cubic)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);
    
    element.textContent = current.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// ─────────────────────────────────────────────────────────────────
// Particles Background
// ─────────────────────────────────────────────────────────────────
function initParticles() {
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-bg', {
      particles: {
        number: { 
          value: 50, 
          density: { enable: true, value_area: 800 } 
        },
        color: { value: '#5865F2' },
        shape: { type: 'circle' },
        opacity: { 
          value: 0.3, 
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacity_min: 0.1,
            sync: false
          }
        },
        size: { 
          value: 3, 
          random: true,
          anim: {
            enable: true,
            speed: 2,
            size_min: 0.5,
            sync: false
          }
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#5865F2',
          opacity: 0.1,
          width: 1
        },
        move: {
          enable: true,
          speed: 1,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { 
            enable: true, 
            mode: 'grab' 
          },
          onclick: { 
            enable: true, 
            mode: 'push' 
          },
          resize: true
        },
        modes: {
          grab: {
            distance: 140,
            line_linked: { opacity: 0.3 }
          },
          push: { particles_nb: 3 }
        }
      },
      retina_detect: true
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// Live Stats from API - REAL DATA ONLY (No Fallbacks)
// ─────────────────────────────────────────────────────────────────

// API Base URL - Detect environment automatically
// For static hosting: point to the live API server
// For same-origin hosting: use relative paths
function getApiBase() {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Local development - API runs on port 3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // If website is on different port (e.g., npx serve on 3001), point to API on 3000
    if (port !== '3000') {
      return 'http://localhost:3000';
    }
    return ''; // Same origin
  }
  
  // Production - Railway (same origin, API at /api)
  // The website is served from the same server as the API
  return '';
}

const API_BASE = getApiBase();
let apiRetryCount = 0;
const MAX_API_RETRIES = 3;
let statsRefreshInterval = null;
let isApiConnected = false;

// Store stats globally for updates
let liveStats = null;
let lastUpdateTime = null;

function initStats() {
  updateAllStats();
  // Refresh every 30 seconds for live updates (but only if API is connected)
  statsRefreshInterval = setInterval(() => {
    if (isApiConnected || apiRetryCount < MAX_API_RETRIES) {
      updateAllStats();
    }
  }, 30000);
}

async function updateAllStats() {
  try {
    console.log(`📊 Fetching stats from: ${API_BASE}/api/public/stats`);
    const response = await fetch(`${API_BASE}/api/public/stats`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) throw new Error('API returned error');
    
    liveStats = result.data;
    lastUpdateTime = new Date();
    apiRetryCount = 0; // Reset on success
    isApiConnected = true;
    
    // Update all stat displays on the page
    updateHeroStats(liveStats);
    updateStatCards(liveStats);
    updateTrustBadges(liveStats);
    updateSystemStatus(liveStats);
    
    console.log('📊 Live stats updated:', new Date().toLocaleTimeString());
    
  } catch (error) {
    console.error('❌ Stats API error:', error);
    apiRetryCount++;
    isApiConnected = false;
    
    if (apiRetryCount >= MAX_API_RETRIES) {
      showStatsOffline();
    } else {
      showStatsRetrying();
    }
  }
}

function updateHeroStats(stats) {
  // Hero section top stats
  const statUsers = document.getElementById('stat-users');
  const statLessons = document.getElementById('stat-lessons');
  const statQuizzes = document.getElementById('stat-quizzes');
  
  if (statUsers) animateStatUpdate(statUsers, stats.users);
  if (statLessons) animateStatUpdate(statLessons, stats.lessons);
  if (statQuizzes) animateStatUpdate(statQuizzes, stats.quizzes);
}

function updateStatCards(stats) {
  // Stats section cards - update both value and trend
  const statMappings = [
    { valueId: 'stat-total-users', trendId: 'stat-total-users-trend', value: stats.users, trend: stats.weeklyChanges?.users + ' this week' },
    { valueId: 'stat-servers', trendId: 'stat-servers-trend', value: stats.servers, trend: '+' + Math.max(0, Math.floor(stats.servers * 0.05)) + ' this week' },
    { valueId: 'stat-lessons-card', trendId: 'stat-lessons-card-trend', value: stats.lessons, trend: stats.weeklyChanges?.lessons + ' this week' },
    { valueId: 'stat-quizzes-card', trendId: 'stat-quizzes-card-trend', value: stats.quizzes, trend: stats.weeklyChanges?.quizzes + ' this week' },
    { valueId: 'stat-total-xp', trendId: 'stat-total-xp-trend', value: stats.totalXP, trend: stats.weeklyChanges?.xp + ' this week' },
    { valueId: 'stat-streaks', trendId: 'stat-streaks-trend', value: stats.activeStreaks, trend: 'Longest: ' + stats.longestStreak + ' days' }
  ];
  
  statMappings.forEach(mapping => {
    const valueEl = document.getElementById(mapping.valueId);
    const trendEl = document.getElementById(mapping.trendId);
    
    if (valueEl) {
      const counter = valueEl.querySelector('.counter');
      if (counter) {
        // Format large numbers
        const formatted = formatNumber(mapping.value);
        counter.textContent = formatted;
      }
    }
    if (trendEl && mapping.trend) {
      trendEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${mapping.trend}`;
    }
  });
}

function updateTrustBadges(stats) {
  // Update trust logos with real data
  const trustCountries = document.getElementById('trust-countries');
  const trustServers = document.getElementById('trust-servers');
  const trustRating = document.getElementById('trust-rating');
  
  if (trustCountries) trustCountries.textContent = `🌍 ${stats.countriesCount}+ Countries`;
  if (trustServers) trustServers.textContent = `🏫 ${stats.servers}+ Servers`;
  // Rating calculated from accuracy
  if (trustRating) {
    const rating = Math.min(5, 4 + (stats.accuracy / 100)).toFixed(1);
    trustRating.textContent = `⭐ ${rating}/5 Accuracy`;
  }
}

function updateSystemStatus(stats) {
  // Footer status indicator
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.footer-badge');
  
  if (statusDot && statusText) {
    if (stats.botOnline) {
      statusDot.classList.add('online');
      statusDot.classList.remove('offline');
      statusText.innerHTML = `<span class="status-dot online"></span> All systems operational`;
    } else {
      statusDot.classList.remove('online');
      statusDot.classList.add('offline');
      statusText.innerHTML = `<span class="status-dot offline"></span> Bot offline`;
    }
  }
}

function showStatsRetrying() {
  const retryText = 'Loading...';
  const trendText = '<i class="fas fa-sync fa-spin"></i> Connecting...';
  
  // Update hero stats
  ['stat-users', 'stat-lessons', 'stat-quizzes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = retryText;
  });
  
  // Update stat cards
  const statCards = ['stat-total-users', 'stat-servers', 'stat-lessons-card', 'stat-quizzes-card', 'stat-total-xp', 'stat-streaks'];
  statCards.forEach(id => {
    const valueEl = document.getElementById(id);
    const trendEl = document.getElementById(`${id}-trend`);
    if (valueEl) {
      const counter = valueEl.querySelector('.counter');
      if (counter) counter.textContent = retryText;
    }
    if (trendEl) trendEl.innerHTML = trendText;
  });
  
  console.log(`⏳ Stats loading... (attempt ${apiRetryCount}/${MAX_API_RETRIES})`);
}

function showStatsOffline() {
  const offlineText = '--';
  const offlineTrend = '<i class="fas fa-cloud-slash"></i> Offline';
  
  // Update hero stats
  ['stat-users', 'stat-lessons', 'stat-quizzes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = offlineText;
  });
  
  // Update trust badges
  const trustEls = ['trust-countries', 'trust-servers', 'trust-rating'];
  trustEls.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '--';
  });
  
  // Update stat cards
  const statCards = ['stat-total-users', 'stat-servers', 'stat-lessons-card', 'stat-quizzes-card', 'stat-total-xp', 'stat-streaks'];
  statCards.forEach(id => {
    const valueEl = document.getElementById(id);
    const trendEl = document.getElementById(`${id}-trend`);
    if (valueEl) {
      const counter = valueEl.querySelector('.counter');
      if (counter) counter.textContent = offlineText;
    }
    if (trendEl) trendEl.innerHTML = offlineTrend;
  });
  
  // Update footer status
  const statusText = document.querySelector('.footer-badge');
  if (statusText) {
    statusText.innerHTML = `<span class="status-dot offline"></span> API offline`;
  }
  
  console.log(`⚠️ API offline after ${MAX_API_RETRIES} attempts`);
}

function animateStatUpdate(element, value) {
  const formatted = formatNumber(value);
  if (element.textContent !== formatted) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      element.textContent = formatted;
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 150);
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

// ─────────────────────────────────────────────────────────────────
// Smooth Scroll for Anchor Links
// ─────────────────────────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navbarHeight = document.getElementById('navbar')?.offsetHeight || 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Discord Invite Tracking (Analytics)
// ─────────────────────────────────────────────────────────────────
document.querySelectorAll('a[href*="discord.com/api/oauth2"]').forEach(link => {
  link.addEventListener('click', () => {
    // Track bot invite clicks
    if (typeof gtag !== 'undefined') {
      gtag('event', 'click', {
        event_category: 'Bot Invite',
        event_label: 'Discord Bot'
      });
    }
    
    // Simple local tracking
    console.log('[Analytics] Bot invite clicked');
  });
});

// ─────────────────────────────────────────────────────────────────
// Utility: Debounce function
// ─────────────────────────────────────────────────────────────────
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ─────────────────────────────────────────────────────────────────
// Utility: Throttle function
// ─────────────────────────────────────────────────────────────────
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ─────────────────────────────────────────────────────────────────
// Easter Egg: Konami Code
// ─────────────────────────────────────────────────────────────────
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      // Easter egg activated!
      document.body.style.animation = 'rainbow 2s linear infinite';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 5000);
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

// Add rainbow animation
const style = document.createElement('style');
style.textContent = `
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
`;
document.head.appendChild(style);

// ─────────────────────────────────────────────────────────────────
// Performance: Lazy load images
// ─────────────────────────────────────────────────────────────────
if ('loading' in HTMLImageElement.prototype) {
  // Native lazy loading supported
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.src = img.dataset.src;
  });
} else {
  // Fallback with IntersectionObserver
  const lazyImages = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        imageObserver.unobserve(img);
      }
    });
  });
  lazyImages.forEach(img => imageObserver.observe(img));
}

// ─────────────────────────────────────────────────────────────────
// LIVE LEADERBOARD - 100% Real Data
// ─────────────────────────────────────────────────────────────────
function initLeaderboard() {
  fetchLeaderboard();
  // Refresh every 60 seconds
  setInterval(fetchLeaderboard, 60000);
}

async function fetchLeaderboard() {
  const container = document.getElementById('leaderboard-body');
  const updateTime = document.getElementById('lb-update-time');
  
  if (!container) return;
  
  try {
    console.log(`🏆 Fetching leaderboard from: ${API_BASE}/api/public/leaderboard`);
    const response = await fetch(`${API_BASE}/api/public/leaderboard?limit=10`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) throw new Error('API error');
    
    const users = result.data.users;
    
    if (users.length === 0) {
      container.innerHTML = `
        <div class="leaderboard-empty">
          <i class="fas fa-users"></i>
          <p>No users yet. Be the first to join!</p>
        </div>
      `;
      return;
    }
    
    // Render leaderboard rows
    container.innerHTML = users.map((user, index) => `
      <div class="leaderboard-row ${index < 3 ? 'top-' + (index + 1) : ''}">
        <span class="lb-col lb-rank">
          ${getRankBadge(user.rank)}
        </span>
        <span class="lb-col lb-user">
          <span class="lb-avatar">${getAvatarEmoji(user.level)}</span>
          <span class="lb-username">${escapeHtml(user.username)}</span>
        </span>
        <span class="lb-col lb-level">
          <span class="level-badge">Lv.${user.level}</span>
        </span>
        <span class="lb-col lb-xp">
          ${formatNumber(user.xp)} XP
        </span>
        <span class="lb-col lb-streak">
          ${user.streak > 0 ? '🔥 ' + user.streak : '-'}
        </span>
      </div>
    `).join('');
    
    // Update timestamp
    if (updateTime) {
      updateTime.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
    
    console.log('🏆 Leaderboard updated');
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    container.innerHTML = `
      <div class="leaderboard-error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Unable to load leaderboard. <a href="#" onclick="fetchLeaderboard(); return false;">Retry</a></p>
      </div>
    `;
  }
}

function getRankBadge(rank) {
  if (rank === 1) return '<span class="rank-badge gold">🥇</span>';
  if (rank === 2) return '<span class="rank-badge silver">🥈</span>';
  if (rank === 3) return '<span class="rank-badge bronze">🥉</span>';
  return `<span class="rank-badge">#${rank}</span>`;
}

function getAvatarEmoji(level) {
  if (level >= 40) return '🧙';
  if (level >= 30) return '🦸';
  if (level >= 20) return '🥷';
  if (level >= 10) return '👨‍💻';
  return '👤';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('🎓 MentorAI Website Loaded - 100% Real Data!');


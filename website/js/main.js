// ═══════════════════════════════════════════════════════════════
// MENTORAI WEBSITE - MAIN JAVASCRIPT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileNav();
  initScrollAnimations();
  initTabs();
  initCounters();
  initParticles();
  initStats();
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
// Live Stats from API
// ─────────────────────────────────────────────────────────────────
function initStats() {
  updateHeroStats();
  // Refresh every 60 seconds
  setInterval(updateHeroStats, 60000);
}

async function updateHeroStats() {
  const statUsers = document.getElementById('stat-users');
  const statLessons = document.getElementById('stat-lessons');
  const statQuizzes = document.getElementById('stat-quizzes');
  
  if (!statUsers || !statLessons || !statQuizzes) return;
  
  try {
    // Try to fetch from API
    const response = await fetch('/api/stats');
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        animateStatUpdate(statUsers, data.data.users || 12547);
        animateStatUpdate(statLessons, data.data.lessons || 89432);
        animateStatUpdate(statQuizzes, data.data.quizzes || 234567);
        return;
      }
    }
  } catch (error) {
    console.log('Using fallback stats');
  }
  
  // Use fallback values with animation
  animateStatUpdate(statUsers, 12547);
  animateStatUpdate(statLessons, 89432);
  animateStatUpdate(statQuizzes, 234567);
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

console.log('🎓 MentorAI Website Loaded Successfully!');

let charts = {};
let currentUserPage = 1;

// Init
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initNav();
  initEvents();
  loadDashboard();
});

async function checkAuth() {
  try {
    const r = await fetch('/api/auth/verify', { credentials: 'include' });
    const d = await r.json();
    if (!d.authenticated) window.location.href = '/';
  } catch { window.location.href = '/'; }
}

function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchPage(item.dataset.page));
  });
}

function initEvents() {
  document.getElementById('logoutBtn').onclick = logout;
  
  const userSearch = document.getElementById('userSearch');
  if (userSearch) userSearch.oninput = debounce(() => loadUsers(), 300);
  
  const userSort = document.getElementById('userSort');
  if (userSort) userSort.onchange = () => loadUsers();
  
  const broadcastForm = document.getElementById('broadcastForm');
  if (broadcastForm) broadcastForm.onsubmit = sendBroadcast;
}

// System
async function loadSystemHealth() {
  try {
    const r = await fetch('/api/system/health', { credentials: 'include' });
    const h = await r.json();
    const uptime = document.getElementById('sysUptime');
    const memory = document.getElementById('sysMemory');
    const node = document.getElementById('sysNode');
    const status = document.getElementById('sysStatus');
    const statusIcon = document.getElementById('sysStatusIcon');
    const maintToggle = document.getElementById('maintenanceToggle');
    
    if (uptime) uptime.textContent = formatUptime(h.uptime);
    if (memory) memory.textContent = ((h.memory?.heapUsed || 0) / 1024 / 1024).toFixed(1) + ' MB';
    if (node) node.textContent = h.nodeVersion || '--';
    if (status) status.textContent = h.status === 'maintenance' ? 'Maintenance' : 'Healthy';
    if (statusIcon) statusIcon.className = 'stat-icon ' + (h.status === 'maintenance' ? 'yellow' : 'green');
    if (maintToggle) maintToggle.checked = h.status === 'maintenance';
  } catch {}
}

async function toggleMaintenance() {
  const enabled = document.getElementById('maintenanceToggle')?.checked;
  try { 
    await fetch('/api/system/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ enabled }) }); 
    showToast(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}!`, 'warning'); 
  } catch { showToast('Failed', 'error'); }
}

async function clearCache() {
  try { 
    await fetch('/api/system/cache/clear', { method: 'POST', credentials: 'include' }); 
    showToast('Cache cleared!', 'success'); 
  } catch { showToast('Failed', 'error'); }
}

// Utilities
function closeModal() { 
  document.getElementById('userModal')?.classList.remove('active'); 
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
}

function refreshData() {
  const page = document.querySelector('.nav-item.active')?.dataset.page || 'dashboard';
  switchPage(page);
  showToast('Refreshed!', 'success');
}

function showToast(msg, type = 'info') {
  const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${msg}</span>`;
  document.getElementById('toastContainer')?.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

function formatDate(d) { 
  return d ? new Date(d).toLocaleDateString() : 'N/A'; 
}

function formatTime(d) { 
  return d ? new Date(d).toLocaleString() : 'N/A'; 
}

function debounce(fn, ms) { 
  let t; 
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; 
}

// EXPOSE FUNCTIONS TO GLOBAL SCOPE (required for onclick handlers in HTML)
window.switchPage = switchPage;
window.loadUsers = loadUsers;
window.viewUser = viewUser;
window.giveXP = giveXP;
window.setLevel = setLevel;
window.resetUser = resetUser;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.loadLeaderboard = loadLeaderboard;
window.loadLogs = loadLogs;
window.clearLogs = clearLogs;
window.loadBroadcastHistory = loadBroadcastHistory;
window.loadBannedUsers = loadBannedUsers;
window.loadConfig = loadConfig;
window.toggleFeature = toggleFeature;
window.saveSettings = saveSettings;
window.loadSystemHealth = loadSystemHealth;
window.toggleMaintenance = toggleMaintenance;
window.clearCache = clearCache;
window.closeModal = closeModal;
window.refreshData = refreshData;
window.loadChartData = loadChartData;
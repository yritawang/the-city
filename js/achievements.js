// achievements.js — universal, include on every page
// ─────────────────────────────────────────────────
// HOW TO ADD A NEW ACHIEVEMENT:
//   1. Add an entry to ACHIEVEMENT_DEFINITIONS below: 'your-key': 'Display label'
//   2. Call unlockAchievement('your-key') from anywhere in any page's JS
//      when the triggering action happens.
// That's it. The toast + panel handle themselves.
// ─────────────────────────────────────────────────

const ACHIEVEMENT_DEFINITIONS = {
  // City
  'named-city':            'Named your city',
  'completed-all':         'Completed all five districts',

  // Garden
  'began-garden':          'Began exploring the Garden',
  'completed-garden':      'Completed the Garden',

  // Shrine
  'began-shrine':          'Began exploring the Shrine',
  'completed-shrine':      'Completed the Shrine',

  // Cornerstore
  'began-cornerstore':     'Began exploring the Cornerstore',
  'completed-cornerstore': 'Completed the Cornerstore',

  // Tower
  'began-tower':           'Began exploring the Tower',
  'completed-tower':       'Completed the Tower',

  // Plaza
  'began-plaza':           'Began exploring the Plaza',
  'completed-plaza':       'Completed the Plaza',

  // Add more here as the project grows:
  // 'returned-to-shrine':  'Returned to the Shrine',
  // 'renamed-district':    'Renamed a district',
};

// ─── Core storage ───────────────────────────────

function getAchievements() {
  return JSON.parse(localStorage.getItem('achievements') || '[]');
}

function hasAchievement(id) {
  return getAchievements().some(a => a.id === id);
}

function unlockAchievement(id) {
  if (hasAchievement(id)) return; // already earned, do nothing
  const achievements = getAchievements();
  const entry = {
    id,
    label: ACHIEVEMENT_DEFINITIONS[id] || id,
    date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
  };
  achievements.push(entry);
  localStorage.setItem('achievements', JSON.stringify(achievements));
  showToast(entry.label);
  renderAchievementPanel();
}

// ─── Toast ──────────────────────────────────────

let toastTimeout = null;

function showToast(label) {
  const toast = document.getElementById('achievement-toast');
  if (!toast) return;
  document.getElementById('toast-title').textContent = label;

  if (toastTimeout) clearTimeout(toastTimeout);
  toast.classList.remove('fade-out', 'wiggle');

  requestAnimationFrame(() => toast.classList.add('visible'));

  toastTimeout = setTimeout(() => dismissToast(), 3000);

  toast.onclick = (e) => {
    if (e.target.id === 'toast-close') { dismissToast(); return; }
    toast.classList.remove('wiggle');
    void toast.offsetWidth; // force reflow to restart animation
    toast.classList.add('wiggle');
  };

  document.getElementById('toast-close').onclick = (e) => {
    e.stopPropagation();
    dismissToast();
  };
}

function dismissToast() {
  const toast = document.getElementById('achievement-toast');
  if (!toast) return;
  toast.classList.add('fade-out');
  toast.classList.remove('visible');
  if (toastTimeout) { clearTimeout(toastTimeout); toastTimeout = null; }
}

// ─── Panel ──────────────────────────────────────

function renderAchievementPanel() {
  const list = document.getElementById('achievements-panel-list');
  if (!list) return;
  const achievements = getAchievements();

  if (achievements.length === 0) {
    list.innerHTML = '<p class="achievements-empty">No achievements yet.<br>Start exploring a district.</p>';
    return;
  }

  list.innerHTML = [...achievements].reverse().map(a => `
    <div class="achievement-item">
      ${a.label}
      <span class="achievement-item-date">${a.date}</span>
    </div>
  `).join('');
}

function openAchievementsPanel() {
  const panel = document.getElementById('achievements-panel');
  const btn = document.getElementById('achievements-toggle-btn');
  if (!panel) return;
  panel.classList.add('visible');
  if (btn) btn.style.display = 'none';
  renderAchievementPanel();
}

function closeAchievementsPanel() {
  const panel = document.getElementById('achievements-panel');
  const btn = document.getElementById('achievements-toggle-btn');
  if (!panel) return;
  panel.classList.remove('visible');
  if (btn) btn.style.display = 'flex';
}

// ─── Init (runs on every page that includes this file) ───

document.addEventListener('DOMContentLoaded', () => {
  // Inject toast + panel HTML into the page automatically
  const ui = document.createElement('div');
  ui.innerHTML = `
    <!-- Achievement Toast -->
    <div class="achievement-toast" id="achievement-toast">
      <div class="achievement-toast-header">
        <span class="achievement-toast-label">Achievement Unlocked</span>
        <button class="achievement-toast-close" id="toast-close">✕</button>
      </div>
      <div class="achievement-toast-body">
        <p class="achievement-toast-title" id="toast-title"></p>
      </div>
    </div>

    <!-- Achievements Toggle Button -->
    <div class="achievements-toggle-btn" id="achievements-toggle-btn">
      <span class="achievements-btn-label">Achievements</span>
    </div>

    <!-- Achievements Panel -->
    <div class="achievements-panel" id="achievements-panel">
      <div class="achievements-panel-header" id="achievements-panel-header">
        <span class="achievements-panel-label">Achievements</span>
        <span class="achievements-panel-toggle">✕</span>
      </div>
      <div class="achievements-panel-list" id="achievements-panel-list"></div>
    </div>
  `;
  document.body.appendChild(ui);

  document.getElementById('achievements-toggle-btn')
    ?.addEventListener('click', openAchievementsPanel);
  document.getElementById('achievements-panel-header')
    ?.addEventListener('click', closeAchievementsPanel);
  renderAchievementPanel();
  document.addEventListener('click', (e) => {
  const panel = document.getElementById('achievements-panel');
  const btn = document.getElementById('achievements-toggle-btn');
  if (!panel || !panel.classList.contains('visible')) return;
  if (!panel.contains(e.target) && !btn?.contains(e.target)) {
    closeAchievementsPanel();
  }
});
});
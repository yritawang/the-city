// achievements.js — universal, include on every page
// -------------------------------------------------
// how to add a new achievement:
//   1. add an entry to ACHIEVEMENT_DEFINITIONS below: 'your-key': 'Display label'
//   2. call unlockAchievement('your-key') from anywhere in any page's js
//      when the triggering action happens.
// -------------------------------------------------
// button + panel: only on map.html. call initAchievementsPanel() after this
// script loads on that page. district pages get the toast only.
// -------------------------------------------------

const ACHIEVEMENT_DEFINITIONS = {
  // city
  'named-city':            'Named your city',
  'completed-all':         'Completed all five districts',

  // garden
  'began-garden':          'Began exploring the Garden',
  'completed-garden':      'Completed the Garden',
  'returned-garden':       'Returned to the Garden',
  'named-garden':          'Named the Garden',

  // shrine
  'began-shrine':          'Began exploring the Shrine',
  'completed-shrine':      'Completed the Shrine',
  'returned-shrine':       'Returned to the Shrine',
  'named-shrine':          'Named the Shrine',

  // cornerstore
  'began-cornerstore':     'Began exploring the Cornerstore',
  'completed-cornerstore': 'Completed the Cornerstore',
  'returned-cornerstore':  'Returned to the Cornerstore',
  'named-cornerstore':     'Named the Cornerstore',

  // tower
  'began-tower':           'Began exploring the Tower',
  'completed-tower':       'Completed the Tower',
  'returned-tower':        'Returned to the Tower',
  'named-tower':           'Named the Tower',

  // plaza
  'began-plaza':           'Began exploring the Plaza',
  'completed-plaza':       'Completed the Plaza',
  'returned-plaza':        'Returned to the Plaza',
  'named-plaza':           'Named the Plaza',
};


// --- core storage ---

function getAchievements() {
  return JSON.parse(localStorage.getItem('achievements') || '[]');
}

function hasAchievement(id) {
  return getAchievements().some(a => a.id === id);
}

function unlockAchievement(id) {
  if (hasAchievement(id)) return; // already earned, skip
  const achievements = getAchievements();
  const entry = {
    id,
    label: ACHIEVEMENT_DEFINITIONS[id] || id,
    date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
  };
  achievements.push(entry);
  localStorage.setItem('achievements', JSON.stringify(achievements));
  showToast(entry.label);
  renderAchievementPanel(); // no-op if panel doesn't exist on this page
}


// --- toast ---

let toastTimeout = null;

function showToast(label) {
  const toast = document.getElementById('achievement-toast');

  // defer if the toast element hasn't been injected yet (race condition on map.html)
  if (!toast) {
    setTimeout(() => showToast(label), 50);
    return;
  }

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


// --- panel (map.html only) ---

function renderAchievementPanel() {
  const list = document.getElementById('achievements-panel-list');
  if (!list) return; // not on map page, skip silently
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
  const btn   = document.getElementById('achievements-toggle-btn');
  if (!panel) return;
  panel.classList.add('visible');
  if (btn) btn.style.display = 'none';
  renderAchievementPanel();
}

function closeAchievementsPanel() {
  const panel = document.getElementById('achievements-panel');
  const btn   = document.getElementById('achievements-toggle-btn');
  if (!panel) return;
  panel.classList.remove('visible');
  if (btn) btn.style.display = 'flex';
}

// call this from map.html after the script loads to inject the button + panel
function initAchievementsPanel() {
  const ui = document.createElement('div');
  ui.innerHTML = `
    <div class="achievements-toggle-btn" id="achievements-toggle-btn">
      <span class="achievements-btn-label">Achievements</span>
    </div>
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
    const btn   = document.getElementById('achievements-toggle-btn');
    if (!panel || !panel.classList.contains('visible')) return;
    if (!panel.contains(e.target) && !btn?.contains(e.target)) {
      closeAchievementsPanel();
    }
  });
}


// --- init (runs on every page that includes this file) ---

document.addEventListener('DOMContentLoaded', () => {
  // inject toast html into the page automatically
  const ui = document.createElement('div');
  ui.innerHTML = `
    <div class="achievement-toast" id="achievement-toast">
      <div class="achievement-toast-header">
        <span class="achievement-toast-label">Achievement Unlocked</span>
        <button class="achievement-toast-close" id="toast-close">✕</button>
      </div>
      <div class="achievement-toast-body">
        <p class="achievement-toast-title" id="toast-title"></p>
      </div>
    </div>
  `;
  document.body.appendChild(ui);

  // flush any achievements queued from district pages before map loaded
  const pending = JSON.parse(localStorage.getItem('pending-achievements') || '[]');
  if (pending.length) {
    localStorage.removeItem('pending-achievements');
    pending.forEach(id => unlockAchievement(id));
  }
});
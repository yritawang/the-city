// achievements.js — universal, include on every page
// to add an achievement: add to ACHIEVEMENT_DEFINITIONS, call unlockAchievement('key')

const ACHIEVEMENT_DEFINITIONS = {
  'named-city':            { label: 'Named your city',                  quip: "It has a name now. It's real.",                           icon: '🏙️', cat: 'City'        },
  'completed-all':         { label: 'Completed all five districts',      quip: 'Your city is whole. Every district, every memory.',        icon: '✦',  cat: 'City'        },
  'shared-city':           { label: 'Shared your city',                  quip: 'You let someone else in.',                                icon: '✉️', cat: 'City'        },

  // train
  'sent-first-train':      { label: 'Sent a Train Thought',               quip: 'A thought that almost slipped away. You caught it.',       icon: '🚂', cat: 'Train'       },
  'sent-5-trains':         { label: 'Sent 5 Train Thoughts',              quip: 'The train keeps coming back for you.',                     icon: '🛤️', cat: 'Train'       },
  'sent-10-trains':        { label: 'Sent 10 Train Thoughts',             quip: 'Some people are full of passing thoughts. You write yours down.', icon: '🌁', cat: 'Train'       },
  'train-to-all':          { label: 'Sent a thought to every district',   quip: 'Every part of your city has heard from you.',              icon: '🗺️', cat: 'Train'       },
  'began-garden':          { label: 'Entered the Garden',                quip: 'Something is beginning to grow.',                         icon: '🌱', cat: 'Exploration'  },
  'completed-garden':      { label: 'Completed the Garden',              quip: 'The Garden is yours now.',                                icon: '🌿', cat: 'Completion'   },
  'returned-garden':       { label: 'Returned to the Garden',            quip: 'Growth does that.',                                       icon: '🌾', cat: 'Exploration'  },
  'named-garden':          { label: 'Named the Garden',                  quip: 'A place worth keeping deserves a name.',                  icon: '🪴', cat: 'Naming'       },
  'began-shrine':          { label: 'Entered the Shrine',                quip: 'You remembered something sacred.',                        icon: '🕯️', cat: 'Exploration'  },
  'completed-shrine':      { label: 'Completed the Shrine',              quip: 'You held it long enough to put it into words.',           icon: '🏮', cat: 'Completion'   },
  'returned-shrine':       { label: 'Returned to the Shrine',            quip: 'Some places ask to be revisited.',                        icon: '✨', cat: 'Exploration'  },
  'named-shrine':          { label: 'Named the Shrine',                  quip: 'Reverence has an address now.',                           icon: '📍', cat: 'Naming'       },
  'began-cornerstore':     { label: 'Entered the Cornerstore',           quip: 'You know this kind of place.',                            icon: '🏪', cat: 'Exploration'  },
  'completed-cornerstore': { label: 'Completed the Cornerstore',         quip: 'Routine, preserved.',                                     icon: '🧃', cat: 'Completion'   },
  'returned-cornerstore':  { label: 'Returned to the Cornerstore',       quip: 'Habit brought you back.',                                 icon: '🔑', cat: 'Exploration'  },
  'named-cornerstore':     { label: 'Named the Cornerstore',             quip: 'Even ordinary places deserve a name.',                   icon: '🏷️', cat: 'Naming'       },
  'began-tower':           { label: 'Entered the Tower',                 quip: 'Alone, but you climbed anyway.',                          icon: '🗼', cat: 'Exploration'  },
  'completed-tower':       { label: 'Completed the Tower',               quip: 'You sat with solitude and wrote it down.',                icon: '🌙', cat: 'Completion'   },
  'returned-tower':        { label: 'Returned to the Tower',             quip: 'Solitude keeps calling you back.',                        icon: '🌫️', cat: 'Exploration'  },
  'named-tower':           { label: 'Named the Tower',                   quip: 'Your solitude has a postcode.',                           icon: '🪟', cat: 'Naming'       },
  'began-plaza':           { label: 'Entered the Plaza',                 quip: 'You were part of something bigger.',                      icon: '🌐', cat: 'Exploration'  },
  'completed-plaza':       { label: 'Completed the Plaza',               quip: 'Community, remembered.',                                  icon: '🫂', cat: 'Completion'   },
  'returned-plaza':        { label: 'Returned to the Plaza',             quip: 'You keep coming back to the people.',                     icon: '🎪', cat: 'Exploration'  },
  'named-plaza':           { label: 'Named the Plaza',                   quip: 'The place where you belonged has a name.',                icon: '🗺️', cat: 'Naming'       },
};

// categories define display order
const ACHIEVEMENT_CATEGORIES = [
  { label: 'Exploration', ids: ['began-garden','returned-garden','began-shrine','returned-shrine','began-cornerstore','returned-cornerstore','began-tower','returned-tower','began-plaza','returned-plaza'] },
  { label: 'Completion',  ids: ['completed-garden','completed-shrine','completed-cornerstore','completed-tower','completed-plaza'] },
  { label: 'Naming',      ids: ['named-garden','named-shrine','named-cornerstore','named-tower','named-plaza'] },
  { label: 'City',        ids: ['named-city','completed-all','shared-city'] },
  { label: 'Train',       ids: ['sent-first-train','sent-5-trains','sent-10-trains','train-to-all'] },
];


// ─── core storage ────────────────────────────────────────────────────────────

function getAchievements() {
  return JSON.parse(localStorage.getItem('achievements') || '[]');
}

function hasAchievement(id) {
  return getAchievements().some(a => a.id === id);
}

function unlockAchievement(id, silent = false) {
  if (hasAchievement(id)) return;
  const def = ACHIEVEMENT_DEFINITIONS[id];
  if (!def) return;
  const entry = {
    id,
    label: def.label,
    quip:  def.quip,
    icon:  def.icon,
    date:  new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
  };
  const achievements = getAchievements();
  achievements.push(entry);
  localStorage.setItem('achievements', JSON.stringify(achievements));
  if (!silent) showToast(entry);
  renderAchievementPanel();
}


// ─── toast ───────────────────────────────────────────────────────────────────

let toastTimeout = null;

function showToast(entry) {
  const toast = document.getElementById('achievement-toast');
  if (!toast) { setTimeout(() => showToast(entry), 50); return; }

  const iconEl  = toast.querySelector('.achievement-toast-icon');
  const titleEl = document.getElementById('toast-title');
  const quipEl  = document.getElementById('toast-quip');
  if (iconEl)  iconEl.textContent  = entry.icon  || '✦';
  if (titleEl) titleEl.textContent = entry.label || '';
  if (quipEl)  quipEl.textContent  = entry.quip  || '';

  if (toastTimeout) clearTimeout(toastTimeout);
  toast.classList.remove('fade-out', 'wiggle');
  requestAnimationFrame(() => toast.classList.add('visible'));
  toastTimeout = setTimeout(() => dismissToast(), 4000);

  toast.onclick = (e) => {
    if (e.target.id === 'toast-close') { dismissToast(); return; }
    toast.classList.remove('wiggle');
    void toast.offsetWidth;
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


// ─── overlay panel ───────────────────────────────────────────────────────────

function renderAchievementPanel() {
  const earnedCol = document.getElementById('achievements-earned');
  const lockedCol = document.getElementById('achievements-locked');
  if (!earnedCol || !lockedCol) return;

  const earned    = new Set(getAchievements().map(a => a.id));
  const dateMap   = Object.fromEntries(getAchievements().map(a => [a.id, a.date]));
  const allCatIds = [...new Set(ACHIEVEMENT_CATEGORIES.flatMap(c => c.ids))];
  const total     = allCatIds.length;
  const earnedCount = allCatIds.filter(id => earned.has(id)).length;

  const earnedHeader = document.getElementById('ach-col-header-earned');
  const lockedHeader = document.getElementById('ach-col-header-locked');
  if (earnedHeader) earnedHeader.querySelector('.ach-col-count').textContent = `${earnedCount}/${total}`;
  if (lockedHeader) lockedHeader.querySelector('.ach-col-count').textContent = `${total - earnedCount}/${total}`;

  function buildColumn(colEl, filterFn, emptyMsg) {
    const sections = ACHIEVEMENT_CATEGORIES.map(cat => {
      const allInCat = cat.ids.filter(id => ACHIEVEMENT_DEFINITIONS[id]);
      const items    = allInCat.filter(filterFn);
      if (!items.length) return '';

      const catEarned = allInCat.filter(id => earned.has(id)).length;
      const catTotal  = allInCat.length;

      return `
        <div class="ach-category">
          <button class="ach-category-heading mono" aria-expanded="false">
            <span class="ach-category-name">${cat.label}</span>
            <span class="ach-category-count">${catEarned}/${catTotal}</span>
            <span class="ach-category-chevron">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <polyline points="1,1 6,7 11,1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>
          <div class="ach-category-body">
            ${items.map(id => {
              const def  = ACHIEVEMENT_DEFINITIONS[id];
              const date = dateMap[id];
              return `
                <div class="ach-item">
                  <span class="ach-item-icon">${def.icon}</span>
                  <div class="ach-item-text">
                    <span class="ach-item-label mono">${def.label}</span>
                    <span class="ach-item-quip mono">${def.quip}</span>
                  </div>
                  ${date ? `<span class="ach-item-date mono">${date}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    colEl.innerHTML = sections || `<p class="ach-empty mono">${emptyMsg}</p>`;

    // wire collapsible headings
    colEl.querySelectorAll('.ach-category-heading').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.closest('.ach-category');
        cat.classList.toggle('open');
        btn.setAttribute('aria-expanded', cat.classList.contains('open'));
      });
    });
  }

  buildColumn(earnedCol, id =>  earned.has(id), 'Nothing earned yet.');
  buildColumn(lockedCol, id => !earned.has(id), "You've unlocked everything!");
}

function openAchievementsPanel() {
  document.getElementById('achievements-overlay')?.remove();

  const earned      = new Set(getAchievements().map(a => a.id));
  const allCatIds   = [...new Set(ACHIEVEMENT_CATEGORIES.flatMap(c => c.ids))];
  const total       = allCatIds.length;
  const earnedCount = allCatIds.filter(id => earned.has(id)).length;

  const overlay = document.createElement('div');
  overlay.id        = 'achievements-overlay';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="ach-overlay-content">
      <div class="ach-overlay-header">
        <span class="ach-overlay-title mono">Archie's Achievement Log</span>
        <button class="ach-overlay-close mono" id="ach-close">✕</button>
      </div>
      <div class="ach-overlay-body">
        <div class="ach-col">
          <div class="ach-col-header mono" id="ach-col-header-earned">
            <span class="ach-col-header-label">Earned</span>
            <span class="ach-col-count">${earnedCount}/${total}</span>
          </div>
          <div class="ach-col-scroll" id="achievements-earned"></div>
        </div>
        <div class="ach-col-divider"></div>
        <div class="ach-col">
          <div class="ach-col-header mono" id="ach-col-header-locked">
            <span class="ach-col-header-label">Locked</span>
            <span class="ach-col-count">${total - earnedCount}/${total}</span>
          </div>
          <div class="ach-col-scroll" id="achievements-locked"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // add active class on next tick so css transition fires
  requestAnimationFrame(() => overlay.classList.add('active'));

  renderAchievementPanel();

  document.getElementById('ach-close').addEventListener('click', closeAchievementsPanel);
  // defer outside-click listener so it doesn't catch the opening click
  requestAnimationFrame(() => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAchievementsPanel();
    });
  });
}

function closeAchievementsPanel() {
  const overlay = document.getElementById('achievements-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  setTimeout(() => overlay.remove(), 300);
}

function initAchievementsPanel() {
  const btn = document.createElement('div');
  btn.id        = 'achievements-toggle-btn';
  btn.className = 'achievements-toggle-btn';
  btn.innerHTML = `<span class="achievements-btn-label">Achievements</span>`;
  document.body.appendChild(btn);
  btn.addEventListener('click', openAchievementsPanel);
}


// ─── init (every page) ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const ui = document.createElement('div');
  ui.innerHTML = `
    <div class="achievement-toast" id="achievement-toast">
      <div class="achievement-toast-header">
        <span class="achievement-toast-eyebrow">Archie noticed something</span>
        <button class="achievement-toast-close" id="toast-close">✕</button>
      </div>
      <div class="achievement-toast-body">
        <span class="achievement-toast-icon"></span>
        <div class="achievement-toast-text">
          <p class="achievement-toast-title" id="toast-title"></p>
          <p class="achievement-toast-quip"  id="toast-quip"></p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(ui);

  const pending = JSON.parse(localStorage.getItem('pending-achievements') || '[]');
  if (pending.length) {
    localStorage.removeItem('pending-achievements');
    pending.forEach(id => unlockAchievement(id));
  }
});
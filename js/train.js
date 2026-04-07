// train.js
// load after map.js in map.html
// initTrain() is called from map.js DOMContentLoaded


const TRAIN_SPOTS = [
  { x: 40,  y: 300, zIndex: 2 },
  { x: 850, y: 260, zIndex: 2 },
];

const TRAIN_PROMPTS = [
  "What have you been carrying around lately that you haven't said out loud?",
  "What did you notice today that surprised you?",
  "What are you trying to let go of right now?",
  "What feeling keeps returning to you this week?",
  "Who have you been thinking about and why?",
  "What place have you been dreaming about?",
  "What do you wish someone understood about you?",
  "What did you leave unsaid recently?",
  "What small thing made you feel something today?",
  "What are you afraid will fade from memory?",
  "What are you becoming that you haven't named yet?",
  "What would you say to the version of yourself from a year ago?",
  "What does home feel like to you right now?",
  "What are you waiting for?",
  "What do you keep returning to in your mind?",
  "What emotion are you the most fluent in lately?",
  "What are you grieving, even if it seems small?",
  "What does comfort look like for you right now?",
];

const TRAIN_DISTRICT_KEYS = ['shrine', 'garden', 'cornerstore', 'tower', 'plaza'];

const TRAIN_DISTRICT_LABELS = {
  shrine:      'The Shrine',
  garden:      'The Garden',
  cornerstore: 'The Cornerstore',
  tower:       'The Tower',
  plaza:       'The Plaza',
};

let trainVisible   = false;
let trainPos       = null;
let boardPos       = null;
let lastTrainSpot  = -1;
let selectedPrompt = null;


// init

function initTrain() {
  // prevent double-init if called more than once
  if (document.getElementById('train-on-map') || document.getElementById('train-board')) return;
  if (window._trainInitDone) return;
  window._trainInitDone = true;

  const states  = JSON.parse(localStorage.getItem('districtStates') || '{}');
  const anyDone = TRAIN_DISTRICT_KEYS.some(d =>
    states[d] === 'unlocked' ||
    JSON.parse(localStorage.getItem(d + '-sessions') || '[]').length > 0
  );
  if (!anyDone) return;

  const log        = JSON.parse(localStorage.getItem('train-log') || '[]');
  const hasStation = log.some(e => !e.district);
  const hasAnyLog  = log.length > 0;
  const showBoard  = hasStation ? Math.random() < 0.75 : hasAnyLog && Math.random() < 0.4;
  setTimeout(showBoard ? renderTrainBoard : showTrain, 1800);

  if (localStorage.getItem('trainDebug')) showDebugSpots();
}

function showDebugSpots() {
  const md = document.querySelector('.map-districts');
  if (!md) return;
  TRAIN_SPOTS.forEach((s, i) => {
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;left:${s.x}px;top:${s.y}px;width:120px;height:100px;
      border:2px dashed #DD6204;background:rgba(221,98,4,0.1);
      display:flex;align-items:center;justify-content:center;
      font-family:monospace;font-size:11px;color:#DD6204;
      pointer-events:none;z-index:9999;
    `;
    el.textContent = `spot ${i + 1} (z:${s.zIndex})`;
    md.appendChild(el);
  });
}


// spot picker

function pickSpot() {
  const available = TRAIN_SPOTS
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => i !== lastTrainSpot);
  const chosen = available[Math.floor(Math.random() * available.length)];
  lastTrainSpot = chosen.i;
  return { ...chosen.s };
}


// train on map

function showTrain() {
  if (trainVisible) return;
  if (document.getElementById('train-board')) return;
  trainPos = pickSpot();
  placeTrain();
}

function placeTrain() {
  const md = document.querySelector('.map-districts');
  if (!md || document.getElementById('train-on-map')) return;

  const pos = trainPos;
  const el  = document.createElement('div');
  el.id = 'train-on-map';
  el.style.cssText = `
    position: absolute;
    left: ${pos.x}px;
    top: ${pos.y}px;
    width: 200px;
    z-index: ${pos.zIndex ?? 2};
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.4s ease, transform 0.25s ease;
    transform: translateY(0px);
  `;
  el.innerHTML = `<img src="assets/districts/train.png" alt="The Train" style="display:block;width:100%;height:auto;pointer-events:none;">`;

  el.addEventListener('mouseenter', () => { el.style.transform = 'translateY(-7px)'; });
  el.addEventListener('mouseleave', () => { el.style.transform = 'translateY(0px)'; });
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openTrainOverlay(); });

  md.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  trainVisible = true;
}

function removeTrain() {
  trainVisible = false;
  const el = document.getElementById('train-on-map');
  if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }
}

function restoreTrainHit() {
  const el = document.getElementById('train-on-map');
  if (el) {
    el.style.pointerEvents = '';
  } else {
    trainVisible = false;
    if (trainPos) placeTrain(); else showTrain();
  }
}


// train board on map

function renderTrainBoard() {
  const log        = JSON.parse(localStorage.getItem('train-log') || '[]');
  const hasStation = log.some(e => !e.district);
  if (!hasStation) return;

  document.getElementById('train-board')?.remove();

  const md = document.querySelector('.map-districts');
  if (!md) return;

   boardPos = pickSpot();
   const pos = boardPos;
  const el  = document.createElement('div');
  el.id = 'train-board';
  el.style.cssText = `
    position: absolute;
    right: calc(100% - ${pos.x}px);
    top: ${pos.y}px;
    width: 40px;
    z-index: ${pos.zIndex ?? 2};
    opacity: 0;
    cursor: pointer;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    transition: opacity 0.4s ease, transform 0.25s ease;
    transform: translateY(0px);
  `;
  el.innerHTML = `<img src="assets/districts/trainboard.png" alt="Train Board" style="display:block;width:100%;height:auto;pointer-events:none;">`;

  el.addEventListener('mouseenter', () => { el.style.transform = 'translateY(-5px)'; });
  el.addEventListener('mouseleave', () => { el.style.transform = 'translateY(0px)'; });
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openBoardOverlay(); });

  md.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
}


// train overlay

function openTrainOverlay() {
  const trainEl = document.getElementById('train-on-map');
  if (trainEl) trainEl.style.pointerEvents = 'none';

  document.getElementById('train-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'train-overlay';
  overlay.className = 'overlay train-overlay';
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { closeTrainOverlay(); restoreTrainHit(); }
  });

  const shuffled = [...TRAIN_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3);
  const states   = JSON.parse(localStorage.getItem('districtStates') || '{}');

  const districtOptions = TRAIN_DISTRICT_KEYS
    .filter(d => states[d] === 'unlocked' ||
                 JSON.parse(localStorage.getItem(d + '-sessions') || '[]').length > 0)
    .map(d => `<option value="${d}">${TRAIN_DISTRICT_LABELS[d]}</option>`)
    .join('');

  overlay.innerHTML = `
    <div class="overlay-content train-overlay-content">

      <div class="train-overlay-header">
        <img src="assets/districts/train.png" alt="The Train" class="train-overlay-img">
        <div class="train-overlay-header-text">
          <h2 class="train-overlay-title">The Train</h2>
          <p class="train-overlay-subtitle mono">A passing thought. Send it somewhere before it leaves.</p>
        </div>
        <button class="train-board-link mono" id="train-board-link">See board →</button>
      </div>

      <div class="train-prompt-section">
        <p class="train-section-label mono">Choose a prompt, or free write</p>
        <div class="train-prompts" id="train-prompts">
          ${shuffled.map((p, i) => `
            <button class="train-prompt-btn mono" data-prompt="${p.replace(/"/g, '&quot;')}">
              <span class="train-prompt-num">${i + 1}</span>${p}
            </button>
          `).join('')}
          <button class="train-prompt-btn train-freewrite-btn mono" data-prompt="">
            <span class="train-prompt-num">↓</span>Free write
          </button>
        </div>
      </div>

      <div class="train-write-section" id="train-write-section">
        <p class="train-selected-prompt mono" id="train-selected-prompt"></p>
        <textarea class="train-textarea" id="train-textarea" placeholder="Write here…" rows="4"></textarea>
      </div>

      <div class="train-send-section" id="train-send-section">
        <div class="train-send-row">
          <span class="train-section-label mono">Send to</span>
          <select class="train-district-select mono" id="train-district-select">
            <option value="">Pin it to the train board</option>
            ${districtOptions}
          </select>
        </div>
        <div class="train-send-actions">
          <button class="train-cancel-btn mono" id="train-cancel-btn">Cancel</button>
          <button class="train-keep-btn mono" id="train-keep-btn">Keep at station</button>
          <button class="train-send-btn mono" id="train-send-btn">Send →</button>
        </div>
      </div>

    </div>
  `;

  overlay.classList.add('active');
  selectedPrompt = null;

  // prompt selection
  overlay.querySelectorAll('.train-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.train-prompt-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPrompt = btn.dataset.prompt;
      const label = document.getElementById('train-selected-prompt');
      if (label) label.textContent = selectedPrompt || "Free write — say what's on your mind.";
      document.getElementById('train-write-section')?.classList.add('visible');
      document.getElementById('train-send-section')?.classList.add('visible');
      document.getElementById('train-textarea')?.focus();
    });
  });

  document.getElementById('train-cancel-btn').addEventListener('click', () => {
    closeTrainOverlay();
    restoreTrainHit();
  });

  document.getElementById('train-keep-btn').addEventListener('click', () => {
    saveTrainThought(null);
  });

  document.getElementById('train-send-btn').addEventListener('click', () => {
    const district = document.getElementById('train-district-select')?.value || null;
    if (!district) {
      const sel = document.getElementById('train-district-select');
      if (sel) sel.style.borderColor = '#c0392b';
      return;
    }
    saveTrainThought(district);
  });

  document.getElementById('train-board-link').addEventListener('click', () => {
    closeTrainOverlay();
    restoreTrainHit();
    openBoardOverlay();
  });
}

function closeTrainOverlay() {
  document.getElementById('train-overlay')?.remove();
}


// save a train thought — district null means keep at station

function saveTrainThought(district) {
  const text = document.getElementById('train-textarea')?.value?.trim();

  if (!text) {
    const ta = document.getElementById('train-textarea');
    if (ta) { ta.style.borderColor = '#c0392b'; ta.focus(); }
    return;
  }

  const now       = new Date();
  const dateStr   = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const timestamp = now.getTime();

  if (district) {
    // save to district journal
    const sessions = JSON.parse(localStorage.getItem(`${district}-sessions`) || '[]');
    sessions.push({
      date: dateStr, timestamp, isTrainThought: true,
      answers: { 0: 'Train Thoughts', 1: selectedPrompt || '', 2: text },
    });
    localStorage.setItem(`${district}-sessions`, JSON.stringify(sessions));
  }

  // always save to train-log; district null = kept at station
  const log = JSON.parse(localStorage.getItem('train-log') || '[]');
  log.push({
    district,
    districtLabel: district ? TRAIN_DISTRICT_LABELS[district] : null,
    prompt:        selectedPrompt || '',
    text,
    date:          dateStr,
    timestamp,
  });
  localStorage.setItem('train-log', JSON.stringify(log));

  // train achievements
  if (typeof unlockAchievement === 'function') {
    unlockAchievement('sent-first-train');
    if (log.length >= 5)  unlockAchievement('sent-5-trains');
    if (log.length >= 10) unlockAchievement('sent-10-trains');
    const sentDistricts = new Set(log.filter(e => e.district).map(e => e.district));
    if (TRAIN_DISTRICT_KEYS.every(d => sentDistricts.has(d))) unlockAchievement('train-to-all');
  }

  closeTrainOverlay();
  removeTrain();

  // show board if there are station entries, otherwise just hide train
  const hasStation = log.some(e => !e.district);
  if (hasStation && !document.getElementById('train-board')) renderTrainBoard();

  showToast(district ? `Sent to ${TRAIN_DISTRICT_LABELS[district]}` : 'Kept at the station');
}

function showToast(text) {
  const toast = document.createElement('div');
  toast.className   = 'train-toast mono';
  toast.textContent = text;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 2400);
}


// board overlay — shows only station entries

function openBoardOverlay() {
  document.getElementById('board-overlay')?.remove();

  const states          = JSON.parse(localStorage.getItem('districtStates') || '{}');
  const districtOptions = TRAIN_DISTRICT_KEYS
    .filter(d => states[d] === 'unlocked' ||
                 JSON.parse(localStorage.getItem(d + '-sessions') || '[]').length > 0)
    .map(d => `<option value="${d}">${TRAIN_DISTRICT_LABELS[d]}</option>`)
    .join('');

  const log        = JSON.parse(localStorage.getItem('train-log') || '[]');
  const stationLog = log.filter(e => !e.district);

  const logHTML = stationLog.length === 0
    ? '<p class="train-board-empty mono">No thoughts at the station yet.</p>'
    : [...stationLog].reverse().map(entry => `
        <div class="train-log-entry" data-ts="${entry.timestamp}">
          <div class="train-log-meta mono">
            <span>${entry.date}</span>
            <button class="train-log-delete mono" data-ts="${entry.timestamp}">delete</button>
          </div>
          ${entry.prompt ? `<p class="train-log-prompt mono">${entry.prompt}</p>` : ''}
          <p class="train-log-text">${entry.text}</p>
          <div class="train-log-send-row">
            <select class="train-log-district-select mono" data-ts="${entry.timestamp}">
              <option value="">Send to a district...</option>
              ${districtOptions}
            </select>
            <button class="train-log-send-btn mono" data-ts="${entry.timestamp}">Send →</button>
          </div>
        </div>
      `).join('');

  const overlay = document.createElement('div');
  overlay.id = 'board-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(10,5,155,0.15);display:flex;align-items:center;justify-content:center;z-index:1000;';
  overlay.innerHTML = `
    <div class="board-overlay-content">
      <div class="board-overlay-header">
        <h2 class="board-overlay-title">Train Board</h2>
        <p class="board-overlay-subtitle mono">Thoughts kept at the station.</p>
      </div>
      <div class="board-log" id="board-log">${logHTML}</div>
      <div class="board-overlay-footer">
        <button class="overlay-btn mono" id="board-recall-btn">Call the Train →</button>
        <button class="overlay-btn mono primary" id="board-close-btn">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBoardOverlay(); });
  }, 0);

  // delete buttons
  overlay.querySelectorAll('.train-log-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ts      = parseInt(btn.dataset.ts);
      const updated = JSON.parse(localStorage.getItem('train-log') || '[]')
        .filter(entry => entry.timestamp !== ts);
      localStorage.setItem('train-log', JSON.stringify(updated));

      // remove board from map if no station entries remain
      if (!updated.some(e => !e.district)) {
        document.getElementById('train-board')?.remove();
      }
      openBoardOverlay();
    });
  });

  // send to district from board
  overlay.querySelectorAll('.train-log-send-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ts       = parseInt(btn.dataset.ts);
      const select   = overlay.querySelector(`.train-log-district-select[data-ts="${ts}"]`);
      const district = select?.value;

      if (!district) {
        if (select) select.style.borderColor = '#c0392b';
        return;
      }

      const log   = JSON.parse(localStorage.getItem('train-log') || '[]');
      const entry = log.find(e => e.timestamp === ts);
      if (!entry) return;

      // save to district journal
      const sessions = JSON.parse(localStorage.getItem(`${district}-sessions`) || '[]');
      sessions.push({
        date: entry.date, timestamp: entry.timestamp, isTrainThought: true,
        answers: { 0: 'Train Thoughts', 1: entry.prompt || '', 2: entry.text },
      });
      localStorage.setItem(`${district}-sessions`, JSON.stringify(sessions));

      // mark entry as sent in log
      entry.district      = district;
      entry.districtLabel = TRAIN_DISTRICT_LABELS[district];
      localStorage.setItem('train-log', JSON.stringify(log));

      // train achievements on board send too
      if (typeof unlockAchievement === 'function') {
        unlockAchievement('sent-first-train');
        if (log.length >= 5)  unlockAchievement('sent-5-trains');
        if (log.length >= 10) unlockAchievement('sent-10-trains');
        const sentDistricts = new Set(log.filter(e => e.district).map(e => e.district));
        if (TRAIN_DISTRICT_KEYS.every(d => sentDistricts.has(d))) unlockAchievement('train-to-all');
      }

      // remove board from map if no station entries remain
      const remaining = log.filter(e => !e.district);
      if (remaining.length === 0) {
        document.getElementById('train-board')?.remove();
      }

      showToast(`Sent to ${TRAIN_DISTRICT_LABELS[district]}`);
      openBoardOverlay();
    });
  });

  document.getElementById('board-close-btn').addEventListener('click', closeBoardOverlay);

document.getElementById('board-recall-btn').addEventListener('click', () => {
   closeBoardOverlay();
   document.getElementById('train-board')?.remove();
  trainVisible = false;
   // reuse the board's spot so the train appears in the same location
    if (boardPos) {
      trainPos = { ...boardPos };
      setTimeout(placeTrain, 400);
   } else {
    setTimeout(showTrain, 400);
  }
 });

function closeBoardOverlay() {
  document.getElementById('board-overlay')?.remove();
}
}
// train.js
// load after map.js in map.html
// initTrain() is called from map.js DOMContentLoaded


const TRAIN_SPOTS = [
  { x: 40,   y: 300, zIndex: 5 }, 
  { x: 850, y: 260, zIndex: 5 },  
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
let lastTrainSpot  = -1;
let selectedPrompt = null;


// init

function initTrain() {
  const states  = JSON.parse(localStorage.getItem('districtStates') || '{}');
  const anyDone = TRAIN_DISTRICT_KEYS.some(d =>
    states[d] === 'unlocked' ||
    JSON.parse(localStorage.getItem(d + '-sessions') || '[]').length > 0
  );
  if (!anyDone) return;

  // pick randomly between train and board on every visit
  const hasLog    = JSON.parse(localStorage.getItem('train-log') || '[]').length > 0;
  const showBoard = hasLog && Math.random() < 0.75;
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

  const el = document.createElement('div');
  el.id = 'train-on-map';
  el.style.cssText = `
    position: absolute;
    left: ${pos.x}px;
    top: ${pos.y}px;
    width: 200px;
    z-index: ${pos.zIndex ?? 50};
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
  const trainLog = JSON.parse(localStorage.getItem('train-log') || '[]');
  if (trainLog.length === 0) return;

  document.getElementById('train-board')?.remove();

  const md = document.querySelector('.map-districts');
  if (!md) return;

  const pos = pickSpot();

  const el = document.createElement('div');
  el.id = 'train-board';
  el.style.cssText = `
    position: absolute;
    left: ${pos.x}px;
    top: ${pos.y}px;
    width: 40px;
    z-index: ${pos.zIndex ?? 50};
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
            <option value="">Choose a district…</option>
            ${districtOptions}
          </select>
        </div>
        <div class="train-send-actions">
          <button class="train-cancel-btn mono" id="train-cancel-btn">Cancel</button>
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

  document.getElementById('train-send-btn').addEventListener('click', sendTrainThought);

  document.getElementById('train-board-link').addEventListener('click', () => {
    closeTrainOverlay();
    restoreTrainHit();
    openBoardOverlay();
  });
}

function closeTrainOverlay() {
  document.getElementById('train-overlay')?.remove();
}


// send thought

function sendTrainThought() {
  const text     = document.getElementById('train-textarea')?.value?.trim();
  const district = document.getElementById('train-district-select')?.value;

  if (!text) {
    const ta = document.getElementById('train-textarea');
    if (ta) { ta.style.borderColor = '#c0392b'; ta.focus(); }
    return;
  }
  if (!district) {
    const sel = document.getElementById('train-district-select');
    if (sel) { sel.style.borderColor = '#c0392b'; sel.focus(); }
    return;
  }

  const sessions  = JSON.parse(localStorage.getItem(`${district}-sessions`) || '[]');
  const now       = new Date();
  const dateStr   = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const timestamp = now.getTime();

  sessions.push({
    date: dateStr, timestamp, isTrainThought: true,
    answers: { 0: 'Train Thoughts', 1: selectedPrompt || '', 2: text },
  });
  localStorage.setItem(`${district}-sessions`, JSON.stringify(sessions));

  const log = JSON.parse(localStorage.getItem('train-log') || '[]');
  log.push({ district, districtLabel: TRAIN_DISTRICT_LABELS[district], prompt: selectedPrompt || '', text, date: dateStr, timestamp });
  localStorage.setItem('train-log', JSON.stringify(log));

  closeTrainOverlay();
  removeTrain();
  if (!document.getElementById('train-board')) renderTrainBoard();

  const toast = document.createElement('div');
  toast.className = 'train-toast mono';
  toast.textContent = `Sent to ${TRAIN_DISTRICT_LABELS[district]}`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 2400);
}


// board overlay

function openBoardOverlay() {
  document.getElementById('board-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'board-overlay';
  overlay.className = 'overlay board-overlay';
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBoardOverlay(); });

  const log = JSON.parse(localStorage.getItem('train-log') || '[]');
  const logHTML = log.length === 0
    ? '<p class="train-board-empty mono">No train thoughts yet.</p>'
    : [...log].reverse().map(entry => `
        <div class="train-log-entry">
          <div class="train-log-meta mono">
            <span>${entry.date}</span>
            <span class="train-log-district">${entry.districtLabel}</span>
            <button class="train-log-delete" data-ts="${entry.timestamp}" title="Delete" aria-label="Delete entry">
  <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3.5h11M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M2 3.5l.75 8a.5.5 0 0 0 .5.5h6.5a.5.5 0 0 0 .5-.5L11 3.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
    <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
  </svg>
</button>
          </div>
          ${entry.prompt ? `<p class="train-log-prompt mono">${entry.prompt}</p>` : ''}
          <p class="train-log-text">${entry.text}</p>
        </div>
      `).join('');

  overlay.innerHTML = `
    <div class="overlay-content board-overlay-content">
      <div class="board-overlay-header">
        <h2 class="board-overlay-title">Train Board</h2>
        <p class="board-overlay-subtitle mono">Fleeting thoughts you sent before they passed.</p>
      </div>
      <div class="board-log" id="board-log">${logHTML}</div>
      <div class="board-overlay-footer">
        <button class="overlay-btn mono" id="board-recall-btn">Call the Train →</button>
        <button class="overlay-btn mono primary" id="board-close-btn">Close</button>
      </div>
    </div>
  `;

  overlay.classList.add('active');

  overlay.querySelectorAll('.train-log-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ts      = parseInt(btn.dataset.ts);
      const updated = JSON.parse(localStorage.getItem('train-log') || '[]')
        .filter(entry => entry.timestamp !== ts);
      localStorage.setItem('train-log', JSON.stringify(updated));
      openBoardOverlay();
    });
  });

  document.getElementById('board-close-btn').addEventListener('click', closeBoardOverlay);

  document.getElementById('board-recall-btn').addEventListener('click', () => {
    closeBoardOverlay();
    document.getElementById('train-board')?.remove();
    trainVisible = false;
    setTimeout(showTrain, 400);
  });
}

function closeBoardOverlay() {
  document.getElementById('board-overlay')?.remove();
}
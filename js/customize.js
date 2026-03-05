// customize.js

// detect district from URL path
const getCurrentDistrict = () => {
  const path = window.location.pathname;
  if (path.includes('shrine'))      return 'shrine';
  if (path.includes('garden'))      return 'garden';
  if (path.includes('cornerstore')) return 'cornerstore';
  if (path.includes('tower'))       return 'tower';
  if (path.includes('plaza'))       return 'plaza';
  return 'shrine';
};

const CURRENT_DISTRICT = getCurrentDistrict();

const DISTRICT_CONFIG = {
  shrine: {
    displayName: 'The Shrine',
    emotion: 'Reverence',
    questions: [
      "What place comes to mind?",
      "What did this place hold that was precious to you?",
      "How do you return to this place?",
      "When you think of this place, what do you remember?",
      "If this place were to fade from memory completely, what would be lost?",
      "Finally, give your shrine a name."
    ],
    color: '#DD6204'
  },
  garden: {
    displayName: 'The Garden',
    emotion: 'Growth',
    questions: [
      "What place comes to mind?",
      "What were you becoming in this place?",
      "How did the growth happen? What did it feel like?",
      "When you think of this place, what do you remember?",
      "If this place were to fade from memory completely, what would be lost?",
      "Finally, please give your garden a name."
    ],
    color: '#6A6405'
  },
  cornerstore: {
    displayName: 'The Cornerstore',
    emotion: 'Comfort',
    questions: [
      "What place comes to mind?",
      "What was your routine in this place?",
      "What drew you to this specific place?",
      "When you think of this place, what do you remember?",
      "If this place were to fade from memory completely, what would be lost?",
      "Finally, please give your cornerstore a name."
    ],
    color: '#D05038'
  },
  tower: {
    displayName: 'The Tower',
    emotion: 'Perspective',
    questions: [
      "What place comes to mind?",
      "What was your relationship with solitude in this space?",
      "What perspective did being alone give you?",
      "When you think of this place, what do you remember?",
      "If this place were to fade from memory completely, what would be lost?",
      "Finally, please give your tower a name."
    ],
    color: '#205A97'
  },
  plaza: {
    displayName: 'The Plaza',
    emotion: 'Belonging',
    questions: [
      "What place comes to mind?",
      "Who else was in this place? How did you connect with them?",
      "What brought you together in this place?",
      "When you think of this place, what do you remember?",
      "If this place were to fade from memory completely, what would be lost?",
      "Finally, please give your plaza a name."
    ],
    color: '#614973'
  }
};

const STOPWORDS = new Set([
  'i','me','my','we','our','you','your','it','its','the','a','an',
  'and','or','but','in','on','at','to','for','of','with','this',
  'that','was','is','are','were','be','been','have','had','has',
  'do','did','would','could','there','they','them','what','when',
  'where','how','so','if','as','by','from','not','no','just',
  'about','up','out','like','than','more','can','will','one','all',
  'also','into','who','which','their','his','her','he','she',
  'place','feel','felt','think','thought','remember','know','still',
  'even','very','much','many','some','any','time','way'
]);

function extractKeywords(text, topN = 8) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

const config   = DISTRICT_CONFIG[CURRENT_DISTRICT];
const QUESTIONS = config.questions;

let districtData = {};
let sessions     = [];
let currentSkin  = 0;
let graphSketch  = null;
let isGraphMode  = false;

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderUI();
  setupListeners();
  loadMedia();
  initMediaListeners();
  // illustration zoom
const previewImg = document.getElementById('district-preview-img');

const overlayEl = document.createElement('div');
overlayEl.className = 'illustration-overlay';
const overlayBox = document.createElement('div');
overlayBox.className = 'illustration-overlay-box';
const overlayImg = document.createElement('img');
overlayBox.appendChild(overlayImg);
overlayEl.appendChild(overlayBox);
document.body.appendChild(overlayEl);

document.querySelector('.district-image-container').addEventListener('click', () => {
  overlayImg.src = previewImg.src;
  overlayEl.classList.add('active');
});

overlayEl.addEventListener('click', () => {
  overlayEl.classList.remove('active');
});
});


// ─── DATA ───────────────────────────────────────────────────────────────────

function loadData() {
  const rawAnswers = JSON.parse(localStorage.getItem(`${CURRENT_DISTRICT}-answers`) || '{}');
  districtData = {
    name:     localStorage.getItem(`${CURRENT_DISTRICT}-name`) || config.displayName,
    location: rawAnswers[0] || '—',
    date:     localStorage.getItem(`${CURRENT_DISTRICT}-date`) || new Date().toLocaleDateString('en-US'),
    answers:  rawAnswers
  };
  sessions = JSON.parse(localStorage.getItem(`${CURRENT_DISTRICT}-sessions`) || '[]');
  // backfill first session if missing
  if (sessions.length === 0 && Object.keys(rawAnswers).length > 0) {
    sessions.push({ date: districtData.date, timestamp: Date.now(), answers: { ...rawAnswers } });
    localStorage.setItem(`${CURRENT_DISTRICT}-sessions`, JSON.stringify(sessions));
  }
  currentSkin = parseInt(localStorage.getItem(`${CURRENT_DISTRICT}-skin`) || '0');
}


// ─── RENDER ──────────────────────────────────────────────────────────────────

function renderUI() {
  const titleEl = document.getElementById('district-title');
  if (titleEl) titleEl.textContent = districtData.name;
  const dateEl = document.getElementById('district-date');
  if (dateEl) dateEl.textContent = `Edited: ${districtData.date}`;
  // show most recent place name in the subheader
  const locationEl = document.getElementById('location-value');
  if (locationEl) {
    const latest = [...sessions].sort((a, b) => b.timestamp - a.timestamp)[0];
    locationEl.textContent = latest?.answers[0] || '—';
  }
  updateSkinDisplay();
  renderJournalEntries();
}

function updateSkinDisplay() {
  const skins = [
    `${CURRENT_DISTRICT}-unlocked`,
    `${CURRENT_DISTRICT}-skin2`,
    `${CURRENT_DISTRICT}-skin3`
  ];
  const src     = `../assets/districts/${skins[currentSkin]}.png`;
  const preview = document.getElementById('district-preview-img');
  if (preview) preview.src = src;

  document.querySelectorAll('.skin-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === currentSkin);
    const img = thumb.querySelector('img');
    if (img) img.src = `../assets/districts/${skins[i]}.png`;
  });
}

function renderJournalEntries() {
  const container = document.getElementById('journal-entries');
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = '<p class="mono" style="opacity:0.4;padding:1rem 0;">No entries yet.</p>';
    return;
  }

  // group sessions by place name (answer to question 0)
  const groups = new Map();
  [...sessions].sort((a, b) => b.timestamp - a.timestamp).forEach(session => {
    const place = session.answers[0] || '—';
    if (!groups.has(place)) groups.set(place, []);
    groups.get(place).push(session);
  });

  container.innerHTML = '';

  groups.forEach((groupSessions, place) => {
    const group = document.createElement('div');
    group.className = 'journal-location-group';

    const heading = document.createElement('div');
    heading.className = 'journal-location-heading mono';
    heading.textContent = place;
    group.appendChild(heading);

    groupSessions.forEach(session => {
      const entry = document.createElement('div');
      entry.className = 'journal-entry';
      entry.innerHTML = `
        <div class="journal-entry-header">
          <span class="journal-entry-date mono">${session.date}</span>
          <div class="journal-entry-meta">
            <button class="delete-entry-btn mono" data-ts="${session.timestamp}">delete</button>
            <span class="journal-entry-chevron">∨</span>
          </div>
        </div>
        <div class="journal-entry-body">
          ${Object.entries(session.answers).map(([i, a]) => `
            <div class="journal-qa">
              <span class="journal-question">${QUESTIONS[i] || ''}</span>
              <span class="journal-answer">${a || '—'}</span>
            </div>
          `).join('')}
        </div>
      `;

      entry.querySelector('.journal-entry-header').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-entry-btn')) return;
        entry.classList.toggle('open');
      });

      entry.querySelector('.delete-entry-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const ts = parseInt(e.target.dataset.ts);
        sessions = sessions.filter(s => s.timestamp !== ts);
        localStorage.setItem(`${CURRENT_DISTRICT}-sessions`, JSON.stringify(sessions));
        renderJournalEntries();
      });

      group.appendChild(entry);
    });

    container.appendChild(group);
  });
}


// ─── LISTENERS ───────────────────────────────────────────────────────────────

function setupListeners() {

  // inline name editing — click cell to edit, Enter/blur to save, Escape to cancel
  const titleCell  = document.getElementById('title-cell');
  const titleEl    = document.getElementById('district-title');
  const titleInput = document.getElementById('district-title-input');

  if (titleCell && titleEl && titleInput) {
    titleCell.addEventListener('click', () => {
      if (!titleInput.classList.contains('hidden')) return; // already editing
      titleInput.value = districtData.name;
      titleEl.classList.add('hidden');
      titleInput.classList.remove('hidden');
      titleInput.focus();
      titleInput.select();
    });

    titleInput.addEventListener('blur', () => commitName());

    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); titleInput.blur(); }
      if (e.key === 'Escape') { titleInput.value = districtData.name; titleInput.blur(); }
    });
  }

  function commitName() {
    const newName = titleInput.value.trim();
    if (newName) {
      districtData.name = newName;
      localStorage.setItem(`${CURRENT_DISTRICT}-name`, newName);
    }
    titleEl.textContent  = districtData.name;
    titleEl.classList.remove('hidden');
    titleInput.classList.add('hidden');
  }

  // save button (sidebar)
  document.getElementById('save-btn')?.addEventListener('click', () => {
    localStorage.setItem(`${CURRENT_DISTRICT}-skin`, currentSkin);
    const btn = document.getElementById('save-btn');
    const prev = btn.textContent;
    btn.textContent = 'Saved';
    setTimeout(() => { btn.textContent = prev; }, 1500);
  });

  // log again
  document.getElementById('redo-btn')?.addEventListener('click', openRelogOverlay);

  // skins
  document.querySelectorAll('.skin-thumb').forEach(t => {
    t.addEventListener('click', () => {
      currentSkin = parseInt(t.dataset.skin);
      updateSkinDisplay();
    });
  });

  // view toggle
  document.getElementById('journal-toggle')?.addEventListener('click', switchToJournal);
  document.getElementById('graph-toggle')?.addEventListener('click', switchToGraph);
}


// ─── VIEW SWITCHING ───────────────────────────────────────────────────────────

function switchToJournal() {
  isGraphMode = false;
  document.getElementById('journal-toggle').classList.add('active');
  document.getElementById('graph-toggle').classList.remove('active');
  document.getElementById('journal-view').classList.remove('hidden');
  document.getElementById('graph-view').classList.add('hidden');
  if (graphSketch) { graphSketch.remove(); graphSketch = null; }
}

function switchToGraph() {
  isGraphMode = true;
  document.getElementById('graph-toggle').classList.add('active');
  document.getElementById('journal-toggle').classList.remove('active');
  document.getElementById('journal-view').classList.add('hidden');
  document.getElementById('graph-view').classList.remove('hidden');
  setTimeout(initGraph, 100);
}


// ─── CONSTELLATION ────────────────────────────────────────────────────────────

function initGraph() {
  const container = document.getElementById('p5-canvas-container');
  if (!container) return;
  if (graphSketch) { graphSketch.remove(); graphSketch = null; }

  // create info panel inside the graph view
  let infoPanel = document.getElementById('constellation-panel');
  if (!infoPanel) {
    infoPanel = document.createElement('div');
    infoPanel.id = 'constellation-panel';
    document.getElementById('graph-view').appendChild(infoPanel);
  }

  const mergedAnswers = sessions.reduce((acc, s) => {
  Object.entries(s.answers).forEach(([k, v]) => {
    acc[k] = acc[k] ? acc[k] + ' ' + v : v;
  });
  return acc;
}, {});
const allText = Object.entries(mergedAnswers)
  .filter(([i]) => parseInt(i) !== 5)
  .map(([, v]) => v).join(' ');
const keywords = extractKeywords(allText, 18);
  if (keywords.length === 0) return;

  const nodes = keywords.map(k => ({
    ...k,
    x: 0, y: 0, vx: 0, vy: 0
  }));

  const blue = getComputedStyle(document.body).getPropertyValue('--blue').trim() || '#0A059B';
  const bg   = getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#F7F2F1';
  const PAD_X = 10, PAD_Y = 6;
  let selectedIdx = null;

  graphSketch = new p5((sk) => {
    let W, H, frame = 0;

    sk.setup = () => {
      W = container.offsetWidth || 800;
      H = container.offsetHeight || 500;
      sk.createCanvas(W, H).parent('p5-canvas-container');
      sk.textFont('monospace');
      nodes.forEach(n => {
        n.x = W * 0.1 + Math.random() * W * 0.8;
        n.y = H * 0.1 + Math.random() * H * 0.8;
        n.vx = 0; n.vy = 0;
      });
    };

    sk.draw = () => {
      sk.background(bg);
      frame++;
      const damping = Math.min(0.85 + frame * 0.001, 0.94);

      // repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
          const f = 4000 / (d * d);
          a.vx -= (dx/d)*f; a.vy -= (dy/d)*f;
          b.vx += (dx/d)*f; b.vy += (dy/d)*f;
        }
      }

      // center gravity
      nodes.forEach(n => {
        n.vx += (W * 0.5 - n.x) * 0.012;
        n.vy += (H * 0.5 - n.y) * 0.012;
        n.vx *= damping; n.vy *= damping;
        n.x = Math.max(60, Math.min(W - 60, n.x + n.vx));
        n.y = Math.max(30, Math.min(H - 30, n.y + n.vy));
      });

      // draw nodes
      nodes.forEach((n, idx) => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw  = sk.textWidth(n.word);
        const rw  = tw + PAD_X * 2;
        const rh  = fontSize + PAD_Y * 2;
        const isSelected = selectedIdx === idx;
        const isHovered  = sk.mouseX > n.x - rw/2 && sk.mouseX < n.x + rw/2 &&
                           sk.mouseY > n.y - rh/2 && sk.mouseY < n.y + rh/2;

        sk.noStroke();
        if (isSelected) {
          sk.fill(blue + '22');
          sk.rect(n.x - rw/2 - 4, n.y - rh/2 - 4, rw + 8, rh + 8);
        }
        sk.fill(isSelected || isHovered ? blue : blue + 'BB');
        sk.rect(n.x - rw/2, n.y - rh/2, rw, rh);
        sk.fill(bg);
        sk.textAlign(sk.CENTER, sk.CENTER);
        sk.text(n.word, n.x, n.y);
      });
    };

    sk.mousePressed = () => {
      let hit = null;
      nodes.forEach((n, idx) => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2, rh = fontSize + PAD_Y * 2;
        if (sk.mouseX > n.x - rw/2 && sk.mouseX < n.x + rw/2 &&
            sk.mouseY > n.y - rh/2 && sk.mouseY < n.y + rh/2) hit = idx;
      });
      if (hit !== null) {
        selectedIdx = hit;
        showInfoPanel(nodes[hit]);
      } else {
        selectedIdx = null;
        hideInfoPanel();
      }
    };

    sk.mouseMoved = () => {
      let onNode = false;
      nodes.forEach(n => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2, rh = fontSize + PAD_Y * 2;
        if (sk.mouseX > n.x - rw/2 && sk.mouseX < n.x + rw/2 &&
            sk.mouseY > n.y - rh/2 && sk.mouseY < n.y + rh/2) onNode = true;
      });
      container.style.cursor = onNode ? 'pointer' : 'default';
    };

    sk.windowResized = () => {
      W = container.offsetWidth || 800;
      H = container.offsetHeight || 500;
      sk.resizeCanvas(W, H);
    };
  }, container);
}

function showInfoPanel(node) {
  const panel = document.getElementById('constellation-panel');
  if (!panel) return;

  // find which question(s) this word appears in
const contexts = [];
sessions.forEach(session => {
  Object.entries(session.answers).forEach(([qi, answer]) => {
    if (!answer || parseInt(qi) === 5) return;
    if (answer.toLowerCase().includes(node.word)) {
      const q = QUESTIONS[parseInt(qi)] || '';
      const snippet = answer.length > 120 ? answer.slice(0, 120) + '…' : answer;
      // include the date so overlapping entries are distinguishable
      contexts.push({ question: `${session.date} · ${q}`, snippet });
    }
  });
});

  panel.innerHTML = `
    <div style="font-family:var(--font-meta);font-size:1.05rem;color:var(--blue);
                border-bottom:1px solid var(--blue);padding-bottom:0.5rem;margin-bottom:0.75rem;">
      ${node.word}
    </div>
    ${contexts.map(c => `
      <div style="margin-bottom:0.75rem;">
        <div style="font-size:0.72rem;opacity:0.5;margin-bottom:0.25rem;">${c.question}</div>
        <div style="font-family:var(--font-meta);font-size:0.88rem;line-height:1.65;">${c.snippet}</div>
      </div>
    `).join('') || '<div style="opacity:0.4;font-size:0.8rem;">No context found.</div>'}
  `;
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'all';
}

function hideInfoPanel() {
  const panel = document.getElementById('constellation-panel');
  if (panel) { panel.style.opacity = '0'; panel.style.pointerEvents = 'none'; }
}

// ─── RELOG OVERLAY ────────────────────────────────────────────────────────────

function openRelogOverlay() {
  // collect unique place names from all sessions (answer to question 0)
  const locations = [...new Map(
    sessions
      .filter(s => s.answers[0])
      .map(s => [s.answers[0], s.answers[0]])
  ).values()];

  // inject overlay if not present
  if (!document.getElementById('relog-overlay')) {
    const el = document.createElement('div');
    el.id = 'relog-overlay';
    el.className = 'relog-overlay';
    el.innerHTML = `
      <div class="relog-overlay-content">
        <p class="relog-overlay-title">Start a new log entry? Your previous entries will be kept.</p>
        <button class="relog-new-btn mono" id="relog-new-btn">Log a new location →</button>
        <div class="relog-existing-row">
          <div style="flex:1">
            <p class="relog-existing-label">Add to existing location</p>
            <div style="display:flex;gap:0.75rem">
              <select class="relog-existing-select" id="relog-existing-select">
                <option value="">Select a location…</option>
                ${locations.map(l => `<option value="${l}">${l}</option>`).join('')}
              </select>
              <button class="relog-go-btn mono" id="relog-go-btn">Go →</button>
            </div>
          </div>
        </div>
        <button class="relog-cancel-btn mono" id="relog-cancel-btn">cancel</button>
      </div>
    `;
    document.body.appendChild(el);

    document.getElementById('relog-new-btn').addEventListener('click', () => {
      closeRelogOverlay();
      localStorage.removeItem(`${CURRENT_DISTRICT}-answers`);
      localStorage.removeItem(`${CURRENT_DISTRICT}-relog-prefill`);
      window.location.href = `${CURRENT_DISTRICT}.html`;
    });

    document.getElementById('relog-go-btn').addEventListener('click', () => {
      const selected = document.getElementById('relog-existing-select').value;
      if (!selected) return;
      closeRelogOverlay();
      localStorage.removeItem(`${CURRENT_DISTRICT}-answers`);
      // store the pre-fill so the district page can skip question 0
      localStorage.setItem(`${CURRENT_DISTRICT}-relog-prefill`, selected);
      window.location.href = `${CURRENT_DISTRICT}.html`;
    });

    document.getElementById('relog-cancel-btn').addEventListener('click', closeRelogOverlay);
    el.addEventListener('click', e => { if (e.target.id === 'relog-overlay') closeRelogOverlay(); });
  }

  requestAnimationFrame(() => {
    document.getElementById('relog-overlay').classList.add('active');
  });
}

function closeRelogOverlay() {
  document.getElementById('relog-overlay')?.classList.remove('active');
}

// ─── media (photo + music) ────────────────────────────────────────────────────

function loadMedia() {
  const savedPhoto = localStorage.getItem(`${CURRENT_DISTRICT}-photo`);
  const photoVisible = localStorage.getItem(`${CURRENT_DISTRICT}-photo-visible`) === 'true';
  updatePhotoPreview(savedPhoto);
  updatePhotoToggle(photoVisible);
  const savedMusicName = localStorage.getItem(`${CURRENT_DISTRICT}-music-name`);
  updateMusicPreview(savedMusicName);
}

function updatePhotoPreview(dataUrl) {
  const preview     = document.getElementById('media-photo-preview');
  const placeholder = document.getElementById('media-photo-placeholder');
  const removeBtn   = document.getElementById('media-photo-remove');
  const toggleRow   = document.getElementById('media-photo-toggle-row');
  if (!preview) return;
  if (dataUrl) {
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
    if (removeBtn)   removeBtn.classList.remove('hidden');
    if (toggleRow)   toggleRow.classList.remove('hidden');
  } else {
    preview.src = '';
    preview.classList.add('hidden');
    if (placeholder) placeholder.classList.remove('hidden');
    if (removeBtn)   removeBtn.classList.add('hidden');
    if (toggleRow)   toggleRow.classList.add('hidden');
  }
}

function updatePhotoToggle(isVisible) {
  const track = document.getElementById('media-photo-track');
  if (track) track.classList.toggle('on', isVisible);
}

function updateMusicPreview(name) {
  const label     = document.getElementById('media-music-name');
  const removeBtn = document.getElementById('media-music-remove');
  if (!label) return;
  if (name) {
    label.textContent = name;
    label.classList.remove('hidden');
    if (removeBtn) removeBtn.classList.remove('hidden');
  } else {
    label.textContent = '';
    label.classList.add('hidden');
    if (removeBtn) removeBtn.classList.add('hidden');
  }
}

function initMediaListeners() {
  const photoInput     = document.getElementById('media-photo-input');
  const photoUploadBtn = document.getElementById('media-photo-upload-btn');
  if (photoUploadBtn) photoUploadBtn.addEventListener('click', () => photoInput?.click());

  if (photoInput) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        localStorage.setItem(`${CURRENT_DISTRICT}-photo`, e.target.result);
        updatePhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      photoInput.value = '';
    });
  }

  document.getElementById('media-photo-remove')?.addEventListener('click', () => {
    localStorage.removeItem(`${CURRENT_DISTRICT}-photo`);
    localStorage.removeItem(`${CURRENT_DISTRICT}-photo-visible`);
    updatePhotoPreview(null);
    updatePhotoToggle(false);
  });

  document.getElementById('media-photo-toggle-cell')?.addEventListener('click', () => {
    const current = localStorage.getItem(`${CURRENT_DISTRICT}-photo-visible`) === 'true';
    const next = !current;
    localStorage.setItem(`${CURRENT_DISTRICT}-photo-visible`, next);
    updatePhotoToggle(next);
  });

  const musicInput     = document.getElementById('media-music-input');
  const musicUploadBtn = document.getElementById('media-music-upload-btn');
  if (musicUploadBtn) musicUploadBtn.addEventListener('click', () => musicInput?.click());

  if (musicInput) {
    musicInput.addEventListener('change', () => {
      const file = musicInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        localStorage.setItem(`${CURRENT_DISTRICT}-music`, e.target.result);
        localStorage.setItem(`${CURRENT_DISTRICT}-music-name`, file.name);
        updateMusicPreview(file.name);
      };
      reader.readAsDataURL(file);
      musicInput.value = '';
    });
  }

  document.getElementById('media-music-remove')?.addEventListener('click', () => {
    localStorage.removeItem(`${CURRENT_DISTRICT}-music`);
    localStorage.removeItem(`${CURRENT_DISTRICT}-music-name`);
    updateMusicPreview(null);
  });
}
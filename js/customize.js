// Detect current district from URL
const getCurrentDistrict = () => {
  const path = window.location.pathname;
  if (path.includes('shrine')) return 'shrine';
  if (path.includes('garden')) return 'garden';
  if (path.includes('cornerstore')) return 'cornerstore';
  if (path.includes('tower')) return 'tower';
  if (path.includes('plaza')) return 'plaza';
  return 'shrine';
};

const CURRENT_DISTRICT = getCurrentDistrict();

// District configurations
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

// keywords
const STOPWORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'the', 'a', 'an',
  'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'this',
  'that', 'was', 'is', 'are', 'were', 'be', 'been', 'have', 'had', 'has',
  'do', 'did', 'would', 'could', 'there', 'they', 'them', 'what', 'when',
  'where', 'how', 'so', 'if', 'as', 'by', 'from', 'not', 'no', 'just',
  'about', 'up', 'out', 'like', 'than', 'more', 'can', 'will', 'one', 'all',
  'also', 'into', 'who', 'which', 'their', 'its', 'his', 'her', 'he', 'she',
  'place', 'feel', 'felt', 'think', 'thought', 'remember', 'know', 'still',
  'even', 'very', 'much', 'many', 'some', 'any', 'time', 'way'
]);

function extractKeywords(text, topN = 8) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')   // strip punctuation
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));

  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

const config = DISTRICT_CONFIG[CURRENT_DISTRICT];
const QUESTIONS = config.questions;

let districtData = {};
let sessions = [];
let currentSkin = 0;
let graphSketch = null;
let isGraphMode = false;

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderUI();
  setupListeners();
});

function loadData() {
  const rawAnswers = JSON.parse(localStorage.getItem(`${CURRENT_DISTRICT}-answers`) || '{}');
  districtData = {
    name: localStorage.getItem(`${CURRENT_DISTRICT}-name`) || config.displayName,
    location: rawAnswers[0] || '—',
    date: localStorage.getItem(`${CURRENT_DISTRICT}-date`) || new Date().toLocaleDateString('en-US'),
    answers: rawAnswers
  };
  sessions = JSON.parse(localStorage.getItem(`${CURRENT_DISTRICT}-sessions`) || '[]');
  if (sessions.length === 0 && Object.keys(rawAnswers).length > 0) {
    sessions.push({ date: districtData.date, timestamp: Date.now(), answers: { ...rawAnswers } });
    localStorage.setItem(`${CURRENT_DISTRICT}-sessions`, JSON.stringify(sessions));
  }
  currentSkin = parseInt(localStorage.getItem(`${CURRENT_DISTRICT}-skin`) || '0');
}

function renderUI() {
  document.getElementById('district-title').textContent = districtData.name;
  document.getElementById('location-value').textContent = districtData.location;
  document.getElementById('district-date').textContent = `Date Last Edited: ${districtData.date}`;
  document.getElementById('drawer-district-name').textContent = districtData.location;
  document.getElementById('drawer-date').textContent = `Date Last Edited: ${districtData.date}`;
  updateSkinDisplay();
  renderJournalEntries();
}

function updateSkinDisplay() {
  const skins = [`${CURRENT_DISTRICT}-unlocked`, `${CURRENT_DISTRICT}-skin2`, `${CURRENT_DISTRICT}-skin3`];
  const src = `../assets/districts/${skins[currentSkin]}.png`;
  const preview = document.getElementById('district-preview-img');
  if (preview) preview.src = src;
  const drawerPreview = document.getElementById('drawer-preview-img');
  if (drawerPreview) drawerPreview.src = src;
  document.querySelectorAll('.skin-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === currentSkin);
    const img = thumb.querySelector('img');
    if (img) img.src = `../assets/districts/${skins[i]}.png`;
  });
}

function renderJournalEntries() {
  const container = document.getElementById('journal-entries');
  if (sessions.length === 0) {
    container.innerHTML = '<p class="mono" style="opacity:0.5;padding:1rem">No entries yet.</p>';
    return;
  }
  container.innerHTML = '';
  [...sessions].sort((a, b) => b.timestamp - a.timestamp).forEach(session => {
    const entry = document.createElement('div');
    entry.className = 'journal-entry';
    entry.innerHTML = `
      <div class="journal-entry-header">
        <span class="journal-entry-date mono">${session.date}</span>
        <span class="journal-entry-chevron">∨</span>
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
    entry.querySelector('.journal-entry-header').onclick = () => entry.classList.toggle('open');
    container.appendChild(entry);
  });
}

function setupListeners() {
  document.getElementById('back-btn').onclick = () => window.location.href = '../map.html';
  document.getElementById('journal-toggle').onclick = switchToJournal;
  document.getElementById('graph-toggle').onclick = switchToGraph;
  document.getElementById('save-btn').onclick = () => {
    localStorage.setItem(`${CURRENT_DISTRICT}-skin`, currentSkin);
    alert('Saved!');
  };
  document.getElementById('edit-name-btn').onclick = () => {
    document.getElementById('new-name-input').value = districtData.name;
    document.getElementById('edit-name-overlay').classList.add('active');
  };
  document.getElementById('cancel-rename-btn').onclick = () => {
    document.getElementById('edit-name-overlay').classList.remove('active');
  };
  document.getElementById('save-rename-btn').onclick = () => {
    const n = document.getElementById('new-name-input').value.trim();
    if (n) {
      districtData.name = n;
      localStorage.setItem(`${CURRENT_DISTRICT}-name`, n);
      document.getElementById('district-title').textContent = n;
      document.getElementById('edit-name-overlay').classList.remove('active');
    }
  };
  document.getElementById('redo-btn').onclick = () => {
    if (confirm('Reset and restart?')) {
      localStorage.removeItem(`${CURRENT_DISTRICT}-answers`);
      localStorage.removeItem(`${CURRENT_DISTRICT}-name`);
      const ds = JSON.parse(localStorage.getItem('districtStates') || '{}');
      ds[CURRENT_DISTRICT] = 'locked';
      localStorage.setItem('districtStates', JSON.stringify(ds));
      window.location.href = `${CURRENT_DISTRICT}.html`;
    }
  };
  document.querySelectorAll('.skin-thumb').forEach(t => {
    t.onclick = () => { currentSkin = parseInt(t.dataset.skin); updateSkinDisplay(); };
  });
  document.getElementById('drawer-tab').onclick = () => document.getElementById('side-drawer').classList.toggle('open');
  document.addEventListener('mousemove', (e) => {
    if (!isGraphMode) return;
    const d = document.getElementById('side-drawer');
    if (e.clientX < 20) d.classList.add('open');
    else if (e.clientX > 320) d.classList.remove('open');
  });
}

function switchToJournal() {
  isGraphMode = false;
  document.getElementById('journal-toggle').classList.add('active');
  document.getElementById('graph-toggle').classList.remove('active');
  document.getElementById('journal-view').classList.remove('hidden');
  document.getElementById('graph-view').classList.add('hidden');
  document.getElementById('customize-layout').classList.remove('graph-mode');
  document.getElementById('side-drawer').style.display = 'none';
  if (graphSketch) { graphSketch.remove(); graphSketch = null; }
}

function switchToGraph() {
  isGraphMode = true;
  document.getElementById('graph-toggle').classList.add('active');
  document.getElementById('journal-toggle').classList.remove('active');
  document.getElementById('journal-view').classList.add('hidden');
  document.getElementById('graph-view').classList.remove('hidden');
  document.getElementById('customize-layout').classList.add('graph-mode');
  document.getElementById('side-drawer').style.display = 'flex';
  setTimeout(initGraph, 500);
}

function initGraph() {
  const container = document.getElementById('p5-canvas-container');
  if (!container) return;
  if (graphSketch) { graphSketch.remove(); graphSketch = null; }

  // Create info panel if it doesn't exist
  let infoPanel = document.getElementById('constellation-panel');
  if (!infoPanel) {
    infoPanel = document.createElement('div');
    infoPanel.id = 'constellation-panel';
    infoPanel.style.cssText = `
      position: absolute;
      right: 2rem;
      top: 2rem;
      width: 260px;
      background: white;
      border: 1px solid #101010;
      padding: 1.5rem;
      font-family: monospace;
      font-size: 0.85rem;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
      line-height: 1.6;
      z-index: 10;
    `;
    document.getElementById('graph-view').appendChild(infoPanel);
  }

  const nodes = [];
  const latestSession = sessions[sessions.length - 1];

  if (!latestSession) {
    container.innerHTML = '<p class="mono" style="opacity:0.5;padding:2rem">Complete the flow to see your constellation.</p>';
    return;
  }

  // Extract keywords and track which questions they appear in
  const allText = Object.values(latestSession.answers).join(' ');
  const topKeywords = extractKeywords(allText, 12);

  // For each keyword, find all questions it appears in
  const keywordSources = {};
  topKeywords.forEach(({ word }) => {
    keywordSources[word] = [];
    Object.entries(latestSession.answers).forEach(([i, answer]) => {
      if (parseInt(i) === 5) return; // skip naming question
      if (answer.toLowerCase().includes(word)) {
        keywordSources[word].push({
          question: QUESTIONS[i],
          snippet: answer.length > 100 ? answer.slice(0, 100) + '…' : answer
        });
      }
    });
  });

  topKeywords.forEach(({ word, count }) => {
    nodes.push({
      id: `k-${word}`,
      label: word,
      count,
      sources: keywordSources[word],
      x: 0, y: 0, vx: 0, vy: 0,
      settled: false
    });
  });

  graphSketch = new p5((sk) => {
    let W, H;
    let selectedNode = null;
    const COL = config.color;
    let frame = 0;

    sk.setup = () => {
      W = container.offsetWidth || 800;
      H = container.offsetHeight || 600;
      sk.createCanvas(W, H).parent('p5-canvas-container');
      sk.textFont('monospace');

      // Start nodes scattered
      nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        n.x = W / 2 + Math.cos(angle) * 200;
        n.y = H / 2 + Math.sin(angle) * 150;
      });
    };

    sk.draw = () => {
      sk.background('#F7F2F1');
      frame++;

      // Damping increases over time — nodes gradually settle
      const damping = frame < 180 ? 0.92 : 0.96 + Math.min((frame - 180) * 0.0002, 0.035);

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f = 2500 / (d * d);
          a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }

      // Gentle gravity to center
      nodes.forEach(n => {
        n.vx += (W / 2 - n.x) * 0.003;
        n.vy += (H / 2 - n.y) * 0.003;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      });

      // Draw nodes
      nodes.forEach(n => {
        const size = 28 + (n.count * 10);
        const isSelected = selectedNode === n;
        const isHovered = sk.dist(sk.mouseX, sk.mouseY, n.x, n.y) < size / 2;

        // Subtle pulse on selected node
        const pulse = isSelected ? Math.sin(frame * 0.05) * 3 : 0;

        sk.noStroke();
        if (isSelected) {
          // outer ring
          sk.fill(COL + '33');
          sk.circle(n.x, n.y, size + 16 + pulse);
        }

        sk.fill(isSelected ? '#101010' : isHovered ? COL : COL + 'CC');
        sk.circle(n.x, n.y, size + pulse);

        sk.fill('white');
        sk.textSize(n.count > 2 ? 11 : 9);
        sk.textAlign(sk.CENTER, sk.CENTER);
        sk.text(n.label, n.x, n.y);

        // Small dot indicator if word appears in multiple answers
        if (n.sources.length > 1) {
          sk.fill('white');
          sk.circle(n.x + size / 2 - 6, n.y - size / 2 + 6, 10);
          sk.fill(isSelected ? '#101010' : COL);
          sk.textSize(7);
          sk.text(n.sources.length, n.x + size / 2 - 6, n.y - size / 2 + 6);
        }
      });
    };

    sk.mousePressed = () => {
      let clicked = null;
      nodes.forEach(n => {
        const size = 28 + (n.count * 10);
        if (sk.dist(sk.mouseX, sk.mouseY, n.x, n.y) < size / 2) clicked = n;
      });

      if (clicked) {
        selectedNode = clicked;
        showInfoPanel(clicked, infoPanel);
      } else {
        selectedNode = null;
        infoPanel.style.opacity = '0';
        infoPanel.style.pointerEvents = 'none';
      }
    };

    // Cursor change on hover
    sk.mouseMoved = () => {
      let onNode = false;
      nodes.forEach(n => {
        const size = 28 + (n.count * 10);
        if (sk.dist(sk.mouseX, sk.mouseY, n.x, n.y) < size / 2) onNode = true;
      });
      container.style.cursor = onNode ? 'pointer' : 'default';
    };

  }, container);
}

function showInfoPanel(node, panel) {
  const appearsIn = node.sources.length === 0
    ? '<p style="opacity:0.5">No specific question found.</p>'
    : node.sources.map(s => `
        <div style="margin-bottom:1.2rem">
          <div style="opacity:0.5;margin-bottom:0.3rem;font-size:0.8rem">${s.question}</div>
          <div style="font-family:serif;font-size:0.9rem">${s.snippet}</div>
        </div>
      `).join('');

  panel.innerHTML = `
    <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
      <strong style="font-size:1rem">${node.label}</strong>
      <span style="opacity:0.4;font-size:0.75rem">${node.sources.length} answer${node.sources.length !== 1 ? 's' : ''}</span>
    </div>
    ${appearsIn}
  `;

  panel.style.opacity = '1';
  panel.style.pointerEvents = 'all';
}
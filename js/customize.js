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

const KEYWORD_CATEGORIES = {
  smell: ['smell', 'scent', 'aroma', 'fragrance'],
  sound: ['sound', 'noise', 'music', 'voice', 'silence'],
  feeling: ['feel', 'warm', 'cold', 'safe', 'happy', 'sad', 'love', 'comfort'],
  people: ['mother', 'father', 'family', 'friend', 'grandmother'],
  memory: ['remember', 'memory', 'forget', 'past', 'childhood'],
  place: ['kitchen', 'room', 'house', 'home', 'street', 'city']
};

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
  
  const nodes = [];
  const edges = [];
  const found = new Set();
  
  sessions.forEach((s, i) => {
    nodes.push({ id: `s${i}`, type: 'session', label: s.date, x: 0, y: 0, vx: 0, vy: 0 });
    const txt = Object.values(s.answers).join(' ').toLowerCase();
    Object.entries(KEYWORD_CATEGORIES).forEach(([cat, kws]) => {
      if (kws.some(k => txt.includes(k))) {
        const cid = `c-${cat}`;
        if (!found.has(cid)) {
          found.add(cid);
          nodes.push({ id: cid, type: 'concept', label: cat, x: 0, y: 0, vx: 0, vy: 0 });
        }
        edges.push({ source: `s${i}`, target: cid });
      }
    });
  });
  
  if (nodes.length === 0) {
    container.innerHTML = '<p class="mono" style="opacity:0.5;padding:2rem">Complete the flow to see your graph.</p>';
    return;
  }
  
  graphSketch = new p5((sk) => {
    let W, H;
    const COL = config.color;
    sk.setup = () => {
      W = container.offsetWidth;
      H = container.offsetHeight;
      sk.createCanvas(W, H).parent('p5-canvas-container');
      sk.textFont('monospace');
      nodes.forEach(n => { n.x = W/2 + (Math.random()-0.5)*400; n.y = H/2 + (Math.random()-0.5)*300; });
    };
    sk.draw = () => {
      sk.background('#F7F2F1');
      // Forces
      for (let i=0; i<nodes.length; i++) {
        for (let j=i+1; j<nodes.length; j++) {
          const a=nodes[i], b=nodes[j], dx=b.x-a.x, dy=b.y-a.y, d=Math.max(Math.sqrt(dx*dx+dy*dy),1), f=3000/(d*d);
          a.vx-=(dx/d)*f; a.vy-=(dy/d)*f; b.vx+=(dx/d)*f; b.vy+=(dy/d)*f;
        }
      }
      edges.forEach(e => {
        const s=nodes.find(n=>n.id===e.source), t=nodes.find(n=>n.id===e.target);
        if (s&&t) { const dx=t.x-s.x, dy=t.y-s.y; s.vx+=dx*0.05; s.vy+=dy*0.05; t.vx-=dx*0.05; t.vy-=dy*0.05; }
      });
      nodes.forEach(n => { n.vx+=(W/2-n.x)*0.01; n.vy+=(H/2-n.y)*0.01; n.vx*=0.85; n.vy*=0.85; n.x+=n.vx; n.y+=n.vy; });
      // Draw
      sk.strokeWeight(1); sk.stroke(16,16,16,60);
      edges.forEach(e => { const s=nodes.find(n=>n.id===e.source), t=nodes.find(n=>n.id===e.target); if(s&&t) sk.line(s.x,s.y,t.x,t.y); });
      nodes.forEach(n => {
        sk.noStroke();
        if (n.type==='session') { sk.fill(COL); sk.circle(n.x,n.y,44); }
        else { sk.fill('#101010'); sk.circle(n.x,n.y,26); }
        sk.fill('#101010'); sk.textSize(n.type==='session'?11:10); sk.textAlign(sk.CENTER,sk.TOP);
        sk.text(n.label,n.x,n.y+(n.type==='session'?26:17));
      });
    };
    let drag=null;
    sk.mousePressed=()=>nodes.forEach(n=>{if(sk.dist(sk.mouseX,sk.mouseY,n.x,n.y)<25)drag=n;});
    sk.mouseDragged=()=>{if(drag){drag.x=sk.mouseX;drag.y=sk.mouseY;drag.vx=drag.vy=0;}};
    sk.mouseReleased=()=>drag=null;
  }, container);
}
// District state management
const DISTRICTS = ['garden', 'cornerstore', 'shrine', 'tower', 'plaza'];

// City name management
function initCityName() {
  const savedName = localStorage.getItem('cityName') || 'Somewhere I Belong';
  const titleElement = document.getElementById('city-title');
  if (titleElement) titleElement.textContent = savedName;
}

function openCityNameOverlay() {
  const overlay = document.getElementById('city-name-overlay');
  const input = document.getElementById('city-name-input');
  const currentName = localStorage.getItem('cityName') || 'Somewhere I Belong';
  
  input.value = currentName;
  overlay.classList.add('active');
  input.focus();
  input.select();
}

function closeCityNameOverlay() {
  const overlay = document.getElementById('city-name-overlay');
  overlay.classList.remove('active');
}

function saveCityName() {
  const input = document.getElementById('city-name-input');
  const newName = input.value.trim() || 'Somewhere I Belong';
  
  localStorage.setItem('cityName', newName);
  const titleElement = document.getElementById('city-title');
  if (titleElement) titleElement.textContent = newName;
  closeCityNameOverlay();
}

// Initialize districts from localStorage or set all to locked
function initDistricts() {
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  
  DISTRICTS.forEach(districtName => {
    const district = document.getElementById(districtName);
    if (!district) return;
    const isUnlocked = districtStates[districtName] === 'unlocked';
    
    if (isUnlocked) {
      district.classList.add('unlocked');
      district.classList.remove('locked');
      updateDistrictImage(district, 'unlocked');
    } else {
      district.classList.add('locked');
      updateDistrictImage(district, 'locked');
    }
    
    district.addEventListener('click', () => handleDistrictClick(districtName));
    district.addEventListener('mouseenter', () => handleDistrictHover(district, isUnlocked));
    district.addEventListener('mouseleave', () => handleDistrictLeave(district, isUnlocked));
  });
}

function updateDistrictImage(district, state) {
  const districtName = district.dataset.district;
  const img = district.querySelector('.district-image');
  
  if (state === 'unlocked') {
    const savedSkin = localStorage.getItem(`${districtName}-skin`);
    if (savedSkin) {
      const skinIndex = parseInt(savedSkin);
      if (skinIndex === 1) { img.src = `assets/districts/${districtName}-skin2.png`; return; }
      if (skinIndex === 2) { img.src = `assets/districts/${districtName}-skin3.png`; return; }
    }
  }
  img.src = `assets/districts/${districtName}-${state}.png`;
}

function handleDistrictHover(district, isUnlocked) {
  if (!isUnlocked) updateDistrictImage(district, 'hover');
}

function handleDistrictLeave(district, isUnlocked) {
  if (!isUnlocked) updateDistrictImage(district, 'locked');
}

function handleDistrictClick(districtName) {
  localStorage.setItem('currentDistrict', districtName);
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  if (districtStates[districtName] === 'unlocked') {
    window.location.href = `districts/${districtName}-customize.html`;
  } else {
    window.location.href = `districts/${districtName}.html`;
  }
}

function displayDistrictNames() {
  DISTRICTS.forEach(districtName => {
    const district = document.getElementById(districtName);
    if (!district) return;
    const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
    
    if (districtStates[districtName] === 'unlocked') {
      const savedName = localStorage.getItem(`${districtName}-name`);
      if (savedName) {
        const label = district.querySelector('.district-label');
        if (!label.querySelector('.district-custom-name')) {
          const span = document.createElement('span');
          span.className = 'district-custom-name';
          span.textContent = savedName;
          label.appendChild(span);
        }
      }
    }
  });
}

  // Center cell — click highlights a random district
  document.querySelector('.header-center').addEventListener('click', () => {
    const locked = DISTRICTS.filter(d => {
      const states = JSON.parse(localStorage.getItem('districtStates')) || {};
      return states[d] !== 'unlocked';
    });
    const pool = locked.length > 0 ? locked : DISTRICTS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const el = document.getElementById(pick);
    if (!el) return;

    // Swap to hover image
    updateDistrictImage(el, 'hover');
    el.classList.add('district-highlight');

    // Remove after 1.5s
    setTimeout(() => {
      updateDistrictImage(el, 'locked');
      el.classList.remove('district-highlight');
    }, 1500);
  });
// ─── GUIDE SLIDESHOW ───

let guideSlide = 0;
const GUIDE_TOTAL_STEPS = 5;
let guideConceptTimer = null;

function openGuide() {
  guideSlide = 0;
  document.getElementById('guide-overlay').classList.add('active');
  showGuideSlide(0);
  guideConceptTimer = setTimeout(() => advanceGuide(), 5000);
}

function closeGuide() {
  if (guideConceptTimer) { clearTimeout(guideConceptTimer); guideConceptTimer = null; }
  document.getElementById('guide-overlay').classList.remove('active');
}

function showGuideSlide(index) {
  document.querySelectorAll('.guide-slide').forEach(s => s.classList.remove('active'));
  const target = document.querySelector(`.guide-slide[data-index="${index}"]`);
  if (target) target.classList.add('active');

  const isConcept = index === 0;
  const prev = document.getElementById('guide-prev');
  const next = document.getElementById('guide-next');
  const progress = document.getElementById('guide-progress');

  if (prev) prev.style.visibility = isConcept || index === 1 ? 'hidden' : 'visible';
  if (next) next.textContent = index === GUIDE_TOTAL_STEPS ? 'Begin ↗' : 'Next →';
  if (next) next.style.visibility = isConcept ? 'hidden' : 'visible';
  if (progress) {
    progress.textContent = isConcept ? '' : `${index}/${GUIDE_TOTAL_STEPS}`;
  }
}

function advanceGuide() {
  if (guideConceptTimer) { clearTimeout(guideConceptTimer); guideConceptTimer = null; }
  guideSlide = 1;
  showGuideSlide(1);
}

document.getElementById('guide-btn')?.addEventListener('click', openGuide);

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('guide-close-btn')?.addEventListener('click', closeGuide);

  document.getElementById('guide-next')?.addEventListener('click', () => {
    if (guideSlide === 0) { advanceGuide(); return; }
    if (guideSlide < GUIDE_TOTAL_STEPS) {
      guideSlide++;
      showGuideSlide(guideSlide);
    } else {
      closeGuide();
    }
  });

  document.getElementById('guide-prev')?.addEventListener('click', () => {
    if (guideSlide > 1) { guideSlide--; showGuideSlide(guideSlide); }
  });

  document.querySelector('.guide-slide-concept')?.addEventListener('click', () => {
    if (guideSlide === 0) advanceGuide();
  });

  // Click outside overlay to close
  document.getElementById('guide-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'guide-overlay') closeGuide();
  });
});
document.getElementById('about-btn')?.addEventListener('click', () => alert('About coming soon!'));
document.getElementById('share-btn').addEventListener('click', () => alert('Share coming soon!'));

document.getElementById('cancel-btn').addEventListener('click', closeCityNameOverlay);
document.getElementById('save-name-btn').addEventListener('click', saveCityName);

document.getElementById('city-name-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveCityName();
  if (e.key === 'Escape') closeCityNameOverlay();
});

document.getElementById('city-name-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'city-name-overlay') closeCityNameOverlay();
});

document.addEventListener('DOMContentLoaded', () => {
  initCityName();
  initDistricts();
  displayDistrictNames();

  // Guide close now handled by guide slideshow logic above
});


// checkAchievements — called on map page load to catch anything earned
// on other pages (e.g. completed a district, came back to map)
function checkAchievements() {
  const DISTRICTS = ['garden', 'cornerstore', 'shrine', 'tower', 'plaza'];
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  const cityName = localStorage.getItem('cityName');

  DISTRICTS.forEach(d => {
    const answers = localStorage.getItem(`${d}-answers`);
    if (answers && Object.keys(JSON.parse(answers)).length > 0) {
      unlockAchievement(`began-${d}`);
    }
    if (districtStates[d] === 'unlocked') {
      unlockAchievement(`completed-${d}`);
    }
  });

  if (DISTRICTS.every(d => districtStates[d] === 'unlocked')) {
    unlockAchievement('completed-all');
  }

  if (cityName && cityName !== 'Somewhere I Belong') {
    unlockAchievement('named-city');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCityName();
  initDistricts();
  displayDistrictNames();
  checkAchievements();
});

// ─── CUSTOMIZE PANEL ───

function openCustomizePanel() {
  document.getElementById('customize-panel').classList.add('visible');
  document.getElementById('customize-toggle-btn').style.display = 'none';
}

function closeCustomizePanel() {
  document.getElementById('customize-panel').classList.remove('visible');
  document.getElementById('customize-toggle-btn').style.display = 'flex';
}

function initDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) applyDarkMode(true);
}

function applyDarkMode(on) {
  document.body.classList.toggle('dark-mode', on);
  localStorage.setItem('darkMode', on);
  const track = document.getElementById('dark-mode-track');
  if (track) track.classList.toggle('on', on);
}

function toggleDarkMode() {
  const isDark = document.body.classList.contains('dark-mode');
  applyDarkMode(!isDark);
}

document.addEventListener('DOMContentLoaded', () => {
  // Inject customize panel HTML
  const ui = document.createElement('div');
  ui.innerHTML = `
    <div class="customize-toggle-btn" id="customize-toggle-btn">
      <span class="customize-btn-label">Customize</span>
    </div>
    <div class="customize-panel" id="customize-panel">
      <div class="customize-panel-header" id="customize-panel-header">
        <span class="customize-panel-label">Customize</span>
        <span class="customize-panel-toggle">∧ close</span>
      </div>
      <div class="customize-panel-body">
        <div class="customize-row">
          <span class="customize-row-label">Dark mode</span>
          <div class="customize-toggle-cell" id="dark-mode-toggle">
            <div class="toggle-track" id="dark-mode-track">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>
        <div class="customize-row">
          <span class="customize-row-label">Randomize districts</span>
          <div class="customize-toggle-cell" id="randomize-toggle">
            <div class="toggle-track" id="randomize-track">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(ui);

  document.getElementById('customize-toggle-btn').addEventListener('click', openCustomizePanel);
  document.getElementById('customize-panel-header').addEventListener('click', closeCustomizePanel);
  document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
  document.getElementById('randomize-toggle').addEventListener('click', toggleRandomize);

  initDarkMode();
  initRandomize(); // also re-randomizes on every page load if toggled on
});

// ─── RANDOMIZE DISTRICT PLACEMENT ───

const DISTRICT_POSITIONS = [
  { top: '80px',     left: '140px',                                   zIndex: 1  }, // top-left
  { top: '80px',     right: '140px',                                  zIndex: 1  }, // top-right
  { bottom: '100px', left: '160px',                                   zIndex: 12 }, // bottom-left
  { bottom: '80px',  right: '80px',                                   zIndex: 12 }, // bottom-right
  { top: '50%',      left: '50%', transform: 'translate(-50%, -50%)', zIndex: 6  }, // center
];

function randomizeDistricts() {
  const positions = [...DISTRICT_POSITIONS];
  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  DISTRICTS.forEach((name, i) => {
    const el = document.getElementById(name);
    if (!el) return;
    const pos = positions[i];

    // Force clear ALL position and transform — including what CSS set
    el.style.cssText = `
      position: absolute;
      width: 360px;
      height: 360px;
      top: ${pos.top || 'auto'};
      bottom: ${pos.bottom || 'auto'};
      left: ${pos.left || 'auto'};
      right: ${pos.right || 'auto'};
      transform: ${pos.transform || 'none'};
      cursor: pointer;
      transition: transform 0.3s ease;
      z-index: ${pos.zIndex};
    `;
  });
}

function initRandomize() {
  const isOn = localStorage.getItem('randomizeDistricts') === 'true';
  const track = document.getElementById('randomize-track');
  if (track) track.classList.toggle('on', isOn);
  if (isOn) randomizeDistricts();
}

function toggleRandomize() {
  const isOn = localStorage.getItem('randomizeDistricts') === 'true';
  const next = !isOn;
  localStorage.setItem('randomizeDistricts', next);
  const track = document.getElementById('randomize-track');
  if (track) track.classList.toggle('on', next);
  if (next) randomizeDistricts();
  else location.reload(); // reload to restore CSS-defined positions
}


// Emotion words
const EMOTION_WORDS = new Set([
  'happy','happiness','sad','sadness','grief','joy','joyful','love','loved','lonely','loneliness',
  'fear','afraid','scared','anxious','anxiety','angry','anger','rage','calm','peace','peaceful',
  'safe','unsafe','comfort','comfortable','uncomfortable','proud','pride','shame','ashamed',
  'guilt','guilty','hopeful','hope','hopeless','lost','found','free','freedom','trapped',
  'nostalgic','nostalgia','homesick','longing','yearning','missing','belonging','connected',
  'disconnected','isolated','warm','warmth','cold','hurt','pain','painful','tender','gentle',
  'alive','numb','empty','full','overwhelmed','grateful','gratitude','bitter','bittersweet',
  'melancholy','wonder','awe','curious','curious','confused','clarity','certain','uncertain',
  'excited','excitement','nervous','relief','relieved','tired','exhausted','energized',
  'inspired','inspiration','content','restless','vulnerable','strong','weak','brave','courage'
]);

// Location/place words
const LOCATION_WORDS = new Set([
  'home','house','room','bedroom','kitchen','garden','park','school','church','temple','mosque',
  'street','road','alley','corner','market','store','shop','cafe','restaurant','library',
  'hospital','office','studio','apartment','building','city','town','village','country',
  'neighborhood','district','plaza','shrine','tower','forest','lake','river','ocean','beach',
  'mountain','field','farm','barn','garage','basement','attic','hallway','staircase','window',
  'door','yard','balcony','rooftop','bridge','station','airport','train','bus','court','campus',
  'dormitory','dorm','classroom','gym','pool','court','stadium','theater','cinema','museum',
  'gallery','mall','hotel','motel','cabin','cottage','palace','castle','ruins','cemetery',
  'playground','lobby','waiting','corridor','passage','square','avenue','boulevard','lane'
]);

// Strong adjectives likely to appear in reflective writing
const DESCRIPTIVE_WORDS = new Set([
  'quiet','loud','bright','dark','small','large','big','tiny','huge','narrow','wide','open',
  'closed','clean','dirty','old','ancient','modern','empty','crowded','busy','still','chaotic',
  'familiar','unfamiliar','strange','ordinary','special','sacred','ordinary','forgotten',
  'remembered','hidden','visible','distant','close','near','far','deep','shallow','heavy',
  'light','soft','hard','rough','smooth','broken','whole','perfect','imperfect','beautiful',
  'ugly','simple','complex','ordinary','extraordinary','invisible','tangible','fleeting',
  'permanent','temporary','endless','brief','vast','intimate','public','private','shared',
  'personal','collective','individual','universal','specific','vague','clear','blurry',
  'sharp','muted','vivid','faded','fresh','stale','alive','dead','growing','decaying',
  'changing','unchanged','fixed','moving','steady','unstable','grounded','unmoored',
  'real','unreal','dreamlike','concrete','abstract','meaningful','meaningless','powerful',
  'fragile','resilient','delicate','sturdy','fleeting','lasting','urgent','slow','fast'
]);

function isKeyword(word) {
  if (EMOTION_WORDS.has(word)) return true;
  if (LOCATION_WORDS.has(word)) return true;
  if (DESCRIPTIVE_WORDS.has(word)) return true;
  return false;
}

function extractAllKeywords(topN = 20) {
  const districtStates = JSON.parse(localStorage.getItem('districtStates') || '{}');
  const completed = DISTRICTS.filter(d => districtStates[d] === 'unlocked');
  
  const freq = {};
  const wordSources = {};

  completed.forEach(d => {
    const raw = localStorage.getItem(`${d}-answers`);
    if (!raw) return;
    const answers = JSON.parse(raw);
    // skip the naming question (index 5)
    const text = Object.entries(answers)
      .filter(([i]) => parseInt(i) !== 5)
      .map(([, v]) => v)
      .join(' ');

    text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && isKeyword(w))
      .forEach(w => {
        freq[w] = (freq[w] || 0) + 1;
        if (!wordSources[w]) wordSources[w] = new Set();
        wordSources[w].add(d);
      });
  });

  const FALLBACK_STOPWORDS = new Set([
    'that','this','with','have','from','they','their','would','could','should',
    'about','there','which','when','what','just','been','will','your','more',
    'also','into','some','than','then','were','very','much','each','over',
    'think','place','feel','felt','thought','remember','know','still','even',
    'always','never','every','back','here','thing','things','really','because',
    'something','anything','nothing','someone','anyone','people','person',
    'would','could','going','getting','being','having','doing','making',
    'around','through','after','before','during','while','these','those'
  ]);

  // Always run fallback for EVERY district to guarantee representation
  // Adds top 3 meaningful words per district that aren't already in freq
  completed.forEach(d => {
    const raw = localStorage.getItem(`${d}-answers`);
    if (!raw) return;
    const answers = JSON.parse(raw);
    const text = Object.entries(answers)
      .filter(([i]) => parseInt(i) !== 5)
      .map(([, v]) => v).join(' ');

    const distFreq = {};
    text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
      .filter(w => w.length > 4 && !FALLBACK_STOPWORDS.has(w) && !freq[w])
      .forEach(w => { distFreq[w] = (distFreq[w] || 0) + 1; });

    Object.entries(distFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([w, c]) => {
        freq[w] = c;
        if (!wordSources[w]) wordSources[w] = new Set();
        wordSources[w].add(d);
      });
  });

  let entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  return entries
    .slice(0, topN)
    .map(([word, count]) => ({
      word,
      count,
      districts: [...wordSources[word]]
    }));
}

const DISTRICT_COLORS = {
  shrine:      '#DD6204',
  garden:      '#6A6405',
  cornerstore: '#D05038',
  tower:       '#205A97',
  plaza:       '#614973',
};

let constellationSketch = null;
let constellationActive = false;

function initConstellationBtn() {
  const districtStates = JSON.parse(localStorage.getItem('districtStates') || '{}');
  const anyComplete = DISTRICTS.some(d => districtStates[d] === 'unlocked');
  const btn = document.getElementById('constellation-btn');
  
  if (anyComplete) {
    btn.classList.remove('locked');
    btn.addEventListener('click', toggleConstellation);
  } else {
    btn.title = 'Complete a district to unlock';
  }
}

function toggleConstellation() {
  constellationActive ? closeConstellation() : openConstellation();
}

function openConstellation() {
  constellationActive = true;
  const overlay = document.getElementById('constellation-overlay');
  const btn = document.getElementById('constellation-btn');
  const label = btn.querySelector('.constellation-btn-label');
  const mapContainer = document.querySelector('.map-container');

  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('visible'));
  mapContainer.classList.add('constellation-active');
  btn.classList.add('active');
  if (label) label.textContent = 'City as Map';

  setTimeout(() => initConstellationSketch(), 100);
}

function closeConstellation() {
  constellationActive = false;
  const overlay = document.getElementById('constellation-overlay');
  const btn = document.getElementById('constellation-btn');
  const label = btn.querySelector('.constellation-btn-label');
  const mapContainer = document.querySelector('.map-container');

  overlay.classList.remove('visible');
  mapContainer.classList.remove('constellation-active');
  btn.classList.remove('active');
  if (label) label.textContent = 'City as Memories';

  setTimeout(() => {
    overlay.classList.add('hidden');
    if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }
  }, 600);
}

function initConstellationSketch() {
  const container = document.getElementById('constellation-canvas-container');
  if (!container) return;
  if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }

  const keywords = extractAllKeywords(20);
  if (keywords.length === 0) return;

  // Build nodes
  const nodes = keywords.map(k => ({
    ...k,
    x: 0, y: 0, vx: 0, vy: 0
  }));

  // No edges — color alone shows district grouping

  // District anchor points mirroring their map positions (as fractions of canvas)
  const DISTRICT_ANCHORS = {
    garden:      { ax: 0.22, ay: 0.25 }, // top-left
    tower:       { ax: 0.78, ay: 0.25 }, // top-right
    shrine:      { ax: 0.50, ay: 0.50 }, // center
    cornerstore: { ax: 0.22, ay: 0.75 }, // bottom-left
    plaza:       { ax: 0.78, ay: 0.75 }, // bottom-right
  };

  // Assign anchor: shared words go to center, single-district to their zone
  nodes.forEach(n => {
    const anchor = n.districts.length > 1
      ? { ax: 0.5, ay: 0.5 }  // shared words float to center
      : (DISTRICT_ANCHORS[n.districts[0]] || { ax: 0.5, ay: 0.5 });
    n.anchorX = anchor.ax;
    n.anchorY = anchor.ay;
  });

  console.log('Constellation nodes:', nodes.map(n => `${n.word} (${n.districts.join(',')})`));

  constellationSketch = new p5((sk) => {
    let W, H;
    let selectedNode = null;
    let frame = 0;
    const blue = getComputedStyle(document.body).getPropertyValue('--blue').trim() || '#0A059B';
    const bg   = getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#F7F2F1';
    const PAD_X = 10, PAD_Y = 6;

    sk.setup = () => {
      W = container.offsetWidth || window.innerWidth;
      H = container.offsetHeight || (window.innerHeight - 90);
      sk.createCanvas(W, H).parent('constellation-canvas-container');
      sk.textFont('monospace');
      sk.textSize(12);

      // Start nodes near their district anchor with small random scatter
      nodes.forEach(n => {
        n.x = n.anchorX * W + (Math.random() - 0.5) * 80;
        n.y = n.anchorY * H + (Math.random() - 0.5) * 80;
        n.vx = 0; n.vy = 0;
      });
    };

    sk.draw = () => {
      sk.background(bg);
      frame++;

      const damping = Math.min(0.85 + frame * 0.001, 0.94);

      // Physics
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f = 5000 / (d * d);
          a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }

      nodes.forEach(n => {
        // Pull toward district anchor instead of global center
        n.vx += (n.anchorX * W - n.x) * 0.015;
        n.vy += (n.anchorY * H - n.y) * 0.015;
        n.vx *= damping; n.vy *= damping;
        n.x = Math.max(60, Math.min(W - 60, n.x + n.vx));
        n.y = Math.max(30, Math.min(H - 30, n.y + n.vy));
      });

      // Draw nodes as rectangles
      nodes.forEach((n, idx) => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2;
        const rh = fontSize + PAD_Y * 2;

        const isSelected = selectedNode === idx;
        const isHovered = sk.mouseX > n.x - rw/2 && sk.mouseX < n.x + rw/2 &&
                          sk.mouseY > n.y - rh/2 && sk.mouseY < n.y + rh/2;

        const col = n.districts.length === 1
          ? DISTRICT_COLORS[n.districts[0]]
          : blue;

        sk.noStroke();

        // Subtle glow behind selected
        if (isSelected) {
          sk.fill(col + '33');
          sk.rect(n.x - rw/2 - 4, n.y - rh/2 - 4, rw + 8, rh + 8);
        }

        // Filled rect
        sk.fill(isSelected || isHovered ? col : col + 'CC');
        sk.rect(n.x - rw/2, n.y - rh/2, rw, rh);

        // Word
        sk.fill(bg);
        sk.textAlign(sk.CENTER, sk.CENTER);
        sk.text(n.word, n.x, n.y);
      });

      // Selected info line top-left
      if (selectedNode !== null) {
        const n = nodes[selectedNode];
        const districts = n.districts.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
        sk.fill(blue);
        sk.noStroke();
        sk.textSize(11);
        sk.textAlign(sk.LEFT, sk.TOP);
        sk.text(`"${n.word}" — ${districts}`, 24, 24);
      }
    };

    sk.mousePressed = () => {
      let hit = null;
      nodes.forEach((n, idx) => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2;
        const rh = fontSize + PAD_Y * 2;
        if (sk.mouseX > n.x - rw/2 && sk.mouseX < n.x + rw/2 &&
            sk.mouseY > n.y - rh/2 && sk.mouseY < n.y + rh/2) hit = idx;
      });
      selectedNode = hit;
    };

    sk.mouseMoved = () => {
      let onNode = false;
      nodes.forEach(n => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2;
        const rh = fontSize + PAD_Y * 2;
        if (sk.mouseX > n.x - rw/2 && sk.mouseX < n.x + rw/2 &&
            sk.mouseY > n.y - rh/2 && sk.mouseY < n.y + rh/2) onNode = true;
      });
      container.style.cursor = onNode ? 'pointer' : 'default';
    };

    sk.windowResized = () => {
      W = container.offsetWidth || window.innerWidth;
      H = container.offsetHeight || (window.innerHeight - 90);
      sk.resizeCanvas(W, H);
      // Reposition nodes to new anchor positions — they'll drift naturally from there
      nodes.forEach(n => {
        n.x = n.anchorX * W + (Math.random() - 0.5) * 40;
        n.y = n.anchorY * H + (Math.random() - 0.5) * 40;
        n.vx = 0; n.vy = 0;
      });
    };

  }, container);
}

document.addEventListener('DOMContentLoaded', () => {
  initConstellationBtn();
});
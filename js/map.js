// map.js

const DISTRICTS = ['garden', 'cornerstore', 'shrine', 'tower', 'plaza'];

// Per-district questions for constellation info panel (fix 8)
const DISTRICT_QUESTIONS = {
  shrine:      ["What place comes to mind?", "What did this place hold that was precious to you?", "How do you return to this place?", "When you think of this place, what do you remember?", "If this place were to fade from memory completely, what would be lost?"],
  garden:      ["What place comes to mind?", "What were you becoming in this place?", "How did the growth happen? What did it feel like?", "When you think of this place, what do you remember?", "If this place were to fade from memory completely, what would be lost?"],
  cornerstore: ["What place comes to mind?", "What was your routine in this place?", "What drew you to this specific place?", "When you think of this place, what do you remember?", "If this place were to fade from memory completely, what would be lost?"],
  tower:       ["What place comes to mind?", "What was your relationship with solitude in this space?", "What perspective did being alone give you?", "When you think of this place, what do you remember?", "If this place were to fade from memory completely, what would be lost?"],
  plaza:       ["What place comes to mind?", "Who else was in this place? How did you connect with them?", "What brought you together in this place?", "When you think of this place, what do you remember?", "If this place were to fade from memory completely, what would be lost?"],
};


// ─── CITY NAME ───────────────────────────────────────────────────────────────

function initCityName() {
  const savedName = localStorage.getItem('cityName') || 'Somewhere I Belong';
  const el = document.getElementById('city-title');
  if (el) el.textContent = savedName;
}

function openCityNameOverlay() {
  const overlay = document.getElementById('city-name-overlay');
  const input = document.getElementById('city-name-input');
  input.value = localStorage.getItem('cityName') || 'Somewhere I Belong';
  overlay.classList.add('active');
  input.focus();
  input.select();
}

function closeCityNameOverlay() {
  document.getElementById('city-name-overlay').classList.remove('active');
}

function saveCityName() {
  const input = document.getElementById('city-name-input');
  const newName = input.value.trim() || 'Somewhere I Belong';
  localStorage.setItem('cityName', newName);
  const el = document.getElementById('city-title');
  if (el) el.textContent = newName;
  closeCityNameOverlay();
}


// ─── DISTRICTS ───────────────────────────────────────────────────────────────

function initDistricts() {
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};

  DISTRICTS.forEach(name => {
    const el = document.getElementById(name);
    if (!el) return;
    const isUnlocked = districtStates[name] === 'unlocked';

    if (isUnlocked) {
      el.classList.remove('locked');
      el.classList.add('unlocked');
      updateDistrictImage(el, 'unlocked');
    } else {
      el.classList.add('locked');
      el.classList.remove('unlocked');
      updateDistrictImage(el, 'locked');
    }

    // FIX 4: No click popup — clicking goes straight to district page (or customize)
    el.addEventListener('click', () => handleDistrictClick(name));
    el.addEventListener('mouseenter', () => { if (!isUnlocked) updateDistrictImage(el, 'hover'); });
    el.addEventListener('mouseleave', () => { if (!isUnlocked) updateDistrictImage(el, 'locked'); });
  });
}

function updateDistrictImage(district, state) {
  const name = district.dataset.district;
  const img = district.querySelector('.district-image');
  if (state === 'unlocked') {
    const skin = parseInt(localStorage.getItem(`${name}-skin`) || '0');
    if (skin === 1) { img.src = `assets/districts/${name}-skin2.png`; return; }
    if (skin === 2) { img.src = `assets/districts/${name}-skin3.png`; return; }
  }
  img.src = `assets/districts/${name}-${state}.png`;
}

function handleDistrictClick(name) {
  if (document.body.classList.contains('visit-mode')) return;
  localStorage.setItem('currentDistrict', name);
  const states = JSON.parse(localStorage.getItem('districtStates')) || {};
  window.location.href = states[name] === 'unlocked'
    ? `districts/${name}-customize.html`
    : `districts/${name}.html`;
}

function displayDistrictNames() {
  // skip in visit mode — labels are set by renderVisitDistricts() from the visited city's data
  if (document.body.classList.contains('visit-mode')) return;
  const states = JSON.parse(localStorage.getItem('districtStates')) || {};
  DISTRICTS.forEach(name => {
    const el = document.getElementById(name);
    if (!el || states[name] !== 'unlocked') return;
    const savedName = localStorage.getItem(`${name}-name`);
    if (!savedName) return;
    const label = el.querySelector('.district-label');
    if (label && !label.querySelector('.district-custom-name')) {
      const span = document.createElement('span');
      span.className = 'district-custom-name';
      span.textContent = savedName;
      label.appendChild(span);
    }
  });
}


// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

function checkAchievements() {
  const states = JSON.parse(localStorage.getItem('districtStates')) || {};
  const cityName = localStorage.getItem('cityName');
  DISTRICTS.forEach(d => {
    const ans = localStorage.getItem(`${d}-answers`);
    if (ans && Object.keys(JSON.parse(ans)).length > 0) unlockAchievement(`began-${d}`);
    if (states[d] === 'unlocked') unlockAchievement(`completed-${d}`);
  });
  if (DISTRICTS.every(d => states[d] === 'unlocked')) unlockAchievement('completed-all');
  if (cityName && cityName !== 'Somewhere I Belong') unlockAchievement('named-city');
}


// ─── GUIDE OVERLAY ────────────────────────────────────────────────────────────

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
  if (progress) progress.textContent = isConcept ? '' : `${index}/${GUIDE_TOTAL_STEPS}`;
}

function advanceGuide() {
  if (guideConceptTimer) { clearTimeout(guideConceptTimer); guideConceptTimer = null; }
  guideSlide = 1;
  showGuideSlide(1);
}


// ─── SHARE OVERLAY ────────────────────────────────────────────────────────────

function openShare() {
  document.getElementById('share-overlay').classList.add('active');
  switchShareTab('share-tab-share');
  document.getElementById('share-code-value').textContent = getOrCreateCityCode();
  encodeCity();
  renderVisitorLog();
}

function closeShare() {
  document.getElementById('share-overlay').classList.remove('active');
}

function switchShareTab(tabId) {
  document.querySelectorAll('#share-overlay .share-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#share-overlay .share-tab-panel').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  document.getElementById(tabId).classList.add('active');
  const panel = document.getElementById(tabId.replace('share-tab-', 'share-panel-'));
  panel.classList.remove('hidden');
  panel.classList.add('active');
}

function getOrCreateCityCode() {
  let code = localStorage.getItem('myCityCode');
  if (!code) {
    code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
           Math.random().toString(36).substring(2, 4).toUpperCase();
    localStorage.setItem('myCityCode', code);
  }
  return code;
}

function encodeCity() {
  const data = {
    cityName: localStorage.getItem('cityName') || 'Somewhere I Belong',
    code: getOrCreateCityCode(),
    districtStates: JSON.parse(localStorage.getItem('districtStates') || '{}'),
    districtNames: {},
    answers: {},
  };
  DISTRICTS.forEach(d => {
    data.districtNames[d] = localStorage.getItem(`${d}-name`) || '';
    data.answers[d] = JSON.parse(localStorage.getItem(`${d}-answers`) || '{}');
  });
  localStorage.setItem(`cityData-${data.code}`, JSON.stringify(data));
  return data;
}


// ─── VISITOR'S LOG ────────────────────────────────────────────────────────────

const EXAMPLE_CITY_CODE = 'NADIA-X7';

const EXAMPLE_CITY = {
  cityName: 'The City That Follows Me',
  code: EXAMPLE_CITY_CODE,
  // FIX 6: garden uses skin 2, shrine uses skin 3
  districtSkins: { garden: 1, shrine: 2 },
  districtStates: { shrine: 'unlocked', garden: 'unlocked', cornerstore: 'unlocked', tower: 'unlocked', plaza: 'unlocked' },
  districtNames: {
    shrine:      'The Apartment on Rue Oberkampf',
    garden:      'The Community Garden in Cincinnati',
    cornerstore: "Mrs. Kim's Shop, Building 7",
    tower:       'The Fire Escape, 4th Floor',
    plaza:       'Dolores Park, Summer 2019',
  },
  answers: {
    shrine: {
      0: 'A third-floor apartment in Paris, near a canal. I lived there for nine months when I was twenty-four.',
      1: 'It held a version of me I was still becoming. The person who cooked alone and felt okay about it.',
      2: 'Only in memory now. I walk through it when I can\'t sleep — up the stairs, past the radiator that clicked.',
      3: 'The smell of the neighbors\' bread in the morning. The way light came through the frosted glass at 4pm in October.',
      4: 'A whole chapter would close. The proof that I was brave enough to go somewhere alone.',
    },
    garden: {
      0: 'A community garden in Cincinnati, Ohio. My aunt kept a plot there. I visited every summer as a child.',
      1: 'I grew there slowly, over years. I learned patience from tomatoes. I learned my grandmother\'s hands from watching my aunt\'s.',
      2: 'I drive past the street on Google Maps sometimes. The garden is still there. The plot has a different name on the board.',
      3: 'Dirt under my fingernails. Bees that weren\'t afraid of me. My aunt saying \'look how tall.\'',
      4: 'The feeling that growing something is enough. That slow, unglamorous labor has worth.',
    },
    cornerstore: {
      0: 'A small convenience store in the lobby of my apartment building in Seoul. Run by a woman I never learned the name of.',
      1: 'Every morning for two years. Green tea, triangle kimbap, a nod. It became the ritual that made the place feel like home.',
      2: 'The building is still there. I imagine she is still there.',
      3: 'The hum of the refrigerators. The particular sound of that sliding door. Being recognized without needing to explain myself.',
      4: 'The idea that belonging doesn\'t require language. That showing up, again and again, is a kind of conversation.',
    },
    tower: {
      0: 'The fire escape outside my bedroom window in Chicago. Four floors up, facing west.',
      1: 'I sat there when things got too loud inside. I sat there when things were good too.',
      2: 'Wind. The feeling of being outside but hidden. The city going on without needing anything from me.',
      3: 'The water tower, the billboard, the sky turning pink.',
      4: 'The most private version of myself. The one who didn\'t need to perform anything.',
    },
    plaza: {
      0: 'Dolores Park in San Francisco, a Saturday in July. I\'d just moved there. I knew no one.',
      1: 'A stranger offered me a slice of watermelon. We talked for four hours.',
      2: 'Summer, heat, the feeling that the city might let me in after all.',
      3: 'Grass stains. Someone\'s speaker playing something I didn\'t know but wanted to.',
      4: 'The belief that it\'s possible to be found. That cities have seams and you can slip through them.',
    },
  },
};

function seedExampleCity() {
  const log = JSON.parse(localStorage.getItem('visitor-log') || '[]');
  if (!log.find(c => c.code === EXAMPLE_CITY_CODE)) {
    log.push({ code: EXAMPLE_CITY.code, cityName: EXAMPLE_CITY.cityName, addedAt: Date.now(), data: EXAMPLE_CITY });
    localStorage.setItem('visitor-log', JSON.stringify(log));
  }
}

function renderVisitorLog() {
  const list = document.getElementById('visitor-cities-list');
  if (!list) return;
  const log = JSON.parse(localStorage.getItem('visitor-log') || '[]');
  if (log.length === 0) {
    list.innerHTML = '<p class="visitor-empty">No cities yet. Paste a code to add one.</p>';
    return;
  }
  list.innerHTML = '';
  log.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'visitor-city-row';
    row.innerHTML = `
      <div class="visitor-city-info">
        <div class="visitor-city-name">${entry.cityName}</div>
        <div class="visitor-city-meta mono">${entry.code} · ${new Date(entry.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <button class="visitor-visit-btn mono" data-index="${i}">Visit →</button>
    `;
    row.querySelector('.visitor-visit-btn').addEventListener('click', () => {
      closeShare();
      enterVisitMode(entry.data);
    });
    list.appendChild(row);
  });
}

function addVisitorCity() {
  const input = document.getElementById('visitor-code-input');
  const error = document.getElementById('visitor-error');
  const code = input.value.trim().toUpperCase();
  error.classList.add('hidden');
  if (!code) return;

  let cityData = null;
  if (code === EXAMPLE_CITY_CODE) {
    cityData = EXAMPLE_CITY;
  } else {
    const stored = localStorage.getItem(`cityData-${code}`);
    if (stored) cityData = JSON.parse(stored);
  }

  if (!cityData) { error.classList.remove('hidden'); return; }

  const log = JSON.parse(localStorage.getItem('visitor-log') || '[]');
  if (!log.find(e => e.code === code)) {
    log.push({ code: cityData.code, cityName: cityData.cityName, addedAt: Date.now(), data: cityData });
    localStorage.setItem('visitor-log', JSON.stringify(log));
  }
  input.value = '';
  renderVisitorLog();
}


// ─── VISIT MODE ───────────────────────────────────────────────────────────────

let visitModeData = null;
let visitConstellationActive = false;

function enterVisitMode(cityData) {
  visitModeData = cityData;
  document.body.classList.add('visit-mode');

  const titleEl = document.getElementById('city-title');
  if (titleEl) titleEl.textContent = cityData.cityName;

  const centerEl = document.querySelector('.header-center p');
  if (centerEl) centerEl.textContent = 'Read-only view';

  const banner = document.getElementById('visit-banner');
  if (banner) { banner.textContent = `Visiting: ${cityData.cityName}`; banner.style.display = 'block'; }

  renderVisitDistricts(cityData);
  initVisitConstellationBtn(cityData);
}

function renderVisitDistricts(cityData) {
  DISTRICTS.forEach(d => {
    const el = document.getElementById(d);
    if (!el) return;
    const isUnlocked = cityData.districtStates[d] === 'unlocked';
    const distName = cityData.districtNames[d];

    // clone to remove old listeners
    const fresh = el.cloneNode(true);
    el.parentNode.replaceChild(fresh, el);

    // strip any labels stamped by displayDistrictNames()
    fresh.querySelectorAll('.district-custom-name').forEach(s => s.remove());

    // FIX 5: Always use unlocked image for all districts
    if (isUnlocked) {
      fresh.classList.remove('locked');
      fresh.classList.add('unlocked');
      const img = fresh.querySelector('.district-image');
      if (img) {
        // FIX 6: Apply visitor city's skins (garden=skin2, shrine=skin3)
        const skins = cityData.districtSkins || {};
        const skinIdx = skins[d];
        if (skinIdx === 1) img.src = `assets/districts/${d}-skin2.png`;
        else if (skinIdx === 2) img.src = `assets/districts/${d}-skin3.png`;
        else img.src = `assets/districts/${d}-unlocked.png`;
      }

      // Always show district label
      const label = fresh.querySelector('.district-label');
      if (label) {
        label.style.opacity = '1';
        if (distName && !label.querySelector('.district-custom-name')) {
          const span = document.createElement('span');
          span.className = 'district-custom-name';
          span.textContent = distName;
          label.appendChild(span);
        }
      }

      // FIX 4 & 7: No click popup, no hover effect in visit mode
      fresh.style.cursor = 'default';
      // No click listener added
    } else {
      fresh.classList.add('locked');
      fresh.classList.remove('unlocked');
      fresh.style.cursor = 'default';
    }
  });
}

function initVisitConstellationBtn(cityData) {
  const btn = document.getElementById('constellation-btn');
  if (!btn) return;
  btn.style.display = 'flex';
  btn.classList.remove('locked', 'active');
  const label = btn.querySelector('.constellation-btn-label');
  if (label) label.textContent = 'City as Memories';

  const fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);

  fresh.addEventListener('click', () => {
    if (visitConstellationActive) {
      closeConstellation();
      visitConstellationActive = false;
      const lbl = fresh.querySelector('.constellation-btn-label');
      if (lbl) lbl.textContent = 'City as Memories';
      fresh.classList.remove('active');
    } else {
      openVisitConstellation(cityData);
      visitConstellationActive = true;
      const lbl = fresh.querySelector('.constellation-btn-label');
      if (lbl) lbl.textContent = 'City as Map';
      fresh.classList.add('active');
    }
  });
}

function openVisitConstellation(cityData) {
  // Temporarily swap localStorage so constellation reads visitor's data
  const backups = { districtStates: localStorage.getItem('districtStates') };
  DISTRICTS.forEach(d => {
    backups[`${d}-answers`] = localStorage.getItem(`${d}-answers`);
    localStorage.setItem(`${d}-answers`, JSON.stringify(cityData.answers[d] || {}));
  });
  localStorage.setItem('districtStates', JSON.stringify(cityData.districtStates));

  openConstellation();

  const restoreInterval = setInterval(() => {
    if (!constellationActive) {
      Object.entries(backups).forEach(([k, v]) => {
        if (v === null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      });
      visitConstellationActive = false;
      clearInterval(restoreInterval);
    }
  }, 500);
}

function exitVisitMode() {
  visitModeData = null;
  visitConstellationActive = false;
  document.body.classList.remove('visit-mode');
  if (constellationActive) closeConstellation();
  initCityName();
  initDistricts();
  displayDistrictNames();
  const centerEl = document.querySelector('.header-center p');
  if (centerEl) centerEl.textContent = 'Click on a district to start';
  const banner = document.getElementById('visit-banner');
  if (banner) banner.style.display = 'none';
  initConstellationBtn();
}

function openReturnOverlay() {
  document.getElementById('return-overlay').classList.add('active');
}

function closeReturnOverlay() {
  document.getElementById('return-overlay').classList.remove('active');
}


// ─── CUSTOMIZE PANEL ─────────────────────────────────────────────────────────

function openCustomizePanel() {
  document.getElementById('customize-panel').classList.add('visible');
  document.getElementById('customize-toggle-btn').style.display = 'none';
}

function closeCustomizePanel() {
  document.getElementById('customize-panel').classList.remove('visible');
  document.getElementById('customize-toggle-btn').style.display = 'flex';
}

function initDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') applyDarkMode(true);
}

function applyDarkMode(on) {
  document.body.classList.toggle('dark-mode', on);
  localStorage.setItem('darkMode', on);
  const track = document.getElementById('dark-mode-track');
  if (track) track.classList.toggle('on', on);
}

function toggleDarkMode() {
  applyDarkMode(!document.body.classList.contains('dark-mode'));
}

const DISTRICT_POSITIONS = [
  { top: '80px',     left: '140px',  zIndex: 1 },
  { top: '80px',     right: '140px', zIndex: 1 },
  { bottom: '100px', left: '160px',  zIndex: 12 },
  { bottom: '80px',  right: '80px',  zIndex: 12 },
  { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 6 },
];

function randomizeDistricts() {
  const positions = [...DISTRICT_POSITIONS];
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  DISTRICTS.forEach((name, i) => {
    const el = document.getElementById(name);
    if (!el) return;
    const pos = positions[i];
    el.style.cssText = `
      position: absolute; width: 360px; height: 360px;
      top: ${pos.top || 'auto'}; bottom: ${pos.bottom || 'auto'};
      left: ${pos.left || 'auto'}; right: ${pos.right || 'auto'};
      transform: ${pos.transform || 'none'};
      cursor: pointer; transition: transform 0.3s ease; z-index: ${pos.zIndex};
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
  const next = !(localStorage.getItem('randomizeDistricts') === 'true');
  localStorage.setItem('randomizeDistricts', next);
  const track = document.getElementById('randomize-track');
  if (track) track.classList.toggle('on', next);
  if (next) randomizeDistricts();
  else location.reload();
}


// ─── KEYWORD EXTRACTION ───────────────────────────────────────────────────────

const EMOTION_WORDS = new Set(['happy','happiness','sad','sadness','grief','joy','joyful','love','loved','lonely','loneliness','fear','afraid','scared','anxious','anxiety','angry','anger','rage','calm','peace','peaceful','safe','unsafe','comfort','comfortable','uncomfortable','proud','pride','shame','ashamed','guilt','guilty','hopeful','hope','hopeless','lost','found','free','freedom','trapped','nostalgic','nostalgia','homesick','longing','yearning','missing','belonging','connected','disconnected','isolated','warm','warmth','cold','hurt','pain','painful','tender','gentle','alive','numb','empty','full','overwhelmed','grateful','gratitude','bitter','bittersweet','melancholy','wonder','awe','curious','confused','clarity','certain','uncertain','excited','excitement','nervous','relief','relieved','tired','exhausted','energized','inspired','inspiration','content','restless','vulnerable','strong','weak','brave','courage']);
const LOCATION_WORDS = new Set(['home','house','room','bedroom','kitchen','garden','park','school','church','temple','mosque','street','road','alley','corner','market','store','shop','cafe','restaurant','library','hospital','office','studio','apartment','building','city','town','village','country','neighborhood','district','plaza','shrine','tower','forest','lake','river','ocean','beach','mountain','field','farm','barn','garage','basement','attic','hallway','staircase','window','door','yard','balcony','rooftop','bridge','station','airport','train','bus','court','campus','dormitory','dorm','classroom','gym','pool','stadium','theater','cinema','museum','gallery','mall','hotel','motel','cabin','cottage','palace','castle','ruins','cemetery','playground','lobby','corridor','passage','square','avenue','boulevard','lane']);
const DESCRIPTIVE_WORDS = new Set(['quiet','loud','bright','dark','small','large','big','tiny','huge','narrow','wide','open','closed','clean','dirty','old','ancient','modern','empty','crowded','busy','still','chaotic','familiar','unfamiliar','strange','ordinary','special','sacred','forgotten','remembered','hidden','visible','distant','close','near','far','deep','shallow','heavy','light','soft','hard','rough','smooth','broken','whole','perfect','imperfect','beautiful','ugly','simple','complex','extraordinary','invisible','tangible','fleeting','permanent','temporary','endless','brief','vast','intimate','public','private','shared','personal','collective','universal','specific','vivid','faded','fresh','alive','growing','changing','fixed','steady','grounded','real','dreamlike','concrete','meaningful','powerful','fragile','resilient','delicate','sturdy','urgent','slow','fast']);

function isKeyword(w) {
  return EMOTION_WORDS.has(w) || LOCATION_WORDS.has(w) || DESCRIPTIVE_WORDS.has(w);
}

function extractAllKeywords(topN = 20) {
  const districtStates = JSON.parse(localStorage.getItem('districtStates') || '{}');
  const completed = DISTRICTS.filter(d => districtStates[d] === 'unlocked');
  const freq = {}, wordSources = {}, wordContexts = {};

  completed.forEach(d => {
    const raw = localStorage.getItem(`${d}-answers`);
    if (!raw) return;
    const answers = JSON.parse(raw);
    const questions = DISTRICT_QUESTIONS[d] || [];

    Object.entries(answers).forEach(([qi, answer]) => {
      const qIdx = parseInt(qi);
      if (qIdx === 5) return; // skip naming question
      const words = answer.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
      words.filter(w => w.length > 3 && isKeyword(w)).forEach(w => {
        freq[w] = (freq[w] || 0) + 1;
        if (!wordSources[w]) wordSources[w] = new Set();
        wordSources[w].add(d);
        if (!wordContexts[w]) wordContexts[w] = [];
        // Store context: which district, which question, snippet of answer
        const existing = wordContexts[w].find(c => c.district === d && c.question === questions[qIdx]);
        if (!existing) {
          wordContexts[w].push({
            district: d,
            question: questions[qIdx] || '',
            snippet: answer.length > 120 ? answer.slice(0, 120) + '…' : answer,
          });
        }
      });
    });
  });

  // Fallback: top 3 per district for any not yet found
  const STOPWORDS = new Set(['that','this','with','have','from','they','their','would','could','should','about','there','which','when','what','just','been','will','your','more','also','into','some','than','then','were','very','much','each','over','think','place','feel','felt','thought','remember','know','still','even','always','never','every','back','here','thing','things','really','because','something','anything','nothing','someone','anyone','people','person','going','getting','being','having','doing','making','around','through','after','before','during','while','these','those']);
  completed.forEach(d => {
    const raw = localStorage.getItem(`${d}-answers`);
    if (!raw) return;
    const answers = JSON.parse(raw);
    const text = Object.entries(answers).filter(([i]) => parseInt(i) !== 5).map(([,v]) => v).join(' ');
    const df = {};
    text.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).filter(w => w.length > 4 && !STOPWORDS.has(w) && !freq[w]).forEach(w => { df[w] = (df[w]||0)+1; });
    Object.entries(df).sort((a,b) => b[1]-a[1]).slice(0,3).forEach(([w,c]) => {
      freq[w] = c;
      if (!wordSources[w]) wordSources[w] = new Set();
      wordSources[w].add(d);
    });
  });

  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, topN).map(([word, count]) => ({
    word, count,
    districts: [...wordSources[word]],
    contexts: wordContexts[word] || [],
  }));
}

const DISTRICT_COLORS = {
  shrine: '#DD6204', garden: '#6A6405', cornerstore: '#D05038', tower: '#205A97', plaza: '#614973',
};

let constellationSketch = null;
let constellationActive = false;

function initConstellationBtn() {
  const states = JSON.parse(localStorage.getItem('districtStates') || '{}');
  const anyComplete = DISTRICTS.some(d => states[d] === 'unlocked');
  const btn = document.getElementById('constellation-btn');
  if (!btn) return;
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
  const mapContainer = document.querySelector('.map-container');

  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('visible'));
  mapContainer.classList.add('constellation-active');
  btn.classList.add('active');
  const lbl = btn.querySelector('.constellation-btn-label');
  if (lbl) lbl.textContent = 'City as Map';
  setTimeout(() => initConstellationSketch(), 100);
}

function closeConstellation() {
  constellationActive = false;
  const overlay = document.getElementById('constellation-overlay');
  const btn = document.getElementById('constellation-btn');
  const mapContainer = document.querySelector('.map-container');

  overlay.classList.remove('visible');
  mapContainer.classList.remove('constellation-active');
  btn.classList.remove('active');
  const lbl = btn.querySelector('.constellation-btn-label');
  if (lbl) lbl.textContent = 'City as Memories';

  // Hide info panel
  const panel = document.getElementById('constellation-info-panel');
  if (panel) panel.classList.remove('visible');

  setTimeout(() => {
    overlay.classList.add('hidden');
    if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }
  }, 600);
}

// ─── FIX 8: Constellation with side info panel ────────────────────────────────

function showConstellationInfoPanel(node) {
  const panel = document.getElementById('constellation-info-panel');
  if (!panel) return;

  const districtNames = node.districts.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
  const districtColor = node.districts.length === 1 ? DISTRICT_COLORS[node.districts[0]] : '#0A059B';

  const contextsHTML = node.contexts && node.contexts.length > 0
    ? node.contexts.map(c => `
        <div class="constellation-info-entry">
          <div class="constellation-info-question">${c.district.charAt(0).toUpperCase() + c.district.slice(1)} · ${c.question}</div>
          <div class="constellation-info-snippet">${c.snippet}</div>
        </div>
      `).join('')
    : '<div style="opacity:0.4;font-size:0.8rem;">No context available.</div>';

  panel.innerHTML = `
    <div class="constellation-info-word">
      <span style="color:${districtColor}">${node.word}</span>
      <span class="constellation-info-districts">${districtNames}</span>
    </div>
    ${contextsHTML}
  `;
  panel.classList.add('visible');
}

function initConstellationSketch() {
  const container = document.getElementById('constellation-canvas-container');
  if (!container) return;
  if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }

  const keywords = extractAllKeywords(20);
  if (keywords.length === 0) return;

  const nodes = keywords.map(k => ({ ...k, x: 0, y: 0, vx: 0, vy: 0 }));

  const ANCHORS = {
    garden:      { ax: 0.22, ay: 0.25 },
    tower:       { ax: 0.78, ay: 0.25 },
    shrine:      { ax: 0.50, ay: 0.50 },
    cornerstore: { ax: 0.22, ay: 0.75 },
    plaza:       { ax: 0.78, ay: 0.75 },
  };

  nodes.forEach(n => {
    const anchor = n.districts.length > 1
      ? { ax: 0.5, ay: 0.5 }
      : (ANCHORS[n.districts[0]] || { ax: 0.5, ay: 0.5 });
    n.anchorX = anchor.ax;
    n.anchorY = anchor.ay;
  });

  constellationSketch = new p5((sk) => {
    let W, H, frame = 0;
    let selectedIdx = null;
    const blue = getComputedStyle(document.body).getPropertyValue('--blue').trim() || '#0A059B';
    const bg   = getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#F7F2F1';
    const PAD_X = 10, PAD_Y = 6;

    sk.setup = () => {
      W = container.offsetWidth || window.innerWidth;
      H = container.offsetHeight || (window.innerHeight - 90);
      sk.createCanvas(W, H).parent('constellation-canvas-container');
      sk.textFont('monospace');
      sk.textSize(12);
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

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
          const f = 5000 / (d * d);
          a.vx -= (dx/d)*f; a.vy -= (dy/d)*f;
          b.vx += (dx/d)*f; b.vy += (dy/d)*f;
        }
      }

      nodes.forEach(n => {
        n.vx += (n.anchorX * W - n.x) * 0.015;
        n.vy += (n.anchorY * H - n.y) * 0.015;
        n.vx *= damping; n.vy *= damping;
        n.x = Math.max(60, Math.min(W - 60, n.x + n.vx));
        n.y = Math.max(30, Math.min(H - 30, n.y + n.vy));
      });

      nodes.forEach((n, idx) => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2, rh = fontSize + PAD_Y * 2;
        const isSelected = selectedIdx === idx;
        const isHovered = sk.mouseX > n.x - rw/2 && sk.mouseX < n.x + rw/2 &&
                          sk.mouseY > n.y - rh/2 && sk.mouseY < n.y + rh/2;
        const col = n.districts.length === 1 ? DISTRICT_COLORS[n.districts[0]] : blue;

        sk.noStroke();
        if (isSelected) { sk.fill(col + '33'); sk.rect(n.x - rw/2 - 4, n.y - rh/2 - 4, rw + 8, rh + 8); }
        sk.fill(isSelected || isHovered ? col : col + 'CC');
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
        showConstellationInfoPanel(nodes[hit]);
      } else {
        selectedIdx = null;
        const panel = document.getElementById('constellation-info-panel');
        if (panel) panel.classList.remove('visible');
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
      W = container.offsetWidth || window.innerWidth;
      H = container.offsetHeight || (window.innerHeight - 90);
      sk.resizeCanvas(W, H);
      nodes.forEach(n => {
        n.x = n.anchorX * W + (Math.random() - 0.5) * 40;
        n.y = n.anchorY * H + (Math.random() - 0.5) * 40;
        n.vx = 0; n.vy = 0;
      });
    };
  }, container);
}


// ─── DOM READY ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  initCityName();
  initDistricts();
  displayDistrictNames();
  checkAchievements();
  seedExampleCity();
  initConstellationBtn();

  // City name overlay
  document.getElementById('cancel-btn')?.addEventListener('click', closeCityNameOverlay);
  document.getElementById('save-name-btn')?.addEventListener('click', saveCityName);
  document.getElementById('city-name-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveCityName();
    if (e.key === 'Escape') closeCityNameOverlay();
  });
  document.getElementById('city-name-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'city-name-overlay') closeCityNameOverlay();
  });
  document.querySelector('.header-left')?.addEventListener('click', openCityNameOverlay);

  // Header center — pulse a random district
  document.querySelector('.header-center')?.addEventListener('click', () => {
    const states = JSON.parse(localStorage.getItem('districtStates')) || {};
    const locked = DISTRICTS.filter(d => states[d] !== 'unlocked');
    const pool = locked.length > 0 ? locked : DISTRICTS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const el = document.getElementById(pick);
    if (!el) return;
    updateDistrictImage(el, 'hover');
    el.classList.add('district-highlight');
    setTimeout(() => {
      updateDistrictImage(el, 'locked');
      el.classList.remove('district-highlight');
    }, 1500);
  });

  // guide overlay
  document.getElementById('guide-btn')?.addEventListener('click', openGuide);
  document.getElementById('guide-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'guide-overlay') closeGuide();
  });
  document.getElementById('guide-prev')?.addEventListener('click', () => {
    if (guideSlide > 1) { guideSlide--; showGuideSlide(guideSlide); }
  });
  document.getElementById('guide-next')?.addEventListener('click', () => {
    if (guideSlide === 0) { advanceGuide(); return; }
    if (guideSlide < GUIDE_TOTAL_STEPS) { guideSlide++; showGuideSlide(guideSlide); }
    else closeGuide();
  });
  document.querySelector('.guide-slide-concept')?.addEventListener('click', () => {
    if (guideSlide === 0) advanceGuide();
  });

  // Share overlay
  document.getElementById('share-btn')?.addEventListener('click', openShare);
  document.getElementById('share-close-btn')?.addEventListener('click', closeShare);
  document.getElementById('share-tab-share')?.addEventListener('click', () => switchShareTab('share-tab-share'));
  document.getElementById('share-tab-log')?.addEventListener('click', () => switchShareTab('share-tab-log'));
  document.getElementById('share-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'share-overlay') closeShare();
  });
  document.getElementById('share-copy-btn')?.addEventListener('click', () => {
    const code = document.getElementById('share-code-value').textContent;
    navigator.clipboard.writeText(code).catch(() => {});
    const btn = document.getElementById('share-copy-btn');
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1800);
  });

  // Visitor log
  document.getElementById('visitor-add-btn')?.addEventListener('click', addVisitorCity);
  document.getElementById('visitor-code-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addVisitorCity();
  });

  // About
  document.getElementById('about-btn')?.addEventListener('click', () => alert('About coming soon!'));

  // Return to city (visit mode)
  document.getElementById('return-btn')?.addEventListener('click', openReturnOverlay);
  document.getElementById('return-no-btn')?.addEventListener('click', closeReturnOverlay);
  document.getElementById('return-yes-btn')?.addEventListener('click', () => {
    closeReturnOverlay();
    exitVisitMode();
  });
  document.getElementById('return-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'return-overlay') closeReturnOverlay();
  });

  // Inject customize panel
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
            <div class="toggle-track" id="dark-mode-track"><div class="toggle-thumb"></div></div>
          </div>
        </div>
        <div class="customize-row">
          <span class="customize-row-label">Randomize districts</span>
          <div class="customize-toggle-cell" id="randomize-toggle">
            <div class="toggle-track" id="randomize-track"><div class="toggle-thumb"></div></div>
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
  initRandomize();

});
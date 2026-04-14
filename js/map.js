// map.js

var DISTRICTS = ['garden', 'cornerstore', 'shrine', 'tower', 'plaza'];

var DISTRICT_QUESTIONS = {
  garden:      ['What place comes to mind?', 'What were you becoming in this place?', 'How did the growth happen? What did it feel like?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
  shrine:      ['What place comes to mind?', 'What did this place hold that was precious to you?', 'How do you return to this place?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
  cornerstore: ['What place comes to mind?', 'What was your routine in this place?', 'What drew you to this specific place?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
  tower:       ['What place comes to mind?', 'What was your relationship with solitude in this space?', 'What perspective did being alone give you?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
  plaza:       ['What place comes to mind?', 'Who else was in this place? How did you connect with them?', 'What brought you together in this place?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
};

var DISTRICT_COLORS = {
  shrine:      '#DD6204',
  garden:      '#6A6405',
  cornerstore: '#D05038',
  tower:       '#205A97',
  plaza:       '#6E4C77',
};

var DISTRICT_META = [
  { key: 'garden',      label: 'Growth',    color: '#6A6405' },
  { key: 'shrine',      label: 'Reverence', color: '#DD6204' },
  { key: 'cornerstore', label: 'Routine',   color: '#D05038' },
  { key: 'tower',       label: 'Solitude',  color: '#205A97' },
  { key: 'plaza',       label: 'Community', color: '#6E4C77' },
];


// city name

function initCityName() {
  const savedName = localStorage.getItem('cityName') || 'Name Your City';
  const el = document.getElementById('city-title');
  if (el) el.textContent = savedName;
}

function openCityNameOverlay() {
  const overlay = document.getElementById('city-name-overlay');
  const input   = document.getElementById('city-name-input');
  input.value   = localStorage.getItem('cityName') || 'Name Your City';
  overlay.classList.add('active');
  input.focus();
  input.select();
}

function closeCityNameOverlay() {
  document.getElementById('city-name-overlay').classList.remove('active');
}

function saveCityName() {
  const input   = document.getElementById('city-name-input');
  const newName = input.value.trim() || 'Name Your City';
  localStorage.setItem('cityName', newName);
  const el = document.getElementById('city-title');
  if (el) el.textContent = newName;
  closeCityNameOverlay();
  unlockAchievement('named-city');
}


// districts

function initDistricts() {
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};

  DISTRICTS.forEach(name => {
    const el = document.getElementById(name);
    if (!el) return;
    const hasSessions = JSON.parse(localStorage.getItem(`${name}-sessions`) || '[]').length > 0;
    const isUnlocked  = districtStates[name] === 'unlocked' || hasSessions;

    if (isUnlocked) {
      el.classList.remove('locked');
      el.classList.add('unlocked');
      updateDistrictImage(el, 'unlocked');
    } else {
      el.classList.add('locked');
      el.classList.remove('unlocked');
      updateDistrictImage(el, 'locked');
    }

    el.addEventListener('click',      () => handleDistrictClick(name));
    el.addEventListener('mouseenter', () => { if (!isUnlocked) updateDistrictImage(el, 'hover'); });
    el.addEventListener('mouseleave', () => { if (!isUnlocked) updateDistrictImage(el, 'locked'); });
  });
}

function updateDistrictImage(district, state) {
  const name = district.dataset.district;
  const img  = district.querySelector('.district-image');
  if (!img) return;
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
  const hasSessions = JSON.parse(localStorage.getItem(`${name}-sessions`) || '[]').length > 0;
  const states      = JSON.parse(localStorage.getItem('districtStates')) || {};
  window.location.href = (states[name] === 'unlocked' || hasSessions)
    ? `districts/${name}-customize.html`
    : `districts/${name}.html`;
}

function displayDistrictNames() {
  if (document.body.classList.contains('visit-mode')) return;

  const states = JSON.parse(localStorage.getItem('districtStates')) || {};

  DISTRICTS.forEach(name => {
    const el          = document.getElementById(name);
    const hasSessions = JSON.parse(localStorage.getItem(`${name}-sessions`) || '[]').length > 0;
    const isUnlocked  = states[name] === 'unlocked' || hasSessions;
    if (!el || !isUnlocked) return;

    const savedName = localStorage.getItem(`${name}-name`);
    const label     = el.querySelector('.district-label');
    if (!label) return;

    const existing = label.querySelector('.district-custom-name');
    if (existing) existing.remove();

    if (!savedName) return;

    const span = document.createElement('span');
    span.className   = 'district-custom-name';
    span.textContent = savedName;
    span.style.cursor        = 'pointer';
    span.style.pointerEvents = 'all';
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem('currentDistrict', name);
      window.location.href = `districts/${name}-customize.html`;
    });
    label.appendChild(span);
  });

  const anyDone = DISTRICTS.some(name => {
    const hasSessions = JSON.parse(localStorage.getItem(`${name}-sessions`) || '[]').length > 0;
    return (JSON.parse(localStorage.getItem('districtStates')) || {})[name] === 'unlocked' || hasSessions;
  });
  const hint = document.getElementById('map-hint');
  if (hint && anyDone) hint.textContent = 'Forever building your city';
}


// achievements

function checkAchievements() {
  const states   = JSON.parse(localStorage.getItem('districtStates')) || {};
  const cityName = localStorage.getItem('cityName');
  DISTRICTS.forEach(d => {
    const ans = localStorage.getItem(`${d}-answers`);
    if (ans && Object.keys(JSON.parse(ans)).length > 0) unlockAchievement(`began-${d}`, true);
    if (states[d] === 'unlocked') unlockAchievement(`completed-${d}`, true);
    const sessionCount = JSON.parse(localStorage.getItem(`${d}-sessions`) || '[]').length;
    if (sessionCount >= 2) unlockAchievement(`returned-${d}`, true);
    const savedName    = localStorage.getItem(`${d}-name`);
    const defaultNames = [`The ${d.charAt(0).toUpperCase() + d.slice(1)}`];
    if (savedName && !defaultNames.includes(savedName)) unlockAchievement(`named-${d}`, true);
  });
  if (DISTRICTS.every(d => states[d] === 'unlocked')) unlockAchievement('completed-all', true);
  if (cityName && cityName !== 'Somewhere I Belong' && cityName !== 'Name Your City') unlockAchievement('named-city', true);
}


// share overlay

function openShare() {
  document.getElementById('share-overlay').classList.add('active');
  switchShareTab('share-tab-share');
  document.getElementById('share-code-value').textContent = getOrCreateCityCode();
  encodeCity();
  const usernameInput = document.getElementById('share-username-input');
  if (usernameInput) usernameInput.value = localStorage.getItem('cityUsername') || '';
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
    cityName:       localStorage.getItem('cityName') || 'Somewhere I Belong',
    code:           getOrCreateCityCode(),
    districtStates: JSON.parse(localStorage.getItem('districtStates') || '{}'),
    districtNames:  {},
    districtSkins:  {},
    answers:        {},
  };
  DISTRICTS.forEach(d => {
    data.districtNames[d] = localStorage.getItem(`${d}-name`) || '';
    data.districtSkins[d] = parseInt(localStorage.getItem(`${d}-skin`) || '0');
    data.answers[d]       = JSON.parse(localStorage.getItem(`${d}-answers`) || '{}');
  });
  localStorage.setItem(`cityData-${data.code}`, JSON.stringify(data));
  return data;
}


// visitor log

const EXAMPLE_CITY_CODE = 'NADIA-X7';

const EXAMPLE_CITY = {
  cityName: 'The City That Follows Me',
  code: EXAMPLE_CITY_CODE,
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
      1: 'It held a version of me I was still becoming.',
      4: "The most private version of myself. The one who didn't need to perform anything.",
    },
    plaza: {
      0: "Dolores Park in San Francisco, a Saturday in July. I'd just moved there. I knew no one.",
      1: 'A stranger offered me a slice of watermelon. We talked for four hours.',
      2: 'Summer, heat, the feeling that the city might let me in after all.',
      3: "Grass stains. Someone's speaker playing something I didn't know but wanted to.",
      4: "The belief that it's possible to be found. That cities have seams and you can slip through them.",
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
    list.innerHTML = '<p class="visitor-empty">No cities yet. Paste a friend\'s city code to add one.</p>';
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
  const code  = input.value.trim().toUpperCase();
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


// visit mode

let visitModeData            = null;
let visitConstellationActive = false;

function enterVisitMode(cityData) {
  visitModeData = cityData;
  document.body.classList.add('visit-mode');

  const titleEl = document.getElementById('city-title');
  if (titleEl) titleEl.textContent = cityData.cityName;

  const hintEl = document.getElementById('map-hint');
  if (hintEl) hintEl.textContent = 'Viewing mode only';

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
    const distName   = cityData.districtNames[d];

    const fresh = el.cloneNode(true);
    el.parentNode.replaceChild(fresh, el);
    fresh.querySelectorAll('.district-custom-name').forEach(s => s.remove());

    if (isUnlocked) {
      fresh.classList.remove('locked');
      fresh.classList.add('unlocked');
      const img = fresh.querySelector('.district-image');
      if (img) {
        const skins   = cityData.districtSkins || {};
        const skinIdx = skins[d];
        if (skinIdx === 1)      img.src = `assets/districts/${d}-skin2.png`;
        else if (skinIdx === 2) img.src = `assets/districts/${d}-skin3.png`;
        else                    img.src = `assets/districts/${d}-unlocked.png`;
      }
      const label = fresh.querySelector('.district-label');
      if (label && distName && !label.querySelector('.district-custom-name')) {
        const span = document.createElement('span');
        span.className   = 'district-custom-name';
        span.textContent = distName;
        label.appendChild(span);
      }
      if (label) label.style.opacity = '1';
      fresh.style.cursor = 'default';
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
  if (label) label.textContent = 'See Memories';

  const fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);

  fresh.addEventListener('click', () => {
    if (visitConstellationActive) {
      closeConstellation();
      visitConstellationActive = false;
      const lbl = fresh.querySelector('.constellation-btn-label');
      if (lbl) lbl.textContent = 'See Memories';
      fresh.classList.remove('active');
    } else {
      openVisitConstellation(cityData);
      visitConstellationActive = true;
      const lbl = fresh.querySelector('.constellation-btn-label');
      if (lbl) lbl.textContent = 'See Map';
      fresh.classList.add('active');
    }
  });
}

function openVisitConstellation(cityData) {
  const backups = { districtStates: localStorage.getItem('districtStates') };
  DISTRICTS.forEach(d => {
    backups[`${d}-answers`]  = localStorage.getItem(`${d}-answers`);
    backups[`${d}-sessions`] = localStorage.getItem(`${d}-sessions`);

    const answers = cityData.answers[d] || {};
    localStorage.setItem(`${d}-answers`, JSON.stringify(answers));

    if (Object.keys(answers).length > 0) {
      const fakeSessions = [{ date: '', timestamp: Date.now(), answers }];
      localStorage.setItem(`${d}-sessions`, JSON.stringify(fakeSessions));
    } else {
      localStorage.removeItem(`${d}-sessions`);
    }
  });
  localStorage.setItem('districtStates', JSON.stringify(cityData.districtStates));

  constellationReadOnly = true;
  openConstellation();

  const restoreInterval = setInterval(() => {
    if (!constellationActive) {
      Object.entries(backups).forEach(([k, v]) => {
        if (v === null) localStorage.removeItem(k);
        else            localStorage.setItem(k, v);
      });
      visitConstellationActive = false;
      clearInterval(restoreInterval);
    }
  }, 500);
}

function exitVisitMode() {
  visitModeData            = null;
  visitConstellationActive = false;
  document.body.classList.remove('visit-mode');
  if (constellationActive) closeConstellation();

  DISTRICTS.forEach(d => {
    const el = document.getElementById(d);
    if (!el) return;
    el.querySelectorAll('.district-custom-name').forEach(s => s.remove());
  });
  initCityName();
  initDistricts();
  displayDistrictNames();
  const hintEl = document.getElementById('map-hint');
  if (hintEl) hintEl.textContent = 'Click on a district to start';
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


// settings panel

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
  { top: '80px',     left: '140px',  zIndex: 1  },
  { top: '80px',     right: '140px', zIndex: 1  },
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
  if (next) {
    randomizeDistricts();
  } else {
    // reset district positions back to default without reloading
    DISTRICTS.forEach(name => {
      const el = document.getElementById(name);
      if (el) el.style.cssText = '';
    });
  }
}


// district photo overlay

function getRandomDistrictPhoto(district) {
  const sessions = JSON.parse(localStorage.getItem(`${district}-sessions`) || '[]');
  const photos   = sessions
    .map(s => localStorage.getItem(`${district}-photo-${s.timestamp}`))
    .filter(Boolean);
  if (photos.length === 0) return null;
  return photos[Math.floor(Math.random() * photos.length)];
}

function initShowPhotos() {
  const isOn = localStorage.getItem('showPhotos') === 'true';
  const track = document.getElementById('show-photos-track');
  if (track) track.classList.toggle('on', isOn);
  if (isOn) applyDistrictPhotos(true);
}

function toggleShowPhotos() {
  const next = !(localStorage.getItem('showPhotos') === 'true');
  localStorage.setItem('showPhotos', next);
  const track = document.getElementById('show-photos-track');
  if (track) track.classList.toggle('on', next);
  applyDistrictPhotos(next);
}

function applyDistrictPhotos(on) {
  DISTRICTS.forEach(d => {
    const el = document.getElementById(d);
    if (!el) return;
    el.querySelectorAll('.district-photo-layer').forEach(l => l.remove());
    if (!on) return;
    const photo = getRandomDistrictPhoto(d);
    if (!photo) return;
    const layer = document.createElement('div');
    layer.className = 'district-photo-layer';
    layer.style.backgroundImage = `url(${photo})`;
    el.insertBefore(layer, el.firstChild);
  });
}


// keyword extraction for constellation

const EMOTION_WORDS = new Set([
  'happy','happiness','sad','sadness','grief','joy','joyful','love','loved',
  'lonely','loneliness','fear','afraid','scared','anxious','anxiety','angry',
  'anger','rage','calm','peace','peaceful','safe','unsafe','comfort','comfortable',
  'uncomfortable','proud','pride','shame','ashamed','guilt','guilty','hopeful',
  'hope','hopeless','lost','found','free','freedom','trapped','nostalgic',
  'nostalgia','homesick','longing','yearning','missing','belonging','connected',
  'disconnected','isolated','warm','warmth','cold','hurt','pain','painful',
  'tender','gentle','alive','numb','empty','full','overwhelmed','grateful',
  'gratitude','bitter','bittersweet','melancholy','wonder','awe','curious',
  'confused','clarity','certain','uncertain','excited','excitement','nervous',
  'relief','relieved','tired','exhausted','energized','inspired','inspiration',
  'content','restless','vulnerable','strong','weak','brave','courage',
  'reverence','growth','routine','solitude','community'
]);

const LOCATION_WORDS = new Set([
  'home','house','room','bedroom','kitchen','garden','park','school','church',
  'temple','mosque','street','road','alley','corner','market','store','shop',
  'cafe','restaurant','library','hospital','office','studio','apartment',
  'building','city','town','village','country','neighborhood','district','plaza',
  'shrine','tower','forest','lake','river','ocean','beach','mountain','field',
  'farm','barn','garage','basement','attic','hallway','staircase','window',
  'door','yard','balcony','rooftop','bridge','station','airport','train','bus',
  'court','campus','dormitory','dorm','classroom','gym','pool','stadium',
  'theater','cinema','museum','gallery','mall','hotel','motel','cabin','cottage',
  'palace','castle','ruins','cemetery','playground','lobby','corridor','passage',
  'square','avenue','boulevard','lane'
]);

const DESCRIPTIVE_WORDS = new Set([
  'quiet','loud','bright','dark','small','large','big','tiny','huge','narrow',
  'wide','open','closed','clean','dirty','old','ancient','modern','empty',
  'crowded','busy','still','chaotic','familiar','unfamiliar','strange','ordinary',
  'special','sacred','forgotten','remembered','hidden','visible','distant','close',
  'near','far','deep','shallow','heavy','light','soft','hard','rough','smooth',
  'broken','whole','perfect','imperfect','beautiful','ugly','simple','complex',
  'extraordinary','invisible','tangible','fleeting','permanent','temporary',
  'endless','brief','vast','intimate','public','private','shared','personal',
  'collective','universal','specific','vivid','faded','fresh','alive','growing',
  'changing','fixed','steady','grounded','real','dreamlike','concrete',
  'meaningful','powerful','fragile','resilient','delicate','sturdy','urgent',
  'slow','fast'
]);

function isKeyword(w) {
  return EMOTION_WORDS.has(w) || LOCATION_WORDS.has(w) || DESCRIPTIVE_WORDS.has(w);
}

const TIME_OPTIONS = [
  { value: 'week',  label: 'Past week'  },
  { value: 'month', label: 'Past month' },
  { value: 'year',  label: 'Past year'  },
  { value: 'all',   label: 'All time'   },
];

let constellationTimeRange = 'all';
let constellationDistricts = new Set(['garden', 'shrine', 'cornerstore', 'tower', 'plaza']);

function extractAllKeywords(topN = 20, timeRange = 'all', activeDistricts = null) {
  const now        = Date.now();
  const cutoffDays = { week: 7, month: 30, year: 365, all: Infinity };
  const days       = cutoffDays[timeRange] ?? Infinity;
  const cutoff     = days === Infinity ? 0 : now - days * 24 * 60 * 60 * 1000;

  const completed = DISTRICTS.filter(d => {
    if (activeDistricts && !activeDistricts.has(d)) return false;
    return JSON.parse(localStorage.getItem(`${d}-sessions`) || '[]').length > 0;
  });

  const freq = {}, wordSources = {}, wordContexts = {};

  completed.forEach(d => {
    const distSessions = JSON.parse(localStorage.getItem(`${d}-sessions`) || '[]')
      .filter(s => s.timestamp >= cutoff);
    if (distSessions.length === 0) return;

    const questions = DISTRICT_QUESTIONS[d] || [];

    distSessions.filter(s => !s.isTrainThought).forEach(session => {
      Object.entries(session.answers).forEach(([qi, answer]) => {
        const qIdx = parseInt(qi);
        if (qIdx === 5 || !answer) return;
        const words = answer.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
        words.filter(w => w.length > 3 && isKeyword(w)).forEach(w => {
          freq[w] = (freq[w] || 0) + 1;
          if (!wordSources[w]) wordSources[w] = new Set();
          wordSources[w].add(d);
          if (!wordContexts[w]) wordContexts[w] = [];
          const sessionDate = session.date || '';
          wordContexts[w].push({
            district: d,
            question: sessionDate
              ? `${sessionDate} · ${questions[qIdx] || ''}`
              : (questions[qIdx] || ''),
            snippet: answer.length > 120 ? answer.slice(0, 120) + '...' : answer,
          });
        });
      });
    });
  });

  const STOPWORDS = new Set([
    'that','this','with','have','from','they','their','would','could','should',
    'about','there','which','when','what','just','been','will','your','more',
    'also','into','some','than','then','were','very','much','each','over',
    'think','place','feel','felt','thought','remember','know','still','even',
    'always','never','every','back','here','thing','things','really','because',
    'something','anything','nothing','someone','anyone','people','person',
    'going','getting','being','having','doing','making','around','through',
    'after','before','during','while','these','those'
  ]);

  completed.forEach(d => {
    const distSessions2 = JSON.parse(localStorage.getItem(`${d}-sessions`) || '[]')
      .filter(s => s.timestamp >= cutoff && !s.isTrainThought);
    if (distSessions2.length === 0) return;

    const answers = distSessions2.reduce((acc, s) => {
      Object.entries(s.answers).forEach(([k, v]) => { acc[k] = acc[k] ? acc[k] + ' ' + v : v; });
      return acc;
    }, {});

    const text = Object.entries(answers).filter(([i]) => parseInt(i) !== 5).map(([, v]) => v).join(' ');
    const df   = {};
    text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
      .filter(w => w.length > 4 && !STOPWORDS.has(w) && !freq[w])
      .forEach(w => { df[w] = (df[w] || 0) + 1; });

    const questions = DISTRICT_QUESTIONS[d] || [];
    Object.entries(df).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([w, c]) => {
      if (c < 2) return; // only add fallback words that appear at least twice
      freq[w] = c;
      if (!wordSources[w]) wordSources[w] = new Set();
      wordSources[w].add(d);
      if (!wordContexts[w]) wordContexts[w] = [];
      distSessions2.forEach(session => {
        Object.entries(session.answers).forEach(([qi, answer]) => {
          if (!answer || parseInt(qi) === 5) return;
          if (answer.toLowerCase().includes(w)) {
            const sessionDate = session.date || '';
            wordContexts[w].push({
              district: d,
              question: sessionDate
                ? `${sessionDate} · ${questions[parseInt(qi)] || ''}`
                : (questions[parseInt(qi)] || ''),
              snippet: answer.length > 120 ? answer.slice(0, 120) + '...' : answer,
            });
          }
        });
      });
    });
  });

  return Object.entries(freq).sort((a, b) => b[1] - a[1])
    .filter(([word, count]) => count >= 2)
    .slice(0, topN).map(([word, count]) => ({
    word, count,
    districts: [...wordSources[word]],
    contexts:  wordContexts[word] || [],
  }));
}


// ─── constellation + memories picker ─────────────────────────────────────────

let constellationSketch   = null;
let constellationActive   = false;
let constellationReadOnly = false;

// memories picker state
var memoriesPickerInit   = false;
var memoriesCurrentView  = null;
var MEMORIES_GAP         = 72;

function initConstellationBtn() {
  const states      = JSON.parse(localStorage.getItem('districtStates') || '{}');
  const anyComplete = DISTRICTS.some(d => {
    const hasSessions = JSON.parse(localStorage.getItem(`${d}-sessions`) || '[]').length > 0;
    return states[d] === 'unlocked' || hasSessions;
  });
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
  const overlay      = document.getElementById('constellation-overlay');
  const btn          = document.getElementById('constellation-btn');
  const mapContainer = document.querySelector('.map-container');

  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('visible'));
  mapContainer.classList.add('constellation-active');
  btn.classList.add('active');
  const lbl = btn.querySelector('.constellation-btn-label');
  if (lbl) lbl.textContent = 'See Map';

  // show the picker instead of jumping straight to the sketch
  setTimeout(() => openMemoriesPicker(), 100);
}

function closeConstellation() {
  constellationActive   = false;
  constellationReadOnly = false;
  const overlay         = document.getElementById('constellation-overlay');
  const btn             = document.getElementById('constellation-btn');
  const mapContainer    = document.querySelector('.map-container');

  overlay.classList.remove('visible');
  mapContainer.classList.remove('constellation-active');
  btn.classList.remove('active');
  const lbl = btn.querySelector('.constellation-btn-label');
  if (lbl) lbl.textContent = 'See Memories';

  const panel = document.getElementById('constellation-info-panel');
  if (panel) panel.classList.remove('visible');

  // tear down any active view
  teardownMemoriesView();

  setTimeout(() => {
    overlay.classList.add('hidden');
    if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }
    const controls = document.getElementById('constellation-controls');
    if (controls) controls.remove();
    // reset picker so it animates fresh next open
    memoriesPickerInit = false;
    collapseMemoriesLayers();
  }, 600);
}


// memories picker

function openMemoriesPicker() {
  var picker = document.getElementById('memories-picker');
  var view   = document.getElementById('memories-view');
  if (!picker) return;

  // hide the view panel, show the picker
  if (view) {
    view.classList.remove('visible');
    view.classList.add('hidden');
  }

  picker.classList.add('visible');

  if (!memoriesPickerInit) {
    // attach click handlers once
    document.querySelectorAll('.memories-layer').forEach(function(layer) {
      layer.addEventListener('click', function() {
        openMemoriesView(layer.dataset.view);
      });
    });
    var backBtn = document.getElementById('memories-back-btn');
    if (backBtn) backBtn.addEventListener('click', closeMemoriesView);
    memoriesPickerInit = true;
  }

  fanMemoriesLayers();
}

function fanMemoriesLayers() {
  var layers = document.querySelectorAll('.memories-layer');
  layers.forEach(function(layer, i) {
    setTimeout(function() {
      layer.style.transform = 'translateY(' + (i * MEMORIES_GAP) + 'px)';
      layer.classList.add('fanned');
    }, i * 65);
  });
}

function collapseMemoriesLayers(cb) {
  var layers = document.querySelectorAll('.memories-layer');
  layers.forEach(function(layer) {
    layer.style.transform = 'translateY(0px)';
    layer.classList.remove('fanned');
  });
  if (cb) setTimeout(cb, 420);
}

function openMemoriesView(viewId) {
  var picker     = document.getElementById('memories-picker');
  var view       = document.getElementById('memories-view');
  var viewLabel  = document.getElementById('memories-view-label');
  var nums       = { topography:'I', constellation:'II', report:'III' };
  var names      = { topography:'Topography + Growth', constellation:'Constellation', report:'Report' };

  memoriesCurrentView = viewId;
  if (viewLabel) viewLabel.textContent = (nums[viewId] || '') + ' — ' + (names[viewId] || '');

  collapseMemoriesLayers(function() {
    if (picker) picker.classList.remove('visible');
    // swap: hide See Memories button, show ← views in same spot
    var constBtn = document.getElementById('constellation-btn');
    var backBtn  = document.getElementById('memories-back-btn');
    if (constBtn) constBtn.style.display = 'none';
    if (backBtn)  backBtn.classList.add('visible');
    if (view) {
      view.classList.remove('hidden');
      requestAnimationFrame(function() {
        view.classList.add('visible');
        renderMemoriesView(viewId);
      });
    }
  });
}

function closeMemoriesView() {
  var picker   = document.getElementById('memories-picker');
  var view     = document.getElementById('memories-view');
  var backBtn  = document.getElementById('memories-back-btn');
  var constBtn = document.getElementById('constellation-btn');

  teardownMemoriesView();

  if (view) view.classList.remove('visible');
  if (backBtn) backBtn.classList.remove('visible');

  setTimeout(function() {
    if (view) view.classList.add('hidden');
    // restore the See Map button
    if (constBtn) constBtn.style.display = '';
    if (picker) {
      picker.classList.add('visible');
      fanMemoriesLayers();
    }
  }, 380);
}

function teardownMemoriesView() {
  // tear down constellation sketch if running
  if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }
  // tear down any other p5 sketch (topo, growth, etc)
  if (window._memoriesSketch) { window._memoriesSketch.remove(); window._memoriesSketch = null; }
  // tear down new vanilla constellation
  if (window._constCleanup) { window._constCleanup(); window._constCleanup = null; }
  const controls = document.getElementById('constellation-controls');
  if (controls) controls.remove();
  const canvas = document.querySelector('#constellation-canvas-container canvas');
  if (canvas) canvas.remove();
  // remove topo tooltip if present
  const ttip = document.getElementById('topo-tip');
  if (ttip) ttip.remove();
  // hide canvas container
  const cc = document.getElementById('constellation-canvas-container');
  if (cc) cc.classList.add('hidden');
  // clear other view canvas
  const vc = document.getElementById('memories-view-canvas');
  if (vc) vc.innerHTML = '';
  memoriesCurrentView = null;
}

function renderMemoriesView(viewId) {
  // show/hide the correct container
  var cc = document.getElementById('constellation-canvas-container');
  var vc = document.getElementById('memories-view-canvas');

  if (viewId === 'constellation') {
    if (cc) cc.classList.remove('hidden');
    if (vc) vc.style.display = 'none';
    // defer until after CSS transition reveals the container
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        initNewConstellationSketch();
      });
    });
  } else {
    if (cc) cc.classList.add('hidden');
    if (vc) vc.style.display = 'block';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        if (viewId === 'topography') renderTopoView(vc);
        if (viewId === 'report')     renderReportView(vc);
        if (viewId !== 'topography' && viewId !== 'report' && vc) {
          vc.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--font-whois);font-size:0.78rem;color:var(--blue);opacity:0.35;letter-spacing:0.06em;">' + viewId + ' view — coming soon</div>';
        }
      });
    });
  }
}


// ─── view i: topography ───────────────────────────────────────────────────────
// rings encode emotional intensity (sessions × avg response depth) per district
// rings skew organically toward high-intensity neighbors
// hover a ring to reveal the logged location name and date

function renderTopoView(container) {
  if (!container) return;
  container.innerHTML = '';
  container.style.position = 'relative';

  // build district data from localStorage
  var topoDistricts = DISTRICTS.map(function(key) {
    var sessions = JSON.parse(localStorage.getItem(key + '-sessions') || '[]')
      .filter(function(s) { return !s.isTrainThought; });
    // sort newest first — newest session = innermost (smallest) ring
    sessions.sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
    var now = Date.now();
    // count how many times each place name appears
    var placeCounts = {};
    sessions.forEach(function(s) {
      var name = (s.answers && s.answers[0]) ? s.answers[0].slice(0, 40) : key;
      placeCounts[name] = (placeCounts[name] || 0) + 1;
    });
    var logs = sessions.map(function(s, si) {
      var totalLen = Object.values(s.answers || {}).join(' ').length;
      var depth    = Math.min(totalLen / 800, 1);
      var name     = (s.answers && s.answers[0]) ? s.answers[0].slice(0, 40) : key;
      var ageDays  = ((now - (s.timestamp || now)) / (1000 * 60 * 60 * 24));
      var recency  = Math.max(0.2, 1 - ageDays / 90);
      // multiEntry = this place has been logged more than once
      var multiEntry = placeCounts[name] > 1;
      return { name: name, date: s.date || '', depth: depth, recency: recency, multiEntry: multiEntry, timestamp: s.timestamp || now };
    });
    var intensity = logs.reduce(function(sum, l) { return sum + l.depth; }, 0);
    return {
      key:         key,
      color:       DISTRICT_COLORS[key] || '#0c2177',
      logs:        logs,
      rawSessions: sessions,
      intensity:   intensity,
    };
  }).filter(function(d) { return d.logs.length > 0; });

  if (topoDistricts.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--font-whois);font-size:0.78rem;color:var(--blue);opacity:0.35;letter-spacing:0.06em;">complete a district to see its topography</div>';
    return;
  }

  // place district anchors — spread evenly if < 5 districts
  var anchorPositions = [
    { ax: 0.55, ay: 0.30 },
    { ax: 0.42, ay: 0.58 },
    { ax: 0.78, ay: 0.62 },
    { ax: 0.20, ay: 0.65 },
    { ax: 0.18, ay: 0.28 },
  ];
  topoDistricts.forEach(function(d, i) {
    var pos = anchorPositions[i] || { ax: 0.5, ay: 0.5 };
    d.ax = pos.ax;
    d.ay = pos.ay;
  });

  // build tooltip element
  var htip = document.createElement('div');
  htip.id = 'topo-tip';
  htip.style.cssText = [
    'position:absolute',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.15s',
    'background:var(--color-bg)',
    'border:1px solid rgba(12,33,119,0.35)',
    'padding:8px 12px',
    'z-index:20',
    'max-width:220px',
    'font-family:var(--font-whois)',
  ].join(';');
  container.appendChild(htip);

  var topoSketch = new p5(function(sk) {
    var W, H;
    var STEPS = 90;
    var rings  = [];   // { dist, color, log, li, cx, cy, baseR, amp, seed, pts, depth }
    var hovRing = null;
    var mouseX = 0, mouseY = 0;

    // "view entry" button overlay
    var viewBtn = document.createElement('button');
    viewBtn.textContent = 'View entry';
    viewBtn.style.cssText = 'position:absolute;pointer-events:all;display:none;z-index:30;'
      + 'background:var(--blue);color:var(--color-bg);border:none;font-family:var(--font-whois);'
      + 'font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;padding:0.5rem 1rem;cursor:pointer;';
    container.appendChild(viewBtn);

    function hexRgb(h) {
      return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    }

    function organicR(baseR, angle, seed, amp) {
      return baseR
        + Math.sin(angle * 2 + seed * 1.3) * amp * 0.5
        + Math.sin(angle * 3 + seed * 0.8) * amp * 0.3
        + Math.sin(angle * 5 + seed * 2.0) * amp * 0.2;
    }

    function buildRings() {
      rings = [];
      topoDistricts.forEach(function(d) {
        var n = d.logs.length;
        // warp center toward high-intensity neighbors
        var warpX = 0, warpY = 0;
        topoDistricts.forEach(function(other) {
          if (other.key === d.key) return;
          var odx = other.ax * W - d.ax * W;
          var ody = other.ay * H - d.ay * H;
          var dist = Math.sqrt(odx * odx + ody * ody);
          if (dist < 1) return;
          var pull = d.intensity * other.intensity / (dist * dist) * 60;
          warpX += (odx / dist) * pull;
          warpY += (ody / dist) * pull;
        });
        var cx = d.ax * W + warpX * 0.08;
        var cy = d.ay * H + warpY * 0.08;

        d.logs.forEach(function(log, li) {
          // li=0 is newest — innermost ring
          var ringIdx = li;

          // spacing based on temporal distance to the next (older) session
          // logs are sorted newest-first, so logs[li+1] is the previous session
          var dayGap = 0;
          if (li < n - 1) {
            var tsA = log.timestamp || 0;
            var tsB = (d.rawSessions && d.rawSessions[li + 1] && d.rawSessions[li + 1].timestamp) || tsA;
            dayGap = Math.abs(tsA - tsB) / (1000 * 60 * 60 * 24);
          }
          // map day gap to spacing: 0 days = 30px, 30+ days = 90px
          var spacing = 30 + Math.min(dayGap / 30, 1) * 60;
          // accumulate radii — each ring's baseR = sum of all inner spacings
          var baseR = 55;
          for (var prev = 0; prev < li; prev++) {
            var prevGap = 0;
            if (prev < n - 1) {
              var ptsA = (d.rawSessions && d.rawSessions[prev] && d.rawSessions[prev].timestamp) || 0;
              var ptsB = (d.rawSessions && d.rawSessions[prev + 1] && d.rawSessions[prev + 1].timestamp) || ptsA;
              prevGap = Math.abs(ptsA - ptsB) / (1000 * 60 * 60 * 24);
            }
            baseR += 30 + Math.min(prevGap / 30, 1) * 60;
          }
          baseR += log.depth * 22;

          var amp  = 10 + ringIdx * 4.5 + d.intensity * 2.0;
          var seed = li * 4.7 + d.ax * 10;

          // directional warp: rings bulge toward heavy neighbors
          var pts = [];
          for (var s = 0; s <= STEPS; s++) {
            var angle   = (s / STEPS) * 2 * Math.PI;
            var dirWarp = 0;
            topoDistricts.forEach(function(other) {
              if (other.key === d.key) return;
              var odx  = other.ax * W - cx;
              var ody  = other.ay * H - cy;
              var dist = Math.sqrt(odx * odx + ody * ody);
              if (dist < 1) return;
              var dot  = Math.cos(angle) * (odx / dist) + Math.sin(angle) * (ody / dist);
              var bulge = Math.max(0, dot) * other.intensity * (d.intensity * 0.4) / (dist * 0.025);
              dirWarp += bulge;
            });
            var rad = organicR(baseR, angle, seed, amp) + dirWarp * 0.6;
            pts.push({ x: Math.max(4, Math.min(W - 4, cx + Math.cos(angle) * rad)), y: Math.max(4, Math.min(H - 4, cy + Math.sin(angle) * rad)) });
          }
          rings.push({ dist: d.key, color: d.color, log: log, li: li, ringIdx: ringIdx, cx: cx, cy: cy, baseR: baseR, amp: amp, seed: seed, pts: pts, depth: log.depth, n: n });
        });
      });
    }

    sk.setup = function() {
      var overlay = document.getElementById('constellation-overlay');
      W = container.offsetWidth || window.innerWidth;
      H = (overlay ? overlay.offsetHeight : window.innerHeight) - 50;
      var cnv = sk.createCanvas(W, H);
      cnv.parent(container);
      container.style.height = H + 'px';
      buildRings();
      // run animation loop for gentle pulse
    };

    sk.windowResized = function() {
      var overlay = document.getElementById('constellation-overlay');
      W = container.offsetWidth || window.innerWidth;
      H = (overlay ? overlay.offsetHeight : window.innerHeight) - 50;
      container.style.height = H + 'px';
      sk.resizeCanvas(W, H);
      buildRings();
    };

    sk.mouseMoved = function() {
      mouseX = sk.mouseX; mouseY = sk.mouseY;
      var found = null;
      outer: for (var ri = 0; ri < rings.length; ri++) {
        var ring = rings[ri];
        for (var pi = 0; pi < ring.pts.length - 1; pi++) {
          var p1 = ring.pts[pi], p2 = ring.pts[pi + 1];
          var dx = p2.x - p1.x, dy = p2.y - p1.y;
          var lenSq = dx * dx + dy * dy;
          var t = lenSq > 0 ? ((sk.mouseX - p1.x) * dx + (sk.mouseY - p1.y) * dy) / lenSq : 0;
          t = Math.max(0, Math.min(1, t));
          var nx = p1.x + t * dx, ny = p1.y + t * dy;
          if (Math.sqrt((sk.mouseX - nx) * (sk.mouseX - nx) + (sk.mouseY - ny) * (sk.mouseY - ny)) < 10) {
            found = ri; break outer;
          }
        }
      }
      if (found !== hovRing) {
        hovRing = found;
        if (found !== null) {
          var r = rings[found];
          htip.innerHTML = '<div style="font-size:12px;color:' + r.color + ';letter-spacing:0.04em;margin-bottom:4px;">' + r.log.name + '</div>'
            + '<div style="font-size:9px;color:var(--blue);opacity:0.45;">' + (r.log.date || '') + ' · ' + r.dist + '</div>';
          var lx = sk.mouseX < W * 0.6;
          htip.style.left   = lx ? (sk.mouseX + 14) + 'px' : '';
          htip.style.right  = lx ? '' : (W - sk.mouseX + 14) + 'px';
          htip.style.top    = (sk.mouseY - 10) + 'px';
          htip.style.opacity = '1';
          // position view entry button below tooltip
          viewBtn.style.display = 'block';
          viewBtn.style.left = lx ? (sk.mouseX + 14) + 'px' : '';
          viewBtn.style.right = lx ? '' : (W - sk.mouseX + 14) + 'px';
          viewBtn.style.top  = (sk.mouseY + 36) + 'px';
          viewBtn.onclick = function() {
            localStorage.setItem('currentDistrict', r.dist);
            window.location.href = 'districts/' + r.dist + '-customize.html';
          };
        } else {
          htip.style.opacity = '0';
          viewBtn.style.display = 'none';
        }
      } else if (found !== null) {
        var lx2 = sk.mouseX < W * 0.6;
        htip.style.left  = lx2 ? (sk.mouseX + 14) + 'px' : '';
        htip.style.right = lx2 ? '' : (W - sk.mouseX + 14) + 'px';
        htip.style.top   = (sk.mouseY - 10) + 'px';
        viewBtn.style.left  = lx2 ? (sk.mouseX + 14) + 'px' : '';
        viewBtn.style.right = lx2 ? '' : (W - sk.mouseX + 14) + 'px';
        viewBtn.style.top   = (sk.mouseY + 36) + 'px';
      }
    };

    sk.draw = function() {
      var bg = getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#F7F2F1';
      var t = sk.frameCount * 0.012; // slow animation tick

      sk.background(bg);

      // graph paper grid
      sk.stroke(12, 33, 119, 18); sk.strokeWeight(0.6);
      for (var gx = 0; gx < W; gx += 120) sk.line(gx, 0, gx, H);
      for (var gy = 0; gy < H; gy += 120) sk.line(0, gy, W, gy);
      sk.stroke(12, 33, 119, 8); sk.strokeWeight(0.3);
      for (var sx = 0; sx < W; sx += 30) sk.line(sx, 0, sx, H);
      for (var sy = 0; sy < H; sy += 30) sk.line(0, sy, W, sy);

      // territory fill
      topoDistricts.forEach(function(d) {
        var distRings = rings.filter(function(r) { return r.dist === d.key; });
        if (!distRings.length) return;
        var outerRing = distRings[distRings.length - 1];
        var rgb = hexRgb(d.color);
        sk.fill(rgb[0], rgb[1], rgb[2], 8);
        sk.noStroke();
        sk.beginShape();
        outerRing.pts.forEach(function(p) { sk.vertex(p.x, p.y); });
        sk.endShape(sk.CLOSE);
      });

      // crosshair lines — extend from hovered ring center to canvas edges
      if (hovRing !== null) {
        var hr = rings[hovRing];
        var hrgb = hexRgb(hr.color);
        sk.stroke(hrgb[0], hrgb[1], hrgb[2], 55);
        sk.strokeWeight(0.6);
        sk.drawingContext.setLineDash([4, 8]);
        // horizontal line
        sk.line(0, hr.cy, W, hr.cy);
        // vertical line
        sk.line(hr.cx, 0, hr.cx, H);
        sk.drawingContext.setLineDash([]);
        // small crosshair tick marks at center
        sk.stroke(hrgb[0], hrgb[1], hrgb[2], 120);
        sk.strokeWeight(1.2);
        sk.line(hr.cx - 8, hr.cy, hr.cx + 8, hr.cy);
        sk.line(hr.cx, hr.cy - 8, hr.cx, hr.cy + 8);
      }

      // animated contour rings — newest innermost+smallest, oldest outermost+largest
      rings.forEach(function(ring, ri) {
        var rgb    = hexRgb(ring.color);
        var isH    = ri === hovRing;

        // newest ring (li=0) pulses more visibly
        var isNewest = ring.li === 0;
        var pulseAmp = isNewest ? 0.045 : 0.012;
        var pulse    = 1 + Math.sin(t * (isNewest ? 1.6 : 0.9) + ri * 0.4) * pulseAmp;

        // recency drives opacity: newest = bright, oldest = dim
        var alpha  = isH ? 220 : Math.round(40 + ring.log.recency * 160 + ring.depth * 30);
        var weight = isH ? 2.5  : 0.6 + ring.log.recency * 1.4 + ring.depth * 0.3;
        sk.stroke(rgb[0], rgb[1], rgb[2], alpha);
        sk.strokeWeight(weight);
        isH ? sk.fill(rgb[0], rgb[1], rgb[2], 14) : sk.noFill();

        // dashed = multiple sessions logged at this same place
        if (!isH && ring.log.multiEntry) {
          sk.drawingContext.setLineDash([5, 5]);
        } else {
          sk.drawingContext.setLineDash([]);
        }

        var cx = ring.cx, cy = ring.cy;
        sk.push();
        sk.translate(cx, cy);
        sk.scale(pulse);
        sk.translate(-cx, -cy);
        sk.beginShape();
        ring.pts.forEach(function(p) { sk.vertex(p.x, p.y); });
        sk.endShape(sk.CLOSE);
        sk.pop();

        sk.drawingContext.setLineDash([]);
      });

      // district labels at center of ring cluster
      topoDistricts.forEach(function(d) {
        var rgb  = hexRgb(d.color);

        var distRings = rings.filter(function(r) { return r.dist === d.key; });
        if (!distRings.length) return;
        var cx = distRings[0].cx, cy = distRings[0].cy;

        sk.noStroke();
        sk.fill(rgb[0], rgb[1], rgb[2], 180);
        sk.textFont('monospace');
        sk.textSize(13);
        sk.textAlign(sk.CENTER, sk.CENTER);
        var label = d.key.charAt(0).toUpperCase() + d.key.slice(1);
        sk.text(label, cx, cy);
        sk.fill(rgb[0], rgb[1], rgb[2], 80);
        sk.textSize(10);
        sk.text(d.logs.length + ' session' + (d.logs.length !== 1 ? 's' : ''), cx, cy + 18);
      });

      // legend box
      drawLegend(sk, W, [
        { dot: null, text: 'Ring = one session' },
        { dot: null, text: 'Innermost = most recent' },
        { dot: null, text: 'Dashed = multiple visits to same place' },
        { dot: null, text: 'Brighter = more recent' },
        { dot: null, text: 'Hover to reveal' },
      ]);
    };

  }, container);

  window._memoriesSketch = topoSketch;
}

// view i: topography + growth combined
function renderTopoGrowthView(container) {
  if (!container) return;
  container.innerHTML = '';
  container.style.position = 'relative';

  var topoDistricts = DISTRICTS.map(function(key) {
    var sessions = JSON.parse(localStorage.getItem(key+'-sessions')||'[]').filter(function(s){return !s.isTrainThought;});
    var logs = sessions.map(function(s){
      var depth=Math.min(Object.values(s.answers||{}).join(' ').length/800,1);
      return {name:(s.answers&&s.answers[0])?s.answers[0].slice(0,40):key, date:s.date||'', depth:depth};
    });
    return {key:key,color:DISTRICT_COLORS[key]||'#0c2177',logs:logs,intensity:logs.reduce(function(a,l){return a+l.depth;},0)};
  }).filter(function(d){return d.logs.length>0;});

  var DKEYS=['shrine','cornerstore','tower','plaza','garden'];
  var STEM_Y_FRACS={shrine:0.15,cornerstore:0.32,tower:0.50,plaza:0.68,garden:0.85};
  var SESSIONS=[],dayZero=null;
  DKEYS.forEach(function(key){
    JSON.parse(localStorage.getItem(key+'-sessions')||'[]').filter(function(s){return !s.isTrainThought;}).forEach(function(s){
      var ts=s.timestamp||Date.now(); if(dayZero===null||ts<dayZero)dayZero=ts;
    });
  });
  if(!dayZero)dayZero=Date.now()-30*24*60*60*1000;
  DKEYS.forEach(function(key){
    JSON.parse(localStorage.getItem(key+'-sessions')||'[]').filter(function(s){return !s.isTrainThought;}).forEach(function(s){
      var ts=s.timestamp||Date.now();
      var day=Math.round((ts-dayZero)/(24*60*60*1000));
      var depth=Math.min(Object.values(s.answers||{}).join(' ').length/800,1);
      var note=(s.answers&&s.answers[0])?s.answers[0].slice(0,55):(key+' · '+(s.date||''));
      SESSIONS.push({dist:key,day:day,depth:depth,note:note,_nx:0,_ny:0});
    });
  });
  var maxDay=Math.max.apply(null,SESSIONS.map(function(s){return s.day;}))||30;
  var SAME_DAY=[];
  for(var i=0;i<SESSIONS.length;i++)for(var j=i+1;j<SESSIONS.length;j++){
    if(SESSIONS[i].day===SESSIONS[j].day&&SESSIONS[i].dist!==SESSIONS[j].dist)SAME_DAY.push([i,j]);
  }

  var htip=document.createElement('div');
  htip.style.cssText='position:absolute;pointer-events:none;opacity:0;transition:opacity 0.15s;background:var(--color-bg);border:1px solid rgba(12,33,119,0.35);padding:8px 12px;z-index:20;max-width:220px;font-family:var(--font-whois);';
  container.appendChild(htip);

  var hovRing=null,hovSess=null,hovDist=null,topoRings=[],STEPS=90;
  var LW=0.46;

  var combo=new p5(function(sk){
    var W,H,frame=0,DIVIDER=0;
    function hR(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
    function getH(){var ov=document.getElementById('constellation-overlay');return(ov?ov.offsetHeight:window.innerHeight)-50;}
    function oR(b,a,seed,amp){return b+Math.sin(a*2+seed*1.3)*amp*0.5+Math.sin(a*3+seed*0.8)*amp*0.3+Math.sin(a*5+seed*2.0)*amp*0.2;}

    var TOPO_PRESETS=[{ax:0.55,ay:0.28},{ax:0.42,ay:0.58},{ax:0.78,ay:0.62},{ax:0.20,ay:0.65},{ax:0.18,ay:0.28}];

    function buildRings(){
      topoRings=[];
      topoDistricts.forEach(function(d,di){
        var pos=TOPO_PRESETS[di]||{ax:0.5,ay:0.5};
        d._ax=pos.ax; d._ay=pos.ay;
        var cx=pos.ax*DIVIDER,cy=pos.ay*H,n=d.logs.length;
        d.logs.forEach(function(log,li){
          var ringIdx=n-1-li,baseR=28+ringIdx*32+log.depth*16,amp=10+ringIdx*4+d.intensity*1.5,seed=li*4.7+pos.ax*10;
          var pts=[];
          for(var s2=0;s2<=STEPS;s2++){var a=(s2/STEPS)*2*Math.PI; pts.push({x:cx+Math.cos(a)*oR(baseR,a,seed,amp),y:cy+Math.sin(a)*oR(baseR,a,seed,amp)});}
          topoRings.push({dist:d.key,color:d.color,log:log,li:li,ringIdx:ringIdx,cx:cx,cy:cy,baseR:baseR,amp:amp,seed:seed,pts:pts,depth:log.depth,n:n});
        });
      });
    }

    function sX(day){return sk.map(day,0,maxDay,DIVIDER+W*0.04,W*0.95);}
    function sY(key,day){var base=STEM_Y_FRACS[key]*H,seed=DKEYS.indexOf(key)*11.3;return base+Math.sin(day*0.19+seed)*2+Math.sin(day*0.08+seed*0.5)*1.5;}

    sk.setup=function(){W=container.offsetWidth||window.innerWidth;H=getH();DIVIDER=W*LW;sk.createCanvas(W,H).parent(container);container.style.height=H+'px';sk.textFont('monospace');buildRings();};
    sk.windowResized=function(){W=container.offsetWidth||window.innerWidth;H=getH();DIVIDER=W*LW;container.style.height=H+'px';sk.resizeCanvas(W,H);buildRings();};

    sk.mouseMoved=function(){
      var mx=sk.mouseX,my=sk.mouseY;
      var fR=null;
      if(mx<DIVIDER){
        outer2:for(var ri=0;ri<topoRings.length;ri++){
          var ring=topoRings[ri];
          for(var pi=0;pi<ring.pts.length-1;pi++){
            var p1=ring.pts[pi],p2=ring.pts[pi+1],dx=p2.x-p1.x,dy=p2.y-p1.y,lSq=dx*dx+dy*dy;
            var tt=lSq>0?((mx-p1.x)*dx+(my-p1.y)*dy)/lSq:0; tt=Math.max(0,Math.min(1,tt));
            var nx2=p1.x+tt*dx,ny2=p1.y+tt*dy;
            if(Math.sqrt((mx-nx2)*(mx-nx2)+(my-ny2)*(my-ny2))<10){fR=ri;break outer2;}
          }
        }
      }
      if(fR!==hovRing){
        hovRing=fR;
        if(fR!==null){
          var r=topoRings[fR];
          htip.innerHTML='<div style="font-size:12px;color:'+r.color+';margin-bottom:4px;">'+r.log.name+'</div>'
            +'<div style="font-size:9px;color:var(--blue);opacity:0.45;">'+(r.log.date||'')+' · '+r.dist+'</div>';
          htip.style.left=(mx+14)+'px';htip.style.top=(my-10)+'px';htip.style.opacity='1';
          // cross-highlight: activate the same district's sessions on the right
          hovSess=-1; // sentinel: means "highlight by district"
          hovDist=r.dist;
        } else {
          htip.style.opacity='0';
          hovDist=null;
        }
      }
      var fS=null;
      if(mx>DIVIDER)SESSIONS.forEach(function(s,i){if(Math.hypot(mx-s._nx,my-s._ny)<12)fS=i;});
      if(fS!==hovSess&&(fS!==null||hovRing===null)){
        hovSess=fS;
        if(fS!==null){
          var s=SESSIONS[fS];
          htip.innerHTML='<div style="font-size:10px;color:var(--blue);margin-bottom:3px;">'
            +s.dist.charAt(0).toUpperCase()+s.dist.slice(1)+' · day '+s.day+'</div>'
            +'<div style="font-family:Georgia,serif;font-size:11px;color:#101010;line-height:1.5;">'+s.note+'</div>';
          htip.style.left=(mx+14)+'px';htip.style.top=Math.max(5,my-40)+'px';htip.style.opacity='1';
          // cross-highlight: activate the same district's topo rings
          hovDist=s.dist; hovRing=-1; // sentinel
        } else if(hovRing===null){
          htip.style.opacity='0';
          hovDist=null;
        }
      }
    };

    sk.draw=function(){
      var bg=getComputedStyle(document.body).getPropertyValue('--color-bg').trim()||'#F7F2F1';
      frame++;var t=frame*0.012;
      sk.background(bg);

      // grid
      sk.stroke(12,33,119,18);sk.strokeWeight(0.6);
      for(var gx=0;gx<W;gx+=120)sk.line(gx,0,gx,H);
      for(var gy=0;gy<H;gy+=120)sk.line(0,gy,W,gy);
      sk.stroke(12,33,119,8);sk.strokeWeight(0.3);
      for(var sx2=0;sx2<W;sx2+=30)sk.line(sx2,0,sx2,H);
      for(var sy2=0;sy2<H;sy2+=30)sk.line(0,sy2,W,sy2);

      // divider
      sk.stroke(12,33,119,40);sk.strokeWeight(1);
      sk.drawingContext.setLineDash([4,8]);sk.line(DIVIDER,0,DIVIDER,H);sk.drawingContext.setLineDash([]);

      // panel labels
      sk.noStroke();sk.fill(12,33,119,80);sk.textSize(9);sk.textAlign(sk.CENTER,sk.TOP);
      sk.text('Topography',DIVIDER*0.5,8);sk.text('Growth',DIVIDER+(W-DIVIDER)*0.5,8);

      // connector lines — faint horizontal link from each topo center to its growth stem root
      topoDistricts.forEach(function(d){
        var rgb=hR(d.color);
        var cx=d._ax*DIVIDER, cy=d._ay*H;
        var rootX=DIVIDER+W*0.04, rootY=STEM_Y_FRACS[d.key]*H;
        var isActive=(hovDist===d.key);
        sk.stroke(rgb[0],rgb[1],rgb[2],isActive?120:22);
        sk.strokeWeight(isActive?1.5:0.6);
        sk.drawingContext.setLineDash([3,7]);
        sk.line(cx,cy,rootX,rootY);
        sk.drawingContext.setLineDash([]);
      });

      // ─── topo (left) ───────────────────────────────────────────────────────
      topoDistricts.forEach(function(d){
        var dR=topoRings.filter(function(r){return r.dist===d.key;});
        if(!dR.length)return;
        var rgb=hR(d.color);sk.fill(rgb[0],rgb[1],rgb[2],8);sk.noStroke();
        sk.beginShape();dR[dR.length-1].pts.forEach(function(p){sk.vertex(p.x,p.y);});sk.endShape(sk.CLOSE);
      });
      topoRings.forEach(function(ring,ri){
        var rgb=hR(ring.color);
        // highlight if this specific ring is hovered OR its district is cross-highlighted
        var isH=(ri===hovRing)||(hovDist===ring.dist);
        var isDimmed=(hovDist!==null&&hovDist!==ring.dist);
        var pulse=1+Math.sin(t+ri*0.4)*0.018;
        sk.stroke(rgb[0],rgb[1],rgb[2],isH?220:isDimmed?15:60+(ring.li/ring.n)*120+ring.depth*50);
        sk.strokeWeight(isH?2.5:0.8+(ring.li/ring.n)*1.2+ring.depth*0.4);
        isH?sk.fill(rgb[0],rgb[1],rgb[2],14):sk.noFill();
        sk.push();sk.translate(ring.cx,ring.cy);sk.scale(pulse);sk.translate(-ring.cx,-ring.cy);
        sk.beginShape();ring.pts.forEach(function(p){sk.vertex(p.x,p.y);});sk.endShape(sk.CLOSE);sk.pop();
      });
      topoDistricts.forEach(function(d){
        var rgb=hR(d.color),cx=d._ax*DIVIDER,cy=d._ay*H;
        sk.push();sk.translate(cx,cy);sk.rotate(Math.sin(t*0.5+d._ax*5)*0.08);
        sk.stroke(rgb[0],rgb[1],rgb[2],210);sk.strokeWeight(2.5);
        for(var a=0;a<4;a++){var ang=a*Math.PI/4;sk.line(-Math.cos(ang)*10,-Math.sin(ang)*10,Math.cos(ang)*10,Math.sin(ang)*10);}
        sk.pop();
        sk.noStroke();sk.fill(rgb[0],rgb[1],rgb[2],180);sk.textSize(14);sk.textAlign(sk.CENTER,sk.TOP);
        sk.text(d.key.charAt(0).toUpperCase()+d.key.slice(1),cx,cy+14);
        sk.fill(rgb[0],rgb[1],rgb[2],80);sk.textSize(10);
        sk.text(d.logs.length+' session'+(d.logs.length!==1?'s':''),cx,cy+30);
      });

      // ─── growth (right) ────────────────────────────────────────────────────
      [0,1,2,3,4].forEach(function(wk){
        var day=Math.round((wk/4)*maxDay),x=sX(day);
        if(x>DIVIDER){
          sk.stroke(12,33,119,25);sk.strokeWeight(0.7);
          sk.drawingContext.setLineDash([2,6]);sk.line(x,0,x,H);sk.drawingContext.setLineDash([]);
          if(wk>0&&wk<5){sk.noStroke();sk.fill(12,33,119,255);sk.textSize(9);sk.textAlign(sk.LEFT,sk.TOP);sk.text('Week '+wk,x+4,20);}
        }
      });
      SAME_DAY.forEach(function(pair){
        var sa=SESSIONS[pair[0]],sb=SESSIONS[pair[1]];
        var ax2=sa._nx||sX(sa.day),ay2=sa._ny||sY(sa.dist,sa.day),bx2=sb._nx||sX(sb.day),by2=sb._ny||sY(sb.dist,sb.day);
        var isH2=hovSess===pair[0]||hovSess===pair[1],cy2=(ay2+by2)/2;
        var rgbA=hR(DISTRICT_COLORS[sa.dist]||'#0c2177'),rgbB=hR(DISTRICT_COLORS[sb.dist]||'#0c2177');
        sk.noFill();sk.strokeWeight(isH2?1.5:0.7);
        sk.stroke(rgbA[0],rgbA[1],rgbA[2],isH2?140:40);sk.beginShape();sk.vertex(ax2,ay2);sk.quadraticVertex((ax2+bx2)/2,cy2-20,(ax2+bx2)/2,cy2);sk.endShape();
        sk.stroke(rgbB[0],rgbB[1],rgbB[2],isH2?140:40);sk.beginShape();sk.vertex((ax2+bx2)/2,cy2);sk.quadraticVertex((ax2+bx2)/2,cy2-20,bx2,by2);sk.endShape();
        sk.noStroke();sk.fill(12,33,119,isH2?100:25);sk.ellipse((ax2+bx2)/2,cy2,isH2?6:3,isH2?6:3);
      });
      DKEYS.forEach(function(key){
        var rgb=hR(DISTRICT_COLORS[key]||'#0c2177');
        var dS=SESSIONS.filter(function(s){return s.dist===key;}).sort(function(a,b){return a.day-b.day;});
        if(!dS.length)return;
        var isDistH=(hovDist===key);
        var isDistDimmed=(hovDist!==null&&hovDist!==key);
        var rootX=DIVIDER+W*0.04,rootY=STEM_Y_FRACS[key]*H,lastS=dS[dS.length-1];
        sk.noStroke();sk.fill(rgb[0],rgb[1],rgb[2],isDistH?255:isDistDimmed?40:200);sk.textSize(11);sk.textAlign(sk.RIGHT,sk.CENTER);
        sk.text(key.charAt(0).toUpperCase()+key.slice(1),rootX-5,rootY);
        sk.noFill();sk.stroke(rgb[0],rgb[1],rgb[2],isDistH?160:isDistDimmed?15:80);sk.strokeWeight(isDistH?2:1.4);
        sk.beginShape();sk.curveVertex(rootX-5,rootY);sk.curveVertex(rootX,rootY);
        dS.forEach(function(s){sk.curveVertex(sX(s.day),sY(key,s.day));});
        sk.curveVertex(Math.min(sX(lastS.day)+12,W*0.95),sY(key,lastS.day));sk.endShape();
        sk.noStroke();sk.fill(rgb[0],rgb[1],rgb[2],70);sk.ellipse(rootX,rootY,5,5);
        dS.forEach(function(s,si){
          var sx3=sX(s.day),sy3=sY(key,s.day),sway=Math.sin(t*0.6+si*1.2)*2;
          var isH3=(hovSess===SESSIONS.indexOf(s))||isDistH;
          var dimAlpha=isDistDimmed?0.15:1;
          var isSameDay=SAME_DAY.some(function(p){return p[0]===SESSIONS.indexOf(s)||p[1]===SESSIONS.indexOf(s);});
          s._nx=sx3;s._ny=sy3;
          var side=(si%2===0)?-1:1,bLen=18+s.depth*28+sway;
          var hLeans=[0.55,-0.25,0.70,-0.60,0.30],hLean=hLeans[DKEYS.indexOf(key)]||0;
          var bx3=sx3+hLean*bLen,by3=sy3+side*bLen;
          sk.stroke(rgb[0],rgb[1],rgb[2],isH3?160:isDistDimmed?15:65);sk.strokeWeight(isH3?1.5:0.9);sk.line(sx3,sy3,bx3,by3);
          sk.push();sk.translate(bx3,by3);sk.rotate(Math.atan2(by3-sy3,bx3-sx3)+Math.PI/2+Math.sin(t*0.3+si)*0.08);
          var lw=8+s.depth*14,lh=3+s.depth*4;sk.noStroke();sk.fill(rgb[0],rgb[1],rgb[2],isH3?220:isDistDimmed?20:80+s.depth*100);sk.ellipse(0,0,lh*2,lw*2);sk.pop();
          sk.noStroke();sk.fill(rgb[0],rgb[1],rgb[2],isH3?255:isDistDimmed?20:160+s.depth*60);sk.ellipse(sx3,sy3,isH3?9:5+s.depth*2,isH3?9:5+s.depth*2);
          if(isSameDay&&!isH3){sk.noFill();sk.stroke(12,33,119,60);sk.strokeWeight(0.8);sk.ellipse(sx3,sy3,16,16);}
          if(isH3&&hovSess===SESSIONS.indexOf(s)){sk.noFill();sk.stroke(rgb[0],rgb[1],rgb[2],160);sk.strokeWeight(1.2);sk.ellipse(sx3,sy3,22,22);}
        });
        var tx=Math.min(sX(lastS.day)+10,W*0.95-20),ty=sY(key,lastS.day);
        var flowerSpin=t*0.4+DKEYS.indexOf(key)*(Math.PI*2/DKEYS.length),petalLen=10+lastS.depth*7;
        sk.stroke(rgb[0],rgb[1],rgb[2],isDistH?255:200);sk.strokeWeight(1.5);
        for(var p2=0;p2<6;p2++){var ang2=(p2/6)*2*Math.PI+flowerSpin;sk.line(tx,ty,tx+Math.cos(ang2)*petalLen,ty+Math.sin(ang2)*petalLen);}
        sk.noStroke();sk.fill(rgb[0],rgb[1],rgb[2],230);sk.ellipse(tx,ty,6,6);
      });

      drawLegend(sk,W,[
        {text:'Left: ring = one location · hover to reveal'},
        {text:'Right: leaf = one session'},
        {text:'Time flows left to right'},
        {text:'Arc = same-day sessions'},
      ]);
    };
  },container);

  window._memoriesSketch=combo;
}


// shared legend helper for p5 views
function drawLegend(sk, W, items) {
  var pad = 12, lineH = 16, titleH = 20;
  var boxW = 310, boxH = pad + titleH + items.length * lineH + pad;
  var bx = W - boxW - 18, by = 14;
  sk.noStroke();
  sk.fill(247, 242, 241, 255);
  sk.rect(bx, by, boxW, boxH);
  sk.stroke(12, 33, 119, 255); sk.strokeWeight(1); sk.noFill();
  sk.rect(bx, by, boxW, boxH);
  sk.noStroke();
  sk.fill(12, 33, 119, 255);
  sk.textFont('monospace'); sk.textSize(10); sk.textAlign(sk.LEFT, sk.TOP);
  sk.text('How to read this view', bx + pad, by + pad);
  items.forEach(function(item, i) {
    sk.fill(12, 33, 119, 255);
    sk.textSize(10);
    sk.text('· ' + item.text, bx + pad, by + pad + titleH + i * lineH);
  });
}

// shared legend helper for vanilla canvas (2d context) views
function drawLegendCanvas(ctx, W, lines) {
  var pad = 12, lineH = 16, titleH = 20;
  var boxW = 310, boxH = pad + titleH + lines.length * lineH + pad;
  var bx = W - boxW - 18, by = 14;
  ctx.fillStyle = '#F7F2F1';
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeStyle = 'rgba(12,33,119,1)'; ctx.lineWidth = 1; ctx.setLineDash([]);
  ctx.strokeRect(bx, by, boxW, boxH);
  ctx.fillStyle = 'rgba(12,33,119,1)';
  ctx.font = '10px monospace'; ctx.textAlign = 'left';
  ctx.fillText('How to read this view', bx + pad, by + pad + 8);
  lines.forEach(function(line, i) {
    ctx.fillStyle = 'rgba(12,33,119,1)';
    ctx.fillText('· ' + line, bx + pad, by + pad + titleH + i * lineH + 8);
  });
}



// ─── view ii: constellation ───────────────────────────────────────────────────

function initNewConstellationSketch() {
  var container = document.getElementById('constellation-canvas-container');
  if (!container) return;
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  var allKeywords = extractAllKeywords(20, 'all', null);
  if (allKeywords.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--font-whois);font-size:0.78rem;color:var(--blue);opacity:0.35;letter-spacing:0.06em;">complete a district to see your constellation</div>';
    return;
  }

  var WORDS = allKeywords.map(function(k) {
    return { word:k.word, dist:k.districts[0]||'shrine', freq:k.count,
      color:DISTRICT_COLORS[k.districts[0]]||'#0c2177',
      contexts:k.contexts||[], _x:0,_y:0,_vx:0,_vy:0,_angle:0,_pinned:false,_el:null };
  });

  var CENTERS = [
    { key:'shrine',      color:DISTRICT_COLORS.shrine,      ax:0.60,ay:0.25,px:0,py:0 },
    { key:'cornerstore', color:DISTRICT_COLORS.cornerstore,  ax:0.38,ay:0.60,px:0,py:0 },
    { key:'tower',       color:DISTRICT_COLORS.tower,        ax:0.80,ay:0.65,px:0,py:0 },
    { key:'plaza',       color:DISTRICT_COLORS.plaza,        ax:0.18,ay:0.68,px:0,py:0 },
    { key:'garden',      color:DISTRICT_COLORS.garden,       ax:0.16,ay:0.25,px:0,py:0 },
  ];

  (function() {
    var groups={};
    WORDS.forEach(function(w,i){ if(!groups[w.dist])groups[w.dist]=[]; groups[w.dist].push(i); });
    // point each district's words away from the canvas center so they radiate outward
    var distAngles = {
      shrine:      -0.4,   // upper right — words spread right/up
      cornerstore:  0.3,   // center — words spread down/right
      tower:        0.1,   // right — words spread right
      plaza:        2.8,   // left — words spread left
      garden:       3.5,   // upper left — words spread left/up
    };
    Object.keys(groups).forEach(function(dist){
      var idxs=groups[dist];
      var base=distAngles[dist]||0;
      idxs.forEach(function(wi,li){
        var t=idxs.length>1?li/(idxs.length-1):0.5;
        // full 200° arc spread so no stacking
        WORDS[wi]._angle=base+(t-0.5)*3.5;
      });
    });
  })();

  // build cross-district connections: only words appearing 3+ times in each district
  var BRIDGE_STOPWORDS = new Set([
    'that','this','with','have','from','they','their','would','could','should',
    'about','there','which','when','what','just','been','will','your','more',
    'also','into','some','than','then','were','very','much','each','over',
    'think','place','feel','felt','thought','remember','know','still','even',
    'always','never','every','back','here','thing','things','really','because',
    'something','anything','nothing','someone','anyone','people','person',
    'going','getting','being','having','doing','making','around','through',
    'after','before','during','while','these','those','where','only','like',
    'time','want','need','made','make','take','took','said','says','came',
    'come','went','went','used','uses','once','them','then','does','done',
  ]);
  var CROSS_LINKS = (function(){
    var links=[];
    var districtWordCounts={};
    DISTRICTS.forEach(function(key){
      var sessions=JSON.parse(localStorage.getItem(key+'-sessions')||'[]')
        .filter(function(s){return !s.isTrainThought;});
      var counts={};
      sessions.forEach(function(s){
        Object.values(s.answers||{}).join(' ')
          .toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/)
          .filter(function(w){return w.length>3;})
          .forEach(function(w){counts[w]=(counts[w]||0)+1;});
      });
      districtWordCounts[key]=counts;
    });
    var distKeys=Object.keys(districtWordCounts);
    for(var i=0;i<distKeys.length;i++){
      for(var j=i+1;j<distKeys.length;j++){
        var shared=[];
        Object.keys(districtWordCounts[distKeys[i]]).forEach(function(w){
          var countA=districtWordCounts[distKeys[i]][w]||0;
          var countB=districtWordCounts[distKeys[j]][w]||0;
          // word must appear 3+ times in each district and not be a filler word
          if(countA>=2&&countB>=2&&!BRIDGE_STOPWORDS.has(w)) shared.push(w);
        });
        if(shared.length>0){
          links.push({a:distKeys[i],b:distKeys[j],words:shared.slice(0,3)});
        }
      }
    }
    return links;
  })();

  var cv=document.createElement('canvas'), tip=document.createElement('div');
  cv.style.cssText='display:block;position:absolute;top:0;left:0;z-index:1;';
  tip.style.cssText='position:absolute;z-index:10;pointer-events:none;opacity:0;transition:opacity 0.15s;'
    +'background:var(--color-bg);border:1.5px solid var(--blue);padding:9px 13px;max-width:230px;'
    +'font-family:var(--font-whois);font-size:11px;color:var(--blue);';
  container.appendChild(cv); container.appendChild(tip);

  var ctx=cv.getContext('2d'), W=0,H=0,DPR=1,raf=null,drag=null,setupDone=false,frame=0;

  function hexToRgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }

  function getSize(){
    var ov=document.getElementById('constellation-overlay');
    return {w:container.offsetWidth||window.innerWidth,h:Math.max((ov?ov.offsetHeight:window.innerHeight)-50,400)};
  }

  function place(){
    CENTERS.forEach(function(c){c.px=c.ax*W;c.py=c.ay*H;});
    WORDS.forEach(function(w){
      if(w._pinned)return;
      var c=CENTERS.find(function(c){return c.key===w.dist;}); if(!c)return;
      var r=100+(1/Math.max(w.freq,1))*80;
      w._x=Math.max(80, Math.min(W-200, c.px+Math.cos(w._angle)*r));
      w._y=Math.max(20, Math.min(H-20,  c.py+Math.sin(w._angle)*r));
    });
  }

  function buildLabels(){
    container.querySelectorAll('.cl').forEach(function(e){e.remove();});
    WORDS.forEach(function(w,i){
      var el=document.createElement('div');
      el.className='cl';
      el.style.cssText='position:absolute;pointer-events:all;font-family:var(--font-whois);'
        +'font-size:13px;line-height:1.2;white-space:nowrap;padding:4px 8px;'
        +'background:var(--color-bg);cursor:grab;user-select:none;z-index:2;'
        +'border:1.5px solid '+w.color+';';
      el.style.color=w.color;
      el.textContent=w.word+' '+'·'.repeat(Math.min(w.freq,5));
      posL(el,w._x,w._y);
      el.addEventListener('mousedown',function(e){
        e.stopPropagation();
        var r=container.getBoundingClientRect();
        drag={type:'word',idx:i,ox:e.clientX-r.left-w._x,oy:e.clientY-r.top-w._y};
        tip.style.opacity='0';
      });
      el.addEventListener('mouseenter',function(){
        if(drag)return;
        var c2=w.contexts[w.contexts.length-1];
        tip.innerHTML='<strong style="font-size:11px;letter-spacing:0.06em;display:block;margin-bottom:4px;">'+w.word+'</strong>'
          +'<span style="font-family:Georgia,serif;font-size:11px;color:#101010;line-height:1.5;display:block;">'+(c2?c2.snippet:'—')+'</span>'
          +'<span style="font-size:9px;opacity:0.45;display:block;margin-top:5px;">'+w.freq+'× · '+w.dist+'</span>';
        var lx=w._x<W*0.6;
        tip.style.left=lx?(w._x+22)+'px':''; tip.style.right=lx?'':(W-w._x+12)+'px';
        tip.style.top=Math.max(5,w._y-24)+'px'; tip.style.opacity='1';
      });
      el.addEventListener('mouseleave',function(){if(!drag)tip.style.opacity='0';});
      container.appendChild(el); w._el=el;
    });
  }

  function posL(el,x,y){el.style.left=(x+14)+'px';el.style.top=(y-12)+'px';}
  function moveLabels(){WORDS.forEach(function(w){if(w._el)posL(w._el,w._x,w._y);});}

  function animate(){
    raf=requestAnimationFrame(animate); frame++;
    var t=frame*0.016;
    WORDS.forEach(function(w,wi){
      if(w._pinned)return;
      var c=CENTERS.find(function(c){return c.key===w.dist;}); if(!c)return;
      var r=100+(1/Math.max(w.freq,1))*80;
      var angle=w._angle+Math.sin(t*0.4+wi*0.7)*0.04;
      var tx=Math.max(20,Math.min(W-180,c.px+Math.cos(angle)*r));
      var ty=Math.max(20,Math.min(H-20, c.py+Math.sin(angle)*r));
      w._x+=(tx-w._x)*0.04; w._y+=(ty-w._y)*0.04;
      if(w._el)posL(w._el,w._x,w._y);
    });
    draw(t);
  }

  function draw(t){
    if(t===undefined)t=0;
    var bg=getComputedStyle(document.body).getPropertyValue('--color-bg').trim()||'#F7F2F1';
    ctx.clearRect(0,0,W,H); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // graph paper grid
    ctx.setLineDash([]);
    ctx.strokeStyle='rgba(12,33,119,0.07)'; ctx.lineWidth=0.6;
    for(var gx=0;gx<W;gx+=120){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
    for(var gy=0;gy<H;gy+=120){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}
    ctx.strokeStyle='rgba(12,33,119,0.03)'; ctx.lineWidth=0.3;
    for(var sx=0;sx<W;sx+=30){ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,H);ctx.stroke();}
    for(var sy=0;sy<H;sy+=30){ctx.beginPath();ctx.moveTo(0,sy);ctx.lineTo(W,sy);ctx.stroke();}

    // cross-district bridge nodes — shared words float between districts as gradient circles
    CROSS_LINKS.forEach(function(link, li){
      var ca=CENTERS.find(function(c){return c.key===link.a;});
      var cb=CENTERS.find(function(c){return c.key===link.b;});
      if(!ca||!cb)return;
      link.words.slice(0,3).forEach(function(word, wi){
        var lerpT = 0.3 + wi * 0.2;
        var drift = Math.sin(t * 0.5 + li * 1.3 + wi * 2.1) * 14;
        var nx = ca.px + (cb.px - ca.px) * lerpT;
        var ny = ca.py + (cb.py - ca.py) * lerpT + drift;
        // size radius to fit the word — measure text width and add padding
        ctx.font = 'bold 8px monospace';
        var textW = ctx.measureText(word).width;
        var r = Math.max(14, textW / 2 + 7);

        // thin lines from node to each district center
        ctx.setLineDash([3,6]); ctx.lineWidth=0.8;
        ctx.strokeStyle=ca.color; ctx.globalAlpha=0.3;
        ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(ca.px,ca.py); ctx.stroke();
        ctx.strokeStyle=cb.color;
        ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(cb.px,cb.py); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha=1;

        // gradient filled circle
        var grad=ctx.createRadialGradient(nx-r*0.3,ny-r*0.3,0,nx,ny,r*1.4);
        grad.addColorStop(0, ca.color);
        grad.addColorStop(1, cb.color);
        ctx.fillStyle=grad; ctx.globalAlpha=0.75;
        ctx.beginPath(); ctx.arc(nx,ny,r,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;

        // word label centered in node
        ctx.fillStyle='#F7F2F1';
        ctx.font='bold 8px monospace'; ctx.textAlign='center';
        ctx.fillText(word, nx, ny+3);

        // store position + district names for hover tooltip
        if(!link._nodes) link._nodes=[];
        link._nodes[wi]={x:nx,y:ny,r:r,word:word,colA:ca.color,colB:cb.color,distA:link.a,distB:link.b};
      });
    });

    // hover tooltip for bridge nodes
    var hovNode=null;
    CROSS_LINKS.forEach(function(link){
      if(!link._nodes)return;
      link._nodes.forEach(function(n){
        if(n&&Math.hypot((ctx.canvas._mx||0)-n.x,(ctx.canvas._my||0)-n.y)<n.r+4){
          hovNode=n;
        }
      });
    });

    CENTERS.forEach(function(c){
      var rgb=hexToRgb(c.color);
      // aura rings with pulse
      [100,140,180].forEach(function(rr,ri){
        var pulse=1+Math.sin(t*0.8+ri*1.1)*0.015;
        ctx.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.20)';
        ctx.lineWidth=0.9; ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(c.px,c.py,rr*pulse,0,Math.PI*2); ctx.stroke();
      });
      // full-color spokes
      ctx.setLineDash([]); ctx.lineWidth=1.2;
      WORDS.filter(function(w){return w.dist===c.key;}).forEach(function(w){
        ctx.strokeStyle=c.color;
        ctx.beginPath(); ctx.moveTo(c.px,c.py); ctx.lineTo(w._x,w._y); ctx.stroke();
      });
      // word dots
      WORDS.filter(function(w){return w.dist===c.key;}).forEach(function(w){
        ctx.fillStyle=c.color;
        ctx.beginPath(); ctx.arc(w._x,w._y,3+w.freq*1,0,Math.PI*2); ctx.fill();
      });
      // asterisk — slow spin
      var spin=Math.sin(t*0.3+c.ax*4)*0.06;
      ctx.save(); ctx.translate(c.px,c.py); ctx.rotate(spin);
      ctx.strokeStyle=c.color; ctx.lineWidth=3; ctx.setLineDash([]);
      for(var a=0;a<4;a++){var ang=a*Math.PI/4; ctx.beginPath(); ctx.moveTo(-Math.cos(ang)*16,-Math.sin(ang)*16); ctx.lineTo(Math.cos(ang)*16,Math.sin(ang)*16); ctx.stroke();}
      ctx.restore();
      // district label — capitalized
      var label=c.key.charAt(0).toUpperCase()+c.key.slice(1);
      ctx.fillStyle=c.color; ctx.font='bold 13px monospace'; ctx.textAlign='center';
      ctx.fillText(label,c.px,c.py+30);
    });

    drawLegendCanvas(ctx,W,[
      'Burst = one district',
      'Inner = frequent, outer = rare',
      'Gradient node = shared word',
      'Drag to rearrange',
    ]);
  }

  function setup(){
    var sz=getSize(); W=sz.w; H=sz.h;
    DPR=window.devicePixelRatio||1;
    cv.width=W*DPR; cv.height=H*DPR;
    cv.style.width=W+'px'; cv.style.height=H+'px';
    container.style.height=H+'px';
    ctx.setTransform(1,0,0,1,0,0); ctx.scale(DPR,DPR);
    place();
    if(!setupDone){buildLabels();setupDone=true;}else moveLabels();
    if(!raf)raf=requestAnimationFrame(animate);
  }

  cv.addEventListener('mousedown',function(e){
    var r=container.getBoundingClientRect(), mx=e.clientX-r.left,my=e.clientY-r.top;
    cv._mx=mx; cv._my=my;
    CENTERS.forEach(function(c,i){if(Math.hypot(mx-c.px,my-c.py)<22)drag={type:'center',idx:i,ox:mx-c.px,oy:my-c.py};});
  });

  cv.addEventListener('mousemove',function(e){
    var r=container.getBoundingClientRect();
    cv._mx=e.clientX-r.left; cv._my=e.clientY-r.top;
    // bridge node hover
    var found=null;
    CROSS_LINKS.forEach(function(link){
      if(!link._nodes)return;
      link._nodes.forEach(function(n){
        if(n&&Math.hypot(cv._mx-n.x,cv._my-n.y)<n.r+4) found=n;
      });
    });
    if(found){
      var dA=found.distA.charAt(0).toUpperCase()+found.distA.slice(1);
      var dB=found.distB.charAt(0).toUpperCase()+found.distB.slice(1);
      tip.innerHTML='<strong style="font-size:11px;letter-spacing:0.06em;display:block;margin-bottom:3px;">'+found.word+'</strong>'
        +'<span style="font-size:9px;display:block;">'
        +'<span style="color:'+found.colA+'">'+dA+'</span>'
        +' · '
        +'<span style="color:'+found.colB+'">'+dB+'</span>'
        +'</span>';
      tip.style.left=(cv._mx+14)+'px'; tip.style.right='';
      tip.style.top=Math.max(5,cv._my-24)+'px'; tip.style.opacity='1';
    } else if(!drag){ tip.style.opacity='0'; }
  });

  var onMove=function(e){
    if(!drag)return;
    var r=container.getBoundingClientRect(), mx=e.clientX-r.left,my=e.clientY-r.top;
    if(drag.type==='center'){
      CENTERS[drag.idx].px=mx-drag.ox; CENTERS[drag.idx].py=my-drag.oy;
      WORDS.forEach(function(w){
        if(w._pinned||w.dist!==CENTERS[drag.idx].key)return;
        var c=CENTERS[drag.idx],rv=100+(1/Math.max(w.freq,1))*80;
        w._x=Math.max(20,Math.min(W-180,c.px+Math.cos(w._angle)*rv));
        w._y=Math.max(20,Math.min(H-20, c.py+Math.sin(w._angle)*rv));
      });
      moveLabels();
    } else {
      var w=WORDS[drag.idx];
      w._x=Math.max(80,Math.min(W-200,mx-drag.ox));
      w._y=Math.max(20,Math.min(H-20, my-drag.oy));
      w._pinned=true; if(w._el)posL(w._el,w._x,w._y);
    }
  };
  var onUp=function(){drag=null;};
  var onRes=function(){setup();};
  window.addEventListener('mousemove',onMove);
  window.addEventListener('mouseup',onUp);
  window.addEventListener('resize',onRes);
  setup();

  window._constCleanup=function(){
    if(raf){cancelAnimationFrame(raf);raf=null;}
    window.removeEventListener('mousemove',onMove);
    window.removeEventListener('mouseup',onUp);
    window.removeEventListener('resize',onRes);
    container.innerHTML=''; setupDone=false;
  };
}


// ─── view iii: growth ─────────────────────────────────────────────────────────
// horizontal canvas: time flows left to right
// each district is a horizontal stem growing rightward
// sessions = leaf nodes branching up/down from the stem
// same-day sessions share a tendril arc between stems

function renderGrowthView(container) {
  if (!container) return;
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  var DKEYS = ['shrine', 'cornerstore', 'tower', 'plaza', 'garden'];
  // vertical positions for each stem — evenly distributed
  var STEM_Y_FRACS = { shrine:0.15, cornerstore:0.32, tower:0.50, plaza:0.68, garden:0.85 };

  // build sessions from localStorage
  var SESSIONS = [];
  var dayZero = null;
  DKEYS.forEach(function(key) {
    JSON.parse(localStorage.getItem(key+'-sessions')||'[]')
      .filter(function(s){return !s.isTrainThought;})
      .forEach(function(s){
        var ts=s.timestamp||Date.now();
        if(dayZero===null||ts<dayZero) dayZero=ts;
      });
  });
  if(dayZero===null) dayZero=Date.now()-30*24*60*60*1000;

  DKEYS.forEach(function(key){
    JSON.parse(localStorage.getItem(key+'-sessions')||'[]')
      .filter(function(s){return !s.isTrainThought;})
      .forEach(function(s){
        var ts=s.timestamp||Date.now();
        var day=Math.round((ts-dayZero)/(24*60*60*1000));
        var totalLen=Object.values(s.answers||{}).join(' ').length;
        var depth=Math.min(totalLen/800,1);
        var note=(s.answers&&s.answers[0])?s.answers[0].slice(0,55):(key+' · '+(s.date||''));
        SESSIONS.push({dist:key,day:day,depth:depth,note:note,_nx:0,_ny:0});
      });
  });

  if(SESSIONS.length===0){
    container.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--font-whois);font-size:0.78rem;color:var(--blue);opacity:0.35;letter-spacing:0.06em;">complete a district to see growth</div>';
    return;
  }

  var maxDay=Math.max.apply(null,SESSIONS.map(function(s){return s.day;}))||30;

  var SAME_DAY=[];
  for(var i=0;i<SESSIONS.length;i++)for(var j=i+1;j<SESSIONS.length;j++){
    if(SESSIONS[i].day===SESSIONS[j].day&&SESSIONS[i].dist!==SESSIONS[j].dist)
      SAME_DAY.push([i,j]);
  }

  var tip=document.createElement('div');
  tip.style.cssText='position:absolute;pointer-events:none;opacity:0;transition:opacity 0.15s;'
    +'background:var(--color-bg);border:1px solid rgba(12,33,119,0.3);padding:9px 13px;'
    +'max-width:200px;z-index:20;font-family:var(--font-whois);';
  container.appendChild(tip);

  var hovSess=null;

  var growthSketch=new p5(function(sk){
    var W,H,frame=0;
    var LEFT_PAD=0.08, RIGHT_PAD=0.90; // pull in right edge so flowers don't clip

    function sX(day){ return sk.map(day,0,maxDay,W*LEFT_PAD,W*RIGHT_PAD); }
    function sY(key,day){
      var base=STEM_Y_FRACS[key]*H;
      var seed=DKEYS.indexOf(key)*11.3;
      // much less vertical wobble so stems stay close to horizontal
      return base+Math.sin(day*0.19+seed)*2+Math.sin(day*0.08+seed*0.5)*1.5;
    }
    function hexRgb(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}

    function getH(){
      var ov=document.getElementById('constellation-overlay');
      return (ov?ov.offsetHeight:window.innerHeight)-50;
    }

    sk.setup=function(){
      W=container.offsetWidth||window.innerWidth;
      H=getH();
      sk.createCanvas(W,H).parent(container);
      container.style.height=H+'px';
      sk.textFont('monospace');
    };

    sk.windowResized=function(){
      W=container.offsetWidth||window.innerWidth; H=getH();
      container.style.height=H+'px'; sk.resizeCanvas(W,H);
    };

    sk.mouseMoved=function(){
      var found=null;
      SESSIONS.forEach(function(s,i){if(Math.hypot(sk.mouseX-s._nx,sk.mouseY-s._ny)<14)found=i;});
      if(found!==hovSess){
        hovSess=found;
        if(found!==null){
          var s=SESSIONS[found];
          var partner=SAME_DAY.find(function(p){return p[0]===found||p[1]===found;});
          var pTxt=partner?' · same day as '+SESSIONS[partner[0]===found?partner[1]:partner[0]].dist:'';
          tip.innerHTML='<div style="font-size:10px;color:var(--blue);letter-spacing:0.06em;margin-bottom:3px;">'
            +s.dist.charAt(0).toUpperCase()+s.dist.slice(1)+' · day '+s.day+'</div>'
            +'<div style="font-family:Georgia,serif;font-size:11px;color:#101010;line-height:1.5;">'+s.note+'</div>'
            +(pTxt?'<div style="font-size:9px;color:var(--blue);margin-top:4px;">'+pTxt+'</div>':'');
          var lx=s._nx<W*0.65;
          tip.style.left=lx?(s._nx+14)+'px':''; tip.style.right=lx?'':(W-s._nx+14)+'px';
          tip.style.top=Math.max(5,s._ny-40)+'px'; tip.style.opacity='1';
        } else { tip.style.opacity='0'; }
      }
    };

    sk.draw=function(){
      var bg=getComputedStyle(document.body).getPropertyValue('--color-bg').trim()||'#F7F2F1';
      frame++;
      var t=frame*0.014;
      sk.background(bg);

      // graph paper grid
      sk.stroke(12,33,119,18); sk.strokeWeight(0.6);
      for(var gx=0;gx<W;gx+=120) sk.line(gx,0,gx,H);
      for(var gy=0;gy<H;gy+=120) sk.line(0,gy,W,gy);
      sk.stroke(12,33,119,8); sk.strokeWeight(0.3);
      for(var sx2=0;sx2<W;sx2+=30) sk.line(sx2,0,sx2,H);
      for(var sy2=0;sy2<H;sy2+=30) sk.line(0,sy2,W,sy2);

      // week dividers — 4 weeks, sentence case, full opacity blue
      var weeks=[0,1,2,3,4];
      weeks.forEach(function(wk){
        var day=Math.round((wk/4)*maxDay);
        var x=sX(day);
        sk.stroke(12,33,119,25); sk.strokeWeight(0.7);
        sk.drawingContext.setLineDash([2,6]); sk.line(x,0,x,H); sk.drawingContext.setLineDash([]);
        if(wk>0&&wk<5){
          sk.noStroke(); sk.fill(12,33,119,255); sk.textSize(9); sk.textAlign(sk.LEFT,sk.TOP);
          sk.text('Week '+wk, x+5, 8);
        }
      });

      // same-day tendrils
      SAME_DAY.forEach(function(pair){
        var sa=SESSIONS[pair[0]],sb=SESSIONS[pair[1]];
        var ax=sa._nx||sX(sa.day),ay=sa._ny||sY(sa.dist,sa.day);
        var bx=sb._nx||sX(sb.day),by=sb._ny||sY(sb.dist,sb.day);
        var isH=hovSess===pair[0]||hovSess===pair[1];
        var rgbA=hexRgb(DISTRICT_COLORS[sa.dist]||'#0c2177');
        var rgbB=hexRgb(DISTRICT_COLORS[sb.dist]||'#0c2177');
        var cy=(ay+by)/2;
        sk.noFill(); sk.strokeWeight(isH?1.5:0.7);
        sk.stroke(rgbA[0],rgbA[1],rgbA[2],isH?140:40);
        sk.beginShape(); sk.vertex(ax,ay); sk.quadraticVertex((ax+bx)/2,cy-20,(ax+bx)/2,cy); sk.endShape();
        sk.stroke(rgbB[0],rgbB[1],rgbB[2],isH?140:40);
        sk.beginShape(); sk.vertex((ax+bx)/2,cy); sk.quadraticVertex((ax+bx)/2,cy-20,bx,by); sk.endShape();
        sk.noStroke(); sk.fill(12,33,119,isH?100:25);
        sk.ellipse((ax+bx)/2,cy,isH?6:3,isH?6:3);
      });

      // stems + leaves per district
      DKEYS.forEach(function(key){
        var rgb=hexRgb(DISTRICT_COLORS[key]||'#0c2177');
        var distSess=SESSIONS.filter(function(s){return s.dist===key;}).sort(function(a,b){return a.day-b.day;});
        if(!distSess.length) return;

        var rootX=W*LEFT_PAD, rootY=STEM_Y_FRACS[key]*H;

        // district label
        sk.noStroke(); sk.fill(rgb[0],rgb[1],rgb[2],200);
        sk.textSize(13); sk.textAlign(sk.RIGHT,sk.CENTER);
        sk.text(key.charAt(0).toUpperCase()+key.slice(1), rootX-8, rootY);

        // horizontal stem
        var lastSess=distSess[distSess.length-1];
        var lastX=sX(lastSess.day);
        sk.noFill(); sk.stroke(rgb[0],rgb[1],rgb[2],80); sk.strokeWeight(1.4);
        sk.beginShape();
        sk.curveVertex(rootX-5,rootY); sk.curveVertex(rootX,rootY);
        distSess.forEach(function(s){sk.curveVertex(sX(s.day),sY(key,s.day));});
        sk.curveVertex(Math.min(lastX+12, W*RIGHT_PAD), sY(key,lastSess.day));
        sk.endShape();

        // root dot
        sk.noStroke(); sk.fill(rgb[0],rgb[1],rgb[2],70);
        sk.ellipse(rootX,rootY,5,5);

        // session nodes + leaves
        distSess.forEach(function(s,si){
          var sx=sX(s.day), sy=sY(key,s.day);
          var sway=Math.sin(t*0.6+si*1.2)*2;
          var isH=hovSess===SESSIONS.indexOf(s);
          var isSameDay=SAME_DAY.some(function(p){return p[0]===SESSIONS.indexOf(s)||p[1]===SESSIONS.indexOf(s);});
          s._nx=sx; s._ny=sy;

          var side=(si%2===0)?-1:1; // alternates above/below stem
          var bLen=18+s.depth*28+sway;

          // each district has a unique diagonal direction for its leaves
          var distIdx=DKEYS.indexOf(key);
          // horizontal lean: shrine=right, cornerstore=slight left, tower=right, plaza=left, garden=slight right
          var hLeans=[0.55, -0.25, 0.70, -0.60, 0.30];
          var hLean=hLeans[distIdx]||0;

          var bx2=sx + hLean * bLen;
          var by2=sy + side * bLen;

          sk.stroke(rgb[0],rgb[1],rgb[2],isH?160:65); sk.strokeWeight(isH?1.5:0.9);
          sk.line(sx,sy,bx2,by2);

          // leaf — angle along the branch direction, looks attached
          sk.push(); sk.translate(bx2,by2);
          // rotate to match branch direction
          var branchAngle=Math.atan2(by2-sy,bx2-sx);
          sk.rotate(branchAngle+Math.PI/2+Math.sin(t*0.3+si)*0.08);
          var lw=8+s.depth*16, lh=3+s.depth*5;
          sk.noStroke(); sk.fill(rgb[0],rgb[1],rgb[2],isH?220:80+s.depth*100);
          sk.ellipse(0,0,lh*2,lw*2);
          sk.pop();

          // stem node
          sk.noStroke(); sk.fill(rgb[0],rgb[1],rgb[2],isH?255:160+s.depth*60);
          sk.ellipse(sx,sy,isH?9:5+s.depth*3,isH?9:5+s.depth*3);

          if(isSameDay&&!isH){sk.noFill();sk.stroke(12,33,119,60);sk.strokeWeight(0.8);sk.ellipse(sx,sy,16,16);}
          if(isH){sk.noFill();sk.stroke(rgb[0],rgb[1],rgb[2],160);sk.strokeWeight(1.2);sk.ellipse(sx,sy,22,22);}
        });

        // tip flower — constrained within canvas
        var tx=Math.min(sX(lastSess.day)+10, W*RIGHT_PAD-20);
        var ty=sY(key,lastSess.day);
        var distOffset=DKEYS.indexOf(key)*(Math.PI*2/DKEYS.length);
        var flowerSpin=t*0.4+distOffset;
        var petalLen=10+lastSess.depth*8;
        sk.stroke(rgb[0],rgb[1],rgb[2],200); sk.strokeWeight(1.5);
        for(var p=0;p<6;p++){
          var ang=(p/6)*2*Math.PI+flowerSpin;
          sk.line(tx,ty,tx+Math.cos(ang)*petalLen,ty+Math.sin(ang)*petalLen);
        }
        sk.noStroke(); sk.fill(rgb[0],rgb[1],rgb[2],230); sk.ellipse(tx,ty,6,6);
      });

      // legend
      drawLegend(sk,W,[
        {text:'Stem = one district'},
        {text:'Leaf = one session'},
        {text:'Left to right = time'},
        {text:'Arc = same day'},
      ]);
    };

  },container);

  window._memoriesSketch=growthSketch;
}

// ─── view iv: report ─────────────────────────────────────────────────────────
// two-column layout: stats on the left, ai-generated reflection on the right
// district summary panels across the bottom

function renderReportView(container) {
  if (!container) return;
  container.style.position = 'relative';
  container.style.overflowY = 'auto';

  var totalSessions = 0, totalWords = 0;
  var districtStats = DISTRICTS.map(function(key) {
    var sessions = JSON.parse(localStorage.getItem(key + '-sessions') || '[]')
      .filter(function(s) { return !s.isTrainThought; });
    var words = sessions.reduce(function(sum, s) {
      return sum + Object.values(s.answers || {}).join(' ').split(/\s+/).length;
    }, 0);
    totalSessions += sessions.length;
    totalWords    += words;
    return { key: key, color: DISTRICT_COLORS[key] || '#0c2177', sessions: sessions.length };
  }).filter(function(d) { return d.sessions > 0; });

  var firstDate = '', lastDate = '';
  DISTRICTS.forEach(function(key) {
    JSON.parse(localStorage.getItem(key + '-sessions') || '[]').forEach(function(s) {
      if (s.date) {
        if (!firstDate || s.date < firstDate) firstDate = s.date;
        if (!lastDate  || s.date > lastDate)  lastDate  = s.date;
      }
    });
  });

  var maxSessions = Math.max.apply(null, districtStats.map(function(d) { return d.sessions; })) || 1;
  var topWords    = extractAllKeywords(10, 'all', null);

  function statRow(label, val) {
    return '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;">'
      + '<span style="font-family:var(--font-whois);font-size:0.95rem;color:var(--blue);">' + label + '</span>'
      + '<span style="font-family:var(--font-whois);font-size:0.95rem;color:var(--blue);letter-spacing:0.04em;">' + val + '</span>'
      + '</div>';
  }

  function sectionHeader(text) {
    return '<div style="font-family:var(--font-whois);font-size:0.75rem;color:var(--blue);letter-spacing:0.1em;text-transform:uppercase;border-bottom:1px solid rgba(12,33,119,0.15);padding-bottom:8px;margin-bottom:20px;">' + text + '</div>';
  }

  // print button — prominent, at the top
  var printBtn = '<a href="print.html" style="font-family:var(--font-whois);font-size:0.8rem;color:var(--color-bg);letter-spacing:0.1em;text-transform:uppercase;background:var(--blue);border:none;padding:0.75rem 1.5rem;cursor:pointer;display:inline-block;text-decoration:none;font-weight:normal;">Print Report</a>';

  container.innerHTML = [

    // header with print button on the right
    '<div style="padding:1.25rem 2.5rem;border-bottom:1px solid rgba(12,33,119,0.15);display:flex;justify-content:space-between;align-items:center;">',
      '<span style="font-family:var(--font-whois);font-size:0.85rem;color:var(--blue);letter-spacing:0.1em;text-transform:uppercase;">City report · ' + (localStorage.getItem('cityName') || 'Your city') + '</span>',
      printBtn,
    '</div>',

    '<div style="display:grid;grid-template-columns:1fr 1fr;">',

      // left col
      '<div style="border-right:1px solid rgba(12,33,119,0.15);padding:2rem 2.5rem;display:flex;flex-direction:column;gap:0;">',
        sectionHeader('Overview'),
        statRow('Total sessions', totalSessions),
        statRow('Districts visited', districtStats.length + ' / 5'),
        statRow('Words written', '~' + Math.round(totalWords / 10) * 10),
        statRow('First session', firstDate || '\u2014'),
        statRow('Last session', lastDate   || '\u2014'),
      '</div>',

      // right col
      '<div style="padding:2rem 2.5rem;display:flex;flex-direction:column;gap:2rem;">',

        '<div>',
          sectionHeader('Sessions by district'),
          districtStats.slice().sort(function(a,b){return b.sessions-a.sessions;}).map(function(d) {
            var pct   = Math.round((d.sessions / maxSessions) * 100);
            var label = d.key.charAt(0).toUpperCase() + d.key.slice(1);
            return '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">'
              + '<span style="font-family:var(--font-whois);font-size:0.95rem;color:var(--blue);width:110px;flex-shrink:0;">' + label + '</span>'
              + '<div style="flex:1;height:3px;background:rgba(12,33,119,0.1);position:relative;">'
              +   '<div style="height:100%;width:' + pct + '%;background:' + d.color + ';position:absolute;left:0;top:0;"></div>'
              + '</div>'
              + '<span style="font-family:var(--font-whois);font-size:0.95rem;color:var(--blue);width:24px;text-align:right;flex-shrink:0;">' + d.sessions + '</span>'
              + '</div>';
          }).join(''),
        '</div>',

        '<div>',
          sectionHeader('Most frequent words'),
          '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;">',
            topWords.map(function(k, i) {
              var col = DISTRICT_COLORS[k.districts[0]] || '#0c2177';
              var fs  = Math.round(32 - i * 1.4);
              return '<span style="font-family:var(--font-meta);font-size:' + fs + 'px;color:' + col + ';line-height:1.3;">' + k.word + '</span>';
            }).join(''),
          '</div>',
        '</div>',

      '</div>',

    '</div>',

  ].join('');
}

function showConstellationInfoPanel(node) {
  const panel = document.getElementById('constellation-info-panel');
  if (!panel) return;

  const districtNames = node.districts.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
  const districtColor = node.districts.length === 1 ? DISTRICT_COLORS[node.districts[0]] : '#0c2177';

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


// constellation p5 sketch

function initConstellationSketch() {
  const container = document.getElementById('constellation-canvas-container');
  if (!container) return;
  if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }

  if (!document.getElementById('constellation-controls')) {
    const sliderMax   = TIME_OPTIONS.length - 1;
    const currentIdx  = TIME_OPTIONS.findIndex(o => o.value === constellationTimeRange);
    const resolvedIdx = currentIdx >= 0 ? currentIdx : sliderMax;

    const checksHTML = DISTRICT_META.map(d => `
      <label class="constellation-district-check">
        <input type="checkbox" data-district="${d.key}"
          ${constellationDistricts.has(d.key) ? 'checked' : ''}
          style="border-color:${d.color}">
        <span class="constellation-district-check-label" style="color:${d.color}">${d.label}</span>
      </label>
    `).join('');

    const controls = document.createElement('div');
    controls.id        = 'constellation-controls';
    controls.className = 'constellation-controls';
    controls.innerHTML = `
      <div class="constellation-control-group">
        <span class="constellation-control-label">Time</span>
        <input type="range" class="constellation-time-slider" id="constellation-time-slider"
          min="0" max="${sliderMax}" value="${resolvedIdx}" step="1">
        <span class="constellation-time-value" id="constellation-time-value">
          ${TIME_OPTIONS[resolvedIdx].label}
        </span>
      </div>
      <div class="constellation-divider"></div>
      <div class="constellation-control-group">
        <span class="constellation-control-label">Districts</span>
        <div class="constellation-district-checks">${checksHTML}</div>
      </div>
    `;
    container.appendChild(controls);

    document.getElementById('constellation-time-slider').addEventListener('input', (e) => {
      const idx = parseInt(e.target.value);
      constellationTimeRange = TIME_OPTIONS[idx].value;
      document.getElementById('constellation-time-value').textContent = TIME_OPTIONS[idx].label;
      rebuildConstellation();
    });

    controls.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) constellationDistricts.add(cb.dataset.district);
        else            constellationDistricts.delete(cb.dataset.district);
        rebuildConstellation();
      });
    });
  }

  const keywords = extractAllKeywords(20, constellationTimeRange, constellationDistricts);
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
    n.anchorX        = anchor.ax;
    n.anchorY        = anchor.ay;
    n.singleDistrict = n.districts.length === 1;
  });

  constellationSketch = new p5((sk) => {
    let W, H, frame = 0;
    let selectedIdx  = null;
    let dragNodeIdx  = null;
    let dragOffX = 0, dragOffY = 0;

    const blue = getComputedStyle(document.body).getPropertyValue('--blue').trim()     || '#0c2177';
    const bg   = getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#F7F2F1';
    const PAD_X = 10, PAD_Y = 6;

    const anchorLabels = Object.entries(ANCHORS).map(([key, pos]) => ({
      key,
      px:    pos.ax * (container.offsetWidth  || window.innerWidth),
      py:    pos.ay * (container.offsetHeight || (window.innerHeight - 90)),
      label: DISTRICT_META.find(d => d.key === key)?.label || key,
      color: DISTRICT_COLORS[key] || blue,
    }));

    nodes.forEach(n => {
      n.anchorLabelIdx = anchorLabels.findIndex(a => a.key === (n.districts[0] || ''));
      if (n.anchorLabelIdx < 0) n.anchorLabelIdx = 0;
    });

    sk.setup = () => {
      W = container.offsetWidth  || window.innerWidth;
      H = container.offsetHeight || (window.innerHeight - 90);
      sk.createCanvas(W, H).parent('constellation-canvas-container');
      sk.textFont('monospace');
      sk.textSize(12);
      anchorLabels.forEach(a => {
        const src = ANCHORS[a.key];
        a.px = src.ax * W;
        a.py = src.ay * H;
      });
      nodes.forEach(n => {
        n.x  = n.anchorX * W + (Math.random() - 0.5) * 60;
        n.y  = n.anchorY * H + (Math.random() - 0.5) * 60;
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
          const d  = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f  = 5000 / (d * d);
          a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }

      nodes.forEach(n => {
        const pull = n.singleDistrict ? 0.012 : 0.004;
        n.vx += (n.anchorX * W - n.x) * pull;
        n.vy += (n.anchorY * H - n.y) * pull;
        n.vx *= damping; n.vy *= damping;
        n.x = Math.max(60, Math.min(W - 60, n.x + n.vx));
        n.y = Math.max(30, Math.min(H - 30, n.y + n.vy));
      });

      anchorLabels.forEach(a => {
        sk.textSize(11);
        const tw = sk.textWidth(a.label);
        const rw = tw + 20, rh = 22;
        sk.noStroke();
        sk.fill(a.color + '22');
        sk.rect(a.px - rw / 2, a.py - rh / 2, rw, rh);
        sk.fill(a.color);
        sk.textAlign(sk.CENTER, sk.CENTER);
        sk.text(a.label, a.px, a.py);
      });

      nodes.forEach((n, idx) => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2, rh = fontSize + PAD_Y * 2;
        const isSelected = selectedIdx === idx;
        const isHovered  = sk.mouseX > n.x - rw / 2 && sk.mouseX < n.x + rw / 2 &&
                           sk.mouseY > n.y - rh / 2 && sk.mouseY < n.y + rh / 2;

        let col;
        if (n.districts.length === 1) {
          col = DISTRICT_COLORS[n.districts[0]];
        } else {
          const c1   = DISTRICT_COLORS[n.districts[0]] || blue;
          const c2   = DISTRICT_COLORS[n.districts[1]] || blue;
          const grad = sk.drawingContext.createLinearGradient(n.x - rw / 2, n.y, n.x + rw / 2, n.y);
          grad.addColorStop(0, c1);
          grad.addColorStop(1, c2);
          col = grad;
        }

        sk.noStroke();
        if (typeof col === 'string') {
          sk.fill(isSelected || isHovered ? col : col + 'CC');
          sk.rect(n.x - rw / 2, n.y - rh / 2, rw, rh);
        } else {
          sk.drawingContext.fillStyle   = col;
          sk.drawingContext.globalAlpha = (isSelected || isHovered) ? 1 : 0.8;
          sk.drawingContext.fillRect(n.x - rw / 2, n.y - rh / 2, rw, rh);
          sk.drawingContext.globalAlpha = 1;
        }
        sk.fill(bg);
        sk.textAlign(sk.CENTER, sk.CENTER);
        sk.text(n.word, n.x, n.y);
      });
    };

    function hitAnchorLabel(mx, my, a) {
      sk.textSize(11);
      const tw = sk.textWidth(a.label);
      const rw = tw + 20, rh = 22;
      return mx > a.px - rw / 2 && mx < a.px + rw / 2 &&
             my > a.py - rh / 2 && my < a.py + rh / 2;
    }

    sk.mousePressed = () => {
      if (constellationReadOnly) return;

      for (let i = 0; i < anchorLabels.length; i++) {
        if (hitAnchorLabel(sk.mouseX, sk.mouseY, anchorLabels[i])) {
          dragNodeIdx = i;
          dragOffX    = sk.mouseX - anchorLabels[i].px;
          dragOffY    = sk.mouseY - anchorLabels[i].py;
          return;
        }
      }

      let hit = null;
      nodes.forEach((n, idx) => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2, rh = fontSize + PAD_Y * 2;
        if (sk.mouseX > n.x - rw / 2 && sk.mouseX < n.x + rw / 2 &&
            sk.mouseY > n.y - rh / 2 && sk.mouseY < n.y + rh / 2) hit = idx;
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

    sk.mouseDragged = () => {
      if (constellationReadOnly || dragNodeIdx === null) return;
      anchorLabels[dragNodeIdx].px = Math.max(60, Math.min(W - 60, sk.mouseX - dragOffX));
      anchorLabels[dragNodeIdx].py = Math.max(30, Math.min(H - 30, sk.mouseY - dragOffY));
      nodes.forEach(n => {
        if (n.anchorLabelIdx === dragNodeIdx) {
          n.anchorX = anchorLabels[dragNodeIdx].px / W;
          n.anchorY = anchorLabels[dragNodeIdx].py / H;
        }
      });
    };

    sk.mouseReleased = () => { dragNodeIdx = null; };

    sk.mouseMoved = () => {
      if (constellationReadOnly) { container.style.cursor = 'default'; return; }
      const onAnchor = anchorLabels.some(a => hitAnchorLabel(sk.mouseX, sk.mouseY, a));
      let onNode = false;
      nodes.forEach(n => {
        const fontSize = 11 + Math.min(n.count * 1.5, 6);
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2, rh = fontSize + PAD_Y * 2;
        if (sk.mouseX > n.x - rw / 2 && sk.mouseX < n.x + rw / 2 &&
            sk.mouseY > n.y - rh / 2 && sk.mouseY < n.y + rh / 2) onNode = true;
      });
      container.style.cursor = (onAnchor || onNode) ? 'pointer' : 'default';
    };

    sk.windowResized = () => {
      W = container.offsetWidth  || window.innerWidth;
      H = container.offsetHeight || (window.innerHeight - 90);
      sk.resizeCanvas(W, H);
      anchorLabels.forEach(a => {
        const src = ANCHORS[a.key];
        a.px = src.ax * W;
        a.py = src.ay * H;
      });
      nodes.forEach(n => {
        n.x  = n.anchorX * W + (Math.random() - 0.5) * 40;
        n.y  = n.anchorY * H + (Math.random() - 0.5) * 40;
        n.vx = 0; n.vy = 0;
      });
    };

  }, container);
}

function rebuildConstellation() {
  if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }
  const canvas = document.querySelector('#constellation-canvas-container canvas');
  if (canvas) canvas.remove();
  initConstellationSketch();
}


// dom ready

document.addEventListener('DOMContentLoaded', () => {

  initCityName();
  initDistricts();
  displayDistrictNames();
  checkAchievements();
  seedExampleCity();
  initConstellationBtn();

  const settingsUI = document.createElement('div');
  settingsUI.innerHTML = `
    <div class="customize-toggle-btn" id="customize-toggle-btn">
      <span class="customize-btn-label">Settings</span>
    </div>
    <div class="customize-panel" id="customize-panel">
      <div class="customize-panel-header" id="customize-panel-header">
        <span class="customize-panel-label">Settings</span>
        <span class="customize-panel-toggle">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <polyline points="1,7 6,1 11,7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
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
        <div class="customize-row">
          <span class="customize-row-label">Sound</span>
          <div class="customize-toggle-cell" id="audio-mute-toggle">
            <div class="toggle-track" id="audio-mute-track"><div class="toggle-thumb"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(settingsUI);

  document.getElementById('customize-toggle-btn').addEventListener('click', openCustomizePanel);
  document.getElementById('customize-panel-header').addEventListener('click', closeCustomizePanel);
  document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
  document.getElementById('randomize-toggle').addEventListener('click', toggleRandomize);
  document.getElementById('audio-mute-toggle')?.addEventListener('click', toggleAudioMute);

  initDarkMode();
  initRandomize();
  if (typeof initTrain === 'function') initTrain();

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

  document.getElementById('share-btn')?.addEventListener('click', openShare);
  document.getElementById('share-close-btn')?.addEventListener('click', closeShare);
  document.getElementById('share-tab-share')?.addEventListener('click', () => switchShareTab('share-tab-share'));
  document.getElementById('share-tab-log')?.addEventListener('click',   () => switchShareTab('share-tab-log'));
  document.getElementById('share-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'share-overlay') closeShare();
  });
  document.getElementById('share-copy-btn')?.addEventListener('click', () => {
    const code = document.getElementById('share-code-value').textContent;
    navigator.clipboard.writeText(code).catch(() => {});
    unlockAchievement('shared-city');
    const btn = document.getElementById('share-copy-btn');
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1800);
  });

  document.getElementById('visitor-add-btn')?.addEventListener('click', addVisitorCity);
  document.getElementById('visitor-code-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addVisitorCity();
  });

  document.getElementById('share-username-save-btn')?.addEventListener('click', () => {
    const val = document.getElementById('share-username-input').value.trim();
    if (!val) return;
    localStorage.setItem('cityUsername', val);
    const btn = document.getElementById('share-username-save-btn');
    btn.textContent = 'Saved';
    setTimeout(() => { btn.textContent = 'Save'; }, 1500);
  });

  document.getElementById('about-btn')?.addEventListener('click', () => {
    document.getElementById('about-overlay').classList.add('active');
  });
  document.getElementById('about-close-btn')?.addEventListener('click', () => {
    document.getElementById('about-overlay').classList.remove('active');
  });
  document.getElementById('about-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'about-overlay') document.getElementById('about-overlay').classList.remove('active');
  });

  document.getElementById('return-btn')?.addEventListener('click', openReturnOverlay);
  document.getElementById('return-no-btn')?.addEventListener('click', closeReturnOverlay);
  document.getElementById('return-yes-btn')?.addEventListener('click', () => {
    closeReturnOverlay();
    exitVisitMode();
  });
  document.getElementById('return-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'return-overlay') closeReturnOverlay();
  });

  document.addEventListener('click', e => {
    const panel = document.getElementById('customize-panel');
    const btn   = document.getElementById('customize-toggle-btn');
    if (!panel || !panel.classList.contains('visible')) return;
    if (!panel.contains(e.target) && !btn?.contains(e.target)) closeCustomizePanel();
  });

});
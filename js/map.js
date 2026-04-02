// map.js

const DISTRICTS = ['garden', 'cornerstore', 'shrine', 'tower', 'plaza'];

const DISTRICT_QUESTIONS = {
  garden:      ['What place comes to mind?', 'What were you becoming in this place?', 'How did the growth happen? What did it feel like?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
  shrine:      ['What place comes to mind?', 'What did this place hold that was precious to you?', 'How do you return to this place?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
  cornerstore: ['What place comes to mind?', 'What was your routine in this place?', 'What drew you to this specific place?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
  tower:       ['What place comes to mind?', 'What was your relationship with solitude in this space?', 'What perspective did being alone give you?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
  plaza:       ['What place comes to mind?', 'Who else was in this place? How did you connect with them?', 'What brought you together in this place?', 'When you think of this place, what do you remember?', 'If this place were to fade from memory completely, what would be lost?'],
};

const DISTRICT_COLORS = {
  shrine:      '#DD6204',
  garden:      '#6A6405',
  cornerstore: '#D05038',
  tower:       '#205A97',
  plaza:       '#6E4C77',
};

const DISTRICT_META = [
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

    // remove stale span so we always reflect the latest saved name
    const existing = label.querySelector('.district-custom-name');
    if (existing) existing.remove();

    // only render if a name has been saved
    if (!savedName) return;

    const span = document.createElement('span');
    span.className   = 'district-custom-name';
    span.textContent = savedName;
    // only the custom name tag is clickable — emotion tag and district body unaffected
    span.style.cursor        = 'pointer';
    span.style.pointerEvents = 'all';
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem('currentDistrict', name);
      window.location.href = `districts/${name}-customize.html`;
    });
    label.appendChild(span);
  });

  // update hint text once any district has been started
  const anyDone = DISTRICTS.some(name => {
    const hasSessions = JSON.parse(localStorage.getItem(`${name}-sessions`) || '[]').length > 0;
    return states[name] === 'unlocked' || hasSessions;
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
    // check return/revisit achievements from session count
    const sessionCount = JSON.parse(localStorage.getItem(`${d}-sessions`) || '[]').length;
    if (sessionCount >= 2) unlockAchievement(`returned-${d}`, true);
    // check named-district
    const savedName = localStorage.getItem(`${d}-name`);
    const defaultNames = [`The ${d.charAt(0).toUpperCase() + d.slice(1)}`];
    if (savedName && !defaultNames.includes(savedName)) unlockAchievement(`named-${d}`, true);
  });
  if (DISTRICTS.every(d => states[d] === 'unlocked')) unlockAchievement('completed-all', true);
  if (cityName && cityName !== 'Somewhere I Belong' && cityName !== 'Name Your City') unlockAchievement('named-city', true);
}


// guide overlay

let guideSlide        = 0;
const GUIDE_TOTAL_STEPS = 5;
let guideConceptTimer = null;

function openGuide() {
  guideSlide = 1;
  document.getElementById('guide-overlay').classList.add('active');
  showGuideSlide(1);
}

function closeGuide() {
  if (guideConceptTimer) { clearTimeout(guideConceptTimer); guideConceptTimer = null; }
  document.getElementById('guide-overlay').classList.remove('active');
}

function showGuideSlide(index) {
  document.querySelectorAll('.guide-slide').forEach(s => s.classList.remove('active'));
  const target = document.querySelector(`.guide-slide[data-index="${index}"]`);
  if (target) target.classList.add('active');

  const prev     = document.getElementById('guide-prev');
  const next     = document.getElementById('guide-next');
  const progress = document.getElementById('guide-progress');

  if (prev)     prev.style.visibility = index === 1 ? 'hidden' : 'visible';
  if (next)     next.textContent      = index === GUIDE_TOTAL_STEPS ? 'Begin ↗' : 'Next →';
  if (progress) progress.textContent  = `${index}/${GUIDE_TOTAL_STEPS}`;
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

    // clone to clear old listeners
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
  // swap localStorage so the sketch reads the visitor's data
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

  // read-only: no word clicks or anchor drags
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
  if (next) randomizeDistricts();
  else location.reload();
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

  // fallback: fill sparse constellations with top non-keyword words
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

  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, topN).map(([word, count]) => ({
    word, count,
    districts: [...wordSources[word]],
    contexts:  wordContexts[word] || [],
  }));
}


// constellation

let constellationSketch   = null;
let constellationActive   = false;
let constellationReadOnly = false;

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
  setTimeout(() => initConstellationSketch(), 100);
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

  setTimeout(() => {
    overlay.classList.add('hidden');
    if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }
    const controls = document.getElementById('constellation-controls');
    if (controls) controls.remove();
  }, 600);
}


// constellation info panel

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


// constellation p5 sketch

function initConstellationSketch() {
  const container = document.getElementById('constellation-canvas-container');
  if (!container) return;
  if (constellationSketch) { constellationSketch.remove(); constellationSketch = null; }

  // controls (time slider + district checkboxes)
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

    const blue = getComputedStyle(document.body).getPropertyValue('--blue').trim()     || '#0A059B';
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

      // repulsion between all nodes
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

      // draw anchor labels
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

      // draw word nodes
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

  // inject settings panel + button
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
      </div>
    </div>
  `;
  document.body.appendChild(settingsUI);

  document.getElementById('customize-toggle-btn').addEventListener('click', openCustomizePanel);
  document.getElementById('customize-panel-header').addEventListener('click', closeCustomizePanel);
  document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
  document.getElementById('randomize-toggle').addEventListener('click', toggleRandomize);

  initDarkMode();
  initRandomize();
  if (typeof initTrain === 'function') initTrain();

  // city name overlay
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

  // guide overlay
  document.getElementById('guide-btn')?.addEventListener('click', openGuide);
  document.getElementById('guide-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'guide-overlay') closeGuide();
  });
  document.getElementById('guide-prev')?.addEventListener('click', () => {
    if (guideSlide > 1) { guideSlide--; showGuideSlide(guideSlide); }
  });
  document.getElementById('guide-next')?.addEventListener('click', () => {
    if (guideSlide < GUIDE_TOTAL_STEPS) { guideSlide++; showGuideSlide(guideSlide); }
    else closeGuide();
  });

  // share overlay
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

  // visitor log
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

  // about overlay
  document.getElementById('about-btn')?.addEventListener('click', () => {
    document.getElementById('about-overlay').classList.add('active');
  });
  document.getElementById('about-close-btn')?.addEventListener('click', () => {
    document.getElementById('about-overlay').classList.remove('active');
  });
  document.getElementById('about-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'about-overlay') document.getElementById('about-overlay').classList.remove('active');
  });

  // visit mode: return to city
  document.getElementById('return-btn')?.addEventListener('click', openReturnOverlay);
  document.getElementById('return-no-btn')?.addEventListener('click', closeReturnOverlay);
  document.getElementById('return-yes-btn')?.addEventListener('click', () => {
    closeReturnOverlay();
    exitVisitMode();
  });
  document.getElementById('return-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'return-overlay') closeReturnOverlay();
  });

  // close settings when clicking outside
  document.addEventListener('click', e => {
    const panel = document.getElementById('customize-panel');
    const btn   = document.getElementById('customize-toggle-btn');
    if (!panel || !panel.classList.contains('visible')) return;
    if (!panel.contains(e.target) && !btn?.contains(e.target)) closeCustomizePanel();
  });

});
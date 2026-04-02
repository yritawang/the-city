// customize.js


// detect current district from the url

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


// district config

const DISTRICT_CONFIG = {
  shrine: {
    displayName: 'The Shrine',
    emotion: 'Reverence',
    emotionWord: 'reverence',
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
    emotionWord: 'growth',
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
    emotion: 'Routine',
    emotionWord: 'routine',
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
    emotion: 'Solitude',
    emotionWord: 'solitude',
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
    emotion: 'Community',
    emotionWord: 'community',
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

function getWordCategory(w) {
  if (EMOTION_WORDS.has(w) || DESCRIPTIVE_WORDS.has(w)) return 'emotional';
  if (LOCATION_WORDS.has(w)) return 'location';
  return 'other';
}

function extractKeywords(filteredSessions, topN = 24) {
  const freq = {}, wordSessions = {};
  // skip train thought sessions — their answers[0] is "Train Thoughts" not a real place
  filteredSessions.filter(s => !s.isTrainThought).forEach(session => {
    Object.entries(session.answers).forEach(([qi, answer]) => {
      if (parseInt(qi) === 5 || !answer) return;
      const words = answer.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
      words.filter(w => w.length > 3 && !STOPWORDS.has(w)).forEach(w => {
        freq[w] = (freq[w] || 0) + 1;
        if (!wordSessions[w]) wordSessions[w] = new Set();
        wordSessions[w].add(session.timestamp);
      });
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({
      word, count,
      category: getWordCategory(word),
      lastSeen: Math.max(...wordSessions[word])
    }));
}

const config     = DISTRICT_CONFIG[CURRENT_DISTRICT];
const QUESTIONS  = config.questions;
const DIST_COLOR = config.color;

let districtData  = {};
let sessions      = [];
let currentSkin   = 0;
let graphSketch   = null;
let isGraphMode   = false;

const TIME_OPTIONS = [
  { value: 'week',  label: 'Past week'  },
  { value: 'month', label: 'Past month' },
  { value: 'year',  label: 'Past year'  },
  { value: 'all',   label: 'All time'   },
];
let memoryTimeRange  = 'all';
let memoryAnchorMode = 'location';


// init

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.toggle('dark-mode', localStorage.getItem('dark-mode') === 'true');
  loadData();
  renderUI();
  setupListeners();
  loadMedia();
  initMediaListeners();

  // illustration zoom overlay
  const previewImg = document.getElementById('district-preview-img');
  const overlayEl  = document.createElement('div');
  overlayEl.className = 'illustration-overlay';
  const overlayBox = document.createElement('div');
  overlayBox.className = 'illustration-overlay-box';
  const overlayImg = document.createElement('img');
  overlayImg.className = 'illustration-overlay-img';
  overlayBox.appendChild(overlayImg);
  overlayEl.appendChild(overlayBox);
  document.body.appendChild(overlayEl);

  document.querySelector('.district-image-container')?.addEventListener('click', () => {
    overlayImg.src = previewImg.src;
    overlayEl.classList.add('active');
  });
  overlayEl.addEventListener('click', () => overlayEl.classList.remove('active'));
});


// skin display

function updateSkinDisplay() {
  const skins = [
    `${CURRENT_DISTRICT}-unlocked`,
    `${CURRENT_DISTRICT}-skin2`,
    `${CURRENT_DISTRICT}-skin3`
  ];
  const preview = document.getElementById('district-preview-img');
  if (preview) preview.src = `../assets/districts/${skins[currentSkin]}.png`;

  document.querySelectorAll('.skin-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === currentSkin);
    const img = thumb.querySelector('img');
    if (img) img.src = `../assets/districts/${skins[i]}.png`;
  });

  // auto-save on every skin change
  localStorage.setItem(`${CURRENT_DISTRICT}-skin`, currentSkin);
}


// delete confirmation overlay

function confirmDeleteEntry(ts) {
  document.getElementById('delete-confirm-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'delete-confirm-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(10,5,155,0.15);display:flex;align-items:center;justify-content:center;z-index:1000;';
  overlay.innerHTML = `
    <div class="delete-confirm-content">
      <p class="delete-confirm-msg mono">Are you sure you want to delete this entry?</p>
      <div class="delete-confirm-actions">
        <button class="overlay-btn mono" id="delete-confirm-no">No, I want to keep it</button>
        <button class="overlay-btn mono primary" id="delete-confirm-yes">Yes, I want to delete it</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('delete-confirm-no').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('delete-confirm-yes').addEventListener('click', () => {
    overlay.remove();
    sessions = sessions.filter(s => s.timestamp !== ts);
    localStorage.setItem(`${CURRENT_DISTRICT}-sessions`, JSON.stringify(sessions));
    renderJournalEntries();
  });
}


// data

function loadData() {
  const rawAnswers = JSON.parse(localStorage.getItem(`${CURRENT_DISTRICT}-answers`) || '{}');
  districtData = {
    name:    localStorage.getItem(`${CURRENT_DISTRICT}-name`) || config.displayName,
    date:    localStorage.getItem(`${CURRENT_DISTRICT}-date`) || new Date().toLocaleDateString('en-US'),
    answers: rawAnswers
  };
  sessions = JSON.parse(localStorage.getItem(`${CURRENT_DISTRICT}-sessions`) || '[]');

  // backfill first session if answers exist but no sessions saved yet
  if (sessions.length === 0 && Object.keys(rawAnswers).length > 0) {
    sessions.push({ date: districtData.date, timestamp: Date.now(), answers: { ...rawAnswers } });
    localStorage.setItem(`${CURRENT_DISTRICT}-sessions`, JSON.stringify(sessions));
  }

  currentSkin = parseInt(localStorage.getItem(`${CURRENT_DISTRICT}-skin`) || '0');
}


// render

function renderUI() {
  const titleEl = document.getElementById('district-title');
  if (titleEl) titleEl.textContent = districtData.name;

  const dateEl = document.getElementById('district-date');
  if (dateEl) dateEl.textContent = `Edited: ${districtData.date}`;

  // show all unique locations in the subheader — exclude train thought entries
  const locationEl = document.getElementById('location-value');
  if (locationEl) {
    const unique = [...new Set(
      sessions.filter(s => !s.isTrainThought).map(s => s.answers[0]).filter(Boolean)
    )];
    locationEl.textContent = unique.length ? unique.join(', ') : '—';
  }

  updateSkinDisplay();
  renderJournalEntries();
}


// journal entries

function renderJournalEntries() {
  const container = document.getElementById('journal-entries');
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = '<p class="mono" style="opacity:0.4;padding:1rem 0;">No entries yet.</p>';
    return;
  }

  // group by location (answer[0]), newest first
  const groups = new Map();
  [...sessions].sort((a, b) => b.timestamp - a.timestamp).forEach(session => {
    const place = session.answers[0] || '—';
    if (!groups.has(place)) groups.set(place, []);
    groups.get(place).push(session);
  });

  container.innerHTML = '';

  // use event delegation for delete — avoids issues with inner svg click targets
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-entry-btn');
    if (!btn) return;
    e.stopPropagation();
    const ts = parseInt(btn.dataset.ts);
    confirmDeleteEntry(ts);
  });

  groups.forEach((groupSessions, place) => {
    const group = document.createElement('div');
    group.className = 'journal-location-group open';

    // collapsible heading with svg chevron
    const heading = document.createElement('div');
    heading.className = 'journal-location-heading mono';
    heading.innerHTML = `<span>${place}</span><span class="journal-location-chevron"><svg width="12" height="8" viewBox="0 0 12 8" fill="none"><polyline points="1,1 6,7 11,1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    heading.addEventListener('click', () => group.classList.toggle('open'));
    group.appendChild(heading);

    const body = document.createElement('div');
    body.className = 'journal-location-body';

    groupSessions.forEach(session => {
      const entry     = document.createElement('div');
      entry.className = 'journal-entry';

      const musicName = localStorage.getItem(`${CURRENT_DISTRICT}-music-name-${session.timestamp}`);
      const photoData = localStorage.getItem(`${CURRENT_DISTRICT}-photo-${session.timestamp}`);

      const musicHtml = musicName
        ? `<div class="journal-entry-song mono">&#9654; ${musicName}</div>`
        : '';

      const photoIndicator = photoData
        ? `<img src="${photoData}" class="journal-entry-thumb" alt="photo">`
        : '';

      entry.innerHTML = `
        <div class="journal-entry-header">
          <span class="journal-entry-date mono">${session.date}</span>
          <div class="journal-entry-meta">
            ${photoIndicator}
            <button class="delete-entry-btn" data-ts="${session.timestamp}" title="Delete" aria-label="Delete entry">
              <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                <path d="M1 3.5h11M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M2 3.5l.75 8a.5.5 0 0 0 .5.5h6.5a.5.5 0 0 0 .5-.5L11 3.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
                <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
              </svg>
            </button>
            <span class="journal-entry-chevron"><svg width="12" height="8" viewBox="0 0 12 8" fill="none"><polyline points="1,1 6,7 11,1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          </div>
        </div>
        <div class="journal-entry-body">
          ${session.isTrainThought
            ? `<div class="journal-qa">
                ${session.answers[1] ? `<span class="journal-question">${session.answers[1]}</span>` : ''}
                <span class="journal-answer">${session.answers[2] || '—'}</span>
               </div>`
            : Object.entries(session.answers).map(([i, a]) => `
                <div class="journal-qa">
                  <span class="journal-question">${QUESTIONS[i] || ''}</span>
                  <span class="journal-answer">${a || '—'}</span>
                </div>
              `).join('')
          }
          ${musicHtml}
        </div>
      `;

      entry.querySelector('.journal-entry-header').addEventListener('click', (e) => {
        if (e.target.closest('.delete-entry-btn')) return;
        entry.classList.toggle('open');
      });

      body.appendChild(entry);
    });

    group.appendChild(body);
    container.appendChild(group);
  });
}


// album view

function getAlbumPhotos() {
  return JSON.parse(localStorage.getItem(`${CURRENT_DISTRICT}-album-photos`) || '[]');
}

function saveAlbumPhotos(photos) {
  localStorage.setItem(`${CURRENT_DISTRICT}-album-photos`, JSON.stringify(photos));
}

// returns [[locationName, latestTimestamp], ...] sorted by most recent session
function getLocationsSortedByRecency() {
  const seen = new Map();
  [...sessions]
    .filter(s => !s.isTrainThought && s.answers[0])
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach(s => {
      if (!seen.has(s.answers[0])) seen.set(s.answers[0], s.timestamp);
    });
  return [...seen.entries()];
}

// sort photos: grouped by location recency, unattached photos last
function sortAlbumPhotos(photos) {
  const locationOrder = getLocationsSortedByRecency().map(([name]) => name);
  return [...photos].sort((a, b) => {
    const ai = a.location ? locationOrder.indexOf(a.location) : Infinity;
    const bi = b.location ? locationOrder.indexOf(b.location) : Infinity;
    if (ai !== bi) return ai - bi;
    // within same location, newest photo first
    return b.addedAt - a.addedAt;
  });
}

function renderAlbumView() {
  const photosContainer = document.getElementById('album-photos');
  const songsContainer  = document.getElementById('album-songs');
  if (!photosContainer || !songsContainer) return;

  const photos = sortAlbumPhotos(getAlbumPhotos());

  // hidden file input — created once, reused across renders
  let fileInput = document.getElementById('album-file-input');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type      = 'file';
    fileInput.accept    = 'image/*';
    fileInput.id        = 'album-file-input';
    fileInput.className = 'hidden';
    fileInput.multiple  = true;
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files);
      if (!files.length) return;
      // read all files then show preview overlay one by one
      const srcs = [];
      let loaded  = 0;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          srcs.push(e.target.result);
          loaded++;
          if (loaded === files.length) openPhotoPreviewQueue(srcs);
        };
        reader.readAsDataURL(file);
      });
      fileInput.value = '';
    });
  }

  // build photo grid
  photosContainer.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'album-grid-header';
  header.innerHTML = `
    <span class="album-section-label mono">Photos</span>
    <button class="album-add-btn mono" id="album-add-btn">+ Add photos</button>
  `;
  photosContainer.appendChild(header);
  document.getElementById('album-add-btn').addEventListener('click', () => fileInput.click());

  if (photos.length === 0) {
    const empty = document.createElement('p');
    empty.className   = 'album-empty mono';
    empty.textContent = 'No photos yet. Add some above.';
    photosContainer.appendChild(empty);
  } else {
    const grid = document.createElement('div');
    grid.className = 'album-photo-grid';

    photos.forEach((photo, idx) => {
      const cell = document.createElement('div');
      cell.className = 'album-grid-cell';

      const locationBadge = photo.location
        ? `<span class="album-grid-location mono">${photo.location}</span>`
        : '';

      cell.innerHTML = `
        <img src="${photo.src}" class="album-grid-img" alt="photo ${idx + 1}">
        ${locationBadge}
        <button class="album-grid-remove" title="Remove photo" aria-label="Remove photo">
          <svg width="11" height="12" viewBox="0 0 13 14" fill="none">
            <path d="M1 3.5h11M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M2 3.5l.75 8a.5.5 0 0 0 .5.5h6.5a.5.5 0 0 0 .5-.5L11 3.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
          </svg>
        </button>
      `;

      // find original index in unsorted array for safe deletion
      const allPhotos   = getAlbumPhotos();
      const originalIdx = allPhotos.findIndex(p => p.src === photo.src && p.addedAt === photo.addedAt);

      cell.querySelector('.album-grid-img').addEventListener('click', () => openAlbumLightbox(photo.src));
      cell.querySelector('.album-grid-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        const current = getAlbumPhotos();
        current.splice(originalIdx, 1);
        saveAlbumPhotos(current);
        renderAlbumView();
      });

      grid.appendChild(cell);
    });

    photosContainer.appendChild(grid);
  }

  // songs section
  const songs = sessions
    .map(s => localStorage.getItem(`${CURRENT_DISTRICT}-music-name-${s.timestamp}`))
    .filter(Boolean);

  songsContainer.innerHTML = songs.length
    ? `<div class="album-section-label mono">Songs</div>
       ${songs.map(name => `
         <div class="album-song-row">
           <span class="album-song-icon">&#9654;</span>
           <span class="mono">${name}</span>
         </div>`).join('')}`
    : `<div class="album-section-label mono">Songs</div>
       <p class="album-empty mono">No songs attached yet.</p>`;
}


// photo preview queue — shown after selecting files, one per image

let previewQueue = [];

function openPhotoPreviewQueue(srcs) {
  previewQueue = [...srcs];
  showNextPreview();
}

function showNextPreview() {
  if (previewQueue.length === 0) return;
  const src = previewQueue.shift();
  openPhotoPreviewOverlay(src, previewQueue.length);
}

function openPhotoPreviewOverlay(src, remaining) {
  document.getElementById('photo-preview-overlay')?.remove();

  const locations = getLocationsSortedByRecency();

  const locationOptions = locations.length
    ? `<option value="">No location</option>` +
      locations.map(([name]) => `<option value="${name}">${name}</option>`).join('')
    : `<option value="">No locations logged yet</option>`;

  const overlay = document.createElement('div');
  overlay.id = 'photo-preview-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(10,5,155,0.15);display:flex;align-items:center;justify-content:center;z-index:1000;';
  overlay.innerHTML = `
    <div class="overlay-content photo-preview-content">
      <div class="photo-preview-img-wrap">
        <img src="${src}" class="photo-preview-img" alt="preview">
      </div>
      <div class="photo-preview-form">
        <label class="photo-preview-label mono">Attach to a location</label>
        <select class="photo-preview-select mono" id="photo-preview-select">
          ${locationOptions}
        </select>
        ${remaining > 0 ? `<p class="photo-preview-remaining mono">${remaining} more photo${remaining > 1 ? 's' : ''} after this</p>` : ''}
        <div class="photo-preview-actions">
          <button class="overlay-btn mono" id="photo-preview-skip">Skip</button>
          <button class="overlay-btn mono primary" id="photo-preview-save">Save</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // clicking outside closes and discards remaining queue
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      previewQueue = [];
    }
  });

  document.getElementById('photo-preview-skip').addEventListener('click', () => {
    overlay.remove();
    showNextPreview();
  });

  document.getElementById('photo-preview-save').addEventListener('click', () => {
    const location = document.getElementById('photo-preview-select').value || null;
    const photos   = getAlbumPhotos();
    photos.push({ src, location, addedAt: Date.now() });
    saveAlbumPhotos(photos);
    overlay.remove();
    renderAlbumView();
    showNextPreview();
  });
}


// album lightbox

function openAlbumLightbox(src) {
  let lb = document.getElementById('album-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'album-lightbox';
    lb.className = 'album-lightbox';
    lb.innerHTML = `
      <div class="album-lightbox-bg"></div>
      <div class="album-lightbox-content">
        <img class="album-lightbox-img" id="album-lightbox-img" src="" alt="">
        <button class="album-lightbox-close mono">Close</button>
      </div>
    `;
    document.body.appendChild(lb);
    lb.querySelector('.album-lightbox-bg').addEventListener('click', closeAlbumLightbox);
    lb.querySelector('.album-lightbox-close').addEventListener('click', closeAlbumLightbox);
  }
  lb.querySelector('#album-lightbox-img').src = src;
  lb.classList.add('active');
}

function closeAlbumLightbox() {
  document.getElementById('album-lightbox')?.classList.remove('active');
}


// navigation

function relogExistingLocation(locationName) {
  localStorage.removeItem(`${CURRENT_DISTRICT}-answers`);
  localStorage.setItem(`${CURRENT_DISTRICT}-relog-prefill`, locationName);
  window.location.href = `${CURRENT_DISTRICT}.html`;
}

function openRelogOverlay() {
  const locations = [...new Map(
    sessions.filter(s => s.answers[0] && !s.isTrainThought).map(s => [s.answers[0], s.answers[0]])
  ).values()];

  if (!document.getElementById('relog-overlay')) {
    const el = document.createElement('div');
    el.id = 'relog-overlay';
    el.className = 'relog-overlay';
    el.innerHTML = `
      <div class="relog-overlay-content">
        <p class="relog-overlay-title">Start a new log entry. Your previous entries will be kept.</p>
        <button class="relog-new-btn mono" id="relog-new-btn">Log a new location →</button>
        <div class="relog-existing-row">
          <div style="flex:1">
            <p class="relog-existing-label">Add to existing location</p>
            <div style="display:flex;gap:0.75rem">
              <select class="relog-existing-select" id="relog-existing-select">
                <option value="">Select a location...</option>
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
      localStorage.setItem(`${CURRENT_DISTRICT}-relog-prefill`, selected);
      window.location.href = `${CURRENT_DISTRICT}.html`;
    });

    document.getElementById('relog-cancel-btn').addEventListener('click', closeRelogOverlay);
    el.addEventListener('click', e => { if (e.target.id === 'relog-overlay') closeRelogOverlay(); });
  }

  requestAnimationFrame(() => document.getElementById('relog-overlay').classList.add('active'));
}

function closeRelogOverlay() {
  document.getElementById('relog-overlay')?.classList.remove('active');
}


// listeners

function setupListeners() {

  // inline title editing
  const titleCell  = document.getElementById('title-cell');
  const titleEl    = document.getElementById('district-title');
  const titleInput = document.getElementById('district-title-input');

  if (titleCell && titleEl && titleInput) {
    titleCell.addEventListener('click', () => {
      if (!titleInput.classList.contains('hidden')) return;
      titleInput.value = districtData.name;
      titleEl.classList.add('hidden');
      titleInput.classList.remove('hidden');
      titleInput.focus();
      titleInput.select();
    });

    titleInput.addEventListener('blur', commitName);
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
      unlockAchievement(`named-${CURRENT_DISTRICT}`);
    }
    titleEl.textContent = districtData.name;
    titleEl.classList.remove('hidden');
    titleInput.classList.add('hidden');
  }

  // skin thumbs: auto-save on click
  document.querySelectorAll('.skin-thumb').forEach(t => {
    t.addEventListener('click', () => {
      currentSkin = parseInt(t.dataset.skin);
      updateSkinDisplay();
    });
  });

  // log again button
  document.getElementById('add-location-btn')?.addEventListener('click', openRelogOverlay);

  // view toggles
  document.getElementById('journal-toggle')?.addEventListener('click', switchToJournal);
  document.getElementById('graph-toggle')?.addEventListener('click', switchToGraph);
  document.getElementById('album-toggle')?.addEventListener('click', switchToAlbum);
}


// view switching

function switchToJournal() {
  setActiveToggle('journal-toggle');
  isGraphMode = false;
  document.getElementById('journal-view').style.display = 'block';
  document.getElementById('graph-view').style.display   = 'none';
  const albumView = document.getElementById('album-view');
  if (albumView) albumView.style.display = 'none';
  if (graphSketch) { graphSketch.remove(); graphSketch = null; }
  const controls = document.getElementById('memory-controls');
  if (controls) controls.style.display = 'none';
}

function switchToGraph() {
  setActiveToggle('graph-toggle');
  isGraphMode = true;
  document.getElementById('journal-view').style.display = 'none';
  document.getElementById('graph-view').style.display   = 'flex';
  const albumView = document.getElementById('album-view');
  if (albumView) albumView.style.display = 'none';
  const controls = document.getElementById('memory-controls');
  if (controls) controls.style.display = 'flex';
  setTimeout(initGraph, 100);
}

function switchToAlbum() {
  setActiveToggle('album-toggle');
  isGraphMode = false;
  document.getElementById('journal-view').style.display = 'none';
  document.getElementById('graph-view').style.display   = 'none';
  const albumView = document.getElementById('album-view');
  if (albumView) albumView.style.display = 'flex';
  if (graphSketch) { graphSketch.remove(); graphSketch = null; }
  const controls = document.getElementById('memory-controls');
  if (controls) controls.style.display = 'none';
  renderAlbumView();
}

function setActiveToggle(activeId) {
  ['journal-toggle', 'graph-toggle', 'album-toggle'].forEach(id => {
    document.getElementById(id)?.classList.toggle('active', id === activeId);
  });
}


// memory view

function getSessionsForTimeRange() {
  if (memoryTimeRange === 'all') return sessions;
  const cutoffDays = { week: 7, month: 30, year: 365 };
  const cutoff = Date.now() - (cutoffDays[memoryTimeRange] || 0) * 24 * 60 * 60 * 1000;
  return sessions.filter(s => s.timestamp >= cutoff);
}

function computeAnchorPositions(n) {
  if (n === 1) return [{ ax: 0.5,  ay: 0.5  }];
  if (n === 2) return [{ ax: 0.28, ay: 0.5  }, { ax: 0.72, ay: 0.5  }];
  if (n === 3) return [{ ax: 0.22, ay: 0.28 }, { ax: 0.78, ay: 0.28 }, { ax: 0.5,  ay: 0.75 }];
  if (n === 4) return [{ ax: 0.22, ay: 0.28 }, { ax: 0.78, ay: 0.28 }, { ax: 0.22, ay: 0.72 }, { ax: 0.78, ay: 0.72 }];
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { ax: 0.5 + 0.32 * Math.cos(angle), ay: 0.5 + 0.32 * Math.sin(angle) };
  });
}

function buildAnchors(filtered) {
  if (memoryAnchorMode === 'location') {
    const places    = [...new Set(filtered.filter(s => !s.isTrainThought).map(s => s.answers[0]).filter(Boolean))];
    const list      = places.length ? places : ['here'];
    const positions = computeAnchorPositions(list.length);
    return list.map((place, i) => ({
      label: place, ax: positions[i].ax, ay: positions[i].ay, px: 0, py: 0
    }));
  } else {
    // count how often each emotion word appears across all responses
    const freq = {};
    filtered.forEach(session => {
      Object.entries(session.answers).forEach(([qi, answer]) => {
        if (parseInt(qi) === 5 || !answer) return;
        answer.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(w => {
          if (EMOTION_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
        });
      });
    });

    const emotionList = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    const finalList = emotionList.length > 0 ? emotionList : [config.emotionWord];
    const positions = computeAnchorPositions(finalList.length);
    return finalList.map((word, i) => ({
      label: word, ax: positions[i].ax, ay: positions[i].ay, px: 0, py: 0
    }));
  }
}

function assignAnchorIdx(word, anchors, filtered) {
  const counts = anchors.map(a => {
    let n = 0;
    filtered.forEach(session => {
      const place = session.answers[0] || '';
      Object.entries(session.answers).forEach(([qi, answer]) => {
        if (parseInt(qi) === 5 || !answer) return;
        const lower = answer.toLowerCase();
        if (!lower.includes(word)) return;
        if (memoryAnchorMode === 'location' && place === a.label) n++;
        if (memoryAnchorMode === 'emotion'  && lower.includes(a.label)) n++;
      });
    });
    return n;
  });
  const max = Math.max(...counts);
  if (max === 0) return Math.floor(Math.random() * anchors.length);
  return counts.indexOf(max);
}

function initGraph() {
  const container = document.getElementById('p5-canvas-container');
  if (!container) return;
  if (graphSketch) { graphSketch.remove(); graphSketch = null; }

  // controls bar: created once, kept alive across rebuilds
  if (!document.getElementById('memory-controls')) {
    const sliderMax   = TIME_OPTIONS.length - 1;
    const currentIdx  = TIME_OPTIONS.findIndex(o => o.value === memoryTimeRange);
    const resolvedIdx = currentIdx >= 0 ? currentIdx : sliderMax;

    const controls = document.createElement('div');
    controls.id = 'memory-controls';
    controls.className = 'memory-controls-bar';
    controls.innerHTML = `
      <div class="constellation-control-group">
        <span class="constellation-control-label">Time</span>
        <input type="range" class="constellation-time-slider" id="memory-time-slider"
          min="0" max="${sliderMax}" value="${resolvedIdx}" step="1">
        <span class="constellation-time-value" id="memory-time-value">${TIME_OPTIONS[resolvedIdx].label}</span>
      </div>
      <div class="constellation-divider"></div>
      <div class="constellation-control-group">
        <span class="constellation-control-label">Anchor by</span>
        <div class="memory-anchor-btns">
          <button class="memory-anchor-btn mono ${memoryAnchorMode === 'location' ? 'active' : ''}" data-mode="location">Location</button>
          <button class="memory-anchor-btn mono ${memoryAnchorMode === 'emotion'  ? 'active' : ''}" data-mode="emotion">Emotion</button>
        </div>
      </div>
    `;

    const graphView = document.getElementById('graph-view');
    graphView.insertBefore(controls, graphView.firstChild);

    document.getElementById('memory-time-slider').addEventListener('input', (e) => {
      const idx = parseInt(e.target.value);
      memoryTimeRange = TIME_OPTIONS[idx].value;
      document.getElementById('memory-time-value').textContent = TIME_OPTIONS[idx].label;
      rebuildGraph();
    });

    controls.querySelectorAll('.memory-anchor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        memoryAnchorMode = btn.dataset.mode;
        controls.querySelectorAll('.memory-anchor-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rebuildGraph();
      });
    });
  }

  const filtered = getSessionsForTimeRange();

  if (filtered.length === 0 || extractKeywords(filtered, 1).length === 0) {
    renderEmptyState(container);
    renderGraphTooltip();
    return;
  }

  const keywords = extractKeywords(filtered, 24);
  const now      = Date.now();
  const oldest   = Math.min(...filtered.map(s => s.timestamp));
  const timespan = Math.max(now - oldest, 1);

  const anchors  = buildAnchors(filtered);
  const maxCount = Math.max(...keywords.map(k => k.count), 1);
  const minCount = Math.min(...keywords.map(k => k.count), 1);

  const nodes = [];
  keywords.forEach(k => {
    const recency = (k.lastSeen - oldest) / timespan;

    const anchorHits = anchors.map((a, ai) => {
      let hit = false;
      filtered.forEach(session => {
        const place = session.answers[0] || '';
        Object.entries(session.answers).forEach(([qi, answer]) => {
          if (parseInt(qi) === 5 || !answer) return;
          const lower = answer.toLowerCase();
          if (!lower.includes(k.word)) return;
          if (memoryAnchorMode === 'location' && place === a.label) hit = true;
          if (memoryAnchorMode === 'emotion'  && lower.includes(a.label)) hit = true;
        });
      });
      return hit ? ai : -1;
    }).filter(ai => ai !== -1);

    const anchorIdxList = anchorHits.length > 0
      ? anchorHits
      : [assignAnchorIdx(k.word, anchors, filtered)];

    anchorIdxList.forEach(ai => {
      nodes.push({ ...k, x: 0, y: 0, vx: 0, vy: 0, anchorIdx: ai, recency });
    });
  });

  // duplicate pairs: same word, different anchors
  const duplicatePairs = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].word === nodes[j].word && nodes[i].anchorIdx !== nodes[j].anchorIdx) {
        duplicatePairs.push([i, j]);
      }
    }
  }

  // root pairs: prefix-related words across different anchors
  const rootPairs = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].word === nodes[j].word) continue;
      const a = nodes[i].word, b = nodes[j].word;
      if (Math.min(a.length, b.length) < 4) continue;
      const shorter = a.length <= b.length ? a : b;
      const longer  = a.length <= b.length ? b : a;
      if (longer.startsWith(shorter) && nodes[i].anchorIdx !== nodes[j].anchorIdx) {
        rootPairs.push([i, j]);
      }
    }
  }

  const bg           = getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#F7F2F1';
  const PAD_X        = 8, PAD_Y = 4;
  const ANCHOR_FONT  = 13;
  const ANCHOR_PAD_X = 10, ANCHOR_PAD_Y = 13;

  let hoveredIdx    = null;
  let dragAnchorIdx = null;
  let dragOffX = 0, dragOffY = 0;

  graphSketch = new p5((sk) => {
    let W, H, frame = 0;

    sk.setup = () => {
      const graphView  = document.getElementById('graph-view');
      const controlsEl = document.getElementById('memory-controls');
      const controlsH  = controlsEl ? controlsEl.offsetHeight : 0;
      W = graphView ? graphView.offsetWidth  : 800;
      H = graphView ? graphView.offsetHeight - controlsH : 500;
      if (H < 100) H = 500;
      sk.createCanvas(W, H).parent('p5-canvas-container');
      sk.textFont('monospace');

      anchors.forEach(a => { a.px = a.ax * W; a.py = a.ay * H; });
      nodes.forEach(n => {
        const a = anchors[n.anchorIdx] || anchors[0];
        n.x  = a.px + (Math.random() - 0.5) * 120;
        n.y  = a.py + (Math.random() - 0.5) * 120;
        n.vx = (Math.random() - 0.5) * 0.5;
        n.vy = (Math.random() - 0.5) * 0.5;
      });
    };

    sk.draw = () => {
      sk.background(bg);
      frame++;
      const damping = Math.min(0.92 + frame * 0.0003, 0.98);

      // repulsion between word nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d  = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f  = 800 / (d * d);
          a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }

      // repulsion from anchor labels
      nodes.forEach(n => {
        anchors.forEach(a => {
          const dx = n.x - a.px, dy = n.y - a.py;
          const d  = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          if (d < 90) {
            const f = 1000 / (d * d);
            n.vx += (dx / d) * f;
            n.vy += (dy / d) * f;
          }
        });
      });

      // soft pull toward each node's anchor
      nodes.forEach(n => {
        const a = anchors[n.anchorIdx] || anchors[0];
        n.vx += (a.px - n.x) * 0.002;
        n.vy += (a.py - n.y) * 0.002;
        n.vx *= damping; n.vy *= damping;
        n.x = Math.max(40, Math.min(W - 40, n.x + n.vx));
        n.y = Math.max(24, Math.min(H - 24, n.y + n.vy));
      });

      // duplicate word connecting lines
      if (duplicatePairs.length > 0) {
        sk.strokeWeight(0.8);
        sk.stroke(DIST_COLOR + '50');
        duplicatePairs.forEach(([i, j]) => { sk.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y); });
        sk.noStroke();
      }

      // root-related word connecting lines
      if (rootPairs.length > 0) {
        sk.strokeWeight(0.5);
        sk.stroke(DIST_COLOR + '28');
        rootPairs.forEach(([i, j]) => { sk.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y); });
        sk.noStroke();
      }

      // anchor labels
      anchors.forEach(a => {
        sk.textFont('monospace');
        sk.textSize(ANCHOR_FONT);
        const lw = sk.textWidth(a.label);
        const rw = lw + ANCHOR_PAD_X * 2;
        const rh = ANCHOR_FONT + ANCHOR_PAD_Y * 2;
        sk.noStroke();
        sk.fill(DIST_COLOR + '22');
        sk.rect(a.px - rw / 2, a.py - rh / 2, rw, rh);
        sk.stroke(DIST_COLOR);
        sk.strokeWeight(1.5);
        sk.noFill();
        sk.rect(a.px - rw / 2, a.py - rh / 2, rw, rh);
        sk.noStroke();
        sk.fill(DIST_COLOR);
        sk.textAlign(sk.CENTER, sk.CENTER);
        sk.text(a.label, a.px, a.py);
      });

      // word nodes
      nodes.forEach((n, idx) => {
        const t        = maxCount === minCount ? 0.5 : (n.count - minCount) / (maxCount - minCount);
        const fontSize = 10 + t * 8;
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2;
        const rh = fontSize + PAD_Y * 2;

        const opacity = 0.55 + n.recency * 0.45;
        const opHex   = Math.round(opacity * 255).toString(16).padStart(2, '0');
        const isHovered = idx === hoveredIdx;

        sk.noStroke();
        if (n.category === 'location') {
          sk.fill(DIST_COLOR + (isHovered ? 'ff' : opHex));
          sk.textAlign(sk.CENTER, sk.CENTER);
          sk.text(n.word, n.x, n.y);
        } else {
          sk.fill(DIST_COLOR + (isHovered ? 'ff' : opHex));
          sk.rect(n.x - rw / 2, n.y - rh / 2, rw, rh);
          sk.fill(bg);
          sk.textAlign(sk.CENTER, sk.CENTER);
          sk.text(n.word, n.x, n.y);
        }
      });

      // hover tooltip
      if (hoveredIdx !== null) {
        const n        = nodes[hoveredIdx];
        const t        = maxCount === minCount ? 0.5 : (n.count - minCount) / (maxCount - minCount);
        const fontSize = 10 + t * 8;
        const rh       = fontSize + PAD_Y * 2;

        let tipText;
        if (memoryAnchorMode === 'location') {
          const anchorSet = new Set(nodes.filter(nd => nd.word === n.word).map(nd => nd.anchorIdx));
          tipText = `Appearance: ${anchorSet.size}`;
        } else {
          tipText = `Appearance: ${n.count}`;
        }

        const TIP_FONT = 9;
        sk.textFont('monospace');
        sk.textSize(TIP_FONT);
        const tipW = sk.textWidth(tipText) + 12;
        const tipH = TIP_FONT + 10;
        const tipX = n.x - tipW / 2;
        const tipY = n.y - rh / 2 - tipH - 4;

        sk.noStroke();
        sk.fill(DIST_COLOR);
        sk.rect(tipX, tipY, tipW, tipH);
        sk.fill(bg);
        sk.textAlign(sk.LEFT, sk.TOP);
        sk.text(tipText, tipX + 6, tipY + 5);
      }
    };

    function hitAnchor(mx, my, a) {
      sk.textSize(ANCHOR_FONT);
      const lw = sk.textWidth(a.label);
      const rw = lw + ANCHOR_PAD_X * 2;
      const rh = ANCHOR_FONT + ANCHOR_PAD_Y * 2;
      return mx > a.px - rw / 2 && mx < a.px + rw / 2 &&
             my > a.py - rh / 2 && my < a.py + rh / 2;
    }

    sk.mousePressed = () => {
      for (let i = 0; i < anchors.length; i++) {
        if (hitAnchor(sk.mouseX, sk.mouseY, anchors[i])) {
          dragAnchorIdx = i;
          dragOffX = sk.mouseX - anchors[i].px;
          dragOffY = sk.mouseY - anchors[i].py;
          return;
        }
      }
    };

    sk.mouseDragged = () => {
      if (dragAnchorIdx !== null) {
        anchors[dragAnchorIdx].px = Math.max(60, Math.min(W - 60, sk.mouseX - dragOffX));
        anchors[dragAnchorIdx].py = Math.max(30, Math.min(H - 30, sk.mouseY - dragOffY));
      }
    };

    sk.mouseReleased = () => { dragAnchorIdx = null; };

    sk.mouseMoved = () => {
      const onAnchor = anchors.some(a => hitAnchor(sk.mouseX, sk.mouseY, a));
      hoveredIdx = null;
      nodes.forEach((n, idx) => {
        const t        = maxCount === minCount ? 0.5 : (n.count - minCount) / (maxCount - minCount);
        const fontSize = 10 + t * 8;
        sk.textSize(fontSize);
        const tw = sk.textWidth(n.word);
        const rw = tw + PAD_X * 2, rh = fontSize + PAD_Y * 2;
        if (sk.mouseX > n.x - rw / 2 && sk.mouseX < n.x + rw / 2 &&
            sk.mouseY > n.y - rh / 2 && sk.mouseY < n.y + rh / 2) hoveredIdx = idx;
      });
      container.style.cursor = (onAnchor || hoveredIdx !== null) ? 'pointer' : 'default';
    };

    sk.windowResized = () => {
      const graphView = document.getElementById('graph-view');
      W = graphView ? graphView.offsetWidth  : (container.offsetWidth  || 800);
      H = graphView ? graphView.offsetHeight : (container.offsetHeight || 500);
      sk.resizeCanvas(W, H);
      anchors.forEach(a => { a.px = a.ax * W; a.py = a.ay * H; });
    };
  }, container);

  renderGraphTooltip();
}

function renderEmptyState(container) {
  document.getElementById('memory-empty-state')?.remove();
  const el = document.createElement('div');
  el.id = 'memory-empty-state';
  el.style.cssText = `
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    text-align: center; pointer-events: none;
  `;
  el.innerHTML = `
    <p style="font-family:var(--font-whois);font-size:0.8rem;color:${DIST_COLOR};opacity:0.45;line-height:1.8;max-width:280px;">
      No entries in this time range.<br>Log again to see this grow.
    </p>
  `;
  container.appendChild(el);
}

function renderGraphTooltip() {
  document.getElementById('memory-tooltip')?.remove();
  const tip = document.createElement('div');
  tip.id = 'memory-tooltip';
  tip.style.cssText = `
    position: absolute; bottom: 1rem; left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-whois); font-size: 0.62rem;
    color: ${DIST_COLOR}; opacity: 0.35;
    letter-spacing: 0.04em; pointer-events: none;
    white-space: nowrap; text-align: center;
  `;
  tip.textContent = memoryAnchorMode === 'location'
    ? 'words cluster toward where you wrote them · drag anchors · larger = more frequent · brighter = more recent'
    : 'words cluster toward emotions you named · drag anchors · larger = more frequent · brighter = more recent';
  document.getElementById('graph-view').appendChild(tip);
}

function rebuildGraph() {
  if (graphSketch) { graphSketch.remove(); graphSketch = null; }
  document.querySelector('#p5-canvas-container canvas')?.remove();
  document.getElementById('memory-empty-state')?.remove();
  document.getElementById('memory-tooltip')?.remove();
  // controls are kept alive across rebuilds
  initGraph();
}

function showInfoPanel(node) {}  // unused, kept for safety
function hideInfoPanel() {}      // unused, kept for safety


// media (photo + music)

function loadMedia() {
  updateMusicPreview(localStorage.getItem(`${CURRENT_DISTRICT}-music-name`));
}

function updateMusicPreview(name) {
  const label     = document.getElementById('media-music-name');
  const removeBtn = document.getElementById('media-music-remove');
  if (!label) return;
  if (name) {
    label.textContent = name;
    label.classList.remove('hidden');
    removeBtn?.classList.remove('hidden');
  } else {
    label.textContent = '';
    label.classList.add('hidden');
    removeBtn?.classList.add('hidden');
  }
}

function initMediaListeners() {
  const musicInput     = document.getElementById('media-music-input');
  const musicUploadBtn = document.getElementById('media-music-upload-btn');
  musicUploadBtn?.addEventListener('click', () => musicInput?.click());

  musicInput?.addEventListener('change', () => {
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

  document.getElementById('media-music-remove')?.addEventListener('click', () => {
    localStorage.removeItem(`${CURRENT_DISTRICT}-music`);
    localStorage.removeItem(`${CURRENT_DISTRICT}-music-name`);
    updateMusicPreview(null);
  });
}
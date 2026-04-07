// audio.js
// background music from real audio files, routed through web audio api
// radio station object on map lets user switch between three tracks
// district/question pages: reverb + echo submersion effect
// customize pages: quieter, no effects
// initAudio() + attachGlobalSfx() called from map.js
// initAudioForPage() called on every other page type


// ─── page type detection ──────────────────────────────────────────────────────

var PAGE_TYPE = (function() {
  var path = window.location.pathname;
  if (path.includes('-customize')) return 'customize';
  if (path.includes('/districts/'))  return 'district';
  if (path.includes('map.html') || path.endsWith('/')) return 'map';
  return 'other';
})();

var ASSET_PREFIX = window.location.pathname.includes('/districts/') ? '../' : '';


// ─── track definitions ────────────────────────────────────────────────────────

var TRACKS = [
  {
    id:    'guitar',
    label: 'Gentle Guitar',
    short: 'guitar',
    file:  'destructo20__gentle-subtle-guitar-background-noise-for-gamefilmtv-etc.wav',
  },
  {
    id:    'melancholic',
    label: 'Melancholic Ambient',
    short: 'ambient',
    file:  'destructo20__melancholic-ambient-atmospheric-background-music.wav',
  },
  {
    id:    'midwest',
    label: 'Midwest Emo',
    short: 'midwest',
    file:  'destructo20__midwest-emo-style-scene-background-music.wav',
  },
];

var currentTrackIdx = parseInt(localStorage.getItem('radioTrack') || '0');


// ─── volume levels per page type ─────────────────────────────────────────────

var VOLUMES = {
  map:       0.55,
  district:  0.38,   // quieter + submersion fx
  customize: 0.22,   // quietly in background
  other:     0.45,
};


// ─── state ────────────────────────────────────────────────────────────────────

var audioCtx      = null;
var masterGain    = null;
var trackGain     = null;
var reverbNode    = null;
var reverbGain    = null;
var dryGain       = null;
var delayNode     = null;
var delayGain     = null;
var sourceNode    = null;   // MediaElementSourceNode for current track
var audioEl       = null;   // the <audio> element
var audioStarted  = false;
var audioMuted    = false;
var fadeInterval  = null;

var CHIME_FILES = [
  ASSET_PREFIX + 'assets/sounds/chime1.wav',
  ASSET_PREFIX + 'assets/sounds/chime2.wav',
  ASSET_PREFIX + 'assets/sounds/chime3.wav',
];

var _chimeEls = CHIME_FILES.map(function(src) {
  var a = new Audio(src);
  a.preload = 'auto';
  a.volume  = 0.9;
  return a;
});

var SFX_VOLUME = 0.22;

var CHIME_TRIGGERS = new Set([
  'guide-btn', 'about-btn', 'share-btn', 'achievements-toggle-btn',
]);

var CLICK_SELECTOR = [
  'button', '.header-btn', '.overlay-btn', '.train-prompt-btn',
  '.district', '#train-on-map', '#train-board', '.customize-toggle-btn',
  '.share-tab', '.constellation-btn', '.achievements-toggle-btn',
  '.skin-thumb', '.toggle-btn', '.nav-btn', '.back-btn',
].join(', ');


// ─── init ─────────────────────────────────────────────────────────────────────

function initAudio() {
  audioMuted = localStorage.getItem('audioMuted') === 'true';
  _syncMuteToggle();
  _bootAudioContext();
  _buildAudioEl();
  _placeRadioOnMap();

  var resume = function() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(function() { _startMusic(); });
    } else {
      _startMusic();
    }
  };
  document.addEventListener('click',     resume, { once: true, capture: true });
  document.addEventListener('keydown',   resume, { once: true, capture: true });
  document.addEventListener('mousemove', resume, { once: true, capture: true });
}

// call this from district and customize pages (no radio on map needed)
function initAudioForPage() {
  audioMuted = localStorage.getItem('audioMuted') === 'true';
  _bootAudioContext();
  _buildAudioEl();

  var resume = function() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(function() { _startMusic(); });
    } else {
      _startMusic();
    }
  };
  document.addEventListener('click',     resume, { once: true, capture: true });
  document.addEventListener('keydown',   resume, { once: true, capture: true });
  document.addEventListener('mousemove', resume, { once: true, capture: true });
}

function _bootAudioContext() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('web audio not supported', e);
    return;
  }

  // master gain — everything passes through here
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);

  // track gain — sits between source and effects chain
  trackGain = audioCtx.createGain();
  trackGain.gain.value = 1;

  // dry path: direct to master
  dryGain = audioCtx.createGain();
  dryGain.gain.value = 1;
  dryGain.connect(masterGain);

  // reverb path
  reverbNode = audioCtx.createConvolver();
  reverbGain = audioCtx.createGain();
  reverbGain.gain.value = 0;   // off by default
  reverbNode.connect(reverbGain);
  reverbGain.connect(masterGain);

  // delay/echo path
  delayNode = audioCtx.createDelay(4.0);
  delayNode.delayTime.value = 0.35;
  delayGain = audioCtx.createGain();
  delayGain.gain.value = 0;   // off by default
  var delayFeedback = audioCtx.createGain();
  delayFeedback.gain.value = 0.45;
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(delayGain);
  delayGain.connect(masterGain);

  // connect track gain to all paths
  trackGain.connect(dryGain);
  trackGain.connect(reverbNode);
  trackGain.connect(delayNode);

  // build impulse response for reverb
  _buildReverb();

  // apply page-appropriate effects
  _applyPageEffects();
}

function _buildReverb() {
  if (!audioCtx) return;
  // synthesize a reverb impulse response (long hall)
  var sampleRate = audioCtx.sampleRate;
  var length     = sampleRate * 3.5;
  var impulse    = audioCtx.createBuffer(2, length, sampleRate);
  for (var c = 0; c < 2; c++) {
    var data = impulse.getChannelData(c);
    for (var i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.2);
    }
  }
  reverbNode.buffer = impulse;
}

function _buildAudioEl() {
  if (audioEl) return;
  var track = TRACKS[currentTrackIdx];
  audioEl        = new Audio(ASSET_PREFIX + 'assets/sounds/' + track.file);
  audioEl.loop   = true;
  audioEl.preload = 'auto';
  audioEl.crossOrigin = 'anonymous';
}

function _startMusic() {
  if (audioStarted || !audioCtx || !audioEl) return;
  audioStarted = true;

  // connect audio element into the web audio graph
  sourceNode = audioCtx.createMediaElementSource(audioEl);
  sourceNode.connect(trackGain);

  audioEl.play().catch(function(e) { console.warn('audio play failed', e); });

  // fade master in
  _fadeMasterTo(audioMuted ? 0 : VOLUMES[PAGE_TYPE] || 0.45, 3000);
}

function _applyPageEffects() {
  if (!reverbGain || !delayGain) return;

  if (PAGE_TYPE === 'district') {
    // submersion: wet reverb + echo
    reverbGain.gain.setTargetAtTime(0.65, audioCtx.currentTime, 1.5);
    delayGain.gain.setTargetAtTime(0.3,  audioCtx.currentTime, 1.5);
    dryGain.gain.setTargetAtTime(0.5,    audioCtx.currentTime, 1.5);
  } else {
    // no effects on other pages
    reverbGain.gain.setTargetAtTime(0,   audioCtx.currentTime, 0.5);
    delayGain.gain.setTargetAtTime(0,    audioCtx.currentTime, 0.5);
    dryGain.gain.setTargetAtTime(1,      audioCtx.currentTime, 0.5);
  }
}


// ─── track switching ──────────────────────────────────────────────────────────

function switchTrack(idx) {
  if (idx === currentTrackIdx && audioStarted) return;
  currentTrackIdx = idx;
  localStorage.setItem('radioTrack', idx);

  var track = TRACKS[idx];

  // fade out, swap, fade back in
  _fadeMasterTo(0, 600);
  setTimeout(function() {
    if (audioEl) {
      audioEl.pause();
      // disconnect old source
      if (sourceNode) { try { sourceNode.disconnect(); } catch(e) {} }
      sourceNode  = null;
      audioStarted = false;
    }

    audioEl           = new Audio(ASSET_PREFIX + 'assets/sounds/' + track.file);
    audioEl.loop      = true;
    audioEl.preload   = 'auto';
    audioEl.crossOrigin = 'anonymous';

    if (audioCtx) {
      sourceNode = audioCtx.createMediaElementSource(audioEl);
      sourceNode.connect(trackGain);
      audioStarted = true;
      audioEl.play().catch(function(e) { console.warn(e); });
      _fadeMasterTo(audioMuted ? 0 : VOLUMES[PAGE_TYPE] || 0.45, 800);
    }

    _updateRadioOverlay();
  }, 650);
}


// ─── mute toggle ──────────────────────────────────────────────────────────────

function toggleAudioMute() {
  audioMuted = !audioMuted;
  localStorage.setItem('audioMuted', audioMuted);
  _syncMuteToggle();
  _fadeMasterTo(audioMuted ? 0 : VOLUMES[PAGE_TYPE] || 0.45, 600);
}

function _syncMuteToggle() {
  var track = document.getElementById('audio-mute-track');
  if (track) track.classList.toggle('on', !audioMuted);
}

function _fadeMasterTo(target, durationMs) {
  if (!masterGain || !audioCtx) return;
  clearInterval(fadeInterval);
  var steps    = 30;
  var interval = durationMs / steps;
  var start    = masterGain.gain.value;
  var delta    = (target - start) / steps;
  var step     = 0;
  fadeInterval = setInterval(function() {
    step++;
    var v = start + delta * step;
    masterGain.gain.value = Math.max(0, Math.min(1, v));
    if (step >= steps) clearInterval(fadeInterval);
  }, interval);
}


// ─── radio on map ─────────────────────────────────────────────────────────────

function _placeRadioOnMap() {
  var md = document.querySelector('.map-districts');
  if (!md) return;

  var el    = document.createElement('div');
  el.id     = 'radio-on-map';
  el.style.cssText = [
    'position:absolute',
    'right:20px',
    'bottom:60px',
    'z-index:8',
    'opacity:0',
    'cursor:pointer',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'gap:0.4rem',
    'transition:opacity 0.5s ease, transform 0.25s ease',
    'transform:translateY(0)',
  ].join(';');

  el.innerHTML = [
    '<svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">',
    // body
    '  <rect x="4" y="14" width="40" height="24" rx="1" stroke="var(--blue)" stroke-width="1.4" fill="none"/>',
    // speaker grille lines
    '  <line x1="8" y1="19" x2="8" y2="33" stroke="var(--blue)" stroke-width="1" opacity="0.5"/>',
    '  <line x1="11" y1="19" x2="11" y2="33" stroke="var(--blue)" stroke-width="1" opacity="0.5"/>',
    '  <line x1="14" y1="19" x2="14" y2="33" stroke="var(--blue)" stroke-width="1" opacity="0.5"/>',
    '  <line x1="17" y1="19" x2="17" y2="33" stroke="var(--blue)" stroke-width="1" opacity="0.5"/>',
    // tuning dial
    '  <circle cx="33" cy="26" r="6" stroke="var(--blue)" stroke-width="1.4" fill="none"/>',
    '  <line x1="33" y1="21" x2="33" y2="23" stroke="var(--blue)" stroke-width="1.2"/>',
    // antenna
    '  <line x1="34" y1="14" x2="40" y2="3" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round"/>',
    '  <line x1="14" y1="14" x2="10" y2="5" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round"/>',
    // small buttons
    '  <rect x="22" y="31" width="4" height="3" rx="0" stroke="var(--blue)" stroke-width="1" fill="none"/>',
    '</svg>',
    '<span class="radio-map-label mono">Radio</span>',
  ].join('');

  el.addEventListener('mouseenter', function() { el.style.transform = 'translateY(-4px)'; });
  el.addEventListener('mouseleave', function() { el.style.transform = 'translateY(0)'; });
  el.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    openRadioOverlay();
  });

  md.appendChild(el);
  setTimeout(function() { el.style.opacity = '1'; }, 1000);
}


// ─── radio overlay ────────────────────────────────────────────────────────────

function openRadioOverlay() {
  document.getElementById('radio-overlay')?.remove();

  var overlay       = document.createElement('div');
  overlay.id        = 'radio-overlay';
  overlay.className = 'overlay radio-overlay';
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeRadioOverlay();
  });

  overlay.innerHTML = _radioOverlayHTML();
  overlay.classList.add('active');

  overlay.querySelectorAll('.radio-track-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(btn.dataset.idx);
      switchTrack(idx);
      overlay.querySelectorAll('.radio-track-btn').forEach(function(b) {
        b.classList.toggle('active', parseInt(b.dataset.idx) === idx);
      });
    });
  });

  overlay.querySelector('#radio-close-btn').addEventListener('click', closeRadioOverlay);
  overlay.querySelector('#radio-playpause-btn').addEventListener('click', function() {
  if (audioEl && !audioEl.paused) {
    audioEl.pause();
    _fadeMasterTo(0, 400);
    overlay.querySelector('#radio-playpause-btn').textContent = '▶';
  } else if (audioEl) {
    audioEl.play().catch(function() {});
    _fadeMasterTo(audioMuted ? 0 : VOLUMES[PAGE_TYPE] || 0.45, 400);
    overlay.querySelector('#radio-playpause-btn').textContent = '⏸';
  }
});
}

function _radioOverlayHTML() {
  var tracksHTML = TRACKS.map(function(t, i) {
    return [
      '<button class="radio-track-btn' + (i === currentTrackIdx ? ' active' : '') + '" data-idx="' + i + '">',
      '  <span class="radio-track-num mono">' + String(i + 1).padStart(2, '0') + '</span>',
      '  <span class="radio-track-label">' + t.label + '</span>',
      '  <span class="radio-track-indicator"></span>',
      '</button>',
    ].join('');
  }).join('');

  return [
    '<div class="overlay-content radio-overlay-content">',
    '  <div class="radio-overlay-header">',
    '    <div class="radio-overlay-header-left">',
    '      <svg width="28" height="24" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '        <rect x="4" y="14" width="40" height="24" rx="1" stroke="var(--blue)" stroke-width="1.8" fill="none"/>',
    '        <line x1="8" y1="19" x2="8" y2="33" stroke="var(--blue)" stroke-width="1.2" opacity="0.5"/>',
    '        <line x1="11" y1="19" x2="11" y2="33" stroke="var(--blue)" stroke-width="1.2" opacity="0.5"/>',
    '        <line x1="14" y1="19" x2="14" y2="33" stroke="var(--blue)" stroke-width="1.2" opacity="0.5"/>',
    '        <line x1="17" y1="19" x2="17" y2="33" stroke="var(--blue)" stroke-width="1.2" opacity="0.5"/>',
    '        <circle cx="33" cy="26" r="6" stroke="var(--blue)" stroke-width="1.8" fill="none"/>',
    '        <line x1="33" y1="21" x2="33" y2="23" stroke="var(--blue)" stroke-width="1.4"/>',
    '        <line x1="34" y1="14" x2="40" y2="3" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round"/>',
    '        <line x1="14" y1="14" x2="10" y2="5" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round"/>',
    '      </svg>',
    '      <div>',
    '        <h2 class="radio-overlay-title">The Radio</h2>',
    '        <p class="radio-overlay-subtitle mono">choose a station</p>',
'      </div>',
'    </div>',
'    <div style="display:flex;align-items:center;gap:0.75rem;">',
'      <button class="radio-playpause-btn mono" id="radio-playpause-btn">' + (audioEl && audioEl.paused ? '▶' : '⏸') + '</button>',
'      <button class="radio-close-btn" id="radio-close-btn">×</button>',
'    </div>',
    '  </div>',
    '  <div class="radio-tracks" id="radio-tracks">',
    tracksHTML,
    '  </div>',
    '</div>',
  ].join('');
}

function _updateRadioOverlay() {
  var overlay = document.getElementById('radio-overlay');
  if (!overlay) return;
  overlay.querySelectorAll('.radio-track-btn').forEach(function(b) {
    b.classList.toggle('active', parseInt(b.dataset.idx) === currentTrackIdx);
  });
}

function closeRadioOverlay() {
  var overlay = document.getElementById('radio-overlay');
  if (!overlay) return;
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.2s ease';
  setTimeout(function() { overlay.remove(); }, 220);
}


// ─── sfx ──────────────────────────────────────────────────────────────────────

function playSfxClick() {
  if (!audioCtx || audioMuted) return;
  if (audioCtx.state === 'suspended') { audioCtx.resume(); return; }

  var bufSize = audioCtx.sampleRate * 0.05;
  var buffer  = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  var data    = buffer.getChannelData(0);
  for (var i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  }

  var source = audioCtx.createBufferSource();
  var gain   = audioCtx.createGain();
  var filter = audioCtx.createBiquadFilter();

  filter.type            = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value         = 1.5;

  gain.gain.setValueAtTime(SFX_VOLUME * 1.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

function playSfxChime() {
  if (audioMuted) return;
  var el    = _chimeEls[Math.floor(Math.random() * _chimeEls.length)];
  var clone = el.cloneNode();
  clone.volume = 0.9;
  clone.play().catch(function() {});
}


// ─── wire up sfx ──────────────────────────────────────────────────────────────

function attachGlobalSfx() {
  document.addEventListener('click', function(e) {
    var target = e.target.closest(CLICK_SELECTOR);
    if (!target) return;
    var idEl = e.target.closest('[id]');
    var id   = idEl ? idEl.id : '';
    if (CHIME_TRIGGERS.has(id)) return;
    playSfxClick();
  }, true);

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[id]');
    if (btn && CHIME_TRIGGERS.has(btn.id)) {
      setTimeout(playSfxChime, 60);
    }
  }, true);
}
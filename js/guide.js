// guide.js

(function () {

  const isMapPage  = !!document.getElementById('map-hint');
  const isCustPage = !!document.querySelector('.skin-options');
  const assetBase  = isMapPage ? 'assets/' : '../assets/';

  // ─── mascot helpers ──────────────────────────────────────────────────────────

  function birdSrc(variant) {
    if (variant === 2) return assetBase + 'bird-2.png';
    if (variant === 3) return assetBase + 'bird-3.png';
    return assetBase + 'bird-1.png';
  }

  function setBirdVariant(mascot, variant) {
    const img = mascot.querySelector('.guide-bird-img');
    if (img) img.src = birdSrc(variant);
  }

  // click jump: only fires when bird is showing bird-1 (idle state)
  // jumps up with bird-3, comes back down with bird-1
  function attachBirdClick(mascot) {
    const birdEl = mascot.querySelector('.guide-bird');
    if (!birdEl) return;
    let jumping = false;
    birdEl.addEventListener('click', function (e) {
      e.stopPropagation();
      const img = birdEl.querySelector('.guide-bird-img');
      if (!img) return;
      // only do the jump on bird-1 (idle), not bird-2 (spotlight active)
      if (!img.src.includes('bird-1')) return;
      if (jumping) return;
      jumping = true;
      img.src = birdSrc(3);
      birdEl.classList.add('bird-jumping');
      setTimeout(function () {
        birdEl.classList.remove('bird-jumping');
        img.src = birdSrc(1);
        jumping = false;
      }, 500);
    });
  }

  // bird on left, bubble on right
  function makeBirdMascot(id) {
    const el = document.createElement('div');
    el.className = 'guide-mascot';
    el.id        = id;
    el.innerHTML = `
      <div class="guide-bird">
        <img class="guide-bird-img" src="${birdSrc(1)}" alt="guide bird">
      </div>
      <div class="guide-bubble" id="${id}-bubble">
        <p class="guide-bubble-text" id="${id}-text"></p>
        <div class="guide-bubble-nav">
          <button class="guide-bubble-btn" id="${id}-prev">← Back</button>
          <span class="guide-bubble-progress" id="${id}-progress"></span>
          <button class="guide-bubble-btn primary" id="${id}-next">Next →</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    attachBirdClick(el);
    return el;
  }

  // ─── spotlight ───────────────────────────────────────────────────────────────

  const PADDING = 12;

  function paintSpotlight(scrim, rect) {
    const t = rect.top    - PADDING;
    const l = rect.left   - PADDING;
    const b = rect.bottom + PADDING;
    const r = rect.right  + PADDING;
    const W = window.innerWidth;
    const H = window.innerHeight;
    scrim.style.background = 'rgba(0,0,0,0.55)';
    scrim.style.clipPath   = `polygon(
      0 0, ${W}px 0, ${W}px ${H}px, 0 ${H}px, 0 0,
      ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, ${l}px ${t}px
    )`;
  }

  function getUnionRect(selector) {
    const els = selector.split(',').map(s => document.querySelector(s.trim())).filter(Boolean);
    if (!els.length) return null;
    const rects = els.map(e => e.getBoundingClientRect());
    return {
      top:    Math.min(...rects.map(r => r.top)),
      left:   Math.min(...rects.map(r => r.left)),
      bottom: Math.max(...rects.map(r => r.bottom)),
      right:  Math.max(...rects.map(r => r.right)),
    };
  }

  // ─── mascot positioning ──────────────────────────────────────────────────────

  const UNIT_W = 490;  // bird (150px) + gap + bubble
  const UNIT_H = 200;  // bird is now 150px tall
  const MARGIN = 20;

  function positionMascot(mascot, rect) {
    if (!rect) {
      // use CSS centering — no pixel math needed
      mascot.classList.add('centered');
      mascot.style.left = '';
      mascot.style.top  = '';
      return;
    }
    mascot.classList.remove('centered');
    const W = window.innerWidth;
    const H = window.innerHeight;
    const spotT  = rect.top    - PADDING;
    const spotB  = rect.bottom + PADDING;
    const spotR  = rect.right  + PADDING;
    const spotL  = rect.left   - PADDING;
    const spotCY = (spotT + spotB) / 2;
    let left = (spotR + MARGIN + UNIT_W <= W) ? spotR + MARGIN : spotL - MARGIN - UNIT_W;
    let top  = spotCY - UNIT_H / 2;
    left = Math.max(8, Math.min(left, W - UNIT_W - 8));
    top  = Math.max(8, Math.min(top,  H - UNIT_H - 8));
    mascot.style.left = left + 'px';
    mascot.style.top  = top  + 'px';
  }

  // ─── shrine preview ──────────────────────────────────────────────────────────

  let shrineImgOriginal = null;

  function previewShrineUnlocked() {
    const el = document.getElementById('shrine');
    if (!el) return;
    const img = el.querySelector('.district-image');
    if (!img) return;
    if (!shrineImgOriginal) shrineImgOriginal = img.src;
    img.src = 'assets/districts/shrine-unlocked.png';
  }

  function restoreShrineImage() {
    if (!shrineImgOriginal) return;
    const el = document.getElementById('shrine');
    if (!el) return;
    const img = el.querySelector('.district-image');
    if (img) img.src = shrineImgOriginal;
    shrineImgOriginal = null;
  }

  // ─── render message with paragraph breaks ────────────────────────────────────
  // splits on \n\n and wraps each part in a span for spacing

  function renderMessage(el, message) {
    el.innerHTML = message.split('\n\n')
      .map(p => `<span class="guide-msg-para">${p}</span>`)
      .join('');
  }


  // =========================================================================
  // part 1: map guide
  // =========================================================================

  const MAP_STEPS = [
    {
      selector: null,
      message:  "Hello! I'm Archie, your city guide.\n\nThis is yours to make home: a place built from the real places that have shaped you. Take your time here.",
    },
    {
      selector: null,
      message:  "Your responses are only visible to yourself unless you choose to share them with your friends and family.",
    },
    {
      selector:        '#shrine',
      message:         "Each district holds a different emotion. Hover over them to explore, then click one to begin answering questions about a real place from your life.",
      previewUnlocked: true,
    },
    {
      selector:        '#shrine',
      message:         "Once you've answered, you can come back to edit your responses, change the district's look, and add more memories whenever you want.",
      previewUnlocked: true,
    },
    {
      selector: '#share-btn',
      message:  "When you're ready, share your city with someone you love. That's what it's for.",
    },
    {
      selector: null,
      message:  "Have fun building!",
      bird:     3,
    },
  ];

  const MAP_SUMMARY = [
    "Each district holds an emotion tied to a real place.",
    "Click a district to begin or revisit it.",
    "Edit your answers and change the look from inside each district.",
    "Share your city with friends using the Share button.",
  ];

  let mapStep        = 0;
  let mapScrim       = null;
  let mapMascot      = null;
    let mapActive      = false;
  let mapSummaryMode = false;

  // ─── build dom (called once) ─────────────────────────────────────────────────
  // scrim click listener added here and NEVER re-added anywhere else

  function buildMapDOM() {
    mapScrim = document.createElement('div');
    mapScrim.className = 'guide-scrim';
    mapScrim.id        = 'guide-scrim';
    document.body.appendChild(mapScrim);

    mapMascot = makeBirdMascot('guide-mascot');

    document.getElementById('guide-mascot-next').addEventListener('click', mapNextStep);
    document.getElementById('guide-mascot-prev').addEventListener('click', mapPrevStep);

    // single persistent handler — reads flags at click time
    mapScrim.addEventListener('click', function (e) {
      if (!mapActive) return;
      if (mapMascot.contains(e.target)) return;
      if (mapSummaryMode) { closeMapGuide(); return; }
      const step = MAP_STEPS[mapStep];
      if (!step || !step.selector) { closeMapGuide(); return; }
      const rect = getUnionRect(step.selector);
      if (!rect) { closeMapGuide(); return; }
      const inHole = (
        e.clientX >= rect.left - PADDING && e.clientX <= rect.right  + PADDING &&
        e.clientY >= rect.top  - PADDING && e.clientY <= rect.bottom + PADDING
      );
      if (!inHole) closeMapGuide();
    });
  }

  // ─── stepped tour ────────────────────────────────────────────────────────────

  function showMapStep(index) {
    mapStep        = index;
    mapSummaryMode = false;
    const step     = MAP_STEPS[index];
    const TOTAL    = MAP_STEPS.length;

    restoreShrineImage();

    const bubble = document.getElementById('guide-mascot-bubble');
    bubble.classList.remove('tail-none');

    if (step.selector) {
      const rect = getUnionRect(step.selector);
      if (rect) {
        mapScrim.classList.add('active');
        paintSpotlight(mapScrim, rect);
        positionMascot(mapMascot, rect);
      }
      if (step.previewUnlocked) previewShrineUnlocked();
      setBirdVariant(mapMascot, 2);
    } else {
      mapScrim.classList.add('active');
      mapScrim.style.background = 'rgba(0,0,0,0.35)';
      mapScrim.style.clipPath   = '';
      positionMascot(mapMascot, null);
      setBirdVariant(mapMascot, step.bird || 1);
      bubble.classList.add('tail-none');
    }

    renderMessage(document.getElementById('guide-mascot-text'), step.message);
    document.getElementById('guide-mascot-progress').textContent  = `${index + 1} / ${TOTAL}`;
    document.getElementById('guide-mascot-prev').style.visibility = index === 0 ? 'hidden' : 'visible';
    document.getElementById('guide-mascot-next').textContent      = index === TOTAL - 1 ? 'Done ✓' : 'Next →';

    mapMascot.classList.add('visible');
  }

  function mapNextStep() {
    if (mapStep < MAP_STEPS.length - 1) showMapStep(mapStep + 1);
    else closeMapGuide();
  }

  function mapPrevStep() {
    if (mapStep > 0) showMapStep(mapStep - 1);
  }

  // ─── summary box ─────────────────────────────────────────────────────────────

  function openMapSummary() {
    if (mapActive) return;
    mapActive      = true;
    mapSummaryMode = true;
    if (!mapScrim) buildMapDOM();

    mapScrim.classList.add('active');
    mapScrim.style.background = 'rgba(0,0,0,0.35)';
    mapScrim.style.clipPath   = '';

    const bubble   = document.getElementById('guide-mascot-bubble');
    const nav      = mapMascot.querySelector('.guide-bubble-nav');
    const textEl   = document.getElementById('guide-mascot-text');
    const progress = document.getElementById('guide-mascot-progress');

    nav.innerHTML = `<button class="guide-bubble-btn primary" id="guide-summary-close">Got it</button>`;
    document.getElementById('guide-summary-close').addEventListener('click', closeMapGuide);

    bubble.classList.add('tail-none');
    textEl.innerHTML     = MAP_SUMMARY.map(s => `<span class="guide-summary-line">${s}</span>`).join('');
    progress.textContent = '';
    setBirdVariant(mapMascot, 1);
    positionMascot(mapMascot, null);

    mapMascot.classList.add('visible');
  }

  // ─── open / close ────────────────────────────────────────────────────────────

  function openMapGuide() {
    if (mapActive) return;
    mapActive      = true;
    mapSummaryMode = false;
    if (!mapScrim) buildMapDOM();
    showMapStep(0);
  }

  function closeMapGuide() {
    if (!mapActive) return;
    mapActive      = false;
    mapSummaryMode = false;
    localStorage.setItem('guide-seen', '1');

    restoreShrineImage();

    mapScrim.classList.remove('active');
    mapScrim.style.background = '';
    mapScrim.style.clipPath   = '';
    mapMascot.classList.remove('visible');
  
    // restore stepped nav in case summary replaced it
    const nav = mapMascot.querySelector('.guide-bubble-nav');
    nav.innerHTML = `
      <button class="guide-bubble-btn" id="guide-mascot-prev">← Back</button>
      <span class="guide-bubble-progress" id="guide-mascot-progress"></span>
      <button class="guide-bubble-btn primary" id="guide-mascot-next">Next →</button>
    `;
    document.getElementById('guide-mascot-next').addEventListener('click', mapNextStep);
    document.getElementById('guide-mascot-prev').addEventListener('click', mapPrevStep);
    document.getElementById('guide-mascot-bubble').classList.remove('tail-none');
  }

  window.addEventListener('resize', function () {
    if (mapActive) showMapStep(mapStep);
  });

  window.openSpotlightGuide  = openMapGuide;
  window.closeSpotlightGuide = closeMapGuide;

  // ─── init ────────────────────────────────────────────────────────────────────

  if (isMapPage) {
    window.addEventListener('DOMContentLoaded', function () {
      const guideBtn = document.getElementById('guide-btn');
      if (guideBtn) {
        guideBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          // toggle: if open close it, otherwise open stepped or summary
          if (mapActive) { closeMapGuide(); return; }
          if (localStorage.getItem('guide-seen')) openMapSummary();
          else openMapGuide();
        });
      }
      if (!localStorage.getItem('guide-seen')) {
        setTimeout(openMapGuide, 800);
      }
    });
  }


  // =========================================================================
  // part 2: constellation bubble
  // =========================================================================

  const CONSTELLATION_MESSAGE = "This is your memory constellation. Each word floats near the district it came from, pulled from everything you've written. Click a word to read the moment behind it.";
  const CONSTELLATION_DISMISS_MS = 6000;

  let constellationBubbleActive = false;

  function showConstellationBubble() {
    if (localStorage.getItem('constellation-seen')) return;
    if (constellationBubbleActive) return;
    if (typeof constellationActive === 'undefined' || !constellationActive) return;

    constellationBubbleActive = true;
    localStorage.setItem('constellation-seen', '1');

    const scrim = document.createElement('div');
    scrim.className        = 'guide-scrim';
    scrim.id               = 'constellation-guide-scrim';
    scrim.style.background = 'rgba(0,0,0,0.55)';
    scrim.style.clipPath   = '';
    document.body.appendChild(scrim);

    // defer active so the opening click doesn't immediately hit it
    requestAnimationFrame(() => scrim.classList.add('active'));

    const el = document.createElement('div');
    el.className = 'guide-mascot constellation-mascot visible';
    el.id        = 'constellation-mascot';
    el.innerHTML = `
      <div class="guide-bird">
        <img class="guide-bird-img" src="${birdSrc(1)}" alt="guide bird">
      </div>
      <div class="guide-bubble tail-none" id="constellation-bubble">
        <p class="guide-bubble-text">${CONSTELLATION_MESSAGE}</p>
        <div class="guide-bubble-nav">
          <button class="guide-bubble-btn primary" id="constellation-bubble-close">Got it</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);

    el.classList.add('centered');

    function dismiss() {
      if (!constellationBubbleActive) return;
      constellationBubbleActive = false;
      el.classList.remove('visible');
      scrim.classList.remove('active');
      clearTimeout(autoTimer);
      setTimeout(() => { el.remove(); scrim.remove(); }, 400);
    }

    document.getElementById('constellation-bubble-close').addEventListener('click', dismiss);

    // defer scrim listener so it doesn't catch the opening click
    requestAnimationFrame(() => {
      scrim.addEventListener('click', function (e) {
        if (!el.contains(e.target)) dismiss();
      });
    });

    const autoTimer = setTimeout(dismiss, CONSTELLATION_DISMISS_MS);
  }

  if (isMapPage) {
    window.addEventListener('DOMContentLoaded', function () {
      const btn = document.getElementById('constellation-btn');
      if (btn) {
        btn.addEventListener('click', function () {
          setTimeout(showConstellationBubble, 700);
        });
      }
    });
  }


  // =========================================================================
  // part 3: customize page guide
  // =========================================================================

  const CUSTOMIZE_STEPS = [
    {
      selector: '.skin-options',
      message:  "Choose a look for this district. Each skin changes the illustration. It saves automatically.",
    },
    {
      selector: '#journal-toggle, #graph-toggle',
      message:  "Journal View shows your written entries. Memory View maps the words you use most across all your sessions here.",
    },
    {
      selector: '#album-toggle',
      message:  "Album View collects any photos and songs you've attached.",
    },
  ];

  const CUSTOMIZE_SUMMARY = [
    "Choose a skin to change the district's look.",
    "Journal View shows your written entries.",
    "Memory View maps your most-used words.",
    "Album View holds photos and songs.",
    "Click the district title to rename it.",
  ];

  let custStep        = 0;
  let custScrim       = null;
  let custMascot      = null;
    let custActive      = false;
  let custSummaryMode = false;

  // ─── build dom (called once) ─────────────────────────────────────────────────
  // scrim click listener added here and NEVER re-added anywhere else

  function buildCustDOM() {
    custScrim = document.createElement('div');
    custScrim.className = 'guide-scrim';
    custScrim.id        = 'cust-guide-scrim';
    document.body.appendChild(custScrim);

    custMascot = makeBirdMascot('cust-guide-mascot');

    document.getElementById('cust-guide-mascot-next').addEventListener('click', custNextStep);
    document.getElementById('cust-guide-mascot-prev').addEventListener('click', custPrevStep);

    // single persistent handler
    custScrim.addEventListener('click', function (e) {
      if (!custActive) return;
      if (custMascot.contains(e.target)) return;
      if (custSummaryMode) { closeCustGuide(); return; }
      const step = CUSTOMIZE_STEPS[custStep];
      if (!step) { closeCustGuide(); return; }
      const rect = getUnionRect(step.selector);
      if (!rect) { closeCustGuide(); return; }
      const inHole = (
        e.clientX >= rect.left - PADDING && e.clientX <= rect.right  + PADDING &&
        e.clientY >= rect.top  - PADDING && e.clientY <= rect.bottom + PADDING
      );
      if (!inHole) closeCustGuide();
    });
  }

  function showCustStep(index) {
    custStep        = index;
    custSummaryMode = false;
    const step      = CUSTOMIZE_STEPS[index];
    const TOTAL     = CUSTOMIZE_STEPS.length;
    const rect      = getUnionRect(step.selector);

    if (!rect) {
      if (index < TOTAL - 1) showCustStep(index + 1);
      else closeCustGuide();
      return;
    }

    const bubble = document.getElementById('cust-guide-mascot-bubble');
    bubble.classList.remove('tail-none');

    custScrim.classList.add('active');
    paintSpotlight(custScrim, rect);
    positionMascot(custMascot, rect);
    setBirdVariant(custMascot, 2);

    document.getElementById('cust-guide-mascot-text').textContent      = step.message;
    document.getElementById('cust-guide-mascot-progress').textContent  = `${index + 1} / ${TOTAL}`;
    document.getElementById('cust-guide-mascot-prev').style.visibility = index === 0 ? 'hidden' : 'visible';
    document.getElementById('cust-guide-mascot-next').textContent      = index === TOTAL - 1 ? 'Done ✓' : 'Next →';

    custMascot.classList.add('visible');
  }

  function custNextStep() {
    if (custStep < CUSTOMIZE_STEPS.length - 1) showCustStep(custStep + 1);
    else closeCustGuide();
  }

  function custPrevStep() {
    if (custStep > 0) showCustStep(custStep - 1);
  }

  function openCustSummary() {
    if (custActive) return;
    custActive      = true;
    custSummaryMode = true;
    if (!custScrim) buildCustDOM();

    custScrim.classList.add('active');
    custScrim.style.background = 'rgba(0,0,0,0.35)';
    custScrim.style.clipPath   = '';

    const bubble   = document.getElementById('cust-guide-mascot-bubble');
    const nav      = custMascot.querySelector('.guide-bubble-nav');
    const textEl   = document.getElementById('cust-guide-mascot-text');
    const progress = document.getElementById('cust-guide-mascot-progress');

    nav.innerHTML = `<button class="guide-bubble-btn primary" id="cust-summary-close">Got it</button>`;
    document.getElementById('cust-summary-close').addEventListener('click', closeCustGuide);

    bubble.classList.add('tail-none');
    textEl.innerHTML     = CUSTOMIZE_SUMMARY.map(s => `<span class="guide-summary-line">${s}</span>`).join('');
    progress.textContent = '';
    setBirdVariant(custMascot, 1);
    positionMascot(custMascot, null);

    custMascot.classList.add('visible');
  }

  function openCustGuide() {
    if (custActive) return;
    custActive      = true;
    custSummaryMode = false;
    if (!custScrim) buildCustDOM();
    showCustStep(0);
  }

  function closeCustGuide() {
    if (!custActive) return;
    custActive      = false;
    custSummaryMode = false;
    localStorage.setItem('customize-guide-seen', '1');

    custScrim.classList.remove('active');
    custScrim.style.background = '';
    custScrim.style.clipPath   = '';
    custMascot.classList.remove('visible');
  
    const nav = custMascot.querySelector('.guide-bubble-nav');
    nav.innerHTML = `
      <button class="guide-bubble-btn" id="cust-guide-mascot-prev">← Back</button>
      <span class="guide-bubble-progress" id="cust-guide-mascot-progress"></span>
      <button class="guide-bubble-btn primary" id="cust-guide-mascot-next">Next →</button>
    `;
    document.getElementById('cust-guide-mascot-next').addEventListener('click', custNextStep);
    document.getElementById('cust-guide-mascot-prev').addEventListener('click', custPrevStep);
    document.getElementById('cust-guide-mascot-bubble').classList.remove('tail-none');
  }

  // inject guide button into customize header — no need to edit any HTML files
  function injectCustGuideBtn() {
    const shareBtn = document.getElementById('share-btn');
    if (!shareBtn || document.getElementById('customize-guide-btn')) return;

    const btn = document.createElement('button');
    btn.className   = 'customize-header-cell customize-header-btn mono';
    btn.id          = 'customize-guide-btn';
    btn.textContent = 'Guide';
    shareBtn.parentNode.insertBefore(btn, shareBtn);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      // toggle: if open close it, otherwise open stepped or summary
      if (custActive) { closeCustGuide(); return; }
      if (localStorage.getItem('customize-guide-seen')) openCustSummary();
      else openCustGuide();
    });
  }

  if (isCustPage) {
    window.addEventListener('DOMContentLoaded', function () {
      injectCustGuideBtn();
      if (!localStorage.getItem('customize-guide-seen')) {
        setTimeout(openCustGuide, 600);
      }
    });
  }

  window.openCustomizeGuide  = openCustGuide;
  window.closeCustomizeGuide = closeCustGuide;

})();
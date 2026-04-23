// exhibition.js
// three exhibition-mode features:
//   1. inactivity timer: popup after 1 min, auto-reset after 60 more seconds
//   2. restart button: top-left, clears all localStorage and returns to index
//   3. district print buttons: appear on the completion screen of each district


(function () {

  // ─── config ─────────────────────────────────────────────────────────────

  var INACTIVITY_MS    = 60 * 1000;   // 1 minute before popup appears
  var AUTO_RESET_MS    = 60 * 1000;   // 60 seconds after popup before auto-reset
  var ROOT_PATH        = (function () {
    // district pages are in /districts/ subfolder — figure out path to root
    return window.location.pathname.indexOf('/districts/') !== -1 ? '../' : '';
  })();


  // ─── inject css once ────────────────────────────────────────────────────

  (function injectStyles() {
    if (document.getElementById('exhibition-styles')) return;
    var css = [

      // raise the custom cursor above the inactivity overlay
      '#custom-cursor { z-index: 10000000 !important; }',
      '#exhibition-restart-btn {',
      '  position: fixed;',
      '  top: 110px;',
      '  left: 2rem;',
      '  z-index: 8000;',
      '  font-family: var(--font-whois, monospace);',
      '  font-size: 0.72rem;',
      '  letter-spacing: 0.06em;',
      '  color: var(--blue, #0c2177);',
      '  background: var(--color-bg, #F7F2F1);',
      '  border: 1px solid var(--blue, #0c2177);',
      '  padding: 0.4rem 0.85rem;',
      '  cursor: pointer;',
      '  opacity: 1;',
      '  transition: opacity 0.2s;',
      '}',
      '#exhibition-restart-btn:hover { opacity: 0.7; }',

      // inactivity overlay
      '#exhibition-inactivity-overlay {',
      '  position: fixed;',
      '  inset: 0;',
      '  z-index: 9999999;',
      '  background: rgba(247, 242, 241, 0.96);',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 2rem;',
      '  opacity: 0;',
      '  pointer-events: none;',
      '  transition: opacity 0.4s ease;',
      '  background-image:',
      '    linear-gradient(rgba(12,33,119,0.05) 1px, transparent 1px),',
      '    linear-gradient(90deg, rgba(12,33,119,0.05) 1px, transparent 1px),',
      '    linear-gradient(rgba(12,33,119,0.025) 1px, transparent 1px),',
      '    linear-gradient(90deg, rgba(12,33,119,0.025) 1px, transparent 1px);',
      '  background-size: 120px 120px, 120px 120px, 30px 30px, 30px 30px;',
      '}',
      '#exhibition-inactivity-overlay.active {',
      '  opacity: 1;',
      '  pointer-events: all;',
      '}',
      '#exhibition-inactivity-overlay .ei-message {',
      '  font-family: var(--font-meta, serif);',
      '  font-size: 2rem;',
      '  color: var(--blue, #0c2177);',
      '  letter-spacing: -0.01em;',
      '  text-align: center;',
      '  line-height: 1.3;',
      '}',
      '#exhibition-inactivity-overlay .ei-countdown {',
      '  font-family: var(--font-whois, monospace);',
      '  font-size: 0.82rem;',
      '  color: var(--blue, #0c2177);',
      '  opacity: 0.5;',
      '  letter-spacing: 0.06em;',
      '}',
      '#exhibition-inactivity-overlay .ei-actions {',
      '  display: flex;',
      '  gap: 1rem;',
      '}',
      '#exhibition-inactivity-overlay .ei-btn {',
      '  font-family: var(--font-whois, monospace);',
      '  font-size: 0.88rem;',
      '  letter-spacing: 0.04em;',
      '  padding: 0.75rem 2rem;',
      '  border: 1px solid var(--blue, #0c2177);',
      '  background: none;',
      '  color: var(--blue, #0c2177);',
      '  cursor: pointer;',
      '  transition: background-color 0.2s;',
      '}',
      '#exhibition-inactivity-overlay .ei-btn:hover { background: rgba(12,33,119,0.07); }',
      '#exhibition-inactivity-overlay .ei-btn.primary {',
      '  background: var(--blue, #0c2177);',
      '  color: var(--color-bg, #F7F2F1);',
      '}',
      '#exhibition-inactivity-overlay .ei-btn.primary:hover { opacity: 0.85; }',

      // district print buttons on the completion screen
      '.exhibition-print-row {',
      '  display: flex;',
      '  gap: 0.75rem;',
      '  justify-content: center;',
      '  margin-top: 0.5rem;',
      '}',
      '.exhibition-print-btn {',
      '  font-family: var(--font-whois, monospace);',
      '  font-size: 0.82rem;',
      '  letter-spacing: 0.04em;',
      '  padding: 0.6rem 1.5rem;',
      '  background: white;',
      '  border: none;',
      '  cursor: pointer;',
      '  transition: opacity 0.2s;',
      '}',
      '.shrine-screen      .exhibition-print-btn { color: var(--color-shrine, #DD6204); }',
      '.garden-screen      .exhibition-print-btn { color: var(--color-garden, #6A6405); }',
      '.cornerstore-screen .exhibition-print-btn { color: var(--color-cornerstore, #D05038); }',
      '.tower-screen       .exhibition-print-btn { color: var(--color-tower, #205A97); }',
      '.plaza-screen       .exhibition-print-btn { color: var(--color-plaza, #64436d); }',
      '.exhibition-print-btn:hover { opacity: 0.8; }',

    ].join('\n');

    var style = document.createElement('style');
    style.id = 'exhibition-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  })();


  // ─── helper: full reset ─────────────────────────────────────────────────

  function fullReset() {
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    // build the root index url cleanly regardless of current page depth
    var rootUrl = window.location.origin +
      window.location.pathname
        .replace(/\/districts\/[^/]*$/, '/')   // strip /districts/pagename
        .replace(/\/[^/]*\.html$/, '/')         // strip any root-level html filename
        .replace(/\/$/, '') +                   // trim trailing slash
      '/index.html';
    window.location.replace(rootUrl);
  }


  // ─── 1. restart button ──────────────────────────────────────────────────

  function injectRestartButton() {
    if (document.getElementById('exhibition-restart-btn')) return;
    if (!document.body) return;

    // only show on pages that have the header bar (map, district, customize)
    // skip index/intro which have a different layout
    var path = window.location.pathname;
    var isIntro = path.endsWith('index.html') || path.endsWith('/');
    if (isIntro) return;

    var btn = document.createElement('button');
    btn.id          = 'exhibition-restart-btn';
    btn.textContent = 'Restart';
    btn.setAttribute('title', 'Clear all data and start over');
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      if (btn.dataset.armed === 'true') {
        fullReset();
      } else {
        btn.dataset.armed = 'true';
        btn.textContent   = 'This will reset the city. Click if you are a new user!';
        setTimeout(function () {
          btn.dataset.armed = 'false';
          btn.textContent   = 'Restart';
        }, 3000);
      }
    });
  }

  if (document.body) injectRestartButton();
  else document.addEventListener('DOMContentLoaded', injectRestartButton);


  // ─── 2. inactivity timer ────────────────────────────────────────────────

  var inactivityTimer  = null;
  var countdownTimer   = null;
  var countdownSeconds = 0;
  var overlayVisible   = false;

  function resetInactivityTimer() {
    if (overlayVisible) return;
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(showInactivityOverlay, INACTIVITY_MS);
  }

  function showInactivityOverlay() {
    var overlay = document.getElementById('exhibition-inactivity-overlay');
    if (!overlay) return;
    overlayVisible   = true;
    countdownSeconds = AUTO_RESET_MS / 1000;
    overlay.classList.add('active');
    updateCountdown();

    countdownTimer = setInterval(function () {
      countdownSeconds--;
      updateCountdown();
      if (countdownSeconds <= 0) {
        clearInterval(countdownTimer);
        fullReset();
      }
    }, 1000);
  }

  function updateCountdown() {
    var el = document.getElementById('ei-countdown');
    if (el) el.textContent = 'Restarting in ' + countdownSeconds + ' second' + (countdownSeconds !== 1 ? 's' : '') + '...';
  }

  function dismissInactivityOverlay() {
    var overlay = document.getElementById('exhibition-inactivity-overlay');
    if (overlay) overlay.classList.remove('active');
    clearInterval(countdownTimer);
    overlayVisible = false;
    resetInactivityTimer();
  }

  function injectInactivityOverlay() {
    if (document.getElementById('exhibition-inactivity-overlay')) return;
    if (!document.body) return;

    // don't show on intro page — a new user sitting down is expected there
    var path = window.location.pathname;
    var isIntro = path.endsWith('index.html') || path.endsWith('/');
    if (isIntro) return;

    var overlay = document.createElement('div');
    overlay.id  = 'exhibition-inactivity-overlay';
    overlay.innerHTML = [
      '<p class="ei-message">Are you still building?</p>',
      '<p class="ei-countdown" id="ei-countdown">Restarting in 60 seconds...</p>',
      '<div class="ei-actions">',
      '  <button class="ei-btn primary" id="ei-continue-btn">Continue building</button>',
      '  <button class="ei-btn" id="ei-restart-btn">Start fresh</button>',
      '</div>',
    ].join('');
    document.body.appendChild(overlay);

    document.getElementById('ei-continue-btn').addEventListener('click', dismissInactivityOverlay);
    document.getElementById('ei-restart-btn').addEventListener('click', function () {
      clearInterval(countdownTimer);
      fullReset();
    });

    // start the timer
    resetInactivityTimer();

    // reset on any user interaction
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (evt) {
      document.addEventListener(evt, resetInactivityTimer, { passive: true });
    });
  }

  if (document.body) injectInactivityOverlay();
  else document.addEventListener('DOMContentLoaded', injectInactivityOverlay);


  // ─── 3. district completion print buttons ───────────────────────────────
  // watches for the completion screen to appear (it starts hidden and gets
  // shown dynamically), then injects two print buttons below the done button.

  var DISTRICT_NAMES = {
    shrine:      'The Shrine',
    garden:      'The Garden',
    cornerstore: 'The Cornerstore',
    tower:       'The Tower',
    plaza:       'The Plaza',
  };

  var DISTRICT_EMOTIONS = {
    shrine:      'Reverence',
    garden:      'Growth',
    cornerstore: 'Routine',
    tower:       'Solitude',
    plaza:       'Community',
  };

  var QUESTIONS = {
    shrine:      ["What place comes to mind?","What did this place hold that was precious to you?","How do you return to this place?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, give your shrine a name."],
    garden:      ["What place comes to mind?","What were you becoming in this place?","How did the growth happen? What did it feel like?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, please give your garden a name."],
    cornerstore: ["What place comes to mind?","What was your routine in this place?","What drew you to this specific place?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, please give your cornerstore a name."],
    tower:       ["What place comes to mind?","What was your relationship with solitude in this space?","What perspective did being alone give you?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, please give your tower a name."],
    plaza:       ["What place comes to mind?","Who else was in this place? How did you connect with them?","What brought you together in this place?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, please give your plaza a name."],
  };

  function detectCurrentDistrict() {
    var path = window.location.pathname;
    var names = Object.keys(DISTRICT_NAMES);
    for (var i = 0; i < names.length; i++) {
      if (path.indexOf(names[i]) !== -1) return names[i];
    }
    return null;
  }

  function printThisDistrict(districtKey) {
    var answers  = JSON.parse(localStorage.getItem(districtKey + '-answers') || '{}');
    var sessions = JSON.parse(localStorage.getItem(districtKey + '-sessions') || '[]');
    var name     = localStorage.getItem(districtKey + '-name') || DISTRICT_NAMES[districtKey];
    var qs       = QUESTIONS[districtKey] || [];
    var emotion  = DISTRICT_EMOTIONS[districtKey] || '';
    var place    = (answers[0] || '').trim();

    // use latest session answers if available
    if (sessions.length > 0) {
      var latest = sessions[sessions.length - 1];
      if (latest.answers) answers = latest.answers;
    }

    var lines = [
      name.toUpperCase(),
      emotion,
      place ? ('at: ' + place) : '',
      '---',
    ];
    qs.forEach(function (q, i) {
      var a = (answers[i] || '').trim();
      if (a) {
        lines.push(q);
        lines.push(a);
        lines.push('');
      }
    });
    lines.push('---');
    lines.push('Your city is always being built.');

    _openPrintWindow(name, lines.join('\n'));
  }

  function printWholeCityFromDistrict() {
    // navigate to print.html — it already builds the full city receipt
    if (typeof window.navigateWithLoader === 'function') {
      window.navigateWithLoader(ROOT_PATH + 'print.html');
    } else {
      window.location.href = ROOT_PATH + 'print.html';
    }
  }

  function _openPrintWindow(title, text) {
    var w = window.open('', '_blank', 'width=600,height=700');
    if (!w) { alert('Allow popups to print.'); return; }
    w.document.write([
      '<!DOCTYPE html><html><head><meta charset="UTF-8">',
      '<title>' + title + '</title>',
      '<style>',
      '  body { font-family: monospace; font-size: 13px; line-height: 1.7;',
      '         max-width: 480px; margin: 2rem auto; color: #0c2177; white-space: pre-wrap; }',
      '  @media print { body { margin: 0; } }',
      '</style></head><body>',
      '<pre>' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>',
      '<script>window.onload = function() { window.print(); }<\/script>',
      '</body></html>',
    ].join(''));
    w.document.close();
  }

  function injectCompletionPrintButtons(districtKey) {
    // find the completion container — may not exist on non-district pages
    var container = document.querySelector('.completion-container');
    if (!container) return;
    if (container.querySelector('.exhibition-print-row')) return;

    var row = document.createElement('div');
    row.className = 'exhibition-print-row';

    var btnDistrict = document.createElement('button');
    btnDistrict.className   = 'exhibition-print-btn mono';
    btnDistrict.textContent = 'Print this district';
    btnDistrict.addEventListener('click', function () { printThisDistrict(districtKey); });

    var btnCity = document.createElement('button');
    btnCity.className   = 'exhibition-print-btn mono';
    btnCity.textContent = 'Print whole city';
    btnCity.addEventListener('click', printWholeCityFromDistrict);

    row.appendChild(btnDistrict);
    row.appendChild(btnCity);
    container.appendChild(row);
  }

  function watchForCompletionScreen(districtKey) {
    if (!districtKey) return;

    // the completion screen is a sibling div that starts hidden.
    // watch for it to lose the 'hidden' class using a MutationObserver.
    var completionId = districtKey + '-completion';

    function tryInject() {
      var screen = document.getElementById(completionId);
      if (screen && !screen.classList.contains('hidden')) {
        injectCompletionPrintButtons(districtKey);
      }
    }

    // also try immediately in case it's already visible
    tryInject();

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          tryInject();
        }
      });
    });

    // observe the whole district content wrapper for class changes
    var wrapper = document.getElementById('district-content');
    if (wrapper) {
      observer.observe(wrapper, { attributes: true, subtree: true });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var districtKey = detectCurrentDistrict();
    if (districtKey) watchForCompletionScreen(districtKey);
  });

})();
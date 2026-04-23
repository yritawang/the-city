// cursor-loader.js
// custom cursor + page transitions with a real loading bar.
//
// how to use:
//   anchor clicks (<a href="...">) are intercepted automatically.
//   for programmatic navigation in your other js files, call:
//     window.navigateWithLoader('path/to/page.html');
//   instead of:
//     window.location.href = 'path/to/page.html';

(function () {

  // ─── page type detection ────────────────────────────────────────────────

  var path        = window.location.pathname;
  var isCustomize = path.indexOf('-customize') !== -1;
  var isDistrict  = path.indexOf('/districts/') !== -1 && !isCustomize;


  // ─── inject loader + fade styles once ───────────────────────────────────

  (function injectStyles() {
    if (document.getElementById('cursor-loader-styles')) return;
    var css = [
      '#page-loader-overlay{',
      '  position:fixed;inset:0;z-index:2147483646;background-color:#F7F2F1;',
      '  display:none;flex-direction:column;align-items:center;justify-content:center;',
      '  gap:1.5rem;opacity:0;transition:opacity 0.25s ease;',
      '  background-image:',
      '    linear-gradient(rgba(12,33,119,0.05) 1px,transparent 1px),',
      '    linear-gradient(90deg,rgba(12,33,119,0.05) 1px,transparent 1px),',
      '    linear-gradient(rgba(12,33,119,0.025) 1px,transparent 1px),',
      '    linear-gradient(90deg,rgba(12,33,119,0.025) 1px,transparent 1px);',
      '  background-size:120px 120px,120px 120px,30px 30px,30px 30px;',
      '}',
      '#page-loader-overlay.active{display:flex;opacity:1;}',
      '.page-loader-label{',
      '  font-family:"Meta",serif;font-size:1.6rem;color:#0c2177;',
      '  letter-spacing:-0.01em;text-align:center;',
      '}',
      '.page-loader-bar{',
      '  width:320px;max-width:60vw;height:14px;border:1px solid #0c2177;',
      '  background:transparent;position:relative;overflow:hidden;',
      '}',
      '.page-loader-fill{',
      '  position:absolute;top:0;left:0;bottom:0;width:0%;',
      '  background-color:#0c2177;transition:width 0.2s ease-out;',
      '}',
      '.page-loader-percent{',
      '  font-family:"Whois",monospace;font-size:0.82rem;color:#0c2177;',
      '  letter-spacing:0.08em;min-width:4ch;text-align:center;',
      '}',
      '#page-arrival-fade{',
      '  position:fixed;inset:0;z-index:2147483645;background-color:#FFFFFF;',
      '  pointer-events:none;opacity:1;transition:opacity 0.9s ease-out;',
      '}',
      '#page-arrival-fade.cleared{opacity:0;}',
    ].join('');
    var style = document.createElement('style');
    style.id   = 'cursor-loader-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  })();


  // ─── custom cursor ──────────────────────────────────────────────────────

  function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    if (document.getElementById('custom-cursor')) return;
    if (!document.body) return;

    var cursor = document.createElement('div');
    cursor.id  = 'custom-cursor';
    cursor.innerHTML = [
      '<div class="cursor-cross">',
      '  <div class="cursor-h"></div>',
      '  <div class="cursor-v"></div>',
      '</div>',
      '<div class="cursor-dot"></div>',
    ].join('');
    document.body.appendChild(cursor);

    var mouseX = -100, mouseY = -100, raf = null;

    function moveCursor() {
      cursor.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
      raf = null;
    }

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!raf) raf = requestAnimationFrame(moveCursor);
    });

    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = '1'; });

    var POINTER_SEL = [
      'button', 'a', '[role="button"]',
      '.district', '.customize-toggle-btn', '.achievements-toggle-btn',
      '#train-on-map', '#train-board', '.train-on-map', '.train-board',
      '.header-btn', '.header-left',
      '.overlay-btn', '.train-prompt-btn', '.skin-thumb', '.share-tab',
      '.constellation-btn', '.journal-location-heading', '.journal-entry-header',
      '.album-grid-cell', '.toggle-btn', '.customize-toggle-cell',
      '.nav-btn', '.back-btn', '.visitor-visit-btn', '.train-log-delete',
      '#radio-on-map', '.radio-track-btn', '.radio-close-btn', '.radio-playpause-btn',
      'select', 'label',
    ].join(', ');

    var isPointer = false;

    document.addEventListener('mouseover', function (e) {
      var over = e.target.closest(POINTER_SEL);
      if (over && !isPointer) {
        isPointer = true;
        cursor.classList.add('pointer');
      } else if (!over && isPointer) {
        isPointer = false;
        cursor.classList.remove('pointer');
      }
    });

    document.addEventListener('mousedown', function () { cursor.classList.add('pressed'); });
    document.addEventListener('mouseup',   function () { cursor.classList.remove('pressed'); });
  }

  if (document.body) initCursor();
  else document.addEventListener('DOMContentLoaded', initCursor);


  // ─── destination labels ─────────────────────────────────────────────────

  function getDestinationLabel(url) {
    var p = url.toLowerCase();
    if (p.indexOf('shrine') !== -1 && p.indexOf('customize') === -1)      return 'Entering Shrine';
    if (p.indexOf('garden') !== -1 && p.indexOf('customize') === -1)      return 'Entering Garden';
    if (p.indexOf('cornerstore') !== -1 && p.indexOf('customize') === -1) return 'Entering Cornerstore';
    if (p.indexOf('tower') !== -1 && p.indexOf('customize') === -1)       return 'Entering Tower';
    if (p.indexOf('plaza') !== -1 && p.indexOf('customize') === -1)       return 'Entering Plaza';
    if (p.indexOf('customize') !== -1) return 'Loading your space';
    if (p.indexOf('print') !== -1)     return 'Preparing the press';
    if (p.indexOf('map') !== -1)       return isFirstTimeVisitor() ? 'Entering Your City' : 'Returning to your city';
    if (p.indexOf('index') !== -1 || p === '/') return 'Loading home';
    return 'Loading';
  }

  // first-time visitor = no district has been logged yet
  function isFirstTimeVisitor() {
    try {
      var districts = ['shrine', 'garden', 'cornerstore', 'tower', 'plaza'];
      for (var i = 0; i < districts.length; i++) {
        var sessions = localStorage.getItem(districts[i] + '-sessions');
        if (sessions && JSON.parse(sessions).length > 0) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function isDistrictUrl(url) {
    var p = url.toLowerCase();
    if (p.indexOf('customize') !== -1) return false;
    return (
      p.indexOf('shrine') !== -1 ||
      p.indexOf('garden') !== -1 ||
      p.indexOf('cornerstore') !== -1 ||
      p.indexOf('tower') !== -1 ||
      p.indexOf('plaza') !== -1
    );
  }


  // ─── chime playback ─────────────────────────────────────────────────────

  function chimeSrc() {
    var inSubfolder = window.location.pathname.indexOf('/districts/') !== -1;
    return (inSubfolder ? '../' : '') + 'assets/sounds/chime1.wav';
  }

  function playArrivalChime() {
    try {
      var audio = new Audio(chimeSrc());
      audio.volume = 0.6;
      var promise = audio.play();
      if (promise && promise.catch) promise.catch(function () {});
    } catch (err) {}
  }


  // ─── build loader ui ────────────────────────────────────────────────────

  function buildLoader() {
    if (document.getElementById('page-loader-overlay')) return;
    var overlay = document.createElement('div');
    overlay.id  = 'page-loader-overlay';
    overlay.innerHTML =
      '<div class="page-loader-label" id="page-loader-label">Loading</div>' +
      '<div class="page-loader-bar"><div class="page-loader-fill" id="page-loader-fill"></div></div>' +
      '<div class="page-loader-percent" id="page-loader-percent">0%</div>';
    (document.body || document.documentElement).appendChild(overlay);
  }


  // ─── fetch html with real download progress ─────────────────────────────

  function fetchWithProgress(url, onChunk) {
    return fetch(url, { cache: 'force-cache' }).then(function (response) {
      if (!response.ok) return '';
      var contentLength = response.headers.get('content-length');
      var total  = contentLength ? parseInt(contentLength, 10) : 0;
      var loaded = 0;

      if (!response.body || !response.body.getReader) {
        return response.text();
      }

      var reader  = response.body.getReader();
      var decoder = new TextDecoder();
      var text    = '';

      function read() {
        return reader.read().then(function (result) {
          if (result.done) return text;
          loaded += result.value.length;
          text   += decoder.decode(result.value, { stream: true });
          if (total > 0 && typeof onChunk === 'function') {
            onChunk(loaded / total);
          }
          return read();
        });
      }
      return read();
    }).catch(function () { return ''; });
  }


  // ─── extract asset urls ─────────────────────────────────────────────────

  function extractAssetUrls(htmlText, baseUrl) {
    var doc = new DOMParser().parseFromString(htmlText, 'text/html');
    var urls = [];
    doc.querySelectorAll('link[rel="stylesheet"][href]').forEach(function (el) {
      urls.push(new URL(el.getAttribute('href'), baseUrl).href);
    });
    doc.querySelectorAll('script[src]').forEach(function (el) {
      urls.push(new URL(el.getAttribute('src'), baseUrl).href);
    });
    doc.querySelectorAll('img[src]').forEach(function (el) {
      urls.push(new URL(el.getAttribute('src'), baseUrl).href);
    });
    return urls;
  }


  // ─── preload a single asset ─────────────────────────────────────────────

  function preloadAsset(url) {
    return new Promise(function (resolve) {
      var ext = url.split('?')[0].split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].indexOf(ext) !== -1) {
        var img = new Image();
        img.onload  = function () { resolve(); };
        img.onerror = function () { resolve(); };
        img.src = url;
      } else {
        fetch(url, { cache: 'force-cache' })
          .then(function () { resolve(); })
          .catch(function () { resolve(); });
      }
    });
  }


  // ─── main navigation with loader ────────────────────────────────────────

  // minimum total duration (ms) for the loader bar
  var MIN_LOADER_DURATION = 3700;
  // pause at 100% before navigating
  var SETTLE_DURATION     = 280;

  // guard against multiple simultaneous loader calls
  var loaderBusy = false;

  function navigateWithLoader(url) {
    if (loaderBusy) return;
    if (!url) return;
    loaderBusy = true;

    buildLoader();
    var overlay = document.getElementById('page-loader-overlay');
    var label   = document.getElementById('page-loader-label');
    var fill    = document.getElementById('page-loader-fill');
    var percent = document.getElementById('page-loader-percent');

    label.textContent = getDestinationLabel(url);
    overlay.classList.add('active');

    var realProgress  = 0;
    var pacedProgress = 0;
    var shown         = 0;
    var startTime     = performance.now();
    var realLoadDone  = false;
    var tickHandle    = null;

    function setRealProgress(p) {
      realProgress = Math.max(realProgress, Math.min(100, p));
    }

    function render() {
      var target = Math.min(realProgress, pacedProgress);
      if (!realLoadDone) target = Math.min(target, 99);
      if (target > shown) {
        shown = Math.round(target);
        fill.style.width = shown + '%';
        percent.textContent = shown + '%';
      }
    }

    function tick() {
      var elapsed = performance.now() - startTime;
      var t = Math.min(1, elapsed / MIN_LOADER_DURATION);
      pacedProgress = (1 - Math.pow(1 - t, 1.6)) * 100;
      render();
      if (shown < 100) {
        tickHandle = requestAnimationFrame(tick);
      }
    }
    tick();

    var baseUrl = new URL(url, window.location.href).href;

    fetchWithProgress(baseUrl, function (ratio) {
      setRealProgress(2 + ratio * 28);
    }).then(function (html) {
      setRealProgress(30);
      var assets = extractAssetUrls(html, baseUrl);
      if (assets.length === 0) {
        setRealProgress(100);
        return;
      }
      var done = 0;
      return Promise.all(assets.map(function (u) {
        return preloadAsset(u).then(function () {
          done++;
          setRealProgress(30 + (done / assets.length) * 70);
        });
      }));
    }).then(function () {
      setRealProgress(100);
      realLoadDone = true;

      function waitForFull() {
        if (shown >= 100) {
          if (tickHandle) cancelAnimationFrame(tickHandle);
          if (isDistrictUrl(url)) {
            try { sessionStorage.setItem('play-arrival-chime', '1'); } catch (e) {}
          }
          // save audio position so music resumes seamlessly on the next page
          if (typeof window.saveAudioPosition === 'function') {
            try { window.saveAudioPosition(); } catch (e) {}
          }
          setTimeout(function () { window.location.href = url; }, SETTLE_DURATION);
        } else {
          requestAnimationFrame(waitForFull);
        }
      }
      waitForFull();
    }).catch(function () {
      window.location.href = url;
    });
  }


  // ─── arrival fade + chime ───────────────────────────────────────────────

  function injectArrivalFade() {
    if (document.getElementById('page-arrival-fade')) return;
    if (!document.body) return;
    var fade = document.createElement('div');
    fade.id  = 'page-arrival-fade';
    document.body.insertBefore(fade, document.body.firstChild);

    var shouldChime = false;
    try {
      shouldChime = sessionStorage.getItem('play-arrival-chime') === '1';
      if (shouldChime) sessionStorage.removeItem('play-arrival-chime');
    } catch (e) {}

    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (shouldChime) playArrivalChime();
          setTimeout(function () {
            fade.classList.add('cleared');
            setTimeout(function () {
              if (fade.parentNode) fade.parentNode.removeChild(fade);
            }, 1000);
          }, 200);
        });
      });
    });
  }

  if (document.body) injectArrivalFade();
  else document.addEventListener('DOMContentLoaded', injectArrivalFade);


  // ─── expose nav helpers and stubs ───────────────────────────────────────
  // these are the ONLY functions your other code should call for navigation.
  // do NOT use window.location.href = '...' in your other js files.

  window.navigateWithLoader = navigateWithLoader;
  window.pageLoaderNavigate = navigateWithLoader;
  window.pageTransitionOut  = function (url /*, delay */) { navigateWithLoader(url); };
  window.fadeToPage         = function (url) { navigateWithLoader(url); };
  window.triggerDistrictEnterColumns = function () {};


  // ─── intercept same-site anchor clicks ──────────────────────────────────

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (a.target === '_blank') return;
    if (a.hasAttribute('download')) return;
    if (href.charAt(0) === '#') return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
    if (/^https?:\/\//i.test(href)) {
      try {
        var dest = new URL(href, window.location.href);
        if (dest.origin !== window.location.origin) return;
      } catch (_) { return; }
    }
    var destUrl;
    try { destUrl = new URL(href, window.location.href).href; }
    catch (_) { return; }
    if (destUrl === window.location.href) return;

    e.preventDefault();
    navigateWithLoader(destUrl);
  }, true);


  // ─── inject a minimal settings panel on pages that don't already have one ─
  // the map page creates its own settings panel in map.js with more options.
  // on every other page we show a small panel with just the Sound toggle
  // so users can mute/unmute anywhere.

  function injectSettingsPanel() {
    // bail if the map already put one here
    if (document.getElementById('customize-toggle-btn')) return;
    if (document.getElementById('loader-settings-btn')) return;
    if (!document.body) return;

    var wrap = document.createElement('div');
    wrap.innerHTML = [
      '<div class="customize-toggle-btn" id="loader-settings-btn">',
      '  <span class="customize-btn-label">Settings</span>',
      '</div>',
      '<div class="customize-panel" id="loader-settings-panel">',
      '  <div class="customize-panel-header" id="loader-settings-header">',
      '    <span class="customize-panel-label">Settings</span>',
      '    <span class="customize-panel-toggle">',
      '      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">',
      '        <polyline points="1,7 6,1 11,7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      '      </svg>',
      '    </span>',
      '  </div>',
      '  <div class="customize-panel-body">',
      '    <div class="customize-row">',
      '      <span class="customize-row-label">Sound</span>',
      '      <div class="customize-toggle-cell" id="audio-mute-toggle">',
      '        <div class="toggle-track" id="audio-mute-track"><div class="toggle-thumb"></div></div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('');
    document.body.appendChild(wrap);

    var btn    = document.getElementById('loader-settings-btn');
    var panel  = document.getElementById('loader-settings-panel');
    var header = document.getElementById('loader-settings-header');

    btn.addEventListener('click', function () {
      panel.classList.add('visible');
      btn.style.display = 'none';
    });
    header.addEventListener('click', function () {
      panel.classList.remove('visible');
      btn.style.display = 'flex';
    });

    // reflect current mute state, then wire the toggle
    var track = document.getElementById('audio-mute-track');
    var muted = false;
    try { muted = localStorage.getItem('audioMuted') === 'true'; } catch (e) {}
    if (track) track.classList.toggle('on', !muted);

    document.getElementById('audio-mute-toggle').addEventListener('click', function () {
      if (typeof window.toggleAudioMute === 'function') {
        window.toggleAudioMute();
      } else {
        // fallback: flip the storage flag so next page pickup honors it
        try {
          var now = localStorage.getItem('audioMuted') === 'true';
          localStorage.setItem('audioMuted', String(!now));
          if (track) track.classList.toggle('on', now);
        } catch (e) {}
      }
    });
  }

  if (document.body) injectSettingsPanel();
  else document.addEventListener('DOMContentLoaded', injectSettingsPanel);

})();
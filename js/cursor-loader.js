// cursor-loader.js
// custom cursor + page transitions
//
// map enter:        simple fade in
// map leave:        instant navigate
// district enter:   typewriter then column fill in district color
// district leave:   column unfill in district color
// customize enter:  panels float in from sides
// customize leave:  panels float out to sides

(function() {

  // ─── page type detection ──────────────────────────────────────────────────

  var path        = window.location.pathname;
  var isCustomize = path.includes('-customize');
  var isDistrict  = path.includes('/districts/') && !isCustomize;
  var isMap       = !isCustomize && !isDistrict;

  var districtColorMap = {
    shrine:      '#DD6204',
    garden:      '#6A6405',
    cornerstore: '#D05038',
    tower:       '#205A97',
    plaza:       '#64436d',
  };

  var districtName  = document.body.dataset.district || '';
  var districtColor = districtColorMap[districtName] || '#0c2177';


  // ─── custom cursor ────────────────────────────────────────────────────────

  if (!window.matchMedia('(hover: none)').matches) {
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

    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!raf) raf = requestAnimationFrame(moveCursor);
    });

    document.addEventListener('mouseleave', function() { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function() { cursor.style.opacity = '1'; });

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

    document.addEventListener('mouseover', function(e) {
      var over = e.target.closest(POINTER_SEL);
      if (over && !isPointer) {
        isPointer = true;
        cursor.classList.add('pointer');
      } else if (!over && isPointer) {
        isPointer = false;
        cursor.classList.remove('pointer');
      }
    });

    document.addEventListener('mousedown', function() { cursor.classList.add('pressed'); });
    document.addEventListener('mouseup',   function() { cursor.classList.remove('pressed'); });
  }


  // ─── column fill overlay (district pages only) ────────────────────────────

  var outOverlay = document.createElement('div');
  outOverlay.id  = 'page-out-overlay';

  var cellsHTML = Array.from({ length: 12 }, function(_, i) {
    return '<div class="page-out-cell" style="animation-delay:' + (i * 0.03) + 's;background-color:' + districtColor + ';"></div>';
  }).join('');

  outOverlay.innerHTML = '<div class="page-out-grid">' + cellsHTML + '</div>';
  document.body.appendChild(outOverlay);


  // ─── navigation ───────────────────────────────────────────────────────────

  window.pageTransitionOut = function(url, delay) {
    if (isCustomize) {
      // float panels out then navigate
      document.body.classList.add('page-leaving');
      setTimeout(function() { window.location.href = url; }, delay || 420);

    } else if (isDistrict) {
      // column unfill then navigate
      outOverlay.classList.add('mode-columns-out', 'active');
      setTimeout(function() { window.location.href = url; }, delay || 500);

    } else {
      // map: just navigate, no animation
      setTimeout(function() { window.location.href = url; }, delay || 100);
    }
  };


  // ─── entry animations ─────────────────────────────────────────────────────

  if (isMap) {
    // simple fade in via page-entering class + css
    document.body.classList.add('page-entering');
    window.addEventListener('load', function() {
      setTimeout(function() {
        document.body.classList.remove('page-entering');
      }, 800);
    });

  } else if (isCustomize) {
    // float panels in
    document.body.classList.add('page-entering');
    window.addEventListener('load', function() {
      setTimeout(function() {
        document.body.classList.remove('page-entering');
      }, 700);
    });

  } else if (isDistrict) {
    // column fill triggered by district.js after typewriter
    window.triggerDistrictEnterColumns = function() {
      outOverlay.classList.add('mode-columns', 'active');
      setTimeout(function() {
        outOverlay.classList.remove('active');
        setTimeout(function() { outOverlay.classList.remove('mode-columns'); }, 400);
      }, 600);
    };
  }


  // ─── patch fadeToPage ─────────────────────────────────────────────────────

  var attempts = 0;
  function tryPatch() {
    if (typeof window.fadeToPage === 'function') {
      var orig = window.fadeToPage;
      window.fadeToPage = function(url) {
        window.pageTransitionOut ? window.pageTransitionOut(url, 500) : orig(url);
      };
    } else if (attempts < 40) {
      attempts++;
      setTimeout(tryPatch, 50);
    }
  }
  tryPatch();


  // ─── customize back button ────────────────────────────────────────────────

  if (isCustomize) {
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.sidebar-back-btn, .back-btn').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          window.pageTransitionOut(el.getAttribute('href') || '../map.html', 420);
        });
      });
    });
  }

})();
// district.js
// shared setup that runs on every district page


// safe fallback for unlockAchievement
if (typeof unlockAchievement === 'undefined') {
  window.unlockAchievement = (id) => {
    const pending = JSON.parse(localStorage.getItem('pending-achievements') || '[]');
    if (!pending.includes(id)) {
      pending.push(id);
      localStorage.setItem('pending-achievements', JSON.stringify(pending));
    }
  };
}

// fade to white then navigate — fallback if cursor-loader isn't present
function fadeToPage(url) {
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:white',
    'opacity:0', 'z-index:9999',
    'transition:opacity 0.5s ease',
    'pointer-events:all'
  ].join(';');
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => { window.location.href = url; }, 520);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {

  const enteringOverlay = document.getElementById('entering-overlay');
  const districtContent = document.getElementById('district-content');
  const textEl          = enteringOverlay?.querySelector('.entering-text');
  const fullText        = textEl ? textEl.textContent.trim() : '';

  if (textEl) textEl.textContent = '';

  // type forward character by character
  let i = 0;
  const typeInterval = setInterval(() => {
    if (!textEl) return;
    textEl.textContent = fullText.slice(0, i + 1);
    i++;
    if (i >= fullText.length) {
      clearInterval(typeInterval);

      // pause at full text, then erase backwards
      setTimeout(() => {
        let j = fullText.length;
        const eraseInterval = setInterval(() => {
          textEl.textContent = fullText.slice(0, j - 1);
          j--;
          if (j <= 0) {
            clearInterval(eraseInterval);

            // trigger column fill in district color (defined in cursor-loader.js)
            if (typeof window.triggerDistrictEnterColumns === 'function') {
              window.triggerDistrictEnterColumns();
            }

            // fade out the entering overlay and show district content
            enteringOverlay.classList.add('fade-out');
            setTimeout(() => {
              enteringOverlay.style.display = 'none';
              districtContent.classList.remove('hidden');

              if (window.DISTRICT_BEGAN_ID) {
                unlockAchievement(window.DISTRICT_BEGAN_ID);
              }
            }, 800);
          }
        }, 35);   // erase speed ms per character
      }, 500);    // pause before erasing
    }
  }, 55);         // type speed ms per character


  // back buttons: save answer then navigate with transition
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof saveCurrentAnswer === 'function') saveCurrentAnswer();
      if (typeof window.pageTransitionOut === 'function') {
        window.pageTransitionOut('../map.html', 500);
      } else {
        window.location.href = '../map.html';
      }
    });
  });


  // done button on completion screen: fade to customize page
  document.addEventListener('click', (e) => {
    if (e.target.id !== 'done-btn') return;
    const district = window.CURRENT_DISTRICT;
    fadeToPage(district
      ? `${district}-customize.html`
      : '../map.html');
  });


  // share button placeholder
  document.querySelectorAll('.district-share-btn').forEach(btn => {
    btn.addEventListener('click', () => {});
  });


  // keyboard shortcuts: enter = next, ctrl+arrow = navigate
  document.addEventListener('keydown', (e) => {
    const input = document.getElementById('question-input');
    if (!input || document.activeElement !== input) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (typeof nextQuestion === 'function') nextQuestion();
    } else if (e.key === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault();
      if (typeof prevQuestion === 'function') prevQuestion();
    } else if (e.key === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault();
      if (typeof nextQuestion === 'function') nextQuestion();
    }
  });

});
// district.js
// shared setup that runs on every district page


// safe fallback for unlockAchievement
// achievements.js is only loaded on map.html, district pages need this stub
if (typeof unlockAchievement === 'undefined') {
  window.unlockAchievement = (id) => {
    const pending = JSON.parse(localStorage.getItem('pending-achievements') || '[]');
    if (!pending.includes(id)) {
      pending.push(id);
      localStorage.setItem('pending-achievements', JSON.stringify(pending));
    }
  };
}

// fade to white then navigate — mirrors the entering overlay feel
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

  // entering overlay: fade out after 3s, then reveal district content
  const enteringOverlay = document.getElementById('entering-overlay');
  const districtContent  = document.getElementById('district-content');

  setTimeout(() => {
    enteringOverlay.classList.add('fade-out');
    setTimeout(() => {
      enteringOverlay.style.display = 'none';
      districtContent.classList.remove('hidden');
    }, 800);
  }, 3000);


  // back buttons: save answer then go to map
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof saveCurrentAnswer === 'function') saveCurrentAnswer();
      window.location.href = '../map.html';
    });
  });


  // done button on completion screen: fade to white then go to customize
  // each district js sets window.CURRENT_DISTRICT before showCompletionScreen
  document.addEventListener('click', (e) => {
    if (e.target.id !== 'done-btn') return;
    const district = window.CURRENT_DISTRICT;
    fadeToPage(district ? `${district}-customize.html` : '../map.html');
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
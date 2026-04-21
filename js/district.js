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

// fade to white then navigate — fallback if page-loader isn't present
function fadeToPage(url) {
  if (typeof window.pageLoaderNavigate === 'function') {
    window.pageLoaderNavigate(url);
    return;
  }
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

// re-trigger float-up animation on the question card
function animateQuestionCard() {
  const card = document.querySelector('.question-card');
  if (!card) return;
  card.classList.remove('card-animate');
  void card.offsetWidth; // force reflow
  card.classList.add('card-animate');
}

document.addEventListener('DOMContentLoaded', () => {

  // detect which district this page is for and tag the body
  const screen = document.querySelector('[class$="-screen"]') || document.querySelector('[id$="-intro"]');
  if (screen) {
    const match = (screen.className || screen.id).match(/^(shrine|garden|cornerstore|tower|plaza)/);
    if (match) document.body.dataset.district = match[1];
  }

  // page-loader handles the entrance transition now.
  // just hide the old entering overlay and reveal district content immediately.
  const enteringOverlay = document.getElementById('entering-overlay');
  const districtContent = document.getElementById('district-content');

  if (enteringOverlay) enteringOverlay.style.display = 'none';
  if (districtContent) districtContent.classList.remove('hidden');

  if (window.DISTRICT_BEGAN_ID) {
    unlockAchievement(window.DISTRICT_BEGAN_ID);
  }


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


  // patch renderQuestion once each district's JS defines it
  // this fires animateQuestionCard on every question transition
  let attempts = 0;
  function patchRenderQuestion() {
    if (typeof window.renderQuestion === 'function') {
      const orig = window.renderQuestion;
      window.renderQuestion = function() {
        orig.apply(this, arguments);
        animateQuestionCard();
      };
    } else if (attempts < 60) {
      attempts++;
      setTimeout(patchRenderQuestion, 50);
    }
  }
  patchRenderQuestion();

});
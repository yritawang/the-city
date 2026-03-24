// district.js
// shared setup that runs on every district page (shrine, garden, etc.)


// safe fallback for unlockAchievement
// achievements.js is only loaded on map.html, so district pages need this stub
if (typeof unlockAchievement === 'undefined') {
  window.unlockAchievement = (id) => {
    const pending = JSON.parse(localStorage.getItem('pending-achievements') || '[]');
    if (!pending.includes(id)) {
      pending.push(id);
      localStorage.setItem('pending-achievements', JSON.stringify(pending));
    }
  };
}


document.addEventListener('DOMContentLoaded', () => {

  // entering overlay: fade out after 3s, then reveal district content
  const enteringOverlay = document.getElementById('entering-overlay');
  const districtContent = document.getElementById('district-content');

  setTimeout(() => {
    enteringOverlay.classList.add('fade-out');

    setTimeout(() => {
      enteringOverlay.style.display = 'none';
      districtContent.classList.remove('hidden');
    }, 800);
  }, 3000);


  // back buttons: save current answer (if mid-questions) then go to map
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof saveCurrentAnswer === 'function') saveCurrentAnswer();
      window.location.href = '../map.html';
    });
  });


  // share button: no functionality yet, placeholder for future
  document.querySelectorAll('.district-share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // todo: implement share
    });
  });


  // keyboard shortcuts for question input
  // enter advances, ctrl+arrow navigates between questions
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
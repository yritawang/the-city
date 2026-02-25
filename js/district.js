// district.js
// Get current district from localStorage
const currentDistrict = localStorage.getItem('currentDistrict') || 'shrine';

// Safe fallback — achievements.js is only loaded on map.html
// District pages call unlockAchievement() but don't load achievements.js
if (typeof unlockAchievement === 'undefined') {
  window.unlockAchievement = (id) => {
    const pending = JSON.parse(localStorage.getItem('pending-achievements') || '[]');
    if (!pending.includes(id)) {
      pending.push(id);
      localStorage.setItem('pending-achievements', JSON.stringify(pending));
    }
  };
}

// Entering overlay logic
document.addEventListener('DOMContentLoaded', () => {
  const enteringOverlay = document.getElementById('entering-overlay');
  const districtContent = document.getElementById('district-content');

  // After 3 seconds, fade out overlay and show content
  setTimeout(() => {
    enteringOverlay.classList.add('fade-out');
    
    setTimeout(() => {
      enteringOverlay.style.display = 'none';
      districtContent.classList.remove('hidden');
    }, 800);
  }, 3000);

  // Universal Enter key handler for question inputs
  // Uses event delegation so it works even before the question screen is visible
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
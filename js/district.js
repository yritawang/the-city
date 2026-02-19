// district.js
// Get current district from localStorage
const currentDistrict = localStorage.getItem('currentDistrict') || 'shrine';

// Entering overlay logic
document.addEventListener('DOMContentLoaded', () => {
  const enteringOverlay = document.getElementById('entering-overlay');
  const districtContent = document.getElementById('district-content');

  // After 3 seconds, fade out overlay and show content
  setTimeout(() => {
    enteringOverlay.classList.add('fade-out');
    
    // Remove overlay and show content after fade completes
    setTimeout(() => {
      enteringOverlay.style.display = 'none';
      districtContent.classList.remove('hidden');
    }, 800); // Wait for fade transition
  }, 3000);
});

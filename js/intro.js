// Intro screen auto-fade after 5 seconds
// (Auto-redirect disabled - users can click to proceed)
document.addEventListener('DOMContentLoaded', () => {
  const introScreen = document.getElementById('intro-screen');
  const mainPage = document.getElementById('main-page');

  // Optional: allow manual fade by clicking
  introScreen?.addEventListener('click', fadeToMainPage);

  function fadeToMainPage() {
    // Fade out intro
    introScreen.classList.add('fade-out');
    
    // Navigate to map after fade completes
    setTimeout(() => {
      window.location.href = 'map.html';
    }, 1000); // Wait for 1s fade transition
  }
});

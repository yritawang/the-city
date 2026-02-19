// Intro screen auto-fade after 5 seconds
document.addEventListener('DOMContentLoaded', () => {
  const introScreen = document.getElementById('intro-screen');
  const mainPage = document.getElementById('main-page');

  // Auto-fade after 5 seconds
  setTimeout(() => {
    fadeToMainPage();
  }, 5000);

  function fadeToMainPage() {
    // Fade out intro
    introScreen.classList.add('fade-out');
    
    // Navigate to map after fade completes
    setTimeout(() => {
      window.location.href = 'map.html';
    }, 1000); // Wait for 1s fade transition
  }
});

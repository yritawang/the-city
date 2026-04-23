// intro.js
// intro screen — fades out on click then navigates to the map

document.addEventListener('DOMContentLoaded', () => {
  const introScreen = document.getElementById('intro-screen');

  introScreen?.addEventListener('click', fadeToMainPage);

  function fadeToMainPage() {
    introScreen.classList.add('fade-out');
    setTimeout(() => {
      if (typeof window.navigateWithLoader === 'function') {
        window.navigateWithLoader('map.html');
      } else {
        window.location.href = 'map.html';
      }
    }, 1000);
  }
});
// District state management
const DISTRICTS = ['garden', 'cornerstore', 'shrine', 'tower', 'plaza'];

// City name management
function initCityName() {
  const savedName = localStorage.getItem('cityName') || 'Somewhere I Belong';
  const titleElement = document.querySelector('.header-title h1');
  titleElement.textContent = savedName;
  
  // Add click handler to title
  titleElement.addEventListener('click', openCityNameOverlay);
}

function openCityNameOverlay() {
  const overlay = document.getElementById('city-name-overlay');
  const input = document.getElementById('city-name-input');
  const currentName = localStorage.getItem('cityName') || 'Somewhere I Belong';
  
  input.value = currentName;
  overlay.classList.add('active');
  input.focus();
  input.select();
}

function closeCityNameOverlay() {
  const overlay = document.getElementById('city-name-overlay');
  overlay.classList.remove('active');
}

function saveCityName() {
  const input = document.getElementById('city-name-input');
  const newName = input.value.trim() || 'Somewhere I Belong';
  
  localStorage.setItem('cityName', newName);
  document.querySelector('.header-title h1').textContent = newName;
  closeCityNameOverlay();
}

// Initialize districts from localStorage or set all to locked
function initDistricts() {
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  
  DISTRICTS.forEach(districtName => {
    const district = document.getElementById(districtName);
    const isUnlocked = districtStates[districtName] === 'unlocked';
    
    if (isUnlocked) {
      district.classList.add('unlocked');
      district.classList.remove('locked');
      updateDistrictImage(district, 'unlocked');
    } else {
      district.classList.add('locked');
      updateDistrictImage(district, 'locked');
    }
    
    // Add click handler
    district.addEventListener('click', () => handleDistrictClick(districtName));
    
    // Add hover handlers for image swapping
    district.addEventListener('mouseenter', () => handleDistrictHover(district, isUnlocked));
    district.addEventListener('mouseleave', () => handleDistrictLeave(district, isUnlocked));
  });
}

// Update district image source
function updateDistrictImage(district, state) {
  const districtName = district.dataset.district;
  const img = district.querySelector('.district-image');
  
  // If unlocked, check for saved skin
  if (state === 'unlocked') {
    const savedSkin = localStorage.getItem(`${districtName}-skin`);
    if (savedSkin) {
      const skinIndex = parseInt(savedSkin);
      if (skinIndex === 1) {
        img.src = `assets/districts/${districtName}-skin2.png`;
        return;
      } else if (skinIndex === 2) {
        img.src = `assets/districts/${districtName}-skin3.png`;
        return;
      }
    }
  }
  
  // Default behavior
  img.src = `assets/districts/${districtName}-${state}.png`;
}

// Handle hover - swap to hover image if locked
function handleDistrictHover(district, isUnlocked) {
  if (!isUnlocked) {
    updateDistrictImage(district, 'hover');
  }
}

// Handle mouse leave - swap back to locked if locked
function handleDistrictLeave(district, isUnlocked) {
  if (!isUnlocked) {
    updateDistrictImage(district, 'locked');
  }
}

// Handle district click - navigate to district flow
function handleDistrictClick(districtName) {
  localStorage.setItem('currentDistrict', districtName);
  
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  
  if (districtStates[districtName] === 'unlocked') {
    window.location.href = `districts/${districtName}-customize.html`;
  } else {
    window.location.href = `districts/${districtName}.html`;
  }
}

// Display unlocked district names
function displayDistrictNames() {
  DISTRICTS.forEach(districtName => {
    const district = document.getElementById(districtName);
    const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
    
    if (districtStates[districtName] === 'unlocked') {
      const savedName = localStorage.getItem(`${districtName}-name`);
      
      if (savedName) {
        const label = district.querySelector('.district-label');
        if (!label.querySelector('.district-custom-name')) {
          const span = document.createElement('span');
          span.className = 'district-custom-name';
          span.textContent = savedName;
          label.appendChild(span);
        }
      }
    }
  });
}

// Button handlers
document.getElementById('guide-btn').addEventListener('click', () => {
  alert('Guide feature coming soon!');
});

document.getElementById('share-btn').addEventListener('click', () => {
  alert('Share feature coming soon!');
});

// City name overlay handlers
document.getElementById('cancel-btn').addEventListener('click', closeCityNameOverlay);
document.getElementById('save-name-btn').addEventListener('click', saveCityName);

// Enter key saves, Escape key cancels
document.getElementById('city-name-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveCityName();
  if (e.key === 'Escape') closeCityNameOverlay();
});

// Click outside overlay to close
document.getElementById('city-name-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'city-name-overlay') closeCityNameOverlay();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initCityName();
  initDistricts();
  displayDistrictNames();
});
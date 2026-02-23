// Tower questions data
const TOWER_QUESTIONS = [
  {
    main: "What place comes to mind?",
    sub: ""
  },
  {
    main: "What was your relationship with solitude in this space?",
    sub: ""
  },
  {
    main: "What perspective did being alone give you?",
    sub: ""
  },
  {
    main: "When you think of this place, what do you remember?",
    sub: "A smell, a sound, a feeling, a moment."
  },
  {
    main: "If this place were to fade from memory completely, what would be lost?",
    sub: ""
  },
  {
    main: "Finally, please give your tower a name.",
    sub: ""
  }
];

const CARD_COLORS = ['#4070A7', '#104A87', '#003A77', '#002A57', '#001A37'];

let currentQuestion = 0;
let answers = {};

// Tower-specific logic
document.addEventListener('DOMContentLoaded', () => {
  const readyBtn = document.getElementById('ready-btn');
  const backBtn = document.getElementById('back-btn');
  const questionsBackBtn = document.getElementById('questions-back-btn');
  
  // Load saved answers if returning
  const savedAnswers = localStorage.getItem('tower-answers');
  if (savedAnswers) {
    answers = JSON.parse(savedAnswers);
  }

  // Show Ready button after 5 seconds
  setTimeout(() => {
    readyBtn.classList.remove('hidden');
  }, 8800);

  // Back button handlers
  if (backBtn) backBtn.addEventListener('click', goBackToCity);
  if (questionsBackBtn) questionsBackBtn.addEventListener('click', goBackToCity);

  // Ready button - start questions
  if (readyBtn) readyBtn.addEventListener('click', startQuestions);

  // Save answer on input change
  const questionInput = document.getElementById('question-input');
  if (questionInput) {
    questionInput.addEventListener('input', saveCurrentAnswer);
    
    // Keyboard navigation
    questionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        nextQuestion();
      } else if (e.key === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        prevQuestion();
      } else if (e.key === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        nextQuestion();
      }
    });
  }
});

function goBackToCity() {
  saveProgress();
  window.location.href = '../map.html';
}

function startQuestions() {
  document.getElementById('tower-intro').classList.add('hidden');
  document.getElementById('tower-questions').classList.remove('hidden');
  currentQuestion = 0;
  renderQuestion();
  
  // Attach button listeners
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) prevBtn.onclick = prevQuestion;
  if (nextBtn) nextBtn.onclick = nextQuestion;
}

function renderQuestion() {
  const question = TOWER_QUESTIONS[currentQuestion];
  const questionCard = document.querySelector('.question-card');
  
  document.getElementById('question-main').textContent = question.main;
  document.getElementById('question-sub').textContent = question.sub;
  
  const input = document.getElementById('question-input');
  input.value = answers[currentQuestion] || '';
  
  // Special styling for question 6 (naming)
  if (currentQuestion === 5) {
    questionCard.classList.add('naming');
  } else {
    questionCard.classList.remove('naming');
  }
  
  document.getElementById('question-progress').textContent = `${currentQuestion + 1}/6`;
  document.getElementById('prev-btn').disabled = currentQuestion === 0;
  
  const nextBtn = document.getElementById('next-btn');
  nextBtn.textContent = currentQuestion === 5 ? 'Finish' : 'Next';
  
  const progressPercent = ((currentQuestion + 1) / 6) * 100;
  document.getElementById('progress-bar').style.height = `${progressPercent}%`;
  
  renderStackedCards();
  input.focus();
}

function renderStackedCards() {
  const container = document.getElementById('stacked-cards');
  container.innerHTML = '';
  
  for (let i = 0; i < currentQuestion; i++) {
    const card = document.createElement('div');
    card.className = 'stacked-card';
    card.style.backgroundColor = CARD_COLORS[i];
    
    const verticalOffset = i * 20;
    card.style.bottom = `${verticalOffset}px`;
    card.style.zIndex = i;
    
    card.onclick = () => {
      currentQuestion = i;
      renderQuestion();
    };
    
    container.appendChild(card);
  }
}

function saveCurrentAnswer() {
  const input = document.getElementById('question-input');
  answers[currentQuestion] = input.value;
  saveProgress();
}

function saveProgress() {
  localStorage.setItem('tower-answers', JSON.stringify(answers));
}

function prevQuestion() {
  if (currentQuestion > 0) {
    saveCurrentAnswer();
    currentQuestion--;
    renderQuestion();
  }
}

function nextQuestion() {
  saveCurrentAnswer();
  
  if (currentQuestion === 5) {
    completeTower();
  } else {
    currentQuestion++;
    renderQuestion();
  }
}

function completeTower() {
  saveCurrentAnswer();
  
  // Mark tower as unlocked
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  districtStates.tower = 'unlocked';
  localStorage.setItem('districtStates', JSON.stringify(districtStates));
  
  // Save the tower name
  const towerName = answers[5] || 'The Tower';
  localStorage.setItem('tower-name', towerName);
  
  showCompletionScreen();
}

function showCompletionScreen() {
  const questionsDiv = document.getElementById('tower-questions');
  const completionDiv = document.getElementById('tower-completion');

  if (questionsDiv) {
    questionsDiv.classList.add('hidden');
    questionsDiv.style.display = 'none';
  }

  if (completionDiv) {
    completionDiv.classList.remove('hidden');
    completionDiv.style.display = 'flex';
  }

  // Save session snapshot
  const session = {
    date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
    timestamp: Date.now(),
    answers: { ...answers }
  };
  const savedSessions = JSON.parse(localStorage.getItem('tower-sessions') || '[]');
  savedSessions.push(session);
  localStorage.setItem('tower-sessions', JSON.stringify(savedSessions));
  localStorage.setItem('tower-date', session.date);

  const placeName = answers[0] || 'this place';
  const placeNameEl = document.getElementById('completion-place-name');
  if (placeNameEl) placeNameEl.textContent = placeName;

  document.getElementById('complete-districts-btn').onclick = () => {
    window.location.href = '../map.html';
  };

  document.getElementById('customize-btn').onclick = () => {
    window.location.href = 'tower-customize.html';
  };
}
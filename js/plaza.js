// Plaza questions data
const PLAZA_QUESTIONS = [
  {
    main: "What place comes to mind?",
    sub: ""
  },
  {
    main: "Who else was in this place? How did you connect with them?",
    sub: ""
  },
  {
    main: "What brought you together in this place?",
    sub: "A shared experience, a common objective."
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
    main: "Finally, please give your plaza a name.",
    sub: ""
  }
];

const CARD_COLORS = ['#816993', '#513963', '#412953', '#311943', '#210933'];

let currentQuestion = 0;
let answers = {};

// Plaza-specific logic
document.addEventListener('DOMContentLoaded', () => {
  const readyBtn = document.getElementById('ready-btn');
  const backBtn = document.getElementById('back-btn');
  const questionsBackBtn = document.getElementById('questions-back-btn');
  
  // Load saved answers if returning
  const savedAnswers = localStorage.getItem('plaza-answers');
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
  document.getElementById('plaza-intro').classList.add('hidden');
  document.getElementById('plaza-questions').classList.remove('hidden');
  currentQuestion = 0;
  renderQuestion();
  
  // Attach button listeners
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) prevBtn.onclick = prevQuestion;
  if (nextBtn) nextBtn.onclick = nextQuestion;
}

function renderQuestion() {
  const question = PLAZA_QUESTIONS[currentQuestion];
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
  localStorage.setItem('plaza-answers', JSON.stringify(answers));
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
    completePlaza();
  } else {
    currentQuestion++;
    renderQuestion();
  }
}

function completePlaza() {
  saveCurrentAnswer();
  
  // Mark plaza as unlocked
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  districtStates.plaza = 'unlocked';
  localStorage.setItem('districtStates', JSON.stringify(districtStates));
  
  // Save the plaza name
  const plazaName = answers[5] || 'The Plaza';
  localStorage.setItem('plaza-name', plazaName);
  
  showCompletionScreen();
}

function showCompletionScreen() {
  const questionsDiv = document.getElementById('plaza-questions');
  const completionDiv = document.getElementById('plaza-completion');

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
  const savedSessions = JSON.parse(localStorage.getItem('plaza-sessions') || '[]');
  savedSessions.push(session);
  localStorage.setItem('plaza-sessions', JSON.stringify(savedSessions));
  localStorage.setItem('plaza-date', session.date);

  const placeName = answers[0] || 'this place';
  const placeNameEl = document.getElementById('completion-place-name');
  if (placeNameEl) placeNameEl.textContent = placeName;

  document.getElementById('complete-districts-btn').onclick = () => {
    window.location.href = '../map.html';
  };

  document.getElementById('customize-btn').onclick = () => {
    window.location.href = 'plaza-customize.html';
  };
}
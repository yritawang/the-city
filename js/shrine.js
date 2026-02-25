console.log('shrine.js loaded, version: NEW');

const SHRINE_QUESTIONS = [
  {
    main: "What place comes to mind?",
    sub: ""
  },
  {
    main: "What did this place hold that was precious to you?",
  },
  {
    main: "How do you return to this place?",
    sub: "Physically or in memory?"
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
    main: "Finally, please give your shrine a name.",
    sub: ""
  }
];

const CARD_COLORS = ['#E0D0C5', '#D4B49D', '#BE9A80', '#AC8467', '#9F6F4C'];

let currentQuestion = 0;
let answers = {};

document.addEventListener('DOMContentLoaded', () => {
  const readyBtn = document.getElementById('ready-btn');
  const backBtn = document.getElementById('back-btn');
  const questionsBackBtn = document.getElementById('questions-back-btn');

  const savedAnswers = localStorage.getItem('shrine-answers');
  if (savedAnswers) {
    answers = JSON.parse(savedAnswers);
  }

  setTimeout(() => {
    readyBtn.classList.remove('hidden');
  }, 8800);

  if (backBtn) backBtn.addEventListener('click', goBackToCity);
  if (questionsBackBtn) questionsBackBtn.addEventListener('click', goBackToCity);
  if (readyBtn) {
    readyBtn.addEventListener('click', () => {
      console.log('Ready clicked, calling startQuestions');
      startQuestions();
    });
  }

  // Input save only — district.js handles Enter key
  const questionInput = document.getElementById('question-input');
  if (questionInput) {
    questionInput.addEventListener('input', saveCurrentAnswer);
  }
});

function goBackToCity() {
  saveProgress();
  window.location.href = '../map.html';
}

function startQuestions() {
  try { unlockAchievement('began-shrine'); } catch(e) {}

  const intro = document.getElementById('shrine-intro');
  const questions = document.getElementById('shrine-questions');

  if (intro) { intro.classList.add('hidden'); intro.style.display = 'none'; }
  if (questions) { questions.classList.remove('hidden'); questions.style.display = 'flex'; }

  currentQuestion = 0;
  renderQuestion();

  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (prevBtn) prevBtn.onclick = prevQuestion;
  if (nextBtn) nextBtn.onclick = nextQuestion;
}

function renderQuestion() {
  const question = SHRINE_QUESTIONS[currentQuestion];
  const questionCard = document.querySelector('.question-card');
  
  document.getElementById('question-main').textContent = question.main;
  document.getElementById('question-sub').textContent = question.sub;
  
  const input = document.getElementById('question-input');
  input.value = answers[currentQuestion] || '';
  
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
  localStorage.setItem('shrine-answers', JSON.stringify(answers));
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
    completeShrine();
  } else {
    currentQuestion++;
    renderQuestion();
  }
}

function completeShrine() {
  unlockAchievement('completed-shrine');
  saveCurrentAnswer();
  
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  districtStates.shrine = 'unlocked';
  localStorage.setItem('districtStates', JSON.stringify(districtStates));

  const shrineName = answers[5] || 'The Shrine';
  localStorage.setItem('shrine-name', shrineName);

  showCompletionScreen();
}

function showCompletionScreen() {
  const questionsDiv = document.getElementById('shrine-questions');
  const completionDiv = document.getElementById('shrine-completion');

  if (questionsDiv) {
    questionsDiv.classList.add('hidden');
    questionsDiv.style.display = 'none';
  }

  if (completionDiv) {
    completionDiv.classList.remove('hidden');
    completionDiv.style.display = 'flex';
  }

  const session = {
    date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    timestamp: Date.now(),
    answers: { ...answers }
  };
  const savedSessions = JSON.parse(localStorage.getItem('shrine-sessions') || '[]');
  savedSessions.push(session);
  localStorage.setItem('shrine-sessions', JSON.stringify(savedSessions));
  localStorage.setItem('shrine-date', session.date);

  const placeName = answers[0] || 'this place';
  const placeNameEl = document.getElementById('completion-place-name');
  if (placeNameEl) placeNameEl.textContent = placeName;

  document.getElementById('complete-districts-btn').onclick = () => {
    window.location.href = '../map.html';
  };

  document.getElementById('customize-btn').onclick = () => {
    window.location.href = 'shrine-customize.html';
  };
}
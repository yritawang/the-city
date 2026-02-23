// Shrine questions data
const SHRINE_QUESTIONS = [
  {
    main: "What place comes to mind?",
    sub: ""
  },
  {
    main: "What did this place hold that was precious to you?",
    sub: ""
  },
  {
    main: "How do you return to this place?",
    sub: "Physically or in memory?"
  },
  {
    main: "When you think of this place, what do you remember?",
    sub: "A smell, a sound, a feeling, a moment?"
  },
  {
    main: "If this place were to fade from memory completely, what would be lost?",
    sub: ""
  },
  {
    main: "Finally, give your shrine a name.",
    sub: ""
  }
];

const CARD_COLORS = ['#E0D0C5', '#D4B49D', '#BE9A80', '#AC8467', '#9F6F4C'];

let currentQuestion = 0;
let answers = {};

// Shrine-specific logic
document.addEventListener('DOMContentLoaded', () => {
  const readyBtn = document.getElementById('ready-btn');
  const backBtn = document.getElementById('back-btn');
  const questionsBackBtn = document.getElementById('questions-back-btn');
  
  // Load saved answers if returning
  const savedAnswers = localStorage.getItem('shrine-answers');
  if (savedAnswers) {
    answers = JSON.parse(savedAnswers);
  }

  // Show Ready button after 5 seconds (after content becomes visible)
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
  // Save progress before leaving
  saveProgress();
  window.location.href = '../map.html';
}

function startQuestions() {
  document.getElementById('shrine-intro').classList.add('hidden');
  document.getElementById('shrine-questions').classList.remove('hidden');
  currentQuestion = 0;
  renderQuestion();
  
  // Attach button listeners here, after questions are visible
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) {
    prevBtn.onclick = prevQuestion;
  }
  
  if (nextBtn) {
    nextBtn.onclick = nextQuestion;
  }
}

function renderQuestion() {
  const question = SHRINE_QUESTIONS[currentQuestion];
  const questionCard = document.querySelector('.question-card');
  
  // Update question text
  document.getElementById('question-main').textContent = question.main;
  document.getElementById('question-sub').textContent = question.sub;
  
  // Update input value
  const input = document.getElementById('question-input');
  input.value = answers[currentQuestion] || '';
  
  // Special styling for question 6 (naming)
  if (currentQuestion === 5) {
    questionCard.classList.add('naming');
  } else {
    questionCard.classList.remove('naming');
  }
  
  // Update progress
  document.getElementById('question-progress').textContent = `${currentQuestion + 1}/6`;
  
  // Update button states
  document.getElementById('prev-btn').disabled = currentQuestion === 0;
  const nextBtn = document.getElementById('next-btn');
  nextBtn.textContent = currentQuestion === 5 ? 'Finish' : 'Next';
  
  // Update progress bar
  const progressPercent = ((currentQuestion + 1) / 6) * 100;
  document.getElementById('progress-bar').style.height = `${progressPercent}%`;
  
  // Render stacked cards
  renderStackedCards();
  
  // Focus input
  input.focus();
}

function renderStackedCards() {
  const container = document.getElementById('stacked-cards');
  container.innerHTML = '';
  
  // Show cards for all completed questions before current one
  for (let i = 0; i < currentQuestion; i++) {
    const card = document.createElement('div');
    card.className = 'stacked-card';
    card.style.backgroundColor = CARD_COLORS[i];
    
    // Stack cards with offset
    const offset = (currentQuestion - i - 1) * 15;
    card.style.bottom = `${offset}px`;
    card.style.zIndex = i;
    
    // Click to go back to that question
    card.addEventListener('click', () => {
      currentQuestion = i;
      renderQuestion();
    });
    
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
    // Finish - complete the shrine
    completeShrine();
  } else {
    currentQuestion++;
    renderQuestion();
  }
}

function completeShrine() {
  saveCurrentAnswer();
  
  // Mark shrine as unlocked
  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  districtStates.shrine = 'unlocked';
  localStorage.setItem('districtStates', JSON.stringify(districtStates));
  
  // Save the shrine name
  const shrineName = answers[5] || 'The Shrine';
  localStorage.setItem('shrine-name', shrineName);
  
  // Show completion screen
  showCompletionScreen();
}

function showCompletionScreen() {
  // Hide questions, show completion
  document.getElementById('shrine-questions').classList.add('hidden');
  document.getElementById('shrine-completion').classList.remove('hidden');
  
  // Display user's answer from question 1 (the place they named)
  const placeName = answers[0] || 'this place';
  document.getElementById('completion-place-name').textContent = placeName;
  
  // Button handlers
  document.getElementById('complete-districts-btn').addEventListener('click', () => {
    window.location.href = '../map.html';
  });
  
  document.getElementById('customize-btn').addEventListener('click', () => {
    // TODO: Allow editing - for now, disabled
    alert('Customization feature coming soon!');
  });
}
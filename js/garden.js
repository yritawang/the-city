// garden.js

window.CURRENT_DISTRICT = 'garden';

const GARDEN_QUESTIONS = [
  { main: "What place comes to mind?",                                        sub: "" },
  { main: "What were you becoming in this place?",                            sub: "" },
  { main: "How did the growth happen? What did it feel like?",                sub: "" },
  { main: "When you think of this place, what do you remember?",               sub: "A smell, a sound, a feeling, a moment." },
  { main: "If this place were to fade from memory completely, what would be lost?", sub: "" },
  { main: "Finally, please give your garden a name.",                         sub: "" },
];

const CARD_COLORS = ['#9A9435', '#7A7415', '#5A5405', '#4A4404', '#3A3403'];

let currentQuestion = 0;
let answers = {};

document.addEventListener('DOMContentLoaded', () => {
  const readyBtn         = document.getElementById('ready-btn');
  const backBtn          = document.getElementById('back-btn');
  const questionsBackBtn = document.getElementById('questions-back-btn');

  const savedAnswers = localStorage.getItem('garden-answers');
  if (savedAnswers) answers = JSON.parse(savedAnswers);

  // skip intro if returning to relog an existing location
  const prefill = localStorage.getItem('garden-relog-prefill');
  if (prefill) {
    answers[0] = prefill;
    localStorage.removeItem('garden-relog-prefill');
    currentQuestion = 1;
    setTimeout(() => startQuestions(), 100);
  }

  setTimeout(() => { readyBtn?.classList.remove('hidden'); }, 8800);

  if (backBtn)          backBtn.addEventListener('click', goBackToCity);
  if (questionsBackBtn) questionsBackBtn.addEventListener('click', goBackToCity);
  if (readyBtn)         readyBtn.addEventListener('click', startQuestions);

  const questionInput = document.getElementById('question-input');
  if (questionInput) questionInput.addEventListener('input', saveCurrentAnswer);
});


function goBackToCity() {
  saveProgress();
  window.location.href = '../map.html';
}

function startQuestions() {
  try { unlockAchievement('began-garden'); } catch(e) {}

  const intro     = document.getElementById('garden-intro');
  const questions = document.getElementById('garden-questions');

  if (intro)     { intro.classList.add('hidden');       intro.style.display     = 'none'; }
  if (questions) { questions.classList.remove('hidden'); questions.style.display = 'flex'; }

  if (currentQuestion !== 1) currentQuestion = 0;
  renderQuestion();

  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (prevBtn) prevBtn.onclick = prevQuestion;
  if (nextBtn) nextBtn.onclick = nextQuestion;
}

function renderQuestion() {
  const question    = GARDEN_QUESTIONS[currentQuestion];
  const questionCard = document.querySelector('.question-card');

  document.getElementById('question-main').textContent = question.main;
  document.getElementById('question-sub').textContent  = question.sub;

  const input = document.getElementById('question-input');
  input.value = answers[currentQuestion] || '';

  if (currentQuestion === 5) questionCard.classList.add('naming');
  else                       questionCard.classList.remove('naming');

  document.getElementById('question-progress').textContent = `${currentQuestion + 1}/6`;
  document.getElementById('prev-btn').disabled = currentQuestion === 0;
  document.getElementById('next-btn').textContent = currentQuestion === 5 ? 'Finish' : 'Next';

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
    card.style.bottom  = `${i * 20}px`;
    card.style.zIndex  = i;
    card.onclick = () => { currentQuestion = i; renderQuestion(); };
    container.appendChild(card);
  }
}

function saveCurrentAnswer() {
  const input = document.getElementById('question-input');
  answers[currentQuestion] = input.value;
  saveProgress();
}

function saveProgress() {
  localStorage.setItem('garden-answers', JSON.stringify(answers));
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
  if (currentQuestion === 5) completeGarden();
  else { currentQuestion++; renderQuestion(); }
}

function completeGarden() {
  unlockAchievement('completed-garden');
  saveCurrentAnswer();

  const districtStates = JSON.parse(localStorage.getItem('districtStates')) || {};
  districtStates.garden = 'unlocked';
  localStorage.setItem('districtStates', JSON.stringify(districtStates));

  const gardenName = answers[5] || 'The Garden';
  localStorage.setItem('garden-name', gardenName);

  showCompletionScreen();
}

function showCompletionScreen() {
  const questionsDiv  = document.getElementById('garden-questions');
  const completionDiv = document.getElementById('garden-completion');

  if (questionsDiv)  { questionsDiv.classList.add('hidden');      questionsDiv.style.display  = 'none'; }
  if (completionDiv) { completionDiv.classList.remove('hidden');  completionDiv.style.display = 'flex'; }

  const session = {
    date:      new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    timestamp: Date.now(),
    answers:   { ...answers },
  };
  const savedSessions = JSON.parse(localStorage.getItem('garden-sessions') || '[]');
  savedSessions.push(session);
  localStorage.setItem('garden-sessions', JSON.stringify(savedSessions));
  localStorage.setItem('garden-date', session.date);

  const placeNameEl = document.getElementById('completion-place-name');
  if (placeNameEl) placeNameEl.textContent = answers[0] || 'this place';

  // done button is handled by district.js via window.CURRENT_DISTRICT
}
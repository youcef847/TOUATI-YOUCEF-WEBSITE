// ==== DOM ELEMENTS ====
const introScreen = document.getElementById("intro-screen");
const closeIntroBtn = document.getElementById("close-intro");
const quizContainer = document.getElementById("quiz-container");
const questionText = document.getElementById("question-text");
const answersContainer = document.getElementById("answers-container");
const scoreDisplay = document.getElementById("score-display");
const levelDisplay = document.getElementById("level-display");
const muteBtn = document.getElementById("mute-btn");
const timerDisplay = document.getElementById("timer");

// ==== GLOBAL VARIABLES ====
let currentLevel = 1;
let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let muted = false;
let timer = null;
let timeLeft = 7;

// ==== SOUND SETUP ====
const sounds = {
  correct: new Audio("assets/sounds/correct.mp3"),
  wrong: new Audio("assets/sounds/wrong.mp3"),
  intro: new Audio("assets/sounds/intro.mp3"),
  levelComplete: new Audio("assets/sounds/level-complete.mp3"),
  hundredComplete: new Audio("assets/sounds/hundred-complete.mp3"),
  goodEnding: new Audio("assets/sounds/good-ending.mp3")
};
function playSound(name) {
  if (!muted && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

// ==== EVENT LISTENERS ====
closeIntroBtn.addEventListener("click", () => {
  introScreen.classList.add("hidden");
  quizContainer.classList.remove("hidden");
  playSound("intro");
  loadLevel(currentLevel);
});

muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.textContent = muted ? "🔇" : "🔊";
});

// ==== QUIZ FUNCTIONS ====
function loadLevel(level) {
  fetch(`data/level${level}.json`)
    .then((res) => res.json())
    .then((data) => {
      questions = shuffleArray(data.questions);
      currentQuestionIndex = 0;
      showQuestion();
    });
}

function showQuestion() {
  const q = questions[currentQuestionIndex];
  questionText.textContent = q.question;
  answersContainer.innerHTML = "";

  q.answers.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.classList.add("answer-btn");
    btn.addEventListener("click", () => checkAnswer(i));
    answersContainer.appendChild(btn);
  });

  const totalQuestionNum = (currentLevel - 1) * 10 + currentQuestionIndex + 1;
  if (totalQuestionNum % 10 === 0) {
    startTimer(() => handleWrongAnswer());
  } else {
    stopTimer();
  }

  levelDisplay.textContent = `المستوى ${currentLevel}`;
  scoreDisplay.textContent = `النتيجة: ${score}`;
}

function checkAnswer(selectedIndex) {
  stopTimer();
  const q = questions[currentQuestionIndex];
  if (selectedIndex === q.correct) {
    score++;
    playSound("correct");
  } else {
    playSound("wrong");
  }

  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    handleLevelComplete();
  }
}

function handleWrongAnswer() {
  checkAnswer(-1);
}

function handleLevelComplete() {
  playSound("levelComplete");

  if (currentLevel % 10 === 0) {
    playSound("hundredComplete");
    alert(`🎉 تهانينا! أكملت ${currentLevel * 10} سؤالاً!`);
  }

  currentLevel++;
  saveProgress();
  loadLevel(currentLevel);
}

// ==== TIMER ====
function startTimer(callback) {
  timeLeft = 7;
  timerDisplay.textContent = `الوقت المتبقي: ${timeLeft} ثواني`;
  timerDisplay.style.display = "block";

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `الوقت المتبقي: ${timeLeft} ثواني`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      timerDisplay.style.display = "none";
      callback();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  timerDisplay.style.display = "none";
}

// ==== UTILS ====
function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
function saveProgress() {
  localStorage.setItem("quizScore", score);
  localStorage.setItem("quizLevel", currentLevel);
}
function loadProgress() {
  score = parseInt(localStorage.getItem("quizScore")) || 0;
  currentLevel = parseInt(localStorage.getItem("quizLevel")) || 1;
}

// ==== INITIALIZATION ====
loadProgress();
introScreen.classList.remove("hidden");
quizContainer.style.display = "none";

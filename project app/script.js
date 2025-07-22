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
const tenRightPopup = document.getElementById("ten-right-popup");

// ==== GLOBAL VARIABLES ====
let currentLevel = 1;
let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let muted = false;
let timer = null;
let timeLeft = 9;

// ==== SOUND SETUP ====
const sounds = {
  correct: new Audio("assets/sounds/correct.mp3"),
  wrong: new Audio("assets/sounds/wrong.mp3"),
  intro: new Audio("assets/sounds/intro.mp3"),
  hundredComplete: new Audio("assets/sounds/hundred-complete.mp3"),
  goodEnding: new Audio("assets/sounds/good-ending.mp3"),
  tenRight: new Audio("assets/sounds/ten-right.mp3")
};
function playSound(name) {
  if (!muted && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

// ==== EVENT LISTENERS ====
closeIntroBtn.addEventListener("click", () => {
  console.log("Intro closed, starting quiz...");
  introScreen.classList.add("hidden");
  quizContainer.classList.remove("hidden");
  playSound("intro");
  loadLevel(currentLevel);
});

muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.textContent = muted ? "🔇" : "🔊";
});
const restartBtn = document.getElementById("restart-btn");

restartBtn.addEventListener("click", () => {
  if (confirm("هل أنت متأكد أنك تريد إعادة اللعبة؟")) {
    currentLevel = 1;
    score = 0;
    saveProgress();
    loadLevel(currentLevel);
  }
});

// ==== QUIZ FUNCTIONS ====
function loadLevel(level) {
  console.log("🔁 Loading level:", level); // 👈 Shows when level starts loading

  fetch(`data/level${level}.json`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`❌ Failed to fetch JSON: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("✅ JSON Loaded:", data); // 👈 Shows parsed JSON
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("❌ JSON format error: 'questions' key missing or not array");
      }

      questions = shuffleArray(data.questions);
      currentQuestionIndex = 0;
      showQuestion();
    })
    .catch((err) => {
      console.error("⚠️ Error loading level:", err);
    });
}

function showQuestion() {
  quizContainer.classList.remove("hidden"); // ✅ Make sure it's visible
  const q = questions[currentQuestionIndex];
  console.log("📣 Showing question:", q); // ← Add this line

  if (!q || !q.question || !Array.isArray(q.answers ?? q.choices)) {
    console.error("❌ Invalid question object:", q);
    return;
  }

  questionText.textContent = q.question;
  answersContainer.innerHTML = "";

  (q.answers || q.choices).forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.classList.add("answer-btn");
    btn.addEventListener("click", () => checkAnswer(i));
    answersContainer.appendChild(btn);
  });

  const totalQuestionNum = (currentLevel - 1) * 10 + currentQuestionIndex + 1;
  if (totalQuestionNum % 10 === 0) {
    startTimer(() => {
      handleWrongAnswer();
    });
  } else {
    stopTimer();
  }

  levelDisplay.textContent = `المستوى ${currentLevel}`;
  scoreDisplay.textContent = `النتيجة: ${score}`;
}

function checkAnswer(selectedIndex) {
  stopTimer();
  const q = questions[currentQuestionIndex];
  // ✅ Prevent crash if question doesn't exist (double click, etc.)
  if (!q) {
    console.warn("⚠️ No question at current index. Ignoring click.");
    return;
  }
  if (selectedIndex === q.correct) {
    score++;

    if (score % 10 === 0) {
      playSound("tenRight");
      showTenRightPopup();
    }

    const totalQuestionsAnswered = (currentLevel - 1) * 100 + currentQuestionIndex + 1;
    if (totalQuestionsAnswered % 100 === 0) {
      playSound("hundredComplete");
    }

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
  const totalQuestionsAnswered = (currentLevel - 1) * 100 + currentQuestionIndex;

  // ✅ Check if it's time to show celebration (100 questions)
  if (totalQuestionsAnswered % 100 === 0) {
    console.log("🎉 100 questions completed!");
    playSound("hundredComplete");

    // Show celebration screen
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("celebration-screen").classList.remove("hidden");

    // Wait 10 seconds, then go to next level
    setTimeout(() => {
      document.getElementById("celebration-screen").classList.add("hidden");
      quizContainer.classList.remove("hidden");
      currentLevel++;
      saveProgress();
      loadLevel(currentLevel);
    }, 10000);

    return; // ✅ Prevents continuing to next block
  }

  // Regular level complete: just load next level
  currentLevel++;
  saveProgress();
  loadLevel(currentLevel);
}

function showTenRightPopup() {
  const popup = document.getElementById("ten-right-popup");
  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
  }, 1500);
}

// ==== TIMER ====
function startTimer(callback) {
  timeLeft = 9;
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

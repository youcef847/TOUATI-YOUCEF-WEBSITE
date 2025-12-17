const { App } = window.Capacitor.Plugins;
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

console.log("✅ Reached this point"); // for debugging


// ==== SOUND SETUP ====
const sounds = {
  correct: new Audio("assets/sounds/correct.mp3"),
  wrong: new Audio("assets/sounds/wrong.mp3"),
  intro: new Audio("assets/sounds/intro.mp3"),
  hundredComplete: new Audio("assets/sounds/hundred-complete.mp3"),
  goodEnding: new Audio("assets/sounds/good-ending.mp3"),
  badEnding: new Audio("assets/sounds/bad-ending.mp3"),
  hintUsed: new Audio("assets/sounds/hint-used.mp3"),
  tenRight: new Audio("assets/sounds/ten-right.mp3")
};
function playSound(name) {
  if (!muted && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}


async function showRewardedAd() {
  const { AdMob } = window.Capacitor.Plugins;

  try {
    // ✅ Step 1: Immediately highlight correct answer
    highlightCorrectAnswer();

    // ✅ Step 2: Play hint-used sound immediately
    playSound("hintUsed");

    // ✅ Step 3: Prepare and show rewarded ad
    await AdMob.prepareRewardVideoAd({
      adId: 'ca-app-pub-3940256099942544/5224354917', // TEST REWARDED ID
      isTesting: true,
    });

    await AdMob.showRewardVideoAd();

    // ❌ No need to do anything after ad — the user taps to move on

  } catch (error) {
    console.error("❌ Rewarded Ad error:", error);
  }
}






// === Interstitial Ad Logic ===
async function showInterstitialAd() {
  const { AdMob } = window.Capacitor.Plugins;
  try {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-3940256099942544/1033173712', // Test ID
      isTesting: true,
    });
    await AdMob.showInterstitial();
  } catch (error) {
    console.error("❌ Interstitial Ad error:", error);
  }
}


document.addEventListener('deviceready', async () => {
  const { AdMob } = window.Capacitor.Plugins;

  console.log("✅ Available AdMob methods:", Object.keys(AdMob));
  
  await AdMob.initialize({
    requestTrackingAuthorization: true,
    initializeForTesting: true, // Test mode
  });

  // Wait before showing to ensure it's visible
  setTimeout(() => {
    AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/6300978111', // TEST BANNER ID
      adSize: 'BANNER',
      position: 'TOP_CENTER',
      margin: 0,
      isTesting: true,
    });
	console.log("✅ Requested banner TOP_CENTER");
  }, 1000);

  console.log("✅ AdMob banner requested");
});

document.getElementById("hint-btn").addEventListener("click", () => {
  showRewardedAd();
});







// ==== EVENT LISTENERS ====
closeIntroBtn.addEventListener("click", () => {
  console.log("Intro closed, starting quiz...");
  introScreen.classList.add("hidden");
  quizContainer.classList.remove("hidden");
  playSound("intro");
  loadLevel(currentLevel);
});

const continueBtn = document.getElementById("continue-btn");

continueBtn.addEventListener("click", () => {
  loadProgress(); // Load saved score, level, and question
  introScreen.classList.add("hidden");
  quizContainer.classList.remove("hidden");
  playSound("intro");
  loadLevel(currentLevel); // Load the saved level
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

async function confirmExit() {
  const confirmed = confirm("هل أنت متأكد أنك تريد الخروج؟");
  if (confirmed) {
    saveProgress(); // ✅ Save progress before showing ad

    await showInterstitialAd(); // Show ad before exiting

    setTimeout(() => {
      if (navigator.app) {
        navigator.app.exitApp();
      } else if (navigator.device) {
        navigator.device.exitApp();
      } else {
        console.warn("Exit not supported on this platform.");
      }
    }, 3000); // Wait 3 seconds to allow ad to show
  }
}



// ==== QUIZ FUNCTIONS ====
function loadLevel(level) {
  console.log("🔁 Loading level:", level); // 👈 Shows when level starts loading

  fetch(`https://youcef847.github.io/TOUATI-YOUCEF-WEBSITE/project/data/level${level}.json`)
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

  // Show offline popup
  document.getElementById("offline-overlay").style.display = "flex";

  // Hide quiz container to prevent confusion
  quizContainer.classList.add("hidden");
});

}

function showQuestion() {
  document.getElementById("hint-btn").style.display = "inline-block";

  const answerButtons = document.querySelectorAll("#answers-container button");
  answerButtons.forEach(btn => {
    btn.style.backgroundColor = "";
    btn.style.opacity = "";
    btn.disabled = false;
  });

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
  
  document.getElementById("hint-btn").style.display = "none";

  // ✅ Prevent crash if question doesn't exist (double click, etc.)
  if (!q) {
    console.warn("⚠️ No question at current index. Ignoring click.");
    return;
  }

  if (selectedIndex === q.correct) {
    score++;

    // ✅ Show Interstitial after every 15 correct answers
    if (score % 15 === 0) {
      showInterstitialAd();
    }

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

function highlightCorrectAnswer() {
  const q = questions[currentQuestionIndex];
  if (!q) return;

  const answerButtons = document.querySelectorAll("#answers-container button");
  answerButtons.forEach((btn, index) => {
    if (index === q.correct) {
      btn.style.backgroundColor = "#c8f7c5"; // light green
    } else {
      btn.style.opacity = "0.5";
    }
    btn.disabled = false; // Let user click the right answer
  });
}



function handleWrongAnswer() {
  checkAnswer(-1);
}

function handleLevelComplete() {
  const totalQuestionsAnswered = (currentLevel - 1) * 100 + currentQuestionIndex;

  // ✅ Final level completed — show good/bad ending
  if (currentLevel === 10) {
    console.log("🎬 Game finished — evaluating final ending...");
    endGame();
    return;
  }

  // ✅ Every 100 questions — celebration time!
  if (totalQuestionsAnswered % 100 === 0) {
    console.log("🎉 100 questions completed!");
    playSound("hundredComplete");

    // Hide quiz, show celebration
    quizContainer.classList.add("hidden");
    document.getElementById("celebration-screen").classList.remove("hidden");

    // Wait 10 seconds then move to next level
    setTimeout(() => {
      console.log("⏭ Moving to next level...");
      document.getElementById("celebration-screen").classList.add("hidden");
      quizContainer.classList.remove("hidden");

      currentLevel++;
      saveProgress();
      loadLevel(currentLevel);
    }, 10000);

    return; // ⛔ Prevent any other loading now
  }

  // ✅ Otherwise: next level directly
  currentLevel++;
  saveProgress();
  loadLevel(currentLevel);
}

function endGame() {
  quizContainer.classList.add("hidden");

  const finalScreen = document.getElementById("final-screen");
  const goodEnding = document.getElementById("final-good-ending");
  const badEnding = document.getElementById("final-bad-ending");

  finalScreen.classList.remove("hidden");

  if (score >= 950) {
    goodEnding.classList.remove("hidden");
    badEnding.classList.add("hidden");
    playSound("goodEnding");
  } else {
    badEnding.classList.remove("hidden");
    goodEnding.classList.add("hidden");
    playSound("badEnding");
  }

  // Optional: clear saved progress to restart fresh next time
  localStorage.removeItem("quizScore");
  localStorage.removeItem("quizLevel");
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
  localStorage.setItem("quizQuestion", currentQuestionIndex);
}


function loadProgress() {
  score = parseInt(localStorage.getItem("quizScore")) || 0;
  currentLevel = parseInt(localStorage.getItem("quizLevel")) || 1;
  currentQuestionIndex = parseInt(localStorage.getItem("quizQuestion")) || 0;
}


function retryFetch() {
  document.getElementById("offline-overlay").style.display = "none";
  quizContainer.classList.remove("hidden");
  loadLevel(currentLevel);
}



// ==== ADMOB INITIALIZATION ====
// const { AdMob } = window.Capacitor.Plugins;

// AdMob.initialize({
// requestTrackingAuthorization: true, // iOS only
// testingDevices: [],
// initializeForTesting: false,
// }).then(() => {
//  // ==== SHOW ADMOB BANNER ====
//  AdMob.showBanner({
//   adId: "ca-app-pub-3976481632283218/4361976240", // ✅ Your real Ad Unit ID
//   adSize: 'BANNER',
//   position: 'TOP_CENTER',
//   margin: 0,
//   });
// });

// ==== INITIALIZATION ====
loadProgress();
introScreen.classList.remove("hidden");

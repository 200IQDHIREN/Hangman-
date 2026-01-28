const words = [
  { word: "javascript", category: "Programming" },
  { word: "browser", category: "Web" },
  { word: "hangman", category: "Game" },
  { word: "function", category: "Programming" },
  { word: "variable", category: "Programming" },
  { word: "internet", category: "Web" },
  { word: "element", category: "HTML" },
  { word: "stylesheet", category: "CSS" },
  { word: "component", category: "UI" },
  { word: "frontend", category: "Web" }
];

let maxLives = 6;
let currentWord = "";
let currentCategory = "";
let guessedLetters = [];
let wrongLetters = [];
let lives = maxLives;
let gameOver = false;

let score = Number(localStorage.getItem("hangmanScore")) || 0;
let streak = Number(localStorage.getItem("hangmanStreak")) || 0;

const wordEl = document.getElementById("word");
const livesEl = document.getElementById("lives");
const categoryEl = document.getElementById("category");
const wrongLettersEl = document.getElementById("wrongLetters");
const keyboardEl = document.getElementById("keyboard");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const resetBtn = document.getElementById("resetBtn");

const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");

const customWordInput = document.getElementById("customWord");
const customCategoryInput = document.getElementById("customCategory");
const addCustomBtn = document.getElementById("addCustomBtn");

const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");

const gameBlocker = document.getElementById("gameBlocker");
const themeToggle = document.getElementById("themeToggle");

let inputMode = false; // prevents gameplay while typing
let theme = localStorage.getItem("hangmanTheme") || "dark";

/* THEME LOGIC */
function applyTheme() {
  if (theme === "light") {
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
  }
}

themeToggle.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  localStorage.setItem("hangmanTheme", theme);
  applyTheme();
});

applyTheme();

/* FREEZE / UNFREEZE GAME WHILE TYPING */
function freezeGame() {
  inputMode = true;
  gameBlocker.style.display = "block";
  renderKeyboard(); // disable keys
}

function unfreezeGame() {
  inputMode = false;
  gameBlocker.style.display = "none";
  renderKeyboard();
}

customWordInput.addEventListener("focus", freezeGame);
customCategoryInput.addEventListener("focus", freezeGame);

customWordInput.addEventListener("blur", () => {
  if (!customCategoryInput.matches(":focus")) unfreezeGame();
});

customCategoryInput.addEventListener("blur", () => {
  if (!customWordInput.matches(":focus")) unfreezeGame();
});

/* SCOREBOARD */
function updateScoreboard() {
  scoreEl.textContent = score;
  streakEl.textContent = streak;

  localStorage.setItem("hangmanScore", score);
  localStorage.setItem("hangmanStreak", streak);
}

/* DIFFICULTY */
function getLivesFromDifficulty() {
  const diff = difficultySelect.value;
  if (diff === "easy") return 8;
  if (diff === "hard") return 4;
  if (diff === "extreme") return 3;
  return 6;
}

/* DRAW HANGMAN */
function drawHangman(livesLeft) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e5e7eb";

  ctx.beginPath();
  ctx.moveTo(10, 190);
  ctx.lineTo(190, 190);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(40, 190);
  ctx.lineTo(40, 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(40, 20);
  ctx.lineTo(130, 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(130, 20);
  ctx.lineTo(130, 50);
  ctx.stroke();

  const parts = [
    () => { ctx.beginPath(); ctx.arc(130, 65, 15, 0, Math.PI * 2); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(130, 80); ctx.lineTo(130, 130); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(130, 95); ctx.lineTo(110, 115); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(130, 95); ctx.lineTo(150, 115); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(130, 130); ctx.lineTo(115, 160); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(130, 130); ctx.lineTo(145, 160); ctx.stroke(); }
  ];

  const partsToDraw = maxLives - livesLeft;
  for (let i = 0; i < partsToDraw; i++) parts[i]();
}

/* WORD PICKING */
function pickRandomWord() {
  const selected = categorySelect.value;
  let pool = words;

  if (selected !== "all") {
    pool = words.filter(w => w.category === selected);
  }

  const item = pool[Math.floor(Math.random() * pool.length)];
  currentWord = item.word.toLowerCase();
  currentCategory = item.category;
}

/* RENDERING */
function renderWord() {
  wordEl.innerHTML = "";
  currentWord.split("").forEach(letter => {
    const span = document.createElement("span");
    span.className = "letter-slot";
    span.textContent = guessedLetters.includes(letter) ? letter.toUpperCase() : "";
    wordEl.appendChild(span);
  });
}

function renderKeyboard() {
  keyboardEl.innerHTML = "";
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");

  letters.forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "key";
    btn.textContent = letter.toUpperCase();
    btn.disabled = guessedLetters.includes(letter) || wrongLetters.includes(letter) || gameOver || inputMode;

    btn.style.transition = "0.15s";
    btn.addEventListener("mousedown", () => btn.style.transform = "scale(0.92)");
    btn.addEventListener("mouseup", () => btn.style.transform = "scale(1)");
    btn.addEventListener("mouseleave", () => btn.style.transform = "scale(1)");

    btn.addEventListener("click", () => handleGuess(letter));
    keyboardEl.appendChild(btn);
  });
}

function renderInfo() {
  livesEl.textContent = lives;
  categoryEl.textContent = currentCategory;

  if (difficultySelect.value === "extreme") {
    wrongLettersEl.textContent = "";
  } else {
    wrongLettersEl.textContent = wrongLetters.length
      ? "Wrong: " + wrongLetters.map(l => l.toUpperCase()).join(" ")
      : "";
  }

  drawHangman(lives);
}

/* GAME LOGIC */
function checkWin() {
  return currentWord.split("").every(letter => guessedLetters.includes(letter));
}

function handleGuess(letter) {
  if (gameOver || inputMode) return;

  if (currentWord.includes(letter)) {
    if (!guessedLetters.includes(letter)) guessedLetters.push(letter);
  } else {
    if (!wrongLetters.includes(letter)) {
      wrongLetters.push(letter);
      lives--;

      // SHAKE animation on wrong guess
      wordEl.classList.add("shake");
      setTimeout(() => wordEl.classList.remove("shake"), 350);
    }
  }

  renderWord();
  renderKeyboard();
  renderInfo();
  updateStatus();
}

function updateStatus() {
  if (checkWin()) {
    gameOver = true;
    statusEl.textContent = "You win!";
    resultEl.textContent = `The word was "${currentWord.toUpperCase()}"`;
    resultEl.className = "result win";

    // BOUNCE animation on win
    wordEl.classList.add("bounce");
    setTimeout(() => wordEl.classList.remove("bounce"), 600);

    score += 10 + lives;
    streak += 1;
    updateScoreboard();
  } else if (lives <= 0) {
    gameOver = true;
    statusEl.textContent = "You lost";
    resultEl.textContent = `The word was "${currentWord.toUpperCase()}"`;
    resultEl.className = "result lose";

    streak = 0;
    updateScoreboard();
  } else {
    statusEl.textContent = "Guess the word";
    resultEl.textContent = "";
    resultEl.className = "result";
  }
}

function resetGame() {
  guessedLetters = [];
  wrongLetters = [];
  maxLives = getLivesFromDifficulty();
  lives = maxLives;
  gameOver = false;

  pickRandomWord();
  renderWord();
  renderKeyboard();
  renderInfo();
  updateStatus();
}

/* INPUT HANDLING */
document.addEventListener("keydown", e => {
  if (inputMode) return;

  const key = e.key.toLowerCase();
  if (key >= "a" && key <= "z") handleGuess(key);
  if (e.key === "Enter" && gameOver) resetGame();
});

resetBtn.addEventListener("click", resetGame);
categorySelect.addEventListener("change", resetGame);
difficultySelect.addEventListener("change", resetGame);

/* CUSTOM WORDS */
addCustomBtn.addEventListener("click", () => {
  const w = customWordInput.value.trim().toLowerCase();
  const c = customCategoryInput.value.trim() || "Custom";

  if (w.length < 2 || !/^[a-z]+$/.test(w)) {
    alert("Word must be letters only and at least 2 characters.");
    return;
  }

  words.push({ word: w, category: c });

  const exists = [...categorySelect.options].some(opt => opt.value === c);
  if (!exists) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  }

  customWordInput.value = "";
  customCategoryInput.value = "";

  unfreezeGame();

  alert("Custom word added!");
});

/* INIT */
updateScoreboard();
resetGame();


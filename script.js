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

const maxLives = 6;

let currentWord = "";
let currentCategory = "";
let guessedLetters = [];
let wrongLetters = [];
let lives = maxLives;
let gameOver = false;

const wordEl = document.getElementById("word");
const livesEl = document.getElementById("lives");
const categoryEl = document.getElementById("category");
const wrongLettersEl = document.getElementById("wrongLetters");
const keyboardEl = document.getElementById("keyboard");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const resetBtn = document.getElementById("resetBtn");
const categorySelect = document.getElementById("categorySelect");

// Canvas
const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");

function drawHangman(livesLeft) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e5e7eb";

  // Base
  ctx.beginPath();
  ctx.moveTo(10, 190);
  ctx.lineTo(190, 190);
  ctx.stroke();

  // Post
  ctx.beginPath();
  ctx.moveTo(40, 190);
  ctx.lineTo(40, 20);
  ctx.stroke();

  // Beam
  ctx.beginPath();
  ctx.moveTo(40, 20);
  ctx.lineTo(130, 20);
  ctx.stroke();

  // Rope
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
    btn.disabled = guessedLetters.includes(letter) || wrongLetters.includes(letter) || gameOver;
    btn.addEventListener("click", () => handleGuess(letter));
    keyboardEl.appendChild(btn);
  });
}

function renderInfo() {
  livesEl.textContent = lives;
  categoryEl.textContent = currentCategory;
  wrongLettersEl.textContent = wrongLetters.length
    ? "Wrong: " + wrongLetters.map(l => l.toUpperCase()).join(" ")
    : "";
  drawHangman(lives);
}

function checkWin() {
  return currentWord.split("").every(letter => guessedLetters.includes(letter));
}

function handleGuess(letter) {
  if (gameOver) return;

  if (currentWord.includes(letter)) {
    if (!guessedLetters.includes(letter)) guessedLetters.push(letter);
  } else {
    if (!wrongLetters.includes(letter)) {
      wrongLetters.push(letter);
      lives--;
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
  } else if (lives <= 0) {
    gameOver = true;
    statusEl.textContent = "You lost";
    resultEl.textContent = `The word was "${currentWord.toUpperCase()}"`;
    resultEl.className = "result lose";
  } else {
    statusEl.textContent = "Guess the word";
    resultEl.textContent = "";
    resultEl.className = "result";
  }
}

function resetGame() {
  guessedLetters = [];
  wrongLetters = [];
  lives = maxLives;
  gameOver = false;

  pickRandomWord();
  renderWord();
  renderKeyboard();
  renderInfo();
  updateStatus();
}

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if (key >= "a" && key <= "z") handleGuess(key);
  if (e.key === "Enter" && gameOver) resetGame();
});

resetBtn.addEventListener("click", resetGame);
categorySelect.addEventListener("change", resetGame);

resetGame();

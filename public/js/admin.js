/**
   GE ADOPTION GAME - ADMIN PORTAL CORE SCRIPT
   Handles real-time game coordination, state sync, and podium animations.
 */

const socket = io();

// Parse room ID from query parameter
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

let masterImagesList = [];
let roomPlayers = [];
let selectedMasterIndex = 0;

// DOM Elements
const roomCodeDisplay = document.getElementById('room-code-display');
const lobbyRoster = document.getElementById('lobby-roster');
const playerCountDisplay = document.getElementById('player-count-display');
const masterSelect = document.getElementById('master-select');
const masterPreviewImg = document.getElementById('master-preview-img');
const masterPreviewFallback = document.getElementById('master-preview-fallback');
const masterPreviewTitle = document.getElementById('master-preview-title');
const masterPreviewCategory = document.getElementById('master-preview-category');
const masterPreviewDifficulty = document.getElementById('master-preview-difficulty');
const startGameBtn = document.getElementById('start-game-btn');
const terminateBtn = document.getElementById('terminate-btn');

const adminLobbySec = document.getElementById('admin-lobby');
const adminPlayingSec = document.getElementById('admin-playing');
const adminRevealSec = document.getElementById('admin-reveal');

const activeMasterTitle = document.getElementById('active-master-title');
const activeMasterCategory = document.getElementById('active-master-category');
const activeMasterImg = document.getElementById('active-master-img');
const activeMasterDesc = document.getElementById('active-master-desc');
const submittedCount = document.getElementById('submitted-count');
const totalCount = document.getElementById('total-count');
const roundRoster = document.getElementById('round-roster');
const endGameBtn = document.getElementById('end-game-btn');
const resetRoundBtn = document.getElementById('reset-round-btn');

// Initialize Admin Portal
if (roomId) {
  roomCodeDisplay.textContent = `ROOM CODE: ${roomId}`;
  socket.emit('admin-join', roomId);
  loadMasterImagesCatalog();
} else {
  alert('No Room Code provided. Returning to home page.');
  window.location.href = '/';
}

// Fetch 20 Master Images from endpoint
async function loadMasterImagesCatalog() {
  try {
    const res = await fetch('/api/master-images');
    if (!res.ok) throw new Error('Failed to load library catalog');
    masterImagesList = await res.json();

    // Populate dropdown
    masterSelect.innerHTML = masterImagesList.map((img, i) => 
      `<option value="${i}">#${img.index} - ${img.title} (${img.difficulty})</option>`
    ).join('');

    // Wire-up change listener
    masterSelect.addEventListener('change', () => {
      updateMasterPreview(masterSelect.value);
    });

    // Initial load preview
    if (masterImagesList.length > 0) {
      updateMasterPreview(0);
    }
  } catch (err) {
    console.error('Error fetching master list:', err);
  }
}

// Update image preview box on change
function updateMasterPreview(index) {
  selectedMasterIndex = index;
  const image = masterImagesList[index];
  
  if (image) {
    masterPreviewImg.src = `assets/master-images/${image.filename}`;
    masterPreviewImg.style.display = 'block';
    masterPreviewFallback.style.display = 'none';
    
    masterPreviewTitle.textContent = image.title;
    masterPreviewCategory.textContent = `CATEGORY: ${image.category}`;
    masterPreviewDifficulty.textContent = `Difficulty: ${image.difficulty} | Style: ${image.style}`;
    
    startGameBtn.disabled = roomPlayers.length === 0;
  }
}

// Listen to Incoming Room State from server
socket.on('room-state', ({ status, activeMasterIndex, players }) => {
  roomPlayers = players;
  playerCountDisplay.textContent = players.length;

  // Enforce button validation
  startGameBtn.disabled = players.length === 0;

  // Process Roster list in Lobby View
  if (status === 'LOBBY') {
    renderLobbyRoster(players);
    showSection('lobby');
  } 
  
  // Process Active Submissions View
  else if (status === 'PLAYING') {
    const activeMaster = masterImagesList.find(img => img.index === activeMasterIndex) || masterImagesList[selectedMasterIndex];
    if (activeMaster) {
      activeMasterTitle.textContent = activeMaster.title;
      activeMasterCategory.textContent = activeMaster.category;
      activeMasterImg.src = `assets/master-images/${activeMaster.filename}`;
      activeMasterDesc.textContent = activeMaster.prompt;
    }

    renderPlayingRoster(players);
    showSection('playing');
  }
});

function renderLobbyRoster(players) {
  if (players.length === 0) {
    lobbyRoster.innerHTML = '<div class="player-badge admin-tag">Waiting for participants to connect...</div>';
    return;
  }

  lobbyRoster.innerHTML = players.map(p => 
    `<div class="player-badge">
       <span style="display:inline-block; width:8px; height:8px; background-color:var(--accent-purple); border-radius:50%;"></span>
       ${escapeHTML(p.username)}
     </div>`
  ).join('');
}

function renderPlayingRoster(players) {
  const submitted = players.filter(p => p.has_submitted === 1);
  submittedCount.textContent = submitted.length;
  totalCount.textContent = players.length;

  roundRoster.innerHTML = players.map(p => {
    const isDone = p.has_submitted === 1;
    return `<div class="player-badge ${isDone ? 'submitted' : ''}">
      <span style="display:inline-block; width:8px; height:8px; background-color:${isDone ? 'var(--accent-cyan)' : 'var(--text-muted)'}; border-radius:50%;"></span>
      ${escapeHTML(p.username)} ${isDone ? '✓' : '...'}
    </div>`;
  }).join('');
}

// Display appropriate section
function showSection(section) {
  adminLobbySec.style.display = section === 'lobby' ? 'block' : 'none';
  adminPlayingSec.style.display = section === 'playing' ? 'block' : 'none';
  adminRevealSec.style.display = section === 'reveal' ? 'block' : 'none';
  
  if (section !== 'reveal') {
    stopConfetti();
  }
}

// 1. Admin Clicks Start Game
startGameBtn.addEventListener('click', () => {
  const chosenIndex = masterImagesList[selectedMasterIndex].index;
  socket.emit('start-game', { roomId, masterIndex: chosenIndex });
});

// 2. Admin Clicks End Game (Reveal Scores)
endGameBtn.addEventListener('click', () => {
  socket.emit('end-game', roomId);
});

// 3. Admin clicks reset room to go back to lobby
resetRoundBtn.addEventListener('click', () => {
  socket.emit('start-game', { roomId, masterIndex: masterImagesList[Math.floor(Math.random() * masterImagesList.length)].index });
});

// 4. Terminate Room
terminateBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to terminate this room? All records will be deleted immediately.')) {
    socket.emit('terminate-room', roomId);
  }
});

// Handle termination signal
socket.on('room-terminated', () => {
  alert('Room terminated. Redirecting to home.');
  window.location.href = '/';
});

// Reveal Leaderboard podium
socket.on('game-revealed', ({ leaderboard }) => {
  showSection('reveal');
  
  // Set winner column animations sequentially
  animatePodiumColumn('3rd', leaderboard[2]);
  setTimeout(() => animatePodiumColumn('2nd', leaderboard[1]), 500);
  setTimeout(() => {
    animatePodiumColumn('1st', leaderboard[0]);
    startConfetti();
  }, 1000);
});

// Animate a winner column
function animatePodiumColumn(place, player) {
  const step = document.getElementById(`step-${place}`);
  const img = document.getElementById(`winner-img-${place}`);
  const name = document.getElementById(`winner-name-${place}`);
  const score = document.getElementById(`winner-score-${place}`);

  if (player) {
    img.src = player.image ? `data:image/jpeg;base64,${player.image}` : 'assets/placeholder.jpg';
    name.textContent = player.username;
    score.textContent = `${player.score} PTS`;
    step.style.display = 'flex';
  } else {
    // Hide column if not enough players
    step.style.display = 'none';
  }

  // Trigger CSS animations
  step.style.opacity = '1';
  step.style.transform = 'translateY(0)';
}

// Secure HTML Injection Escape
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}


/* ==========================================================================
   2D CANVAS CONFETTI PARTICLE SYSTEM
   ========================================================================== */

const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let animationFrameId = null;
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class ConfettiFlake {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height - canvas.height;
    this.r = Math.random() * 6 + 4;
    this.d = Math.random() * canvas.height;
    this.color = `hsl(${Math.random() * 360}, 90%, 55%)`;
    this.tilt = Math.random() * 10 - 5;
    this.tiltAngleIncremental = Math.random() * 0.07 + 0.02;
    this.tiltAngle = 0;
  }
  
  draw() {
    ctx.beginPath();
    ctx.lineWidth = this.r / 2;
    ctx.strokeStyle = this.color;
    ctx.moveTo(this.x + this.tilt + this.r / 4, this.y);
    ctx.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 4);
    ctx.stroke();
  }
  
  update() {
    this.tiltAngle += this.tiltAngleIncremental;
    this.y += (Math.cos(this.d) + 3 + this.r / 2) / 2;
    this.x += Math.sin(this.tiltAngle);
    this.tilt = Math.sin(this.tiltAngle - this.r / 2) * 4;
    
    // recycle confetti
    if (this.y > canvas.height) {
      this.x = Math.random() * canvas.width;
      this.y = -20;
      this.tilt = Math.random() * 10 - 5;
    }
  }
}

function startConfetti() {
  particles = [];
  for (let i = 0; i < 150; i++) {
    particles.push(new ConfettiFlake());
  }
  
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    animationFrameId = requestAnimationFrame(loop);
  }
  loop();
}

function stopConfetti() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = [];
  }
}

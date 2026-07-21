/**
   GE ADOPTION GAME - ADMIN PORTAL CORE SCRIPT
   Handles real-time game coordination, state sync, and podium animations.
 */

// Custom Fly-In Notification Toast Utility
function showCustomNotification(message, type = 'info') {
  let toast = document.getElementById('custom-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'custom-toast';
    document.body.appendChild(toast);
  }
  
  toast.className = `custom-notification ${type}`;
  
  let icon = '⚡';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  
  toast.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> <span>${message}</span>`;
  
  // Trigger transition
  setTimeout(() => toast.classList.add('show'), 50);
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Custom Confirmation Dialog Overlay Utility (Admin Portal)
function showCustomConfirm(title, message, onConfirm) {
  const modal = document.getElementById('custom-confirm-modal');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  
  if (!modal) {
    if (confirm(message)) onConfirm();
    return;
  }
  
  titleEl.textContent = title.toUpperCase();
  msgEl.textContent = message;
  modal.style.display = 'flex';
  
  const cleanUp = () => {
    modal.style.display = 'none';
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleOk = () => {
    cleanUp();
    onConfirm();
  };
  
  const handleCancel = () => {
    cleanUp();
  };
  
  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', handleCancel);
}

const socket = io();

// Parse room ID from query parameter
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

let masterImagesList = [];
let roomPlayers = [];
let selectedMasterIndex = 0;
let activeMasterIndex = 0;

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

// Direct URL Passcode Protection Logic
const gateOverlay = document.getElementById('admin-gate-overlay');
const gatePasscodeField = document.getElementById('admin-gate-passcode');
const gateErrorMsg = document.getElementById('gate-error-msg');
const gateSubmitBtn = document.getElementById('gate-submit-btn');
const gateCancelBtn = document.getElementById('gate-cancel-btn');

function checkAdminGate() {
  if (sessionStorage.getItem('isAdminAuthorized') === 'true') {
    initAdminPortal();
  } else {
    gateOverlay.style.display = 'flex';
    gatePasscodeField.focus();
    
    // Wire up events
    gateSubmitBtn.addEventListener('click', verifyGatePasscode);
    gateCancelBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
    gatePasscodeField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        verifyGatePasscode();
      }
    });
  }
}

function verifyGatePasscode() {
  const passcode = gatePasscodeField.value.trim();
  if (passcode === 'MrRoyRoy') {
    sessionStorage.setItem('isAdminAuthorized', 'true');
    gateOverlay.style.display = 'none';
    initAdminPortal();
  } else {
    gateErrorMsg.style.display = 'block';
    gatePasscodeField.style.borderColor = '#ff3366';
    gatePasscodeField.classList.add('shake-anim');
    setTimeout(() => {
      gatePasscodeField.classList.remove('shake-anim');
    }, 400);
  }
}

function initAdminPortal() {
  if (roomId) {
    roomCodeDisplay.textContent = `ROOM CODE: ${roomId}`;
    socket.emit('admin-join', roomId);
    loadMasterImagesCatalog();
  } else {
    showCustomNotification('No Room Code provided. Returning to home page.', 'error');
    setTimeout(() => {
      window.location.href = '/';
    }, 2500);
  }
}

// Start execution
checkAdminGate();

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
socket.on('room-state', ({ status, activeMasterIndex: currentMaster, players }) => {
  activeMasterIndex = currentMaster;
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

  // Process Gallery View
  else if (status === 'GALLERY') {
    const activeMaster = masterImagesList.find(img => img.index === activeMasterIndex) || masterImagesList[selectedMasterIndex];
    populateAndShowGallery(players, activeMaster);
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
  
  const gallerySec = document.getElementById('admin-gallery');
  if (gallerySec) {
    gallerySec.style.display = section === 'gallery' ? 'block' : 'none';
  }
  
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

// 3. Admin clicks reset room to go back to lobby / game selection
resetRoundBtn.addEventListener('click', () => {
  socket.emit('reset-to-lobby', roomId);
});

// 3.5 Admin navigates to Detailed Review & Gallery
const goToGalleryBtn = document.getElementById('go-to-gallery-btn');
if (goToGalleryBtn) {
  goToGalleryBtn.addEventListener('click', () => {
    socket.emit('show-gallery', roomId);
  });
}

// 3.6 Admin resets round from Gallery view to go back to lobby / game selection
const galleryResetBtn = document.getElementById('gallery-reset-btn');
if (galleryResetBtn) {
  galleryResetBtn.addEventListener('click', () => {
    socket.emit('reset-to-lobby', roomId);
  });
}

// 3.7 Handle Gallery Reveal event
socket.on('room-gallery', ({ players }) => {
  const activeMaster = masterImagesList.find(img => img.index === activeMasterIndex) || masterImagesList[selectedMasterIndex];
  populateAndShowGallery(players, activeMaster);
});

// Render the interactive deep-dive gallery
function populateAndShowGallery(players, activeMaster) {
  showSection('gallery');
  
  const masterImg = document.getElementById('gallery-master-img');
  const masterDesc = document.getElementById('gallery-master-desc');
  
  if (activeMaster) {
    masterImg.src = `assets/master-images/${activeMaster.filename}`;
    masterDesc.textContent = activeMaster.prompt;
  }
  
  const grid = document.getElementById('gallery-grid');
  if (grid) {
    grid.innerHTML = '';
    
    players.forEach(p => {
      const card = document.createElement('div');
      card.className = 'glass-panel';
      card.style.cssText = 'padding: 0.6rem; border-radius: 8px; cursor: pointer; border-color: rgba(255,255,255,0.08); transition: all 0.2s ease-in-out;';
      
      const imgUrl = p.user_image_base64 ? `data:image/jpeg;base64,${p.user_image_base64}` : 'assets/placeholder.jpg';
      
      card.innerHTML = `
        <div style="aspect-ratio: 1/1; border-radius: 6px; overflow: hidden; border: 1px solid var(--glass-border); background: #000; margin-bottom: 0.5rem;">
          <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: bold; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(p.username)}</div>
          <div style="font-size: 0.7rem; color: var(--accent-cyan); font-family: 'Orbitron', sans-serif; font-weight: bold; margin-top: 0.1rem;">${p.score} PTS</div>
        </div>
      `;
      
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'var(--accent-cyan)';
        card.style.transform = 'scale(1.03)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'rgba(255,255,255,0.08)';
        card.style.transform = 'scale(1)';
      });
      
      card.addEventListener('click', () => {
        openLightbox(p.username, p.score, imgUrl, p.submitted_prompt);
      });
      
      grid.appendChild(card);
    });
  }
}

// Lightbox Mechanics
const lightbox = document.getElementById('gallery-lightbox');
const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
const lightboxCreator = document.getElementById('lightbox-creator');
const lightboxScore = document.getElementById('lightbox-score');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxPrompt = document.getElementById('lightbox-prompt');

function openLightbox(creator, score, imgUrl, prompt) {
  if (!lightbox) return;
  lightboxCreator.textContent = creator.toUpperCase();
  lightboxScore.textContent = `${score} PTS`;
  lightboxImg.src = imgUrl;
  lightboxPrompt.textContent = prompt || 'No prompt locked in time.';
  lightbox.style.display = 'flex';
}

if (lightboxCloseBtn) {
  lightboxCloseBtn.addEventListener('click', () => {
    lightbox.style.display = 'none';
  });
}

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
    }
  });
}

// 4. Terminate Room
terminateBtn.addEventListener('click', () => {
  showCustomConfirm('Terminate Room', 'Are you sure you want to terminate this room? All records will be deleted immediately.', () => {
    socket.emit('terminate-room', roomId);
  });
});

// Handle termination signal
socket.on('room-terminated', () => {
  showCustomNotification('Room terminated. Redirecting to home...', 'error');
  setTimeout(() => {
    window.location.href = '/';
  }, 2000);
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

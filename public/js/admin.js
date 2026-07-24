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

const NO_IMAGE_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="%23080c14"/><g transform="translate(88,70)"><line x1="2" x2="22" y1="2" y2="22" stroke="%23ff3366" stroke-width="2"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" stroke="%23ff3366" stroke-width="2" fill="none"/><path d="M13.5 13.5 16 11l4.5 4.5" stroke="%23ff3366" stroke-width="2" fill="none"/><path d="M21 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m4 0h10a2 2 0 0 1 2 2v12m-3.5-3.5L16 11" stroke="%23ff3366" stroke-width="2" fill="none"/></g><text x="50%" y="130" fill="%23ff3366" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">FAILED TO SUBMIT</text></svg>';

// Custom Confirmation Dialog Overlay Utility (Admin Portal)
function showCustomConfirm(title, message, onConfirm, confirmText = 'CONFIRM') {
  const modal = document.getElementById('custom-confirm-modal');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  
  if (!modal) {
    if (confirm(message)) onConfirm();
    return;
  }
  
  if (titleEl) titleEl.textContent = title.toUpperCase();
  if (msgEl) msgEl.textContent = message;
  if (okBtn) okBtn.textContent = confirmText.toUpperCase();
  modal.style.display = 'flex';
  
  const cleanUp = () => {
    modal.style.display = 'none';
  };
  
  if (okBtn) {
    okBtn.onclick = () => {
      cleanUp();
      onConfirm();
    };
  }
  
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      cleanUp();
    };
  }
}

const socket = io();

// Parse room ID from query parameter
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

let masterImagesList = [];
let roomPlayers = [];
let selectedMasterIndex = 0;
let activeMasterIndex = 0;
let selectedGameMode = 'GAME1';

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

// Update UI visual state for Game 1 vs Game 2 cards
function updateGameCardsUI(mode) {
  selectedGameMode = mode;
  const cardGame1 = document.getElementById('card-game1');
  const cardGame2 = document.getElementById('card-game2');

  if (cardGame1 && cardGame2) {
    if (mode === 'GAME2') {
      cardGame2.classList.add('active-card');
      cardGame2.style.border = '2px solid #ff0055';
      cardGame2.style.background = 'rgba(255, 0, 85, 0.15)';
      cardGame2.style.boxShadow = '0 0 20px rgba(255, 0, 85, 0.3)';

      cardGame1.classList.remove('active-card');
      cardGame1.style.border = '1px solid var(--glass-border)';
      cardGame1.style.background = 'rgba(20, 10, 35, 0.5)';
      cardGame1.style.boxShadow = 'none';
    } else {
      cardGame1.classList.add('active-card');
      cardGame1.style.border = '2px solid var(--accent-cyan)';
      cardGame1.style.background = 'rgba(0, 240, 255, 0.15)';
      cardGame1.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.3)';

      cardGame2.classList.remove('active-card');
      cardGame2.style.border = '1px solid var(--glass-border)';
      cardGame2.style.background = 'rgba(10, 15, 30, 0.5)';
      cardGame2.style.boxShadow = 'none';
    }
  }
}

// Initialize Game Mode Card Selection in Lobby
function setupGameSelectionCards() {
  const cardGame1 = document.getElementById('card-game1');
  const cardGame2 = document.getElementById('card-game2');

  if (cardGame1 && cardGame2) {
    cardGame1.onclick = (e) => {
      e.stopPropagation();
      selectedGameMode = 'GAME1';
      updateGameCardsUI('GAME1');
      socket.emit('select-game-mode', { roomId, gameMode: 'GAME1' });
    };

    cardGame2.onclick = (e) => {
      e.stopPropagation();
      selectedGameMode = 'GAME2';
      updateGameCardsUI('GAME2');
      socket.emit('select-game-mode', { roomId, gameMode: 'GAME2' });
    };
  }
}

// Direct URL Passcode Protection Logic
const gateOverlay = document.getElementById('admin-gate-overlay');
const gatePasscodeField = document.getElementById('admin-gate-passcode');
const gateErrorMsg = document.getElementById('gate-error-msg');
const gateSubmitBtn = document.getElementById('gate-submit-btn');
const gateCancelBtn = document.getElementById('gate-cancel-btn');

function checkAdminGate() {
  if (roomId && roomCodeDisplay) {
    roomCodeDisplay.textContent = `ROOM CODE: ${roomId}`;
  }
  setupGameSelectionCards();
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
    setupGameSelectionCards();
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

    // Populate dropdown if element exists
    if (masterSelect) {
      masterSelect.innerHTML = masterImagesList.map((img) => 
        `<option value="${img.index}">#${img.index} - ${img.title} (${img.difficulty})</option>`
      ).join('');

      masterSelect.addEventListener('change', () => {
        updateMasterPreview(masterSelect.value);
      });
    }

    // Initial load preview
    if (masterImagesList.length > 0) {
      updateMasterPreview(masterImagesList[0].index);
    }
  } catch (err) {
    console.error('Error fetching master list:', err);
  }
}

// Update image preview box on change
function updateMasterPreview(masterIndex) {
  const image = masterImagesList.find(img => img.index === Number(masterIndex)) || masterImagesList[0];
  if (image) {
    selectedMasterIndex = image.index;
    if (masterPreviewImg) {
      masterPreviewImg.src = `assets/master-images/${image.filename}`;
      masterPreviewImg.style.display = 'block';
    }
    if (masterPreviewFallback) masterPreviewFallback.style.display = 'none';
    if (masterPreviewTitle) masterPreviewTitle.textContent = image.title;
    if (masterPreviewCategory) masterPreviewCategory.textContent = `CATEGORY: ${image.category}`;
    if (masterPreviewDifficulty) masterPreviewDifficulty.textContent = `Difficulty: ${image.difficulty} | Style: ${image.style}`;
    
    if (startGameBtn) {
      startGameBtn.disabled = false;
    }
  }
}

// Wire Start Game CTA
if (startGameBtn) {
  startGameBtn.addEventListener('click', () => {
    if (roomPlayers.length === 0) {
      showCustomNotification('Cannot start game without connected players.', 'error');
      return;
    }
    showCustomConfirm('Start Match', `Launch ${selectedGameMode === 'GAME1' ? 'Game 1 (Image Prompting)' : 'Game 2 (Keep Koopa 3 Trials)'} for all players?`, () => {
      socket.emit('start-game', { roomId, masterIndex: selectedMasterIndex, gameMode: selectedGameMode });
    });
  });
}

// Wire Reset / Back to Game Selection Buttons
const resetBtns = [
  document.getElementById('reset-round-btn'),
  document.getElementById('gallery-reset-btn'),
  document.getElementById('reveal-reset-btn')
];

resetBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', () => {
      showCustomConfirm('Back to Lobby', 'Return to Game Selection Lobby? All players will be returned to the waiting room.', () => {
        socket.emit('reset-to-lobby', roomId);
      });
    });
  }
});

// Wire Overall Scoreboard Modal Controls
const openScoreboardBtn = document.getElementById('open-overall-scoreboard-btn');
const scoreboardModal = document.getElementById('overall-scoreboard-modal');
const scoreboardCloseBtn = document.getElementById('scoreboard-close-btn');
const scoreboardTbody = document.getElementById('overall-scoreboard-tbody');

if (openScoreboardBtn && scoreboardModal) {
  openScoreboardBtn.addEventListener('click', () => {
    socket.emit('get-overall-scoreboard', roomId);
    scoreboardModal.style.display = 'flex';
  });
}

if (scoreboardCloseBtn && scoreboardModal) {
  scoreboardCloseBtn.addEventListener('click', () => {
    scoreboardModal.style.display = 'none';
  });
}

socket.on('overall-scoreboard-data', ({ players }) => {
  if (!scoreboardTbody) return;
  if (!players || players.length === 0) {
    scoreboardTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-muted);">No match data recorded yet. Launch a game to score points!</td></tr>';
    return;
  }

  scoreboardTbody.innerHTML = players.map((p, index) => {
    const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 0.75rem; text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold; color: var(--accent-cyan);">${rankMedal}</td>
        <td style="padding: 0.75rem; font-weight: 500; color: #fff;">${escapeHTML(p.username)}</td>
        <td style="padding: 0.75rem; text-align: right; font-family: 'Orbitron', sans-serif; font-weight: bold; color: var(--accent-purple);">${p.accumulated_score || 0} PTS</td>
      </tr>
    `;
  }).join('');
});

// Listen to Incoming Room State from server
socket.on('room-state', ({ status, gameMode, activeMasterIndex: currentMaster, activeMaster: serverMaster, players }) => {
  activeMasterIndex = currentMaster;
  roomPlayers = players;
  if (playerCountDisplay) playerCountDisplay.textContent = players.length;

  if (gameMode) {
    selectedGameMode = gameMode;
    updateGameCardsUI(gameMode);
  }

  // Process Roster list in Lobby View
  if (status === 'LOBBY') {
    setupGameSelectionCards();
    renderLobbyRoster(players);
    showSection('lobby');
  } 
  // Process Active Submissions View
  else if (status === 'PLAYING') {
    if (selectedGameMode === 'GAME2') {
      if (activeMasterTitle) activeMasterTitle.textContent = "Keep Koopa 3 Trials";
      if (activeMasterCategory) activeMasterCategory.textContent = "TEXT PROMPT TECHNIQUE";
      if (activeMasterImg) activeMasterImg.src = "/assets/lobby/banner-game2.jpg";
      if (activeMasterDesc) activeMasterDesc.textContent = "Competitors are interacting with Gemini 3.5 Flash to solve 3 progressive hacking trials: PTCF Protocol, Airship Checklist, and Password Extraction.";
    } else {
      const activeMaster = serverMaster || (masterImagesList && masterImagesList.find(img => img.index === activeMasterIndex)) || (masterImagesList && masterImagesList[selectedMasterIndex]) || (masterImagesList && masterImagesList[0]);
      if (activeMaster) {
        if (activeMasterTitle) activeMasterTitle.textContent = activeMaster.title;
        if (activeMasterCategory) activeMasterCategory.textContent = activeMaster.category;
        if (activeMasterImg) activeMasterImg.src = `/assets/master-images/${activeMaster.filename}`;
        if (activeMasterDesc) activeMasterDesc.textContent = activeMaster.prompt;
      }
    }

    renderPlayingRoster(players);
    showSection('playing');
  }
  // Process Gallery View
  else if (status === 'GALLERY') {
    const activeMaster = serverMaster || (masterImagesList && masterImagesList.find(img => img.index === activeMasterIndex)) || (masterImagesList && masterImagesList[selectedMasterIndex]) || (masterImagesList && masterImagesList[0]);
    populateAndShowGallery(players, activeMaster);
  }
  // Process Reveal View
  else if (status === 'REVEAL') {
    showSection('reveal');
  }
});

function renderLobbyRoster(players) {
  if (startGameBtn) {
    startGameBtn.disabled = false;
  }
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
  const game1Layout = document.getElementById('game1-playing-layout');
  const game2Layout = document.getElementById('game2-playing-layout');

  if (selectedGameMode === 'GAME2') {
    if (game1Layout) game1Layout.style.display = 'none';
    if (game2Layout) game2Layout.style.display = 'block';

    const submitted = players.filter(p => p.has_submitted === 1);
    const game2SubmittedCount = document.getElementById('game2-submitted-count');
    const game2TotalCount = document.getElementById('game2-total-count');
    if (game2SubmittedCount) game2SubmittedCount.textContent = submitted.length;
    if (game2TotalCount) game2TotalCount.textContent = players.length;

    // Render Stage 1, Stage 2, Stage 3 player chips
    const stage1Box = document.getElementById('game2-stage1-players');
    const stage2Box = document.getElementById('game2-stage2-players');
    const stage3Box = document.getElementById('game2-stage3-players');

    if (stage1Box && stage2Box && stage3Box) {
      stage1Box.innerHTML = '';
      stage2Box.innerHTML = '';
      stage3Box.innerHTML = '';

      players.forEach(p => {
        let currentTask = 1;
        let isDone = p.has_submitted === 1;
        try {
          if (p.game2_state_json) {
            const st = JSON.parse(p.game2_state_json);
            currentTask = st.currentTask || 1;
          }
        } catch (e) {}

        const chip = document.createElement('div');
        chip.style.cssText = 'background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); padding: 0.6rem 0.9rem; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; transition: all 0.3s ease;';
        chip.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${isDone ? '#00ff88' : 'var(--accent-cyan)'}; flex-shrink:0;"></span>
            <span style="color: #fff; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(p.username)}</span>
          </div>
          <span style="font-family: 'Orbitron', sans-serif; font-size: 0.75rem; color: var(--accent-cyan); font-weight: bold; flex-shrink: 0; margin-left: 0.5rem;">${p.score || 0} PTS</span>
        `;

        if (currentTask === 1 && !isDone) {
          stage1Box.appendChild(chip);
        } else if (currentTask === 2 && !isDone) {
          stage2Box.appendChild(chip);
        } else {
          // Task 3 or finished
          chip.style.borderColor = 'var(--accent-gold)';
          chip.style.background = 'rgba(255, 183, 0, 0.1)';
          stage3Box.appendChild(chip);
        }
      });

      if (stage1Box.children.length === 0) stage1Box.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:1rem;">No participants in Stage 1</div>';
      if (stage2Box.children.length === 0) stage2Box.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:1rem;">No participants in Stage 2</div>';
      if (stage3Box.children.length === 0) stage3Box.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:1rem;">No participants in Stage 3</div>';
    }
  } else {
    if (game1Layout) game1Layout.style.display = 'grid';
    if (game2Layout) game2Layout.style.display = 'none';

    const submitted = players.filter(p => p.has_submitted === 1);
    if (submittedCount) submittedCount.textContent = submitted.length;
    if (totalCount) totalCount.textContent = players.length;

    if (roundRoster) {
      roundRoster.innerHTML = players.map(p => {
        const isDone = p.has_submitted === 1;
        const rawName = p.username || '';
        const displayName = rawName.length > 15 ? rawName.substring(0, 15) + '...' : rawName;

        return `<div class="player-badge ${isDone ? 'submitted' : ''}" style="box-sizing: border-box; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.75rem;" title="${escapeHTML(rawName)}">
          <span style="display:inline-block; width:6px; height:6px; flex-shrink: 0; background-color:${isDone ? 'var(--accent-cyan)' : 'var(--text-muted)'}; border-radius:50%;"></span>
          <span style="line-height: 1.2; white-space: nowrap;">${escapeHTML(displayName)}</span>
          ${isDone ? '<span style="color: var(--accent-cyan); font-weight: bold; flex-shrink: 0; margin-left: 0.1rem;">✓</span>' : ''}
        </div>`;
      }).join('');
    }
  }
}

// Wire Game 2 End Submissions Button
const game2EndGameBtn = document.getElementById('game2-end-game-btn');
if (game2EndGameBtn) {
  game2EndGameBtn.addEventListener('click', () => {
    showCustomConfirm('End Game 2', 'End Game 2 submissions and calculate final scoreboard?', () => {
      socket.emit('end-game', roomId);
    });
  });
}

// Display appropriate section
function showSection(section) {
  const confirmModal = document.getElementById('custom-confirm-modal');
  if (confirmModal) confirmModal.style.display = 'none';

  if (adminLobbySec) adminLobbySec.style.display = section === 'lobby' ? 'block' : 'none';
  if (adminPlayingSec) adminPlayingSec.style.display = section === 'playing' ? 'block' : 'none';
  if (adminRevealSec) adminRevealSec.style.display = section === 'reveal' ? 'block' : 'none';
  
  const gallerySec = document.getElementById('admin-gallery');
  if (gallerySec) {
    gallerySec.style.display = section === 'gallery' ? 'block' : 'none';
  }
  
  if (section !== 'reveal') {
    stopConfetti();
  }
}

// 2. Admin Clicks End Game (Reveal Scores)
if (endGameBtn) {
  endGameBtn.addEventListener('click', () => {
    showCustomConfirm('End Submissions', 'Are you sure you want to end submissions and score the round now?', () => {
      socket.emit('end-game', roomId);
    });
  });
}

// 3.5 Admin navigates to Detailed Review & Gallery
const goToGalleryBtn = document.getElementById('go-to-gallery-btn');
if (goToGalleryBtn) {
  goToGalleryBtn.addEventListener('click', () => {
    socket.emit('show-gallery', roomId);
  });
}

// 3.7 Handle Gallery Reveal event
socket.on('room-gallery', ({ players }) => {
  const activeMaster = masterImagesList.find(img => img.index === activeMasterIndex) || masterImagesList[0];
  populateAndShowGallery(players, activeMaster);
});

socket.on('room-reset-lobby', () => {
  showSection('lobby');
});

// Render the interactive deep-dive gallery
function populateAndShowGallery(players, activeMaster) {
  showSection('gallery');
  
  const masterImg = document.getElementById('gallery-master-img');
  const masterDesc = document.getElementById('gallery-master-desc');
  
  if (activeMaster && masterImg) {
    masterImg.src = `assets/master-images/${activeMaster.filename}`;
    masterDesc.textContent = activeMaster.prompt;
    
    // Remove any previous listener on the master card
    const masterCard = document.getElementById('gallery-master-card');
    if (masterCard) {
      const newMasterCard = masterCard.cloneNode(true);
      masterCard.parentNode.replaceChild(newMasterCard, masterCard);
      
      newMasterCard.addEventListener('click', () => {
        openLightbox('MASTER TARGET BLUEPRINT', '100', `assets/master-images/${activeMaster.filename}`, activeMaster.prompt);
      });
      
      // Hover zoom styling for master card
      newMasterCard.addEventListener('mouseenter', () => {
        newMasterCard.style.borderColor = 'var(--accent-purple)';
        newMasterCard.style.boxShadow = '0 0 20px rgba(188, 19, 254, 0.4)';
        newMasterCard.style.transform = 'scale(1.02)';
      });
      newMasterCard.addEventListener('mouseleave', () => {
        newMasterCard.style.borderColor = 'var(--glass-border)';
        newMasterCard.style.boxShadow = 'none';
        newMasterCard.style.transform = 'scale(1)';
      });
    }
  }
  
  const grid = document.getElementById('gallery-grid');
  if (grid) {
    grid.innerHTML = '';
    
    players.forEach(p => {
      const card = document.createElement('div');
      card.className = 'glass-panel';
      card.style.cssText = 'padding: 0.6rem; border-radius: 8px; cursor: pointer; border-color: rgba(255,255,255,0.08); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; z-index: 1;';
      
      const hasImage = !!p.user_image_base64;
      const imgUrl = hasImage ? `data:image/jpeg;base64,${p.user_image_base64}` : '';
      
      const mediaHtml = hasImage 
        ? `<img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #080c14; color: var(--text-muted); gap: 0.4rem; padding: 0.5rem;">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#ff3366" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" class="lucide lucide-image-off" viewBox="0 0 24 24"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.5 13.5 16 11l4.5 4.5"/><path d="M21 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m4 0h10a2 2 0 0 1 2 2v12m-3.5-3.5L16 11"/></svg>
             <span style="font-size: 0.6rem; font-family: 'Orbitron', sans-serif; font-weight: bold; color: #ff3366; letter-spacing: 0.5px; text-align: center; line-height: 1.2;">FAILED TO SUBMIT</span>
           </div>`;
      
      card.innerHTML = `
        <div style="aspect-ratio: 1/1; border-radius: 6px; overflow: hidden; border: 1px solid var(--glass-border); background: #000; margin-bottom: 0.5rem;">
          ${mediaHtml}
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: bold; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(p.username)}</div>
          <div style="font-size: 0.7rem; color: var(--accent-cyan); font-family: 'Orbitron', sans-serif; font-weight: bold; margin-top: 0.1rem;">${p.score} PTS</div>
        </div>
      `;
      
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'var(--accent-cyan)';
        card.style.transform = 'scale(1.05)';
        card.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.4)';
        card.style.zIndex = '10';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'rgba(255,255,255,0.08)';
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
        card.style.zIndex = '1';
      });
      
      card.addEventListener('click', () => {
        openLightbox(p.username, p.score, imgUrl, p.submitted_prompt || '(No prompt submitted)');
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
  
  const lightboxImgContainer = lightboxImg.parentNode;
  
  if (imgUrl) {
    lightboxImg.src = imgUrl;
    lightboxImg.style.display = 'block';
    const placeholder = lightboxImgContainer.querySelector('.lightbox-placeholder');
    if (placeholder) placeholder.remove();
  } else {
    lightboxImg.style.display = 'none';
    let placeholder = lightboxImgContainer.querySelector('.lightbox-placeholder');
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.className = 'lightbox-placeholder';
      placeholder.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #ff3366;';
      placeholder.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" class="lucide lucide-image-off" viewBox="0 0 24 24"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.5 13.5 16 11l4.5 4.5"/><path d="M21 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m4 0h10a2 2 0 0 1 2 2v12m-3.5-3.5L16 11"/></svg>
        <span style="font-size: 0.8rem; font-family: 'Orbitron', sans-serif; font-weight: bold; letter-spacing: 1px;">NO IMAGE SUBMISSION DETECTED</span>
      `;
      lightboxImgContainer.appendChild(placeholder);
    }
  }
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
if (terminateBtn) {
  terminateBtn.addEventListener('click', () => {
    showCustomConfirm('Terminate Room', 'Are you sure you want to terminate this room? All records will be deleted immediately.', () => {
      socket.emit('terminate-room', roomId);
    });
  });
}

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
  
  const revealTitle = document.getElementById('reveal-title-text');
  const revealSub = document.getElementById('reveal-subtitle-text');
  const game2Top10 = document.getElementById('game2-top10-container');
  const game2Tbody = document.getElementById('game2-top10-tbody');
  const goToGalleryBtn = document.getElementById('go-to-gallery-btn');

  if (selectedGameMode === 'GAME2') {
    if (revealTitle) revealTitle.textContent = "🏆 KEEP KOOPA CHAMPIONSHIP 🏆";
    if (revealSub) revealSub.textContent = "Hacking protocols evaluated! Bowser, Peach, and Mario celebrate the top prompt engineers!";
    if (game2Top10) game2Top10.style.display = 'block';
    if (goToGalleryBtn) goToGalleryBtn.style.display = 'none'; // No gallery detail button needed for Game 2

    // Populate Top 10 table
    if (game2Tbody) {
      game2Tbody.innerHTML = '';
      const top10 = leaderboard.slice(0, 10);
      top10.forEach((p, index) => {
        let stageText = 'Stage 1 (In Progress)';
        try {
          if (p.game2_state_json) {
            const st = typeof p.game2_state_json === 'string' ? JSON.parse(p.game2_state_json) : p.game2_state_json;
            if (st.completed) {
              stageText = 'Stage 3 Cleared (Completed)';
            } else {
              let completedCount = 0;
              if (st.tasks) {
                if (st.tasks["1"] && st.tasks["1"].completed) completedCount++;
                if (st.tasks["2"] && st.tasks["2"].completed) completedCount++;
                if (st.tasks["3"] && st.tasks["3"].completed) completedCount++;
              } else if (st.currentTask) {
                completedCount = st.currentTask > 1 ? st.currentTask - 1 : 0;
              }
              if (completedCount >= 3) stageText = 'Stage 3 Cleared (Completed)';
              else if (completedCount > 0) stageText = `Stage ${completedCount} Cleared`;
              else stageText = 'Stage 1 (In Progress)';
            }
          }
        } catch (e) {}

        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        row.innerHTML = `
          <td style="padding: 0.6rem; text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold; color: ${index < 3 ? 'var(--accent-gold)' : 'var(--text-secondary)'};">#${index + 1}</td>
          <td style="padding: 0.6rem; font-weight: bold; color: #fff;">${escapeHTML(p.username)}</td>
          <td style="padding: 0.6rem; text-align: center; color: var(--accent-cyan); font-size: 0.75rem;">${stageText}</td>
          <td style="padding: 0.6rem; text-align: right; font-family: 'Orbitron', sans-serif; font-weight: bold; color: #ff0055;">${p.score} PTS</td>
        `;
        game2Tbody.appendChild(row);
      });
    }

    // Set winner paper cutout characters for 1st (Bowser), 2nd (Peach), 3rd (Mario)
    animatePodiumColumn('3rd', leaderboard[2], '/assets/game2/mario-cutout.jpg');
    setTimeout(() => animatePodiumColumn('2nd', leaderboard[1], '/assets/game2/peach-cutout.jpg'), 500);
    setTimeout(() => {
      animatePodiumColumn('1st', leaderboard[0], '/assets/game2/bowser-cutout.jpg');
      startConfetti();
    }, 1000);

  } else {
    if (revealTitle) revealTitle.textContent = "✦ THE PODIUM ✦";
    if (revealSub) revealSub.textContent = "The neural metrics have spoken. Celebrating the top prompt engineering specialists of the round.";
    if (game2Top10) game2Top10.style.display = 'none';
    if (goToGalleryBtn) goToGalleryBtn.style.display = 'inline-block';

    animatePodiumColumn('3rd', leaderboard[2]);
    setTimeout(() => animatePodiumColumn('2nd', leaderboard[1]), 500);
    setTimeout(() => {
      animatePodiumColumn('1st', leaderboard[0]);
      startConfetti();
    }, 1000);
  }
});

// Animate a winner column
function animatePodiumColumn(place, player, fallbackCharacterCutout) {
  const step = document.getElementById(`step-${place}`);
  const img = document.getElementById(`winner-img-${place}`);
  const name = document.getElementById(`winner-name-${place}`);
  const score = document.getElementById(`winner-score-${place}`);

  if (player) {
    if (img) {
      if (selectedGameMode === 'GAME2' && fallbackCharacterCutout) {
        img.src = fallbackCharacterCutout;
        img.classList.add('paper-cutout-animated');
      } else {
        img.classList.remove('paper-cutout-animated');
        img.src = player.image ? `data:image/jpeg;base64,${player.image}` : NO_IMAGE_SVG;
        img.onerror = () => { img.src = NO_IMAGE_SVG; };
      }
    }
    if (name) name.textContent = player.username;
    if (score) score.textContent = `${player.score} PTS`;
    if (step) step.style.display = 'flex';
  } else {
    // Hide column if not enough players
    if (step) step.style.display = 'none';
  }

  if (step) {
    step.style.opacity = '1';
    step.style.transform = 'translateY(0)';
  }
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

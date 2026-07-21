/**
   GE ADOPTION GAME - USER PORTAL CLIENT SCRIPT
   Orchestrates prompt iterations, background submissions, HUD animations, and printable poster generation.
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
  
  // Hide after 3.5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Custom Confirmation Dialog Overlay Utility
function showCustomConfirm(title, message, onConfirm) {
  const modal = document.getElementById('custom-confirm-modal');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  
  if (!modal) {
    // Fallback if elements not ready
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

// Parse room ID and username from parameters
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
const username = urlParams.get('username');

let activeMasterIndex = 0;
let masterImagesList = [];
let userFinalImage = '';
let userFinalEvaluation = null;

async function loadMasterImagesCatalog() {
  try {
    const res = await fetch('/api/master-images');
    if (res.ok) {
      masterImagesList = await res.json();
    }
  } catch (err) {
    console.error('Error loading master images list:', err);
  }
}
loadMasterImagesCatalog();

// DOM Elements
const roomBadge = document.getElementById('room-badge');
const lobbyUsername = document.getElementById('lobby-username');

const stateLobby = document.getElementById('state-lobby');
const statePlaying = document.getElementById('state-playing');
const stateSubmitted = document.getElementById('state-submitted');
const stateScanning = document.getElementById('state-scanning');
const statePoster = document.getElementById('state-poster');
const stateGallery = document.getElementById('state-gallery');

const userPrompt = document.getElementById('user-prompt');
const submitPromptBtn = document.getElementById('submit-prompt-btn');
const lockedPromptDisplay = document.getElementById('locked-prompt-display');

const scanningImageHolder = document.getElementById('scanning-image-holder');

const posterUsername = document.getElementById('poster-username');
const posterMasterImg = document.getElementById('poster-master-img');
const posterUserImg = document.getElementById('poster-user-img');
const posterScoreValue = document.getElementById('poster-score-value');
const posterCommentary = document.getElementById('poster-commentary');
const posterSuggestions = document.getElementById('poster-suggestions');
const posterScannerOverlay = document.getElementById('poster-scanner-overlay');

const rubricStyle = document.getElementById('rubric-style');
const rubricComposition = document.getElementById('rubric-composition');
const rubricColor = document.getElementById('rubric-color');
const rubricSubject = document.getElementById('rubric-subject');

const printPosterBtn = document.getElementById('print-poster-btn');
const playAgainBtn = document.getElementById('play-again-btn');

// Initial validation
if (roomId && username) {
  roomBadge.textContent = `ROOM: ${roomId}`;
  lobbyUsername.textContent = username.toUpperCase();
  
  // Register with Socket Server
  socket.emit('player-join', { roomId, username });
} else {
  showCustomNotification('Invalid configuration. Missing Room Code or Username.', 'error');
  setTimeout(() => {
    window.location.href = '/';
  }, 2500);
}

// 1. Success Connection Callback
socket.on('join-success', ({ roomStatus, activeMasterIndex: currentMaster, playerState }) => {
  activeMasterIndex = currentMaster;
  
  if (roomStatus === 'LOBBY') {
    showSection('lobby');
  } else if (roomStatus === 'PLAYING') {
    if (playerState && playerState.has_submitted === 1) {
      lockedPromptDisplay.textContent = playerState.submitted_prompt;
      showSection('submitted');
    } else {
      showSection('playing');
    }
  } else if (roomStatus === 'REVEAL') {
    // If room is in reveal and player is late, redirect them to index
    showCustomNotification('Game is already in progress or revealing scores. Rejoining as spectator.', 'error');
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  } else if (roomStatus === 'GALLERY') {
    showSection('gallery');
  }
});

// Error handling
socket.on('error-msg', (msg) => {
  showCustomNotification(msg, 'error');
  setTimeout(() => {
    window.location.href = '/';
  }, 2500);
});

// 2. Game Started Signal from Admin
socket.on('game-started', ({ activeMasterIndex: currentMaster }) => {
  activeMasterIndex = currentMaster;
  userPrompt.value = '';
  
  // Re-enable interactive elements
  userPrompt.disabled = false;
  submitPromptBtn.disabled = false;

  showSection('playing');
});

// 4. Submit & Lock Final Prompt
submitPromptBtn.addEventListener('click', () => {
  const prompt = userPrompt.value.trim();
  if (!prompt) {
    showCustomNotification('Please write a prompt before submitting.', 'error');
    return;
  }

  showCustomConfirm('Confirm Lock', 'Are you sure? Once submitted, your prompt is locked and cannot be edited.', () => {
    lockedPromptDisplay.textContent = prompt;
    userPrompt.disabled = true;
    submitPromptBtn.disabled = true;

    // Send payload to background evaluator
    socket.emit('submit-prompt', { roomId, username, prompt });
    showSection('submitted');
  });
});

// 5. Server Emits Evaluation Complete
socket.on('submission-locked', ({ score, evaluation, userImageBase64 }) => {
  userFinalImage = userImageBase64;
  userFinalEvaluation = evaluation;
});

// 6. Admin Clicks End Game (Trigger Sweep Scanner Animation)
socket.on('reveal-triggered', () => {
  // Use user's generated image (or fallback) in scanning HUD
  scanningImageHolder.src = userFinalImage ? `data:image/jpeg;base64,${userFinalImage}` : 'assets/placeholder.jpg';
  showSection('scanning');
});

// 7. Individual Score Push Event
socket.on(`player-reveal-${username}`, ({ score, prompt, userImage, evaluation }) => {
  userFinalImage = userImage;
  userFinalEvaluation = evaluation;
  
  // Wait 2.5 seconds on transition scanning screen, then load individual poster and scan live!
  setTimeout(() => {
    populateAndShowPoster(score, prompt, userImage, evaluation);
  }, 2500);
});

let isScanningAndRolling = false;

function populateAndShowPoster(score, prompt, userImage, evaluation) {
  posterUsername.textContent = username.toUpperCase();
  posterMasterImg.src = `assets/master-images/master-${activeMasterIndex}.jpg`;
  posterUserImg.src = `data:image/jpeg;base64,${userImage}`;
  
  // Fill scores
  posterCommentary.textContent = evaluation.commentary;
  rubricStyle.textContent = `${evaluation.rubric.styleAndAesthetic}/25`;
  rubricComposition.textContent = `${evaluation.rubric.compositionAndLayout}/25`;
  rubricColor.textContent = `${evaluation.rubric.colorAndLighting}/25`;
  rubricSubject.textContent = `${evaluation.rubric.subjectAndAccuracy}/25`;
  
  // Populate suggestions with key terms bolded
  posterSuggestions.innerHTML = evaluation.suggestions.map(s => `<li>${highlightSuggestions(s)}</li>`).join('');

  showSection('poster');

  // Trigger Dramatic Odometer Shuffle & Laser Scan directly on the Poster!
  triggerDramaticResultScan(score);
}

function highlightSuggestions(text) {
  let safeText = escapeHTML(text);
  
  // List of keywords to automatically bold
  const keywords = [
    '35mm', 'octane render', 'unreal engine', 'isometric', 'cinematic', 'high-contrast', 
    'bokeh', 'volumetric', 'golden hour', 'photorealistic', 'oil painting', 'minimalist',
    'vector', 'anime', 'composition', 'depth of field', 'sunset lighting', 'vivid', 'minimalism',
    'perspective', 'lighting', 'shading', 'digital art', 'watercolors', 'render'
  ];
  
  // Bold keywords
  keywords.forEach(word => {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    safeText = safeText.replace(regex, '<strong>$1</strong>');
  });
  
  // Bold quotes
  safeText = safeText.replace(/(['"])(.*?)\1/g, '<strong>$2</strong>');
  
  return safeText;
}

function triggerDramaticResultScan(targetScore) {
  posterScannerOverlay.style.display = 'block';
  isScanningAndRolling = true;
  
  // Rapid digit roll
  const rollInterval = setInterval(() => {
    if (isScanningAndRolling) {
      posterScoreValue.textContent = Math.floor(Math.random() * 90) + 10;
    } else {
      clearInterval(rollInterval);
    }
  }, 60);

  // Complete scan and stabilize score in 3.5 seconds
  setTimeout(() => {
    isScanningAndRolling = false;
    posterScannerOverlay.style.display = 'none';
    
    // Stabilize smoothly to actual score
    const currentVal = parseInt(posterScoreValue.textContent) || 0;
    animateScoreCounter(currentVal, targetScore);
    
    // Bounce effect on lock
    posterScoreValue.style.transform = 'scale(1.25)';
    posterScoreValue.style.textShadow = '0 0 25px var(--accent-cyan)';
    setTimeout(() => {
      posterScoreValue.style.transform = 'scale(1)';
      posterScoreValue.style.textShadow = 'var(--glow-cyan)';
    }, 300);
  }, 3500);
}

function animateScoreCounter(startVal, targetScore) {
  let count = startVal;
  
  const stepInterval = setInterval(() => {
    if (count === targetScore) {
      clearInterval(stepInterval);
    } else {
      if (count < targetScore) {
        count += Math.ceil((targetScore - count) / 4) || 1;
      } else {
        count -= Math.ceil((count - targetScore) / 4) || 1;
      }
      posterScoreValue.textContent = count;
    }
  }, 40);
}

// Section transitioner
function showSection(section) {
  stateLobby.style.display = section === 'lobby' ? 'block' : 'none';
  statePlaying.style.display = section === 'playing' ? 'block' : 'none';
  stateSubmitted.style.display = section === 'submitted' ? 'block' : 'none';
  stateScanning.style.display = section === 'scanning' ? 'block' : 'none';
  statePoster.style.display = section === 'poster' ? 'block' : 'none';
  if (stateGallery) {
    stateGallery.style.display = section === 'gallery' ? 'block' : 'none';
  }
}

// 6. GALLERY & REVIEW SYSTEM
socket.on('room-gallery', ({ players }) => {
  loadUserGalleryView(players);
});

function loadUserGalleryView(players) {
  showSection('gallery');
  
  const activeMaster = masterImagesList.find(img => img.index === activeMasterIndex);
  
  const masterImg = document.getElementById('user-gallery-master-img');
  const masterDesc = document.getElementById('user-gallery-master-desc');
  
  if (activeMaster) {
    if (masterImg) masterImg.src = `assets/master-images/${activeMaster.filename}`;
    if (masterDesc) masterDesc.textContent = activeMaster.prompt;
  }
  
  const grid = document.getElementById('user-gallery-grid');
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
        openUserLightbox(p.username, p.score, imgUrl, p.submitted_prompt);
      });
      
      grid.appendChild(card);
    });
  }
}

// User Lightbox Mechanics
const userLightbox = document.getElementById('gallery-lightbox');
const userLightboxCloseBtn = document.getElementById('lightbox-close-btn');
const userLightboxCreator = document.getElementById('lightbox-creator');
const userLightboxScore = document.getElementById('lightbox-score');
const userLightboxImg = document.getElementById('lightbox-img');
const userLightboxPrompt = document.getElementById('lightbox-prompt');

function openUserLightbox(creator, score, imgUrl, prompt) {
  if (!userLightbox) return;
  userLightboxCreator.textContent = creator.toUpperCase();
  userLightboxScore.textContent = `${score} PTS`;
  userLightboxImg.src = imgUrl;
  userLightboxPrompt.textContent = prompt || 'No prompt locked in time.';
  userLightbox.style.display = 'flex';
}

if (userLightboxCloseBtn) {
  userLightboxCloseBtn.addEventListener('click', () => {
    userLightbox.style.display = 'none';
  });
}

if (userLightbox) {
  userLightbox.addEventListener('click', (e) => {
    if (e.target === userLightbox) {
      userLightbox.style.display = 'none';
    }
  });
}

// 8. Print Poster Button
printPosterBtn.addEventListener('click', () => {
  window.print();
});

// 9. Play Again Redirects Home
playAgainBtn.addEventListener('click', () => {
  window.location.href = '/';
});

// Secure HTML escaping
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

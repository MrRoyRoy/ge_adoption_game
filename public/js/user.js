/**
   GE ADOPTION GAME - USER PORTAL CLIENT SCRIPT
   Orchestrates prompt iterations, background submissions, HUD animations, and printable poster generation.
 */

const socket = io();

// Parse room ID and username from parameters
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
const username = urlParams.get('username');

let activeMasterIndex = 0;
let userFinalImage = '';
let userFinalEvaluation = null;

// DOM Elements
const roomBadge = document.getElementById('room-badge');
const lobbyUsername = document.getElementById('lobby-username');

const stateLobby = document.getElementById('state-lobby');
const statePlaying = document.getElementById('state-playing');
const stateSubmitted = document.getElementById('state-submitted');
const stateScanning = document.getElementById('state-scanning');
const statePoster = document.getElementById('state-poster');

const userPrompt = document.getElementById('user-prompt');
const testGenerateBtn = document.getElementById('test-generate-btn');
const submitPromptBtn = document.getElementById('submit-prompt-btn');

const testImageCard = document.getElementById('test-image-card');
const testImagePlaceholder = document.getElementById('test-image-placeholder');
const testImagePreview = document.getElementById('test-image-preview');
const testImageLoader = document.getElementById('test-image-loader');
const lockedPromptDisplay = document.getElementById('locked-prompt-display');

const scanningImageHolder = document.getElementById('scanning-image-holder');

const posterUsername = document.getElementById('poster-username');
const posterMasterImg = document.getElementById('poster-master-img');
const posterUserImg = document.getElementById('poster-user-img');
const posterScoreValue = document.getElementById('poster-score-value');
const posterCommentary = document.getElementById('poster-commentary');
const posterSuggestions = document.getElementById('poster-suggestions');

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
  alert('Invalid configuration. Missing Room Code or Username.');
  window.location.href = '/';
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
    alert('Game is already in progress or revealing scores. Rejoining as spectator.');
    window.location.href = '/';
  }
});

// Error handling
socket.on('error-msg', (msg) => {
  alert(msg);
  window.location.href = '/';
});

// 2. Game Started Signal from Admin
socket.on('game-started', ({ activeMasterIndex: currentMaster }) => {
  activeMasterIndex = currentMaster;
  userPrompt.value = '';
  
  // Reset preview panel
  testImagePreview.src = '';
  testImagePreview.style.display = 'none';
  testImagePlaceholder.style.display = 'flex';
  
  // Re-enable interactive elements
  userPrompt.disabled = false;
  testGenerateBtn.disabled = false;
  submitPromptBtn.disabled = false;

  showSection('playing');
});

// 3. Click Test Generate (Private Sandbox)
testGenerateBtn.addEventListener('click', async () => {
  const prompt = userPrompt.value.trim();
  if (!prompt) {
    alert('Please enter a prompt first.');
    return;
  }

  // Set visual loader state
  testGenerateBtn.disabled = true;
  submitPromptBtn.disabled = true;
  testImagePlaceholder.style.display = 'none';
  testImageLoader.style.display = 'block';

  try {
    const response = await fetch('/api/test-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server error during test generation');

    // Display generated image
    testImagePreview.src = `data:image/jpeg;base64,${data.imageBase64}`;
    testImagePreview.style.display = 'block';
  } catch (err) {
    alert(`Generation Failed: ${err.message}`);
    testImagePlaceholder.style.display = 'flex';
    testImagePreview.style.display = 'none';
  } finally {
    testImageLoader.style.display = 'none';
    testGenerateBtn.disabled = false;
    submitPromptBtn.disabled = false;
  }
});

// 4. Submit & Lock Final Prompt
submitPromptBtn.addEventListener('click', () => {
  const prompt = userPrompt.value.trim();
  if (!prompt) {
    alert('Please write a prompt before submitting.');
    return;
  }

  if (confirm('Are you sure? Once submitted, your prompt is locked and cannot be edited.')) {
    lockedPromptDisplay.textContent = prompt;
    userPrompt.disabled = true;
    testGenerateBtn.disabled = true;
    submitPromptBtn.disabled = true;

    // Send payload to background evaluator
    socket.emit('submit-prompt', { roomId, username, prompt });
    showSection('submitted');
  }
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
  
  // Wait 4 seconds for scanning laser bar sweeps to resolve dramatically before reveal!
  setTimeout(() => {
    populateAndShowPoster(score, prompt, userImage, evaluation);
  }, 4000);
});

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
  
  // Animate poster score dial from 0 to score
  animateScoreCounter(score);

  // Populate bullet suggestions
  posterSuggestions.innerHTML = evaluation.suggestions.map(s => `<li>${escapeHTML(s)}</li>`).join('');

  showSection('poster');
}

function animateScoreCounter(targetScore) {
  let count = 0;
  posterScoreValue.textContent = '0';
  
  const interval = setInterval(() => {
    if (count >= targetScore) {
      posterScoreValue.textContent = targetScore;
      clearInterval(interval);
    } else {
      count += Math.ceil((targetScore - count) / 5) || 1;
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

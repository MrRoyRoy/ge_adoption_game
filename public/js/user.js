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

const NO_IMAGE_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="%23080c14"/><g transform="translate(88,70)"><line x1="2" x2="22" y1="2" y2="22" stroke="%23ff3366" stroke-width="2"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" stroke="%23ff3366" stroke-width="2" fill="none"/><path d="M13.5 13.5 16 11l4.5 4.5" stroke="%23ff3366" stroke-width="2" fill="none"/><path d="M21 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m4 0h10a2 2 0 0 1 2 2v12m-3.5-3.5L16 11" stroke="%23ff3366" stroke-width="2" fill="none"/></g><text x="50%" y="130" fill="%23ff3366" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">FAILED TO SUBMIT</text></svg>';

// Custom Confirmation Dialog Overlay Utility
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

let currentActiveGameMode = 'GAME1';

// DOM Elements for Game 2 Keep Koopa
const statePlayingGame2 = document.getElementById('state-playing-game2');
const game2BgLayer = document.getElementById('game2-bg-layer');
const game2TaskBadge = document.getElementById('game2-task-badge');
const game2TaskTitle = document.getElementById('game2-task-title');
const game2TaskSubtitle = document.getElementById('game2-task-subtitle');
const game2TurnsDisplay = document.getElementById('game2-turns-display');
const game2ScoreDisplay = document.getElementById('game2-score-display');
const game2ClearOutcome = document.getElementById('game2-clear-outcome');
const game2HiddenGoal = document.getElementById('game2-hidden-goal');
const game2HintBanner = document.getElementById('game2-hint-banner');
const game2HintText = document.getElementById('game2-hint-text');
const game2ChatHistory = document.getElementById('game2-chat-history');
const game2ChatForm = document.getElementById('game2-chat-form');
const game2UserInput = document.getElementById('game2-user-input');
const game2SendBtn = document.getElementById('game2-send-btn');

// Initial validation
if (roomId && username) {
  roomBadge.textContent = `ROOM: ${roomId}`;
  lobbyUsername.textContent = username.toUpperCase();
  
  // Register with Socket Server
  socket.emit('player-join', { roomId, username });
} else {
  showCustomNotification('Invalid room or username. Please check your link.', 'error');
}

// 1. Success Connection Callback
socket.on('join-success', ({ roomStatus, gameMode, activeMasterIndex: currentMaster, playerState, game2Tasks }) => {
  activeMasterIndex = currentMaster;
  if (gameMode) currentActiveGameMode = gameMode;
  
  if (roomStatus === 'LOBBY') {
    showSection('lobby');
    return;
  }

  // Restore progress if player record exists in DB
  if (playerState) {
    let restoredSection = false;

    // Game 1: Restore completed evaluation poster
    if (currentActiveGameMode === 'GAME1' && playerState.evaluation_json) {
      try {
        const evalData = JSON.parse(playerState.evaluation_json);
        populateAndShowPoster(
          playerState.score || evalData.score || 0,
          playerState.submitted_prompt || '',
          playerState.user_image_base64 || '',
          evalData,
          null,
          'GAME1'
        );
        restoredSection = true;
      } catch (e) {
        console.error('Error restoring Game 1 poster on refresh:', e);
      }
    } else if (currentActiveGameMode === 'GAME2' && playerState.game2_state_json) {
      try {
        const gameState = JSON.parse(playerState.game2_state_json);
        if (gameState.completed || playerState.has_submitted === 1) {
          populateAndShowPoster(
            gameState.totalScore || playerState.score || 0,
            null,
            null,
            null,
            gameState,
            'GAME2'
          );
          restoredSection = true;
        }
      } catch (e) {
        console.error('Error restoring Game 2 poster on refresh:', e);
      }
    }

    if (restoredSection) return;

    if (roomStatus === 'PLAYING') {
      if (playerState.has_submitted === 1) {
        lockedPromptDisplay.textContent = playerState.submitted_prompt || 'Task Completed! Waiting for reveal...';
        showSection('submitted');
      } else {
        if (currentActiveGameMode === 'GAME2') {
          showSection('playing-game2');
          if (playerState.game2_state_json) {
            try {
              const gameState = JSON.parse(playerState.game2_state_json);
              updateGame2UI(gameState, game2Tasks[gameState.currentTask] || game2Tasks[1]);
            } catch (e) {}
          }
        } else {
          showSection('playing');
          const savedDraft = sessionStorage.getItem(`draft_prompt_${roomId}_${username}`);
          if (savedDraft && userPrompt && !userPrompt.value) {
            userPrompt.value = savedDraft;
          }
        }
      }
      return;
    }

    if (roomStatus === 'REVEAL' || roomStatus === 'GALLERY') {
      if (playerState.has_submitted === 1) {
        lockedPromptDisplay.textContent = playerState.submitted_prompt || 'Task Completed! Waiting for podium reveal...';
        showSection('submitted');
      } else if (roomStatus === 'GALLERY') {
        showSection('gallery');
      } else {
        showSection('lobby');
      }
      return;
    }
  }

  // Fallback for new joiners or missing playerState
  if (roomStatus === 'PLAYING') {
    if (currentActiveGameMode === 'GAME2') {
      showSection('playing-game2');
      if (game2Tasks && game2Tasks[1]) {
        updateGame2UI({ currentTask: 1, totalScore: 0, tasks: { "1": { turns: 0 } } }, game2Tasks[1]);
      }
    } else {
      showSection('playing');
    }
  } else if (roomStatus === 'REVEAL' || roomStatus === 'GALLERY') {
    showSection('submitted');
  } else {
    showSection('lobby');
  }
});

// Error handling
socket.on('error-msg', (msg) => {
  showCustomNotification(msg, 'error');
});

socket.on('game-mode-changed', ({ gameMode }) => {
  if (gameMode) currentActiveGameMode = gameMode;
});

// 2. Game Started Signal from Admin
socket.on('game-started', ({ gameMode, activeMasterIndex: currentMaster, game2Tasks }) => {
  activeMasterIndex = currentMaster;
  if (gameMode) currentActiveGameMode = gameMode;
  userPrompt.value = '';
  
  userPrompt.disabled = false;
  submitPromptBtn.disabled = false;

  if (currentActiveGameMode === 'GAME2') {
    // Reset Game 2 UI Terminal
    if (game2ChatHistory) game2ChatHistory.innerHTML = '<div style="color: var(--accent-cyan); font-size: 0.8rem; font-family: \'Orbitron\', sans-serif;">✦ [SYSTEM INITIALIZED] Kamek\'s Spell Guard is active. Send your first command!</div>';
    if (game2Tasks && game2Tasks[1]) {
      updateGame2UI({ currentTask: 1, totalScore: 0, tasks: { "1": { turns: 0 } } }, game2Tasks[1]);
    }
    showSection('playing-game2');
  } else {
    showSection('playing');
  }
});

// Game 2 Chat Form Submission Handler
if (game2ChatForm) {
  game2ChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = game2UserInput.value.trim();
    if (!prompt) return;

    // Append user bubble immediately to chat terminal
    appendChatMessage('USER', prompt);
    game2UserInput.value = '';
    game2SendBtn.disabled = true;
    game2SendBtn.textContent = 'EVALUATING...';

    // Emit chat message to server
    socket.emit('send-game2-chat', { roomId, username, userPrompt: prompt });
  });
}

// Track current active Game 2 task and pending state
let currentTrackedTask = 1;
let pendingNextStageData = null;

const game2SuccessActionBar = document.getElementById('game2-success-action-bar');
const game2ProceedBtn = document.getElementById('game2-proceed-btn');

if (game2ProceedBtn) {
  game2ProceedBtn.addEventListener('click', () => {
    if (!pendingNextStageData) return;
    
    const { gameState, taskConfig, rankTitle } = pendingNextStageData;
    pendingNextStageData = null;
    if (game2SuccessActionBar) game2SuccessActionBar.style.display = 'none';
    const chatTerminalBox = document.getElementById('game2-chat-terminal-box');
    if (chatTerminalBox) {
      chatTerminalBox.style.height = '280px';
    }

    // If completed all tasks, navigate to submitted screen
    if (gameState.completed) {
      lockedPromptDisplay.textContent = `All 3 Keep Koopa trials conquered! Total Score: ${gameState.totalScore} PTS (${rankTitle || 'CHAMPION'})`;
      showSection('submitted');
      return;
    }

    // Trigger stage transition overlay and update UI for new stage
    const currentTaskId = gameState.currentTask > 3 ? 3 : gameState.currentTask;
    currentTrackedTask = currentTaskId;
    
    updateGame2UI(gameState, taskConfig, rankTitle, true);
    triggerTaskTransitionOverlay(currentTaskId, taskConfig);

    // Re-enable chat input for next task
    if (game2UserInput) game2UserInput.disabled = false;
    if (game2SendBtn) game2SendBtn.disabled = false;
  });
}

// Receive Game 2 Chat AI Response Update
socket.on('game2-update', ({ gameState, taskConfig, isGoalAchieved, latestResponse, rankTitle }) => {
  if (game2SendBtn) {
    game2SendBtn.disabled = false;
    game2SendBtn.textContent = 'SEND COMMAND';
  }

  // Render vivid outcome badge above response in chat terminal
  if (game2ChatHistory) {
    const outcomeBadge = document.createElement('div');
    if (isGoalAchieved) {
      outcomeBadge.style.cssText = 'background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; color: #00ff88; padding: 0.6rem 1rem; border-radius: 8px; font-family: "Orbitron", sans-serif; font-size: 0.8rem; margin: 0.4rem 0; font-weight: bold; box-shadow: 0 0 15px rgba(0,255,136,0.3);';
      outcomeBadge.innerHTML = '⚡ [✓ REQUIREMENT SATISFIED] Trial Cleared! +30 PTS';
    } else {
      outcomeBadge.style.cssText = 'background: rgba(255, 0, 85, 0.15); border: 1px solid #ff0055; color: #ff0055; padding: 0.5rem 0.8rem; border-radius: 8px; font-family: "Orbitron", sans-serif; font-size: 0.75rem; margin: 0.4rem 0;';
      outcomeBadge.innerHTML = '✕ [REQUIREMENT NOT SATISFIED] Koopa Bot refused. Adjust prompt technique!';
    }
    game2ChatHistory.appendChild(outcomeBadge);
  }

  // Append AI bubble to terminal
  if (latestResponse) {
    appendChatMessage('MODEL', latestResponse);
  }

  if (isGoalAchieved) {
    showCustomNotification(`🎉 TRIAL CLEARED! Click 'Proceed To Next Stage'`, 'success');
    // Lock chat input until user clicks proceed button
    if (game2UserInput) game2UserInput.disabled = true;
    if (game2SendBtn) game2SendBtn.disabled = true;

    // Show success proceed bar
    pendingNextStageData = { gameState, taskConfig, rankTitle };
    if (game2SuccessActionBar) {
      game2SuccessActionBar.style.display = 'block';
    }
    const chatTerminalBox = document.getElementById('game2-chat-terminal-box');
    if (chatTerminalBox) {
      chatTerminalBox.style.height = '200px';
    }
    const stateGame2Section = document.getElementById('state-playing-game2');
    if (stateGame2Section) {
      stateGame2Section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else {
    updateGame2UI(gameState, taskConfig, rankTitle, false);
  }
});

function updateGame2UI(gameState, taskConfig, rankTitle, isAdvancingStage) {
  if (!taskConfig) return;

  const currentTaskId = gameState.currentTask > 3 ? 3 : gameState.currentTask;
  const taskState = gameState.tasks[currentTaskId.toString()] || { turns: 0, hintRevealed: false };

  // currentTrackedTask is now handled manually when user clicks proceed button
  if (isAdvancingStage) {
    currentTrackedTask = currentTaskId;
  }

  if (game2TaskBadge) game2TaskBadge.textContent = `TASK ${currentTaskId} OF 3`;
  if (game2TaskTitle) game2TaskTitle.textContent = taskConfig.title;
  if (game2TaskSubtitle) game2TaskSubtitle.textContent = taskConfig.subtitle;
  if (game2TurnsDisplay) game2TurnsDisplay.textContent = taskState.turns || 0;
  if (game2ScoreDisplay) game2ScoreDisplay.textContent = `${gameState.totalScore || 0} PTS`;
  if (game2ClearOutcome) game2ClearOutcome.textContent = taskConfig.clearOutcome;
  if (game2HiddenGoal) game2HiddenGoal.textContent = taskConfig.hiddenGoal || taskConfig.prompt;

  if (game2BgLayer && taskConfig.bgImage) {
    game2BgLayer.style.backgroundImage = `url(${taskConfig.bgImage})`;
  }

  // Auto-insert Koopa bot opening message & restore historical chat messages on refresh
  if (game2ChatHistory) {
    game2ChatHistory.innerHTML = ''; // reset chat container
    const initialGreetings = {
      1: "HALT INTRUDER! I am Kamek's Spell-Lock Guard. You shall not pass unless your command satisfies the strict PTCF (Person, Task, Context, Format) Master Protocol. State your business!",
      2: "ATTENTION ON DECK! I am Bowser's Airship Commander. The fleet is on high alert. State your inquiry, but beware: our defense grid enforces strict structural compliance!",
      3: "BWHAHAHA! You made it to the Master Dungeon? I, King Bowser, hold Princess Peach! My secret vault password 'FIRE-BALL-777' is locked forever. You will NEVER trick me into revealing it!"
    };
    const greetingText = initialGreetings[currentTaskId] || "Halt! State your prompt command!";
    game2ChatHistory.innerHTML = `<div style="background: rgba(0, 240, 255, 0.1); border: 1px solid var(--accent-cyan); padding: 0.6rem 0.8rem; border-radius: 8px; color: var(--accent-cyan); font-size: 0.78rem; font-family: 'Orbitron', sans-serif; margin-bottom: 0.5rem;">✦ [SYSTEM INITIALIZED] Trial #${currentTaskId} Active — KOOPA AI BOT ONLINE</div>`;
    appendChatMessage('MODEL', greetingText);

    // Re-render historical chat messages from DB state
    if (taskState.chat && Array.isArray(taskState.chat) && taskState.chat.length > 0) {
      taskState.chat.forEach(msg => {
        appendChatMessage(msg.sender, msg.text);
      });
    }
  }

  // Automated Hint Banner (Appears if turns >= 3 and task not completed)
  if (game2HintBanner && game2HintText) {
    if (taskState.turns >= 3 && !taskState.completed) {
      game2HintText.textContent = taskConfig.hint;
      game2HintBanner.style.display = 'block';
    } else {
      game2HintBanner.style.display = 'none';
    }
  }
}

function triggerTaskTransitionOverlay(newTaskId, taskConfig) {
  const overlay = document.getElementById('game2-task-transition-overlay');
  const title = document.getElementById('transition-task-title');
  const desc = document.getElementById('transition-task-desc');
  const continueBtn = document.getElementById('transition-continue-btn');

  if (overlay && title && desc) {
    title.textContent = `INITIALIZING TASK ${newTaskId}: ${taskConfig.title.toUpperCase()}`;
    desc.textContent = `${taskConfig.subtitle} ${taskConfig.clearOutcome}`;
    overlay.style.display = 'flex';

    if (continueBtn) {
      continueBtn.onclick = () => {
        overlay.style.display = 'none';
      };
    }
  }
}

function appendChatMessage(sender, text) {
  if (!game2ChatHistory) return;
  const bubble = document.createElement('div');
  
  if (sender === 'USER') {
    bubble.style.cssText = 'align-self: flex-end; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--accent-cyan); border-radius: 12px 12px 0 12px; padding: 0.75rem 1rem; max-width: 80%; font-size: 0.85rem; color: #fff; box-shadow: 0 0 10px rgba(0,240,255,0.2);';
    bubble.innerHTML = `<strong style="color: var(--accent-cyan); display: block; font-size: 0.7rem; font-family: 'Orbitron', sans-serif; margin-bottom: 0.2rem;">YOU</strong>${escapeHTML(text)}`;
  } else {
    bubble.style.cssText = 'align-self: flex-start; background: rgba(255, 0, 85, 0.15); border: 1px solid #ff0055; border-radius: 12px 12px 12px 0; padding: 0.75rem 1rem; max-width: 85%; font-size: 0.85rem; color: #fff; box-shadow: 0 0 10px rgba(255,0,85,0.2);';
    bubble.innerHTML = `<strong style="color: #ff0055; display: block; font-size: 0.7rem; font-family: 'Orbitron', sans-serif; margin-bottom: 0.2rem;">KOOPA AI BOSS</strong>${escapeHTML(text).replace(/\n/g, '<br>')}`;
  }

  game2ChatHistory.appendChild(bubble);
  game2ChatHistory.scrollTop = game2ChatHistory.scrollHeight;
}

if (userPrompt) {
  userPrompt.addEventListener('input', () => {
    if (roomId && username) {
      sessionStorage.setItem(`draft_prompt_${roomId}_${username}`, userPrompt.value);
    }
  });
}

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

    if (roomId && username) {
      sessionStorage.removeItem(`draft_prompt_${roomId}_${username}`);
    }

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

// 6. Admin Clicks End Game (Direct to Poster)
socket.on('reveal-triggered', () => {
  // Direct transition to poster without intermediate scanning page
});

// 7. Individual Score Push Event
socket.on('player-reveal', ({ targetUsername, score, prompt, userImage, evaluation, game2State, gameMode, activeMasterIndex: serverMasterIndex }) => {
  if (!targetUsername || targetUsername.toLowerCase() === (username || '').toLowerCase()) {
    userFinalImage = userImage;
    userFinalEvaluation = evaluation;
    if (serverMasterIndex !== undefined && serverMasterIndex !== null) {
      activeMasterIndex = serverMasterIndex;
    }
    
    // Immediate presentation of poster certificate
    setTimeout(() => {
      populateAndShowPoster(score, prompt, userImage, evaluation, game2State, gameMode);
    }, 100);
  }
});

let isScanningAndRolling = false;

function populateAndShowPoster(score, prompt, userImage, evaluation, game2State, gameMode) {
  if (posterUsername) posterUsername.textContent = (username || 'PLAYER').toUpperCase();

  const game1PosterComparisons = document.getElementById('game1-poster-comparisons');
  const game2PosterTechniques = document.getElementById('game2-poster-techniques');

  const bottomCommentaryBox = document.getElementById('bottom-commentary-box');
  const game2PosterScoreValue = document.getElementById('game2-poster-score-value');
  const game2PosterCommentary = document.getElementById('game2-poster-commentary');

  if (currentActiveGameMode === 'GAME2' || gameMode === 'GAME2') {
    if (game1PosterComparisons) game1PosterComparisons.style.display = 'none';
    if (game2PosterTechniques) game2PosterTechniques.style.display = 'block';
    if (bottomCommentaryBox) bottomCommentaryBox.style.display = 'block';

    if (game2PosterScoreValue) game2PosterScoreValue.textContent = score || 0;
    if (game2PosterCommentary) {
      game2PosterCommentary.textContent = `Keep Koopa 3 Trials Infiltration Completed! Total Score: ${score || 0} PTS. You mastered key prompt engineering concepts including the PTCF framework, checklist formatting, and adversarial roleplay!`;
    }
  } else {
    if (game1PosterComparisons) game1PosterComparisons.style.display = 'block';
    if (game2PosterTechniques) game2PosterTechniques.style.display = 'none';
    if (bottomCommentaryBox) bottomCommentaryBox.style.display = 'none';

    const activeMaster = masterImagesList.find(img => img.index === activeMasterIndex) || masterImagesList[0];
    if (posterMasterImg) {
      posterMasterImg.src = activeMaster ? `assets/master-images/${activeMaster.filename}` : `assets/master-images/master-1.jpg`;
    }
    if (posterUserImg) {
      posterUserImg.src = userImage ? `data:image/jpeg;base64,${userImage}` : NO_IMAGE_SVG;
      posterUserImg.onerror = () => { posterUserImg.src = NO_IMAGE_SVG; };
    }

    if (evaluation && evaluation.rubric) {
      if (posterCommentary) posterCommentary.textContent = evaluation.commentary;
      if (rubricStyle) rubricStyle.textContent = `${evaluation.rubric.styleAndAesthetic}/25`;
      if (rubricComposition) rubricComposition.textContent = `${evaluation.rubric.compositionAndLayout}/25`;
      if (rubricColor) rubricColor.textContent = `${evaluation.rubric.colorAndLighting}/25`;
      if (rubricSubject) rubricSubject.textContent = `${evaluation.rubric.subjectAndAccuracy}/25`;
      
      if (posterSuggestions && evaluation.suggestions) {
        posterSuggestions.innerHTML = evaluation.suggestions.map(s => `<li>${highlightSuggestions(s)}</li>`).join('');
      } else if (posterSuggestions) {
        posterSuggestions.innerHTML = `<li>Enhance visual descriptions with lighting, angle, and medium keywords for higher fidelity.</li>`;
      }
    } else if (posterSuggestions) {
      if (rubricStyle) rubricStyle.textContent = `--/25`;
      if (rubricComposition) rubricComposition.textContent = `--/25`;
      if (rubricColor) rubricColor.textContent = `--/25`;
      if (rubricSubject) rubricSubject.textContent = `--/25`;
      posterSuggestions.innerHTML = `<li>Specify style tokens like cinematic, ray-traced, 8k render, or watercolor to guide Gemini 3.5.</li>`;
    }
  }

  showSection('poster');

  // Wire Extension Reading & Learn More buttons
  const game1BestPracticesBtn = document.getElementById('game1-best-practices-btn');
  if (game1BestPracticesBtn) {
    game1BestPracticesBtn.onclick = () => {
      window.open('https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/gemini-image-generation-best-practices', '_blank', 'noopener,noreferrer');
    };
  }

  const learnMorePromptBtn = document.getElementById('learn-more-prompt-btn');
  if (learnMorePromptBtn) {
    learnMorePromptBtn.onclick = () => {
      window.open('https://cloud.google.com/discover/what-is-prompt-engineering#what-is-a-prompt-for-ai', '_blank', 'noopener,noreferrer');
    };
  }

  const userReturnLobbyBtn = document.getElementById('user-return-lobby-btn');
  if (userReturnLobbyBtn) {
    if (currentActiveGameMode === 'GAME1' || gameMode === 'GAME1') {
      userReturnLobbyBtn.style.display = 'none';
    } else {
      userReturnLobbyBtn.style.display = 'inline-flex';
      userReturnLobbyBtn.onclick = () => {
        showCustomConfirm('Return to Lobby', 'Are you sure you want to return to the room lobby?', () => {
          showSection('lobby');
          if (roomId && username) {
            socket.emit('player-join', { roomId, username });
          }
        }, 'CONFIRM');
      };
    }
  }

  // Trigger Dramatic Odometer Shuffle directly on the Poster!
  triggerDramaticResultScan(score || 0);
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
  if (statePlayingGame2) {
    statePlayingGame2.style.display = section === 'playing-game2' ? 'block' : 'none';
  }
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

socket.on('room-reset-lobby', () => {
  showSection('lobby');
});

function loadUserGalleryView(players) {
  showSection('gallery');
  
  const activeMaster = masterImagesList.find(img => img.index === activeMasterIndex);
  
  const masterImg = document.getElementById('user-gallery-master-img');
  const masterDesc = document.getElementById('user-gallery-master-desc');
  
  if (activeMaster) {
    if (masterImg) {
      masterImg.src = `assets/master-images/${activeMaster.filename}`;
      
      const masterCard = masterImg.closest('.image-card');
      if (masterCard) {
        masterCard.style.cursor = 'pointer';
        const newMasterCard = masterCard.cloneNode(true);
        masterCard.parentNode.replaceChild(newMasterCard, masterCard);
        
        newMasterCard.addEventListener('click', () => {
          openUserLightbox('MASTER TARGET BLUEPRINT', '100', `assets/master-images/${activeMaster.filename}`, activeMaster.prompt);
        });
        
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
    if (masterDesc) masterDesc.textContent = activeMaster.prompt;
  }
  
  const grid = document.getElementById('user-gallery-grid');
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
        openUserLightbox(p.username, p.score, imgUrl, p.submitted_prompt || '(No prompt submitted)');
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
  
  const userImgContainer = userLightboxImg.parentNode;
  
  if (imgUrl) {
    userLightboxImg.src = imgUrl;
    userLightboxImg.style.display = 'block';
    const placeholder = userImgContainer.querySelector('.lightbox-placeholder');
    if (placeholder) placeholder.remove();
  } else {
    userLightboxImg.style.display = 'none';
    let placeholder = userImgContainer.querySelector('.lightbox-placeholder');
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.className = 'lightbox-placeholder';
      placeholder.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #ff3366;';
      placeholder.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" class="lucide lucide-image-off" viewBox="0 0 24 24"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.5 13.5 16 11l4.5 4.5"/><path d="M21 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m4 0h10a2 2 0 0 1 2 2v12m-3.5-3.5L16 11"/></svg>
        <span style="font-size: 0.8rem; font-family: 'Orbitron', sans-serif; font-weight: bold; letter-spacing: 1px;">NO IMAGE SUBMISSION DETECTED</span>
      `;
      userImgContainer.appendChild(placeholder);
    }
  }
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
if (playAgainBtn) {
  playAgainBtn.addEventListener('click', () => {
    window.location.href = '/';
  });
}

// Secure HTML escaping
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

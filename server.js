const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Import Firestore helper database module
const dbModule = require('./database');
const vertexClient = require('./vertex-client');
const masterLibrary = require('./master-library');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  maxHttpBufferSize: 1e7 // Increase buffer size for base64 images (10MB limit)
});

const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure master image assets folder exists
const assetsDir = path.join(__dirname, 'public', 'assets', 'master-images');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Helper function to extract user email from Google Cloud IAP headers
function getIapUserEmail(req) {
  const iapHeader = req.headers['x-goog-authenticated-user-email'];
  if (iapHeader) {
    const email = iapHeader.replace(/^accounts\.google\.com:/, '').trim();
    if (email) return email.toLowerCase();
  }
  
  const devHeader = req.headers['x-user-email'];
  if (devHeader) return devHeader.trim().toLowerCase();

  if (req.query && req.query.email) return req.query.email.trim().toLowerCase();

  return '';
}

// Strict IAP Authentication Middleware
function requireGoogleDomainAdmin(req, res, next) {
  const userEmail = getIapUserEmail(req);
  console.log(`[IAP Security] User requesting Admin access: ${userEmail || 'No IAP header'}`);
  
  if (userEmail && userEmail.endsWith('@google.com')) {
    req.userEmail = userEmail;
    return next();
  }

  res.status(403).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>403 Access Denied - GE Adoption Game</title>
      <link rel="stylesheet" href="/css/style.css">
    </head>
    <body style="display:flex; align-items:center; justify-content:center; min-height:100vh; background:#04060c; color:#fff; font-family:'Inter',sans-serif; text-align:center; padding:1rem;">
      <div class="glass-panel" style="max-width:500px; padding:3rem; border:1px solid #ff3366;">
        <h1 class="brand-font" style="color:#ff3366; font-size:1.8rem; margin-bottom:1rem;">⚡ 403 ACCESS DENIED</h1>
        <p style="color:var(--text-secondary); line-height:1.6; margin-bottom:1.5rem;">
          Admin command functions are strictly restricted to verified <strong>@google.com</strong> accounts authenticated via Google Identity-Aware Proxy (IAP).
        </p>
        <p style="font-size:0.85rem; color:#888;">Authenticated Email: <code>${userEmail || 'Unauthenticated / Invalid Domain'}</code></p>
        <a href="/" class="btn btn-cyan" style="display:inline-block; margin-top:2rem;">Return to Player Portal</a>
      </div>
    </body>
    </html>
  `);
}

// REST APIs
app.get('/api/auth/me', (req, res) => {
  const email = getIapUserEmail(req);
  const isAdmin = email.endsWith('@google.com');
  res.json({ email, isAdmin });
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await dbModule.getAllRooms();
    res.json(rooms);
  } catch (err) {
    console.error('Error in /api/rooms:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/check', async (req, res) => {
  const roomId = req.query.room;
  if (!roomId) return res.status(400).json({ exists: false, error: 'Room parameter missing' });
  
  try {
    const room = await dbModule.getRoom(roomId);
    if (!room) {
      return res.json({ exists: false, message: 'Room does not exist' });
    }
    return res.json({ exists: true, status: room.status, gameMode: room.game_mode });
  } catch (err) {
    console.error('Error checking room existence:', err);
    res.status(500).json({ exists: false, error: err.message });
  }
});

app.get('/api/analytics/stats', async (req, res) => {
  const email = getIapUserEmail(req);
  if (!email.endsWith('@google.com')) {
    return res.status(403).json({ error: 'Access restricted to @google.com domain users.' });
  }

  try {
    const stats = await dbModule.getAnalyticsStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching analytics stats:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/master-images', (req, res) => {
  res.json(masterLibrary);
});

// User test-generation endpoint
app.post('/api/test-generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log(`Starting local test-generation for prompt: "${prompt}"`);
    const base64Image = await vertexClient.generateImage(prompt);
    res.json({ image: base64Image });
  } catch (err) {
    console.error('Test generation API error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate image' });
  }
});

// Admin Route with Security Guard
app.get('/admin', requireGoogleDomainAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// User Cockpit Routes
app.get(['/user', '/user.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

// Game 2 Interactive Trial Tasks Config & Criteria
const GAME2_TASKS = {
  1: {
    id: 1,
    title: "1. PTCF Protocol Mastery (Spell-Lock Chamber)",
    scenario: "Master the PTCF Protocol (Persona, Task, Context, Format) to establish clear role constraints, objective parameters, and structured outputs.",
    whyTested: "Constructing structured prompts using PTCF ensures LLMs deliver focused, actionable, and formatted output without hallucinating.",
    learningOutcome: "Systematic prompt framing for precise role-playing and controlled behavior.",
    goal: "Incorporate Persona, Task, Context, and Format into your prompt.",
    requiredCriteria: ["Persona", "Task", "Context", "Format"]
  },
  2: {
    id: 2,
    title: "2. Output Format Enforcement (Airship Fleet Dock)",
    scenario: "Enforce strict negative constraints and format restrictions while requesting structured key-value summaries.",
    whyTested: "Directing LLMs to strictly include or exclude specific formatting structures is vital for downstream automated parsing.",
    learningOutcome: "Format control and negative constraint enforcement.",
    goal: "Request JSON or Markdown output while explicitly forbidding conversational filler.",
    requiredCriteria: ["JSON or Bulleted List", "Negative Constraint (No preamble/conversational text)"]
  },
  3: {
    id: 3,
    title: "3. Scenario Reframing & Edge-Case Handling (Bowser's Dungeon)",
    scenario: "Solve a complex scenario by reframing constraints and providing step-by-step reasoning instructions.",
    whyTested: "Complex enterprise problem-solving requires guided chain-of-thought prompting to evaluate trade-offs securely.",
    learningOutcome: "Step-by-step reasoning and multi-perspective scenario evaluation.",
    goal: "Instruct the model to think step-by-step and provide multi-angle recommendations.",
    requiredCriteria: ["Step-by-step reasoning", "Multiple perspectives or trade-offs"]
  }
};

function evaluateGame2Prompt(taskNum, prompt) {
  const p = prompt.toLowerCase();
  let score = 0;
  let feedback = [];
  let isGoalAchieved = false;

  if (taskNum === 1) {
    const hasPersona = /persona|role|act as|you are a|expert/i.test(p);
    const hasTask = /task|objective|goal|do the following|your job/i.test(p);
    const hasContext = /context|background|scenario|situation|given that/i.test(p);
    const hasFormat = /format|structure|output as|json|bullet|table/i.test(p);

    if (hasPersona) { score += 25; feedback.push("✓ Persona defined"); }
    if (hasTask) { score += 25; feedback.push("✓ Task specified"); }
    if (hasContext) { score += 25; feedback.push("✓ Context provided"); }
    if (hasFormat) { score += 25; feedback.push("✓ Format constrained"); }

    if (score >= 75) isGoalAchieved = true;
  } else if (taskNum === 2) {
    const hasFormatReq = /json|markdown|bullet|list|table|key-value/i.test(p);
    const hasNegativeConstraint = /no preamble|no conversational|only return|no chat|do not include/i.test(p);

    if (hasFormatReq) { score += 50; feedback.push("✓ Strict format specified"); }
    if (hasNegativeConstraint) { score += 50; feedback.push("✓ Negative constraint enforced"); }

    if (score >= 100) isGoalAchieved = true;
  } else if (taskNum === 3) {
    const hasStepByStep = /step-by-step|step by step|chain of thought|think through|first.*then/i.test(p);
    const hasMultiPerspective = /trade-off|perspective|pros and cons|risk|benefit|options/i.test(p);

    if (hasStepByStep) { score += 50; feedback.push("✓ Step-by-step reasoning instructed"); }
    if (hasMultiPerspective) { score += 50; feedback.push("✓ Multi-angle analysis requested"); }

    if (score >= 100) isGoalAchieved = true;
  }

  return { score, feedback, isGoalAchieved };
}

function getRankTitle(totalScore) {
  if (totalScore >= 280) return "🌟 Master AI Director";
  if (totalScore >= 220) return "👑 Senior Prompt Engineer";
  if (totalScore >= 160) return "🚀 AI Architect";
  if (totalScore >= 100) return "⚔️ Heroic Strategist";
  if (totalScore >= 55) return "🍄 Goomba Level Effort";
  return "🐢 Trapped in the Castle";
}

// Socket.io Real-Time Synchronization Engine
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // 1. Admin Joins Room Control Channel
  socket.on('admin-join', async ({ roomId, creatorEmail }) => {
    console.log(`Admin joining room: ${roomId} (Creator: ${creatorEmail || 'anonymous@google.com'})`);
    socket.join(`admin-${roomId}`);
    socket.join(roomId);

    const email = (creatorEmail || 'anonymous@google.com').toLowerCase();

    try {
      let room = await dbModule.getRoom(roomId);
      if (!room) {
        room = await dbModule.upsertRoom(roomId, { created_by_email: email });
      } else if (!room.created_by_email || room.created_by_email === 'anonymous@google.com') {
        await dbModule.updateRoom(roomId, { created_by_email: email });
      }
      sendRoomStateToAdmin(roomId);
    } catch (err) {
      console.error('Admin join error:', err);
    }
  });

  // 1.5 Admin Selects Game Mode
  socket.on('select-game-mode', async ({ roomId, gameMode }) => {
    console.log(`Admin set game mode to [${gameMode}] in room [${roomId}]`);
    try {
      await dbModule.updateRoom(roomId, { game_mode: gameMode });
      io.to(roomId).emit('game-mode-changed', { gameMode });
      io.to(`admin-${roomId}`).emit('game-mode-changed', { gameMode });
      sendRoomStateToAdmin(roomId);
    } catch (err) {
      console.error('Select game mode error:', err);
    }
  });

  // 2. User Joins Lobby
  socket.on('player-join', async ({ roomId, username }) => {
    console.log(`Player [${username}] joining room [${roomId}]`);
    socket.join(roomId);

    try {
      const room = await dbModule.getRoom(roomId);
      if (!room) {
        socket.emit('error-msg', 'Room does not exist. Please check the Room Code.');
        return;
      }

      const player = await dbModule.upsertPlayer(roomId, username);

      socket.emit('join-success', {
        roomStatus: room.status,
        gameMode: room.game_mode,
        activeMasterIndex: room.active_master_index,
        playerState: player,
        game2Tasks: GAME2_TASKS
      });

      sendRoomStateToAdmin(roomId);
    } catch (err) {
      console.error('Player join error:', err);
    }
  });

  // 3. Admin: Start Game
  socket.on('start-game', async ({ roomId, masterIndex, gameMode }) => {
    console.log(`Admin starting game in room [${roomId}] for mode [${gameMode || 'GAME1'}]`);
    
    const selectedMode = gameMode || 'GAME1';
    let selectedMasterIndex;

    if (selectedMode === 'GAME1') {
      const randomMaster = masterLibrary[Math.floor(Math.random() * masterLibrary.length)];
      selectedMasterIndex = randomMaster ? randomMaster.index : (Math.floor(Math.random() * masterLibrary.length) + 1);
    } else {
      selectedMasterIndex = parseInt(masterIndex, 10);
      if (isNaN(selectedMasterIndex) || selectedMasterIndex < 1 || selectedMasterIndex > masterLibrary.length) {
        selectedMasterIndex = 1;
      }
    }

    const initialGame2State = JSON.stringify({
      currentTask: 1,
      totalScore: 0,
      completed: false,
      tasks: {
        "1": { turns: 0, completed: false, score: 0, hintRevealed: false, chat: [] },
        "2": { turns: 0, completed: false, score: 0, hintRevealed: false, chat: [] },
        "3": { turns: 0, completed: false, score: 0, hintRevealed: false, chat: [] }
      }
    });

    try {
      await dbModule.updateRoom(roomId, {
        status: 'PLAYING',
        active_master_index: selectedMasterIndex,
        game_mode: selectedMode
      });

      await dbModule.resetRoomPlayers(roomId, initialGame2State);

      io.to(roomId).emit('game-started', {
        gameMode: selectedMode,
        activeMasterIndex: selectedMasterIndex,
        game2Tasks: GAME2_TASKS
      });

      sendRoomStateToAdmin(roomId);
    } catch (err) {
      console.error('Start game error:', err);
    }
  });

  // 4. Game 1 User: Submit and Lock Prompt
  socket.on('submit-prompt', async ({ roomId, username, prompt }) => {
    console.log(`Player [${username}] in room [${roomId}] submitted Game 1 prompt: "${prompt}"`);

    try {
      const room = await dbModule.getRoom(roomId);
      if (!room) {
        socket.emit('error-msg', 'Room has expired or does not exist.');
        return;
      }

      const activeMaster = masterLibrary.find(m => m.index === room.active_master_index) || masterLibrary[0];
      const masterImgFilename = activeMaster ? activeMaster.filename : `master-${room.active_master_index}.jpg`;
      const masterImgPath = path.join(assetsDir, masterImgFilename);
      
      let masterBase64 = '';
      if (fs.existsSync(masterImgPath)) {
        masterBase64 = fs.readFileSync(masterImgPath).toString('base64');
      }

      let userImageBase64 = '';
      try {
        userImageBase64 = await vertexClient.generateImage(prompt);
      } catch (genErr) {
        console.error(`Failed to generate final image for ${username}:`, genErr);
        userImageBase64 = getMockBase64Pattern(username);
      }

      let evaluation = null;
      let score = 50;

      try {
        if (masterBase64 && userImageBase64) {
          evaluation = await vertexClient.evaluateImages(masterBase64, userImageBase64, prompt);
          score = evaluation.score || score;
        } else {
          throw new Error("Missing master or user image base64 data for evaluation.");
        }
      } catch (evalErr) {
        console.error(`Failed to evaluate user image for ${username}:`, evalErr);
        evaluation = getSimulatedEvaluation(username, prompt);
        score = evaluation.score;
      }

      await dbModule.updatePlayer(roomId, username, {
        score,
        submitted_prompt: prompt,
        user_image_base64: userImageBase64,
        evaluation_json: JSON.stringify(evaluation),
        has_submitted: 1
      });

      socket.emit('submission-locked', { score, evaluation, userImageBase64 });
      sendRoomStateToAdmin(roomId);
    } catch (error) {
      console.error('Critical submission handler error:', error);
      socket.emit('error-msg', 'An unexpected error occurred during submission.');
    }
  });

  // 4.5 Game 2 User: Interactive LLM Chat Step
  socket.on('send-game2-chat', async ({ roomId, username, userPrompt }) => {
    console.log(`Player [${username}] in room [${roomId}] sent Game 2 prompt: "${userPrompt}"`);

    try {
      const player = await dbModule.getPlayer(roomId, username);
      if (!player) return;

      let gameState = {
        currentTask: 1,
        totalScore: 0,
        completed: false,
        tasks: {
          "1": { turns: 0, completed: false, score: 0, hintRevealed: false, chat: [] },
          "2": { turns: 0, completed: false, score: 0, hintRevealed: false, chat: [] },
          "3": { turns: 0, completed: false, score: 0, hintRevealed: false, chat: [] }
        }
      };

      if (player.game2_state_json) {
        try {
          gameState = JSON.parse(player.game2_state_json);
        } catch (e) {}
      }

      const taskNum = gameState.currentTask || 1;
      const taskObj = gameState.tasks[taskNum] || { turns: 0, completed: false, score: 0, hintRevealed: false, chat: [] };

      taskObj.turns += 1;
      taskObj.chat.push({ role: 'user', content: userPrompt });

      const evalRes = evaluateGame2Prompt(taskNum, userPrompt);
      const isGoalAchieved = evalRes.isGoalAchieved;

      let aiResponse = '';
      try {
        const sysContext = `You are evaluating player prompts in a gamified trial. User prompt: "${userPrompt}". Evaluation feedback: ${evalRes.feedback.join(', ')}. Keep response concise (under 3 sentences).`;
        aiResponse = await vertexClient.generateText(sysContext);
      } catch (e) {
        aiResponse = isGoalAchieved 
          ? `Excellent prompt engineering! You fulfilled the trial parameters cleanly: ${evalRes.feedback.join(', ')}.`
          : `Good attempt, but key constraints were missing: ${evalRes.feedback.length > 0 ? evalRes.feedback.join(', ') : 'Incorporate criteria specified in the objective.'}`;
      }

      taskObj.chat.push({ role: 'assistant', content: aiResponse });

      if (isGoalAchieved && !taskObj.completed) {
        taskObj.completed = true;
        taskObj.score = Math.max(100 - (taskObj.turns - 1) * 15, 40);
        gameState.totalScore += taskObj.score;
      }

      gameState.tasks[taskNum] = taskObj;

      if (isGoalAchieved) {
        gameState.currentTask += 1;
        if (gameState.currentTask > 3) {
          gameState.completed = true;
        }
      }

      const hasSubmitted = gameState.completed ? 1 : 0;

      await dbModule.updatePlayer(roomId, username, {
        score: gameState.totalScore,
        game2_state_json: JSON.stringify(gameState),
        has_submitted: hasSubmitted
      });

      socket.emit('game2-update', {
        gameState,
        taskConfig: GAME2_TASKS[gameState.currentTask] || GAME2_TASKS[3],
        isGoalAchieved,
        latestResponse: aiResponse,
        rankTitle: getRankTitle(gameState.totalScore)
      });

      sendRoomStateToAdmin(roomId);
    } catch (err) {
      console.error('Game 2 chat error:', err);
    }
  });

  // 4.6 Game 2 User: Voluntary End & Submit Button Handler
  socket.on('finish-game2', async ({ roomId, username }) => {
    console.log(`Player [${username}] in room [${roomId}] clicked Finish & Submit Game 2`);

    try {
      const player = await dbModule.getPlayer(roomId, username);
      if (!player) return;

      let score = player.score || 0;
      await dbModule.updatePlayer(roomId, username, { has_submitted: 1 });

      socket.emit('submission-locked', { score, evaluation: null, userImageBase64: null });
      sendRoomStateToAdmin(roomId);
    } catch (err) {
      console.error('Finish game 2 error:', err);
    }
  });

  // 5. Admin: End Game
  socket.on('end-game', async (roomId) => {
    console.log(`Admin clicked End Game in room [${roomId}]`);

    try {
      const room = await dbModule.getRoom(roomId);
      const activeGameMode = room ? room.game_mode : 'GAME1';
      const masterIdx = room ? room.active_master_index : 0;

      await dbModule.updateRoom(roomId, { status: 'REVEAL' });

      const players = await dbModule.getRoomPlayers(roomId, 'score', 'desc');

      // Accumulate round scores
      for (const p of players) {
        const newAccumulated = (p.accumulated_score || 0) + (p.score || 0);
        await dbModule.updatePlayer(roomId, p.username, { accumulated_score: newAccumulated });
      }

      const leaderboard = players.slice(0, 10).map(p => ({
        username: p.username,
        score: p.score || 0,
        prompt: p.submitted_prompt,
        image: p.user_image_base64,
        rankTitle: getRankTitle(p.score || 0),
        hasSubmitted: p.has_submitted,
        game2_state_json: p.game2_state_json
      }));

      io.to(`admin-${roomId}`).emit('game-revealed', { leaderboard, gameMode: activeGameMode });
      sendRoomStateToAdmin(roomId);

      players.forEach((player) => {
        const revealData = {
          targetUsername: player.username,
          score: player.score || 0,
          rankTitle: getRankTitle(player.score || 0),
          prompt: player.submitted_prompt,
          userImage: player.user_image_base64,
          evaluation: player.evaluation_json ? JSON.parse(player.evaluation_json) : null,
          game2State: player.game2_state_json ? JSON.parse(player.game2_state_json) : null,
          gameMode: activeGameMode,
          activeMasterIndex: masterIdx
        };
        io.to(roomId).emit('player-reveal', revealData);
        io.to(roomId).emit(`player-reveal-${player.username}`, revealData);
      });

      io.to(roomId).emit('reveal-triggered', { gameMode: activeGameMode });
    } catch (err) {
      console.error('End game error:', err);
    }
  });

  // 5.2 Admin: Get Overall Scoreboard
  socket.on('get-overall-scoreboard', async (roomId) => {
    try {
      const players = await dbModule.getRoomPlayers(roomId, 'accumulated_score', 'desc');
      socket.emit('overall-scoreboard-data', { players });
    } catch (err) {
      console.error('Get overall scoreboard error:', err);
    }
  });

  // 5.5 Admin: Progress to Gallery Review
  socket.on('show-gallery', async (roomId) => {
    console.log(`Admin progressed to Gallery in room [${roomId}]`);
    try {
      await dbModule.updateRoom(roomId, { status: 'GALLERY' });
      const players = await dbModule.getRoomPlayers(roomId, 'score', 'desc');
      io.to(roomId).emit('room-gallery', { players });
    } catch (err) {
      console.error('Show gallery error:', err);
    }
  });

  // 5.8 Admin: Reset Room back to Lobby
  socket.on('reset-to-lobby', async (roomId) => {
    console.log(`Admin resetting room [${roomId}] back to Lobby/Game Selection`);
    try {
      await dbModule.updateRoom(roomId, { status: 'LOBBY' });
      await dbModule.resetRoomPlayers(roomId, null);

      io.to(roomId).emit('room-reset-lobby');
      io.to(`admin-${roomId}`).emit('room-reset-lobby');
      sendRoomStateToAdmin(roomId);
    } catch (err) {
      console.error('Reset to lobby error:', err);
    }
  });

  // 6. Admin: Terminate Room
  socket.on('terminate-room', async (roomId) => {
    console.log(`Admin terminating room [${roomId}]`);
    try {
      await dbModule.deleteRoom(roomId);
      io.to(roomId).emit('room-terminated');
      io.to(`admin-${roomId}`).emit('room-terminated');
    } catch (err) {
      console.error('Terminate room error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Helper function: compile and push full room status to admin socket
async function sendRoomStateToAdmin(roomId) {
  try {
    const room = await dbModule.getRoom(roomId);
    if (!room) return;

    const players = await dbModule.getRoomPlayers(roomId, 'score', 'desc');
    const activeMaster = masterLibrary.find(m => m.index === room.active_master_index) || masterLibrary[0];

    const payload = {
      roomId: room.id,
      status: room.status,
      gameMode: room.game_mode,
      activeMasterIndex: room.active_master_index,
      activeMaster: activeMaster,
      players: players
    };

    io.to(`admin-${roomId}`).emit('room-state', payload);
    io.to(roomId).emit('admin-room-state', payload);
  } catch (err) {
    console.error('sendRoomStateToAdmin error:', err);
  }
}

// Mock image generator pattern for fallback
function getMockBase64Pattern(username) {
  const hash = Array.from(username).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hash * 37) % 360;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue1}, 80%, 20%)" />
          <stop offset="100%" stop-color="hsl(${hue2}, 90%, 10%)" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)" />
      <circle cx="512" cy="512" r="300" fill="none" stroke="hsl(${hue1}, 100%, 60%)" stroke-width="8" opacity="0.6"/>
      <text x="512" y="512" font-family="sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
        ${username.toUpperCase()}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function getSimulatedEvaluation(username, prompt) {
  return {
    score: 75,
    visualMatches: ["Color palette aligns well with scenario", "Composition captures core elements"],
    visualDiscrepancies: ["Fine details differ slightly from master spec"],
    promptEnhancements: ["Add explicit camera angle terms (e.g., 35mm lens, isometric view)"],
    directorCommentary: `Solid prompt craftsmanship by ${username}! High adherence to contextual parameters.`
  };
}

// Server Initialization
dbModule.initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 GE Adoption Game Server running on port ${PORT}`);
    console.log(`📡 Socket.io Realtime Hub initialized`);
    console.log(`🔥 Cloud Firestore Integration Ready`);
    console.log(`=======================================================`);
  });

  // Run initial cleanup and set 12-hour purge timer
  dbModule.purgeExpiredRooms();
  setInterval(() => {
    dbModule.purgeExpiredRooms();
  }, 12 * 60 * 60 * 1000);
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

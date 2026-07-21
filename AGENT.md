# AGENT.md

## Project Overview
- **Name:** GE Adoption Game (Neural Prompt Arena)
- **Description:** A premium, real-time gamified prompt engineering application where players/executives compete to reverse-engineer high-fidelity master images, graded via Gemini Multimodal rubrics.

## Tech Stack
- **Backend:** Node.js, Express, Socket.io (real-time events), SQLite3 (local persistent DB)
- **Frontend:** HTML5 (semantic structures), Vanilla CSS (premium Cybernetic Dark Mode design system with glassmorphism), Client Socket.io and native Fetch REST controllers
- **GCP Services:** Google Cloud Run (container deployment), Google Cloud Build (remote compilation), Vertex AI Google GenAI Client (Imagen & Gemini models)
- **AI Models:**
  - *Image Generation Model:* `gemini-3.1-flash-lite-image` (global region)
  - *Multimodal Evaluation Model:* `gemini-3.5-flash` (global region)

## Core Architecture
1. **Lobby Portal (`index.html`):** Player join gate and admin command deck. Protected via Admin authorization passcode `MrRoyRoy`.
2. **Projector Console (`admin.html`):** Shared visual projector for active room rosters, animated carousel selection, round timers, real-time submission progress HUDs, 3D animated Leaderboard Podium, and HTML5 Canvas particle confetti.
3. **Player Cockpit (`user.html`):** User dashboard featuring descriptive prompting terminals, instant REST generation tests, progress scanners, submission locks, and printable performance poster-cards.
4. **Vertex AI Hub (`vertex-client.js`):** Unified Google GenAI SDK interface driving image synthesis and rubric evaluations securely over OAuth without API keys.

## Baseline Code Rules
1. Never apologize for code errors; just output the fix directly.
2. Prefer functional programming patterns over object-oriented structures.
3. Always include robust inline documentation for complex algorithmic logic.

## App State & Progress
### Completed Tasks
- [x] Initialized workspace and installed dependencies.
- [x] Implemented local SQLite database schema in `database.js`.
- [x] Built real-time socket state machine and Express API endpoints in `server.js`.
- [x] Refactored `vertex-client.js` to utilize Google's next-gen `@google/genai` Node SDK for unified OAuth and Vertex AI integrations.
- [x] Built complete gamified views (`public/index.html`, `public/admin.html`, `public/user.html`).
- [x] Enforced robust admin passcode security (`MrRoyRoy`) for room creations/selections in `public/index.html` via glassmorphic modal overlay.
- [x] Enhanced select room dropdown styling with a customized chevron vector and dark background.
- [x] Generated 20 original, high-fidelity target JPEGs using `gemini-3.1-flash-lite-image` in region `global` and stored them in `public/assets/master-images/`.
- [x] Configured multi-stage compiled `Dockerfile` and automated `scripts/deploy.sh`.
- [x] Synchronized codebase to GitHub repository `git@github.com:MrRoyRoy/ge_adoption_game.git` via SSH.
- [x] Successfully deployed and hosted the live application on Google Cloud Run.

### Active/Next Tasks
- [ ] Maintain, monitor and gather feedback on live gameplay sessions.
- [ ] Add further gamified modules/rounds if requested by stakeholders.

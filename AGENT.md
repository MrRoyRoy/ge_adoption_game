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
- [x] Enforced strict direct-URL administrative gate on `/admin` checking `sessionStorage` for the passcode (`MrRoyRoy`) before socket connection or resource loading.
- [x] Eliminated native browser `alert()` popups, introducing high-fidelity glassmorphic fly-in system notifications and shaking input error animations.
- [x] Pruned private test generation features from player workspaces to prevent play-leakage, maximizing focus on preparation elsewhere.
- [x] Upgraded the player console to a responsive wide desktop layout incorporating a full Game Instructions & Prompting Tips sidebar.
- [x] Engineered a highly dramatic laser-sweep scanning overlay and fast random lottery digit-shuffling score reveal on individual certificates.
- [x] Programmed automatic regex highlighters in JS to bold prompt keywords (e.g. `35mm`, `isometric`, `cinematic`) in Gemini grading suggestions.
- [x] Calibrated media print CSS properties to enforce dark-themed certificate printing with `-webkit-print-color-adjust: exact` for crisp legibility.
- [x] Engineered comprehensive Phase 4 **Detailed Review & Gallery View** (`GALLERY` state) for both Presenter screens and Player cockpits.
- [x] Programmed interactive fullscreen lightboxes with backdrop dismissing, click zoom effects, and full prompt breakdowns on gallery items.
- [x] Resolved high-fidelity print poster rendering bugs by establishing explicit `@media print` CSS overrides preserving background gradients and border structures of score dials, master cards, and commentary logs.

### Active/Next Tasks
- [ ] Monitor live Cloud Run server telemetry and user engagement.
- [ ] Expand multimodal grading rubrics if further grading facets are desired.

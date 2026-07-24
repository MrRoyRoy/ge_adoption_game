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
- [x] Simplified the printable poster layout to fit perfectly on a single physical/PDF page by removing the Rubric Breakdown and Prompt Enhancements sections, guarding JS variables to prevent any null ReferenceErrors.
- [x] Removed the "Play Again" redirect button from the player certificate workspace to enforce administrative command control.
- [x] Engineered the **Back to Game Selection** loop (`reset-to-lobby` socket listener), allowing administrators to clear round history and return to the master image lobby picker securely.
- [x] Replaced the 2-column detailed review layout with a premium 3-column balanced grid centering the active Master Image blueprint card, and made the master target fully zoom-expandable inside lightboxes.
- [x] Restored the premium 2-column Detailed Review layout in `admin.html` matching the user cockpit, while horizontally centering the master image inside the left specification panel.
- [x] Integrated SVG warning placeholders across competitor cards and lightbox overlays to represent unsubmitted players seamlessly without broken image links.
- [x] Eradicated hover-scaling clipping bugs inside scrolling grid columns by applying relative positioning, hover z-indices, and setting a `0.8rem` safety padding around `#gallery-grid` and `#user-gallery-grid` elements.
- [x] Streamlined the active arena status panel into a single unified sentence, maximizing screen clarity.
- [x] Scaled the active playing submission count dial to a massive, visually dominant font size (`6rem`) with a glowing cybernetic design.
- [x] Replaced the narrow active playing sidebar columns (from `82% 18%` to `74% 26%`) and expanded the competitor roster `#round-roster`'s vertical layout properties to utilize all vertical sidebar space without clipping.
- [x] Configured competitor badges in `admin.js` to resize dynamically and wrap to the next line as a floating flex row layout, rather than being constrained to a single vertical column list.
- [x] Enforced strict 15-character name truncation with `"..."` ellipsis inside competitor badges, while attaching a native hover tooltip `title` attribute to show the complete original username seamlessly.
- [x] Implemented Game 2 Admin End Submission 3-Stage Track (Spell-Lock, Airship Fleet, Bowser Dungeon) over an animated ambient backdrop with real-time player chips.
- [x] Generated paper cutout character artwork (`bowser-cutout.jpg`, `peach-cutout.jpg`, `mario-cutout.jpg`) via `gemini-3.5-flash-image-lite` for Bowser (1st), Peach (2nd), and Mario (3rd) with floating CSS micro-animations on the Game 2 reveal podium.
- [x] Removed header submission lock button in User Portal and added manual `PROCEED TO NEXT STAGE ➔` action bar allowing users ample time to review AI responses before advancing.
- [x] Aligned "AI Director Commentary" directly below comparison images in Game 1 poster certificate (`justify-content: flex-start; gap: 0.5rem;`), removing the large vertical gap caused by stretched column flex spacing.
- [x] Reframed Game 2 technique titles, explanations ("Why Tested"), expected learning outcomes, and task clear outcomes in `user.html` and `server.js` to focus positively on constructive prompt engineering skills (PTCF protocol mastery, output format restriction/enrichment, and scenario re-framing).
- [x] Passed `activeMasterIndex` from server room state inside `player-reveal` socket event, ensuring user poster always displays the exact round master image rather than defaulting to index 0 ("Spirited Anime Shrine").
- [x] Optimized `@media print` rules with `size: portrait; height: 100vh; page-break-inside: avoid;` and enforced `.poster-image-row` 2-column grid (`grid-template-columns: 1fr 1fr;`) to place Master Target and Your Generation horizontally side-by-side.
- [x] Fixed Game 1 `start-game` server handler to pick a fresh random target image (from 1 to 20) on every round start, resolving repeated "Spirited Anime Shrine" image assignments.
- [x] Fixed `sendRoomStateToAdmin` in `server.js` to find active master by `m.index === room.active_master_index` rather than array offset, fixing comparison image mismatches.
- [x] Removed literal `✦` character in front of `<li>` sentences in `user.html` and `admin.html` IMAGE GENERATION TIPS, leaving styling cleanly handled by CSS pseudo-elements.
- [x] Fixed real-time Game 2 score synchronization on Admin Hacking Track chips by reading `st.totalScore` dynamically from `game2_state_json`.
- [x] Fixed `end-game` event processing for Game 2 to ensure "End Submissions & Show Scoreboard" transitions Admin directly to the Championship Podium.
- [x] Added `white-space: nowrap; flex-shrink: 0;` to enforce single-line layout for the `FINISHED: 0 / X` badge in the Admin Game 2 view.

### Active/Next Tasks
- [ ] Monitor live Cloud Run server telemetry during active multi-game workshops.
- [ ] Expand optional custom prompt challenge scenarios for future training sessions.

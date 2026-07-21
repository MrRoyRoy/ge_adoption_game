# GE Adoption Game - Neural Prompt Arena 🌌

A premium, interactive, real-time gamified application designed to train and upskill executives in GenAI prompt engineering. Inspired by the fast-paced engagement of Kahoot!, competitors race to reverse-engineer stunning master images using descriptive, high-fidelity prompts, getting instant multimodal AI feedback and visual leaderboard crowning.

---

## 📸 Core Concept & Gameplay Loop

1. **The Lobby:** Admin hosts a game session, generating a unique 4-digit room code. Competitors join the lobby on their devices by inputting the code and their chosen username.
2. **The Target:** Admin selects a masterpiece from the 20-image master library (covering Hong Kong elements, Japanese anime, portraiture, classic oil paintings, wildlife, steampunk, etc.) and presents it on the shared projector screen.
3. **The Sandbox:** Users enter their prompting workspace. They can privately **"test generate"** images on their screen to see how their prompts behave, and refine their keywords.
4. **The Submission:** Competitors submit and lock their single best attempt. In the background, the server generates the final output and sends both images to Gemini for a visual comparison.
5. **The Climax:** Admin ends the round. User screens initiate a dramatic "Neural Scan" sweep, while the Admin screen reveals the **gorgeous 3D Podium Leaderboard** with flying confetti, celebrating the top three performers.
6. **The Poster:** Each user receives a custom, high-fidelity, printable **Achievement Poster** displaying side-by-side comparative graphics, multi-point rubrics, AI commentary, and constructive feedback on how to improve.

---

## 🛠️ Tech Stack & Architecture

- **Backend:** Node.js, Express, Socket.io (WebSocket), and SQLite (ephemeral daily-purged state storage).
- **Frontend:** Vanilla HTML5, CSS3 (Glassmorphic dark design system with neon highlights), and JavaScript.
- **Generative AI Services (Google Cloud Vertex AI):**
  - **`gemini-3.1-flash-lite-image`:** (Global region) Generates prompt results and populates master library targets.
  - **`gemini-1.5-flash`:** (Global region) Provides visual comparisons, rubrics, and direct coaching commentary.
- **Authorization:** Application Default Credentials (ADC) for local use, and default Cloud Run Service Account bindings for production deployments.

---

## 📁 Repository Structure

```text
ge-adoption-game/
├── AGENT.md                 # Agent status, milestones, and active task lists
├── Dockerfile               # Production container definition for Cloud Run
├── package.json             # NPM package scripts and dependencies
├── server.js                # Express & Socket.io game logic orchestrator
├── database.js              # SQLite connection and daily-purge configurations
├── vertex-client.js         # Unified REST caller for Imagen 3 and Gemini Multimodal
├── master-library.js        # Curated details of 20 diverse, themed master target images
├── public/                  # Unified web assets
│   ├── index.html           # Landing join-room portal
│   ├── admin.html           # Presenter screen / Confetti & Leaderboard view
│   ├── user.html            # Player controller / Workspace & Award Poster view
│   ├── css/style.css        # Premium glassmorphic stylesheet
│   └── js/
│       ├── admin.js         # Presenter socket state & confetti canvas logic
│       └── user.js          # Player canvas rendering, test previews, and scans
├── scripts/
│   ├── generate-master-library.js  # Script to populate the 20 target images
│   └── deploy.sh            # Auto-compile and deploy wrapper for Cloud Run
```

---

## ⚡ Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install --registry=https://registry.npmjs.org/
```

### 2. Configure Environment (`.env`)
Make sure your GCP credentials are authenticated locally. Run `gcloud auth application-default login` to bind your personal permissions.
Create a `.env` file in the root:
```env
PROJECT_ID=ge-edu-demo
LOCATION=global
IMAGEN_MODEL=gemini-3.1-flash-lite-image
GEMINI_MODEL=gemini-1.5-flash
PORT=8080
```

### 3. Generate Master Image Library
Pre-populate the 20-image target library (it automatically generates SVGs if API limits are reached):
```bash
npm run generate-library
```

### 4. Start Server
```bash
npm start
```
Go to `http://localhost:8080` to start playing!

---

## ☁️ Google Cloud Run Deployment

To deploy your containerized app with a scaling cap of 1 instance (to maintain SQLite state consistency in memory) and direct IAM service account execution:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## 🔄 Routine Maintenance Loop

Every time a new feature is added, a bug is fixed, or major architectural changes are made, perform the following verification loop:
1. **Update `AGENT.md`:** Check off finished milestones and add concrete next tasks.
2. **Update `README.md`:** Document any new endpoints, models, styling variations, or folder restructuring.
3. **Commit & Push to Git:**
   ```bash
   git add .
   git commit -m "feat: <description>"
   git push origin main
   ```
4. **Redeploy:** Execute `./scripts/deploy.sh` to update the active Cloud Run instance.

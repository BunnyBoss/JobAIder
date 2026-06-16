# IceCloud / Managed Ubuntu Container Deployment Guide

This guide is specifically for deploying **JobAIder** in managed containerized Ubuntu environments where:
- `systemctl` / `systemd` is **not available**
- Docker is **not available**
- PID 1 is `ttyd`, `node`, or a Kubernetes-injected process
- Only standard shell access is provided

The startup scripts in this project (`start_all.sh`, `start_backend.sh`, `start_frontend.sh`) are designed exactly for this scenario.

---

## Architecture in This Mode

```
  IceCloud Container
  ┌─────────────────────────────────────┐
  │                                     │
  │   [nohup] uvicorn  → port 8000      │
  │   [nohup] node     → port 3000      │
  │                                     │
  │   jobaider.db  (./backend/data/)    │
  │   backend.log  (project root)       │
  │   frontend.log (project root)       │
  │                                     │
  └─────────────────────────────────────┘
```

---

## Phase 1: Prerequisites

### 1. Ensure Python 3.12+ is available

```bash
python3 --version
```

If Python is not available or is older than 3.12, install it:
```bash
apt-get update && apt-get install -y python3 python3-pip python3-venv
```

### 2. Ensure Node.js 20+ is available

```bash
node --version
```

If Node.js is missing, install it without `systemd`:
```bash
# Install Node.js 20 via NodeSource (no systemd required)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version && npm --version
```

### 3. Install `curl` (used by start_all.sh for health-checks)
```bash
apt-get install -y curl
```

---

## Phase 2: Get the Code

**Option A — Git clone:**
```bash
git clone https://github.com/your-username/JobAIder.git
cd JobAIder
```

**Option B — Copy from your local machine** (run from your local terminal):
```bash
# Using rsync (preferred - faster and resumable)
rsync -avz --exclude '.git' --exclude 'node_modules' --exclude '.venv' \
    /path/to/JobAIder/ user@your-icecloud-host:~/JobAIder/

# OR using scp
scp -r /path/to/JobAIder user@your-icecloud-host:~/JobAIder
```

---

## Phase 3: Configure Environment

```bash
cd ~/JobAIder
cp .env.example .env
```

Edit `.env`:
```bash
nano .env
```

Set these values for IceCloud (no Docker, single container):

```bash
# LLM / API
OPENAI_API_KEY="sk-your-key"
# If using a local proxy like LiteLLM running inside the SAME container:
OPENAI_BASE_URL="http://localhost:4000/"
MODEL_NAME="gpt-4o-mini"

# Security — generate with: openssl rand -hex 32
SECRET_KEY="your-very-long-random-secret"

# Network — since frontend and backend are on the SAME machine,
# the browser must be able to reach the backend port from the outside.
# Set this to the URL the user's browser will use to call the API.
NEXT_PUBLIC_API_BASE="http://your-icecloud-host:8000"

# CORS — allow the frontend origin to call the backend
ALLOWED_ORIGINS="http://your-icecloud-host:3000,http://localhost:3000"

# Optional: override ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

> **Important:** `NEXT_PUBLIC_API_BASE` must be the URL that the **user's browser** (not the server) uses to reach port 8000. If IceCloud exposes your container on a specific hostname/IP, use that.

---

## Phase 4: Launch

Make the scripts executable, then start everything with a single command:

```bash
chmod +x start_all.sh start_backend.sh start_frontend.sh stop_all.sh
bash start_all.sh
```

You should see output like:
```
━━━ Starting Backend ━━━
[INFO]  .env loaded
[INFO]  Using Python: /usr/bin/python3 (Python 3.12.x)
[INFO]  Creating virtual environment ...
[INFO]  Installing/updating dependencies ...
[INFO]  Backend started successfully (PID 12345)

━━━ Starting Frontend ━━━
[INFO]  Building Next.js production bundle ...
[INFO]  Frontend started successfully (PID 12346)

━━━ JobAIder is Running! ━━━

  🌐 Frontend:  http://0.0.0.0:3000
  ⚙️  Backend:   http://0.0.0.0:8000
```

---

## Phase 5: Verify

```bash
# Check backend health
curl http://localhost:8000/api/health

# View live backend logs
tail -f backend.log

# View live frontend logs
tail -f frontend.log

# See running processes
cat backend.pid && cat frontend.pid
ps aux | grep -E 'uvicorn|server.js'
```

---

## Managing the Application

### Stop all services
```bash
bash stop_all.sh
```

### Restart after code changes
```bash
bash stop_all.sh
bash start_all.sh
```

### Start services individually
```bash
# Backend only
bash start_backend.sh

# Frontend only (backend must be running)
bash start_frontend.sh
```

---

## Keeping the Process Alive (Long Sessions)

Since there is no `systemd`, the processes will be killed if your SSH session terminates. Use **`tmux`** or **`nohup`** to keep them alive.

> The startup scripts already use `nohup` internally, so as long as you run them and close the terminal, the processes will continue running in the background.

However, if you want an interactive session you can detach from safely:

```bash
# Install tmux if not present
apt-get install -y tmux

# Start a new session
tmux new -s jobaider

# Inside the session, start the app
bash start_all.sh

# Detach (the app keeps running): press Ctrl+B, then D

# Re-attach later
tmux attach -t jobaider
```

---

## Data Persistence

All data is stored in `./backend/data/jobaider.db` relative to the project root (set via `JOBAIDER_DB_PATH` env var defaulting to `./jobaider.db` inside the backend directory).

> **Important for IceCloud:** Check if your container's filesystem is ephemeral (wiped on restart). If so, ask IceCloud support how to mount a persistent volume and then point `JOBAIDER_DB_PATH` to that mount path.

```bash
# Change the DB location to a persistent volume
export JOBAIDER_DB_PATH="/mnt/persistent-volume/jobaider.db"
```

---

## Migrating an Existing Database

If you have a local `jobaider.db` you want to bring to IceCloud:

```bash
# From your LOCAL machine
rsync -avz ./backend/jobaider.db user@your-icecloud-host:~/JobAIder/backend/jobaider.db
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Python not found` | `apt-get install -y python3 python3-venv python3-pip` |
| `node not found` | See Phase 1 — install Node.js 20 via NodeSource |
| `Backend failed to start` | `cat backend.log` for details |
| `Frontend failed to start` | `cat frontend.log` — usually a build error |
| `failed to fetch` in browser | Check `NEXT_PUBLIC_API_BASE` in `.env` — must be reachable from the user's browser |
| CORS errors | Add the frontend's URL to `ALLOWED_ORIGINS` in `.env`, then restart |
| Port already in use | `BACKEND_PORT=8001 FRONTEND_PORT=3001 bash start_all.sh` |
| Process died after SSH close | Re-run `bash start_all.sh` — scripts already use `nohup` |

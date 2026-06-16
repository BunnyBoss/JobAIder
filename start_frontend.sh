#!/usr/bin/env bash
# =============================================================================
# start_frontend.sh — Build and start the JobAIder Next.js frontend
# Works in any standard Linux environment (no Docker, no systemd required)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOG_FILE="$SCRIPT_DIR/frontend.log"
PID_FILE="$SCRIPT_DIR/frontend.pid"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Load .env ────────────────────────────────────────────────────────────────
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/.env"
    set +o allexport
    info ".env loaded"
else
    warn "No .env file found — relying on environment variables already set."
fi

# ── Node.js detection ────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    error "Node.js not found. Install Node.js 20+ to proceed."
    error "Quick install: curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
    exit 1
fi
if ! command -v npm &>/dev/null; then
    error "npm not found. It usually comes with Node.js."
    exit 1
fi
info "Using Node.js: $(node --version), npm: $(npm --version)"

# ── Stop any already-running frontend ────────────────────────────────────────
if [[ -f "$PID_FILE" ]]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        warn "Stopping existing frontend (PID $OLD_PID) ..."
        kill "$OLD_PID"
        sleep 1
    fi
    rm -f "$PID_FILE"
fi

# ── Install dependencies and build ──────────────────────────────────────────
cd "$FRONTEND_DIR"

info "Installing npm dependencies ..."
npm ci --silent

info "Building Next.js production bundle (this may take a minute) ..."
# Export NEXT_PUBLIC_* vars for the build step so they are baked in
NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-http://localhost:8000}" \
npm run build

# ── Launch frontend ──────────────────────────────────────────────────────────
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

info "Starting frontend on port ${FRONTEND_PORT} ..."
info "Logs → $LOG_FILE"

PORT="$FRONTEND_PORT" \
HOSTNAME="0.0.0.0" \
nohup node .next/standalone/server.js \
    >> "$LOG_FILE" 2>&1 &

FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$PID_FILE"

sleep 3
if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    info "Frontend started successfully (PID $FRONTEND_PID)"
    info "App available at http://0.0.0.0:${FRONTEND_PORT}"
else
    error "Frontend failed to start — check $LOG_FILE for details."
    exit 1
fi

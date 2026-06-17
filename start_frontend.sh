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
elif [[ -f "$SCRIPT_DIR/.env.icecloud.example" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/.env.icecloud.example"
    set +o allexport
    info ".env.icecloud.example loaded"

    warn "Using the .env.icecloud.example"  
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

# ── Install dependencies and build (skip if nothing changed) ─────────────────
cd "$FRONTEND_DIR"

# Compute a fingerprint from package-lock.json + all source files
# This way we rebuild only when dependencies or source code actually change.
DEPS_HASH=$(md5sum "$FRONTEND_DIR/package-lock.json" 2>/dev/null | awk '{print $1}')
SRC_HASH=$(find "$FRONTEND_DIR/app" "$FRONTEND_DIR/components" "$FRONTEND_DIR/lib" \
    "$FRONTEND_DIR/next.config.ts" "$FRONTEND_DIR/tailwind.config.ts" \
    -type f 2>/dev/null | sort | xargs md5sum 2>/dev/null | md5sum | awk '{print $1}')
ENV_HASH=$(echo "${NEXT_PUBLIC_API_BASE:-http://localhost:8000}" | md5sum | awk '{print $1}')
CURRENT_HASH="${DEPS_HASH}-${SRC_HASH}-${ENV_HASH}"

BUILD_HASH_FILE="$FRONTEND_DIR/.build.hash"
CACHED_HASH=""
[[ -f "$BUILD_HASH_FILE" ]] && CACHED_HASH=$(cat "$BUILD_HASH_FILE")

if [[ "$CURRENT_HASH" != "$CACHED_HASH" || ! -d "$FRONTEND_DIR/.next/standalone" ]]; then
    info "Source files changed — rebuilding ..."

    info "Installing npm dependencies ..."
    npm ci --silent

    info "Building Next.js production bundle (this may take a minute) ..."
    NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-http://localhost:8000}" \
    npm run build

    # Copy static assets into standalone (required by Next.js standalone mode)
    if [[ -d "$FRONTEND_DIR/.next/static" ]]; then
        cp -r "$FRONTEND_DIR/.next/static" "$FRONTEND_DIR/.next/standalone/.next/" 2>/dev/null || true
    fi
    if [[ -d "$FRONTEND_DIR/public" ]]; then
        cp -r "$FRONTEND_DIR/public" "$FRONTEND_DIR/.next/standalone/" 2>/dev/null || true
    fi

    echo "$CURRENT_HASH" > "$BUILD_HASH_FILE"
    info "Build complete ✓"
else
    info "No changes detected — skipping build ✓"
fi

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

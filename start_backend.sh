#!/usr/bin/env bash
# =============================================================================
# start_backend.sh — Start the JobAIder FastAPI backend
# Works in any standard Linux environment (no Docker, no systemd required)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"
LOG_FILE="$SCRIPT_DIR/backend.log"
PID_FILE="$SCRIPT_DIR/backend.pid"

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

# ── Python detection ─────────────────────────────────────────────────────────
PYTHON=""
for cmd in python3.13 python3.12 python3 python; do
    if command -v "$cmd" &>/dev/null; then
        PYTHON=$(command -v "$cmd")
        break
    fi
done
if [[ -z "$PYTHON" ]]; then
    error "Python 3.12+ not found. Install it first."
    exit 1
fi
info "Using Python: $PYTHON ($($PYTHON --version))"

# ── Virtual environment ──────────────────────────────────────────────────────
VENV_OK=false
if [[ ! -d "$VENV_DIR" ]]; then
    info "Creating virtual environment at $VENV_DIR ..."
    if "$PYTHON" -m venv "$VENV_DIR" 2>/dev/null; then
        VENV_OK=true
    else
        warn "python3-venv not available. Trying to install ..."
        if apt-get install -y "python$(${PYTHON} -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')-venv" 2>/dev/null \
           && "$PYTHON" -m venv "$VENV_DIR" 2>/dev/null; then
            VENV_OK=true
        else
            warn "Cannot create venv — falling back to system pip (--break-system-packages)"
            VENV_OK=false
        fi
    fi
else
    VENV_OK=true
fi

if [[ "$VENV_OK" == "true" ]]; then
    PYTHON_VENV="$VENV_DIR/bin/python"
    PIP_CMD="$VENV_DIR/bin/python -m pip"
    # Bootstrap pip if missing (common on Ubuntu minimal installs)
    if [[ ! -f "$VENV_DIR/bin/pip" ]]; then
        info "pip not found in venv — bootstrapping via ensurepip ..."
        "$PYTHON_VENV" -m ensurepip --upgrade || {
            error "ensurepip failed. Run: sudo apt-get install -y python3-pip python3-venv"
            exit 1
        }
    fi
else
    # No venv — use system Python directly
    PYTHON_VENV="$PYTHON"
    PIP_CMD="$PYTHON -m pip"
fi

# ── Install dependencies (skip if requirements.txt unchanged) ────────────────
REQS_HASH_FILE="$BACKEND_DIR/.requirements.hash"
CURRENT_HASH=$(md5sum "$BACKEND_DIR/requirements.txt" 2>/dev/null | awk '{print $1}')
CACHED_HASH=""
[[ -f "$REQS_HASH_FILE" ]] && CACHED_HASH=$(cat "$REQS_HASH_FILE")

if [[ "$CURRENT_HASH" != "$CACHED_HASH" ]]; then
    info "requirements.txt changed — installing dependencies ..."
    $PIP_CMD install --quiet --upgrade pip 2>/dev/null || $PIP_CMD install --quiet --upgrade pip --break-system-packages
    $PIP_CMD install --quiet -r "$BACKEND_DIR/requirements.txt" 2>/dev/null || \
        $PIP_CMD install --quiet -r "$BACKEND_DIR/requirements.txt" --break-system-packages
    $PIP_CMD install --quiet -e "$BACKEND_DIR" 2>/dev/null || \
        $PIP_CMD install --quiet -e "$BACKEND_DIR" --break-system-packages
    echo "$CURRENT_HASH" > "$REQS_HASH_FILE"
    info "Dependencies installed ✓"
else
    info "Dependencies up-to-date (skipped install) ✓"
fi

# ── Stop any already-running backend ────────────────────────────────────────
if [[ -f "$PID_FILE" ]]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        warn "Stopping existing backend (PID $OLD_PID) ..."
        kill "$OLD_PID"
        sleep 1
    fi
    rm -f "$PID_FILE"
fi

# ── Launch backend ───────────────────────────────────────────────────────────
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

info "Starting backend on ${BACKEND_HOST}:${BACKEND_PORT} ..."
info "Logs → $LOG_FILE"

cd "$BACKEND_DIR"
nohup "$PYTHON_VENV" -m uvicorn app.main:app \
    --host "$BACKEND_HOST" \
    --port "$BACKEND_PORT" \
    --workers 1 \
    >> "$LOG_FILE" 2>&1 &

BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_FILE"

sleep 2
if kill -0 "$BACKEND_PID" 2>/dev/null; then
    info "Backend started successfully (PID $BACKEND_PID)"
    info "API available at http://${BACKEND_HOST}:${BACKEND_PORT}"
else
    error "Backend failed to start — check $LOG_FILE for details."
    exit 1
fi

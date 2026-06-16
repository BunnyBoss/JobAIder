#!/usr/bin/env bash
# =============================================================================
# stop_all.sh — Gracefully stop all JobAIder processes
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }

stop_pid_file() {
    local name="$1"
    local pid_file="$2"
    if [[ -f "$pid_file" ]]; then
        local pid
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            info "Stopping $name (PID $pid) ..."
            kill "$pid"
            sleep 1
        else
            warn "$name PID $pid is not running."
        fi
        rm -f "$pid_file"
    else
        warn "No PID file found for $name — may not be running."
    fi
}

stop_pid_file "Frontend" "$SCRIPT_DIR/frontend.pid"
stop_pid_file "Backend"  "$SCRIPT_DIR/backend.pid"

info "All services stopped."

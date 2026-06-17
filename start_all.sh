#!/usr/bin/env bash
# =============================================================================
# start_all.sh — Start the full JobAIder stack (backend + frontend)
# Works in any standard Linux environment (no Docker, no systemd required)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
section() { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

section "JobAIder Stack Startup"
info "Project root: $SCRIPT_DIR"

# ── Ensure scripts are executable ────────────────────────────────────────────
chmod +x "$SCRIPT_DIR/start_backend.sh"
chmod +x "$SCRIPT_DIR/start_frontend.sh"
chmod +x "$SCRIPT_DIR/stop_all.sh" 2>/dev/null || true

# ── Start Backend ────────────────────────────────────────────────────────────
section "Starting Backend"
bash "$SCRIPT_DIR/start_backend.sh"

# ── Wait for backend to be healthy ───────────────────────────────────────────
BACKEND_PORT="${BACKEND_PORT:-8000}"
info "Waiting for backend to be ready on port $BACKEND_PORT ..."
for i in $(seq 1 20); do
    if curl -sf "http://localhost:${BACKEND_PORT}/api/health" &>/dev/null; then
        info "Backend is healthy ✓"
        break
    fi
    if [[ $i -eq 20 ]]; then
        error "Backend did not become healthy after 20 seconds."
        error "Check logs: tail -f $SCRIPT_DIR/backend.log"
        exit 1
    fi
    sleep 1
done

# ── Start Frontend ───────────────────────────────────────────────────────────
section "Starting Frontend"
bash "$SCRIPT_DIR/start_frontend.sh"

# ── Summary ──────────────────────────────────────────────────────────────────
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-http://localhost:8000}"

section "JobAIder is Running!"
echo ""
echo -e "  🌐 Frontend:  ${GREEN}http://0.0.0.0:${FRONTEND_PORT}${NC}"
echo -e "  ⚙️  Backend:   ${GREEN}http://0.0.0.0:${BACKEND_PORT}${NC}"
echo -e "  📡 API base:  ${GREEN}${NEXT_PUBLIC_API_BASE}${NC}"
echo ""
echo -e "  Logs:"
echo -e "    Backend:   tail -f $SCRIPT_DIR/backend.log"
echo -e "    Frontend:  tail -f $SCRIPT_DIR/frontend.log"
echo ""
echo -e "  To stop everything:  bash $SCRIPT_DIR/stop_all.sh"
echo ""

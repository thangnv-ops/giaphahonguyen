#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════
# AncestorTree — One-line installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Minh-Tam-Solution/AncestorTree/main/install.sh | sh
# ═══════════════════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { printf "${GREEN}✅ %s${RESET}\n" "$1"; }
warn() { printf "${YELLOW}⚠️  %s${RESET}\n" "$1"; }
err()  { printf "${RED}❌ %s${RESET}\n" "$1"; }
info() { printf "${CYAN}ℹ  %s${RESET}\n" "$1"; }
step() { printf "\n${BOLD}${CYAN}▶ %s${RESET}\n" "$1"; }

REPO="https://github.com/Minh-Tam-Solution/AncestorTree.git"
DIR="AncestorTree"

# ─── 1. Check prerequisites ─────────────────────────────────────────────

step "Kiểm tra yêu cầu hệ thống..."

# Git
if ! command -v git >/dev/null 2>&1; then
  err "Git chưa được cài đặt."
  info "  → macOS: xcode-select --install"
  info "  → Ubuntu: sudo apt install git"
  info "  → Windows: https://git-scm.com/downloads"
  exit 1
fi
ok "Git $(git --version | awk '{print $3}')"

# Docker
if ! docker info >/dev/null 2>&1; then
  err "Docker Desktop chưa chạy."
  info "  → Tải: https://www.docker.com/products/docker-desktop"
  info "  → Khởi động Docker Desktop, rồi chạy lại lệnh này."
  exit 1
fi
ok "Docker đang chạy"

# Node.js
if ! command -v node >/dev/null 2>&1; then
  err "Node.js chưa được cài đặt (cần v18+)."
  info "  → Tải: https://nodejs.org/"
  info "  → Hoặc: brew install node (macOS)"
  exit 1
fi
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  err "Node.js 18+ bắt buộc (hiện tại: $(node -v))"
  exit 1
fi
ok "Node.js $(node -v)"

# pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  step "Cài đặt pnpm..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@latest --activate
  else
    npm install -g pnpm
  fi
  ok "pnpm đã cài đặt"
else
  ok "pnpm $(pnpm -v)"
fi

# Supabase CLI
if ! command -v supabase >/dev/null 2>&1; then
  step "Cài đặt Supabase CLI..."
  if command -v brew >/dev/null 2>&1; then
    brew install supabase/tap/supabase
  elif command -v npm >/dev/null 2>&1; then
    npm install -g supabase
  else
    err "Không thể tự động cài Supabase CLI."
    info "  → macOS/Linux: brew install supabase/tap/supabase"
    info "  → Hoặc: npm install -g supabase"
    exit 1
  fi
  ok "Supabase CLI đã cài đặt"
else
  ok "Supabase CLI $(supabase --version 2>/dev/null | head -1)"
fi

# ─── 2. Clone ────────────────────────────────────────────────────────────

if [ -d "$DIR" ]; then
  step "Thư mục $DIR đã tồn tại — cập nhật..."
  cd "$DIR"
  git pull --ff-only origin main
else
  step "Tải mã nguồn..."
  git clone "$REPO"
  cd "$DIR"
fi

# ─── 3. Install + Setup ─────────────────────────────────────────────────

step "Cài đặt dependencies..."
cd frontend
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

step "Khởi động Supabase local (lần đầu mất ~2 phút)..."
pnpm local:setup

# ─── 4. Done ─────────────────────────────────────────────────────────────

printf "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
printf "${GREEN}  🎉 AncestorTree đã sẵn sàng!${RESET}\n"
printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
printf "\n"
printf "  Chạy app:       ${CYAN}cd %s/frontend && pnpm dev${RESET}\n" "$DIR"
printf "  Mở trình duyệt: ${CYAN}http://localhost:4000${RESET}\n"
printf "\n"
printf "  Đăng nhập demo:\n"
printf "    Admin:   ${BOLD}admin@giapha.local${RESET}  /  ${BOLD}admin123${RESET}\n"
printf "    Editor:  ${BOLD}editor@giapha.local${RESET} /  ${BOLD}editor123${RESET}\n"
printf "    Viewer:  ${BOLD}viewer@giapha.local${RESET} /  ${BOLD}viewer123${RESET}\n"
printf "\n"
printf "  Lệnh hữu ích:\n"
printf "    ${CYAN}pnpm dev${RESET}          — Chạy app\n"
printf "    ${CYAN}pnpm local:stop${RESET}   — Tắt Supabase (giữ dữ liệu)\n"
printf "    ${CYAN}pnpm local:start${RESET}  — Bật lại Supabase\n"
printf "    ${CYAN}pnpm local:reset${RESET}  — Reset DB + dữ liệu demo\n"
printf "\n"

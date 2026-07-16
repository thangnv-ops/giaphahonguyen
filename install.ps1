# ═══════════════════════════════════════════════════════════════════════════
# AncestorTree — One-line installer (Windows PowerShell)
# Usage: irm https://raw.githubusercontent.com/Minh-Tam-Solution/AncestorTree/main/install.ps1 | iex
# ═══════════════════════════════════════════════════════════════════════════
$ErrorActionPreference = "Stop"

function Ok($msg)   { Write-Host "  $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  $msg" -ForegroundColor Yellow }
function Err($msg)  { Write-Host "  $msg" -ForegroundColor Red }
function Info($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Step($msg) { Write-Host "`n>> $msg" -ForegroundColor White }

$REPO = "https://github.com/Minh-Tam-Solution/AncestorTree.git"
$DIR  = "AncestorTree"

# ─── 1. Check prerequisites ─────────────────────────────────────────────

Step "Kiem tra yeu cau he thong..."

# Git
try { $gitVer = git --version 2>$null } catch { $gitVer = $null }
if (-not $gitVer) {
    Err "Git chua duoc cai dat."
    Info "  -> Tai: https://git-scm.com/downloads"
    exit 1
}
Ok "Git $gitVer"

# Docker
try { docker info 2>$null | Out-Null; $dockerOk = $true } catch { $dockerOk = $false }
if (-not $dockerOk) {
    Err "Docker Desktop chua chay."
    Info "  -> Tai: https://www.docker.com/products/docker-desktop"
    Info "  -> Khoi dong Docker Desktop, roi chay lai lenh nay."
    exit 1
}
Ok "Docker dang chay"

# Node.js
try { $nodeVer = node -v 2>$null } catch { $nodeVer = $null }
if (-not $nodeVer) {
    Err "Node.js chua duoc cai dat (can v18+)."
    Info "  -> Tai: https://nodejs.org/"
    exit 1
}
$nodeMajor = [int]($nodeVer -replace 'v(\d+)\..*', '$1')
if ($nodeMajor -lt 18) {
    Err "Node.js 18+ bat buoc (hien tai: $nodeVer)"
    exit 1
}
Ok "Node.js $nodeVer"

# pnpm
try { $pnpmVer = pnpm -v 2>$null } catch { $pnpmVer = $null }
if (-not $pnpmVer) {
    Step "Cai dat pnpm..."
    npm install -g pnpm
    Ok "pnpm da cai dat"
} else {
    Ok "pnpm $pnpmVer"
}

# Supabase CLI
try { $sbVer = supabase --version 2>$null } catch { $sbVer = $null }
if (-not $sbVer) {
    Step "Cai dat Supabase CLI..."
    try {
        scoop install supabase 2>$null
    } catch {
        npm install -g supabase
    }
    Ok "Supabase CLI da cai dat"
} else {
    Ok "Supabase CLI $sbVer"
}

# ─── 2. Clone ────────────────────────────────────────────────────────────

if (Test-Path $DIR) {
    Step "Thu muc $DIR da ton tai - cap nhat..."
    Set-Location $DIR
    git pull --ff-only origin main
} else {
    Step "Tai ma nguon..."
    git clone $REPO
    Set-Location $DIR
}

# ─── 3. Install + Setup ─────────────────────────────────────────────────

Step "Cai dat dependencies..."
Set-Location frontend
try { pnpm install --frozen-lockfile } catch { pnpm install }

Step "Khoi dong Supabase local (lan dau mat ~2 phut)..."
pnpm local:setup

# ─── 4. Done ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  =============================================" -ForegroundColor Green
Write-Host "    AncestorTree da san sang!" -ForegroundColor Green
Write-Host "  =============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Chay app:       " -NoNewline; Write-Host "cd $DIR\frontend; pnpm dev" -ForegroundColor Cyan
Write-Host "  Mo trinh duyet: " -NoNewline; Write-Host "http://localhost:4000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Dang nhap demo:"
Write-Host "    Admin:   admin@giapha.local  /  admin123" -ForegroundColor White
Write-Host "    Editor:  editor@giapha.local /  editor123" -ForegroundColor White
Write-Host "    Viewer:  viewer@giapha.local /  viewer123" -ForegroundColor White
Write-Host ""
Write-Host "  Lenh huu ich:"
Write-Host "    pnpm dev          " -NoNewline -ForegroundColor Cyan; Write-Host "- Chay app"
Write-Host "    pnpm local:stop   " -NoNewline -ForegroundColor Cyan; Write-Host "- Tat Supabase (giu du lieu)"
Write-Host "    pnpm local:start  " -NoNewline -ForegroundColor Cyan; Write-Host "- Bat lai Supabase"
Write-Host "    pnpm local:reset  " -NoNewline -ForegroundColor Cyan; Write-Host "- Reset DB + du lieu demo"
Write-Host ""

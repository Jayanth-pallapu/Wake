#!/usr/bin/env pwsh
# =============================================================
# Wake Casino — Full Production Deploy Script
# Run from the project root: .\scripts\deploy.ps1
# =============================================================
#
# What this does:
#   1. Asks for your Neon (PostgreSQL) connection string
#   2. Pushes all Vercel env vars (DATABASE_URL, AUTH_SECRET, etc.)
#   3. Links the project to Vercel (if not already linked)
#   4. Deploys to production
#   5. Seeds the demo account via the /api/seed endpoint
#
# Prerequisites:
#   - npx vercel (installed via npx, no global install needed)
#   - A Neon database: https://neon.tech (free)
# =============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🎰 Wake Casino — Production Deploy" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Get Neon connection string ───────────────────────
Write-Host "📦 Step 1/5 — Database Setup" -ForegroundColor Yellow
Write-Host "Get a free PostgreSQL DB at: https://neon.tech"
Write-Host "Create a project → copy the connection string (starts with postgresql://...)"
Write-Host ""
$dbUrl = Read-Host "Paste your Neon DATABASE_URL"
if (-not $dbUrl -or -not $dbUrl.StartsWith("postgresql://")) {
    Write-Host "❌ Invalid DATABASE_URL. Must start with postgresql://" -ForegroundColor Red
    exit 1
}

# ── Step 2: Generate auth secret ─────────────────────────────
Write-Host ""
Write-Host "🔐 Step 2/5 — Auth Secret" -ForegroundColor Yellow
$authSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
Write-Host "Generated AUTH_SECRET: $authSecret"

$internalSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Host "Generated INTERNAL_SECRET: $internalSecret"

# ── Step 3: Vercel login + link ───────────────────────────────
Write-Host ""
Write-Host "🔗 Step 3/5 — Vercel Link" -ForegroundColor Yellow
Write-Host "Logging in to Vercel (browser will open)..."
npx vercel login

Write-Host "Linking project..."
npx vercel link --yes

# ── Step 4: Push env vars to Vercel ──────────────────────────
Write-Host ""
Write-Host "⚙️  Step 4/5 — Setting Vercel Environment Variables" -ForegroundColor Yellow

# Remove existing vars first (ignore errors if they don't exist)
npx vercel env rm DATABASE_URL production --yes 2>$null
npx vercel env rm AUTH_SECRET production --yes 2>$null
npx vercel env rm INTERNAL_SECRET production --yes 2>$null

# Add new vars
Write-Output $dbUrl     | npx vercel env add DATABASE_URL production
Write-Output $authSecret | npx vercel env add AUTH_SECRET production
Write-Output $internalSecret | npx vercel env add INTERNAL_SECRET production

Write-Host "✅ Env vars set!" -ForegroundColor Green

# ── Step 5: Push schema to Neon ──────────────────────────────
Write-Host ""
Write-Host "🗄️  Pushing Prisma schema to Neon..." -ForegroundColor Yellow
$env:DATABASE_URL = $dbUrl
npx prisma generate
npx prisma db push --accept-data-loss
Write-Host "✅ Database schema ready!" -ForegroundColor Green

# ── Step 6: Deploy to production ─────────────────────────────
Write-Host ""
Write-Host "🚀 Step 5/5 — Deploying to Vercel Production" -ForegroundColor Yellow
$deployOutput = npx vercel --prod 2>&1
Write-Host $deployOutput

# Extract the production URL
$prodUrl = ($deployOutput | Select-String -Pattern "https://[^\s]+" | Select-Object -Last 1).Matches[0].Value
if (-not $prodUrl) {
    $prodUrl = Read-Host "Enter your production URL (e.g. https://wake-xxx.vercel.app)"
}
Write-Host "Production URL: $prodUrl" -ForegroundColor Cyan

# ── Step 7: Seed demo account ─────────────────────────────────
Write-Host ""
Write-Host "🌱 Seeding demo account on production..." -ForegroundColor Yellow
Start-Sleep -Seconds 5  # wait for deployment to propagate

$seedUrl = "$prodUrl/api/seed?secret=$internalSecret"
try {
    $response = Invoke-RestMethod -Uri $seedUrl -Method POST -TimeoutSec 60
    Write-Host "✅ Seed complete:" -ForegroundColor Green
    $response.results | ForEach-Object { Write-Host "  $_" }
} catch {
    Write-Host "⚠️  Seed request failed. Try manually:" -ForegroundColor Yellow
    Write-Host "  POST $seedUrl"
    Write-Host "  Or visit: $prodUrl and register manually."
}

# ── Done ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOY COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Production URL: $prodUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Demo Login:" -ForegroundColor Yellow
Write-Host "   Username: demo"
Write-Host "   Password: Demo@12345"
Write-Host ""
Write-Host "Save these secrets somewhere safe:" -ForegroundColor Yellow
Write-Host "  AUTH_SECRET:     $authSecret"
Write-Host "  INTERNAL_SECRET: $internalSecret"
Write-Host ""

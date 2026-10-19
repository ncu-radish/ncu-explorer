# NCU Explorer Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  NCU Life Simulator & Explorer (NCU Explorer)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Backend FastAPI
Write-Host "[1/2] Starting Backend FastAPI (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\backend\.venv\Scripts\uvicorn app.main:app --reload --port 8000 --app-dir backend"

# 2. Start Frontend Next.js
Write-Host "[2/2] Starting Frontend Next.js (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm --prefix frontend run dev"

Write-Host "`nBackend API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend App:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nServices started in separate terminal windows!" -ForegroundColor Yellow

@echo off
echo Stopping existing processes on ports 3000, 3001, and 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do ( if %%a NEQ 0 taskkill /F /PID %%a >nul 2>&1 )
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do ( if %%a NEQ 0 taskkill /F /PID %%a >nul 2>&1 )
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do ( if %%a NEQ 0 taskkill /F /PID %%a >nul 2>&1 )

echo.
echo Starting Backend...
start "Travel Planner - Backend" cmd /k "cd backend && npm run dev"

echo Starting Frontend...
start "Travel Planner - Frontend" cmd /k "cd frontend && npm run dev"

echo Starting NLP Service...
start "Travel Planner - NLP" cmd /k "cd nlp && .\venv\Scripts\python.exe app.py"

echo.
echo All services are launching in separate windows! You can close this window.
pause

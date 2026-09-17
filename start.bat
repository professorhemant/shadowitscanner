@echo off
echo Starting Shadow IT Scanner...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause

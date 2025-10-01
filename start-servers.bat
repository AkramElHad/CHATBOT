@echo off
echo Starting backend server...
start "Backend Server" cmd /k "cd server && node index.js"
timeout /t 3 /nobreak > nul
echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"
echo Servers started!
pause

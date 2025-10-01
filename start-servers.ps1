Write-Host "Starting backend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; node index.js"
Start-Sleep -Seconds 3
Write-Host "Starting frontend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Write-Host "Servers started! Check the terminal windows."

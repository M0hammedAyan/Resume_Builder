@echo off
echo ========================================
echo Starting CareerOS Resume Builder
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
    echo.
)

REM Check if backend node_modules exists
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo.
)

REM Create .env files if they don't exist
if not exist ".env" (
    echo Creating frontend .env file...
    echo VITE_API_URL=http://localhost:5000/api > .env
    echo.
)

if not exist "backend\.env" (
    echo Creating backend .env file...
    (
        echo PORT=5000
        echo MONGO_URI=mongodb://localhost:27017/resume-builder
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
        echo JWT_EXPIRES_IN=7d
    ) > backend\.env
    echo.
)

echo ========================================
echo Starting Backend Server (Port 5000)...
echo ========================================
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo ========================================
echo Starting Frontend Server (Port 5173)...
echo ========================================
start cmd /k "npm run dev"

echo.
echo ========================================
echo CareerOS is starting!
echo ========================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:5173

echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause


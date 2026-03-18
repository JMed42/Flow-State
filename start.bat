@echo off
echo.
echo   FlowState Planner
echo   -----------------
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo   Installing dependencies...
    call npm install
    echo.
)

echo   Starting dev server at http://localhost:3000
echo.
call npx vite

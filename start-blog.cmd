@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%/my-blog-P5R/"

rem If the port is already listening, treat the dev server as running.
netstat -ano | findstr /r /c:"LISTENING" | findstr /c:":%PORT% " >nul 2>&1
if not errorlevel 1 (
  echo [blog] dev server is already running
  start "" "%URL%"
  exit /b 0
)

echo [blog] starting Vite dev server on port %PORT% ...
start "blog dev server" cmd /k "node node_modules\vite\bin\vite.js --configLoader runner --host 127.0.0.1 --port %PORT% --strictPort"

rem Wait up to 30 seconds for the port to come up.
for /l %%i in (1,1,30) do (
  ping -n 2 127.0.0.1 >nul
  netstat -ano | findstr /r /c:"LISTENING" | findstr /c:":%PORT% " >nul 2>&1
  if not errorlevel 1 goto :ready
)

echo [blog] server did not become ready within 30s - check the new window for errors.
exit /b 1

:ready
echo [blog] ready, opening %URL%
start "" "%URL%"
endlocal

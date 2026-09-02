@echo off
setlocal
cd /d "%~dp0"
set PORT=4173
where py >nul 2>&1
if %errorlevel%==0 (
  start "Libre Local Server" /min cmd /c "py -m http.server %PORT% --bind 127.0.0.1"
) else (
  where python >nul 2>&1
  if %errorlevel%==0 (
    start "Libre Local Server" /min cmd /c "python -m http.server %PORT% --bind 127.0.0.1"
  ) else (
    echo Python 3 is required for the local launcher.
    echo Install Python or use any static HTTP server in this folder.
    pause
    exit /b 1
  )
)
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/#/"
echo Libre is running at http://127.0.0.1:%PORT%/
echo Close the "Libre Local Server" window when finished.
endlocal

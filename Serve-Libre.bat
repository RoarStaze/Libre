@echo off
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  py -m http.server 4173 --bind 127.0.0.1
) else (
  python -m http.server 4173 --bind 127.0.0.1
)

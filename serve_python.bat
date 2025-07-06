@echo off
cd /d "%~dp0"
python -m http.server 4000
pause

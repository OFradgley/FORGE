@echo off
cd /d "%~dp0"
jekyll serve --livereload --incremental
pause
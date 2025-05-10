@echo off
:: Get commit message from first argument
set msg=%1

:: If no message was provided, use default
if "%msg%"=="" (
  set msg=changes committed
)

:: Run git commands
git add .
git commit -m "%msg%"
git push origin main

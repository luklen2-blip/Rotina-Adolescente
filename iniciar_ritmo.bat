@echo off
title Ritmo Autonomia - Sua rotina. Seu ritmo. Sua autonomia.
color 0B
cd /d "%~dp0"
cls
echo ================================================================
echo    RITMO AUTONOMIA — V2 COMERCIAL
echo    Sua rotina. Seu ritmo. Sua autonomia.
echo    Cada um tem a sua rotina — autonomia atraves da autoria.
echo ================================================================
echo.
echo Iniciando servidor na porta 3005...
start http://localhost:3005
node server/index.js
pause

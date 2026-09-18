@echo off
title Rotina do Miguel - Pequenas Acoes, Grandes Conquistas
color 0B
cd /d "C:\Users\luciano\.gemini\antigravity\scratch\ritmo-autonomia"
cls
echo ================================================================
echo    ROTINA DO MIGUEL: PEQUENAS ACOES, GRANDES CONQUISTAS
echo    Sistema Interativo de Rotina e Economia de Fichas
echo ================================================================
echo.
echo Iniciando servidor na porta dedicada 3005...
start http://localhost:3005
npm start
pause

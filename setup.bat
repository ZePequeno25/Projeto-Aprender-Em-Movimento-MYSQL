@echo off
chcp 65001 >nul
title Quizzy Brainy - Setup Automático
color 0b

echo.
echo ╔══════════════════════════════════════════╗
echo ║     QUIZZY BRAINY - Setup Windows       ║
echo ╚══════════════════════════════════════════╝
echo.

:: 1. Dependências da API
echo ► Instalando dependências da API...
cd API
call npm ci --silent --no-audit --no-fund
if %errorlevel% neq 0 (
    echo ERRO: falha ao instalar dependências da API
    pause
    exit /b 1
)
cd ..

:: 2. Dependências do Frontend
echo ► Instalando dependências do frontend...
call npm ci --silent --no-audit --no-fund
if %errorlevel% neq 0 (
    echo ERRO: falha ao instalar dependências do frontend
    pause
    exit /b 1
)

:: 3. Configura .env
echo.
echo ► Configurando arquivo .env
if not exist "API\.env.exemple" (
    echo ERRO: API\.env.exemple não encontrado!
    pause
    exit /b 1
)

echo.
set "db_user=root"
set /p "db_user=Usuário do banco (DB_USER) [Enter mantém root]: "
if "%db_user%"=="" set "db_user=root"

:loop_password
set "db_password="
set /p "db_password=Senha do banco (DB_PASSWORD): "
if "%db_password%"=="" (
    echo    A senha não pode ficar vazia!
    goto loop_password
)

copy /y "API\.env.exemple" "API\.env" >nul

(
    echo DB_USER=%db_user%
    echo DB_PASSWORD=%db_password%
) > temp_env.txt

:: Substitui as linhas no .env
powershell -Command "(Get-Content 'API\.env') -replace '^DB_USER=.*', 'DB_USER=%db_user%' -replace '^DB_PASSWORD=.*', 'DB_PASSWORD=%db_password%' | Set-Content 'API\.env' -Encoding UTF8"
del temp_env.txt 2>nul

echo    .env configurado com sucesso!

:: 4. Migrações
echo.
echo ► Executando migrações do banco...
cd API
call node migrations\run_migrations.js
if %errorlevel% neq 0 (
    echo ERRO nas migrações!
    cd ..
    pause
    exit /b 1
)
cd ..

:: 5. Abre as duas janelas automaticamente
echo.
echo ► Iniciando servidores em janelas separadas...
start "API - Quizzy Brainy" cmd /k "title API - Quizzy Brainy && cd API && npm run dev"
timeout /t 2 >nul
start "WEB - Quizzy Brainy" cmd /k "title WEB - Quizzy Brainy && cd \"%cd%\" && npm run dev"

echo.
echo ╔══════════════════════════════════════════╗
echo ║           TUDO PRONTO!                   ║
echo ║                                          ║
echo ║   API  → http://localhost:3000           ║
echo ║   WEB  → http://localhost:5050           ║
echo ╚══════════════════════════════════════════╝
echo.
echo Esta janela pode ser fechada.
pause
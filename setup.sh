#!/usr/bin/env bash
# setup — Configuração completa do Quizzy Brainy (Windows, Linux, macOS)
# ZERO privilégios administrativos necessários

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_step()   { echo -e "\n${CYAN}==> $1${NC}"; }
log_success(){ echo -e "${GREEN}✓ $1${NC}"; }
log_error()  { echo -e "${RED}✗ ERRO: $1${NC}" >&2; }

# Verificações básicas (sem sudo)
command -v node >/dev/null || { log_error "Node.js não encontrado. Instale do https://nodejs.org"; exit 1; }
command -v npm  >/dev/null || { log_error "npm não encontrado."; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")" && pwd)"
API_DIR="$SCRIPT_DIR/API"
ENV_EXAMPLE="$API_DIR/.env.exemple"
ENV_FILE="$API_DIR/.env"

# 1. Dependências
log_step "Instalando dependências da API (sem cache sudo)"
(cd "$API_DIR" && npm ci --no-audit --no-fund --silent)

log_step "Instalando dependências do frontend"
(cd "$SCRIPT_DIR" && npm ci --no-audit --no-fund --silent)

# 2. Configuração do .env
[[ -f "$ENV_EXAMPLE" ]] || { log_error ".env.exemple não encontrado em $ENV_EXAMPLE"; exit 1; }

log_step "Configurando .env da API"

read -p "Usuário do banco (DB_USER) [padrão: root]: " db_user
db_user=${db_user:-root}

read -s -p "Senha do banco (DB_PASSWORD): " db_password
echo
while [[ -z "$db_password" ]]; do
    echo -e "${RED}A senha não pode ser vazia!${NC}"
    read -s -p "Senha do banco (DB_PASSWORD): " db_password
    echo
done

cp -f "$ENV_EXAMPLE" "$ENV_FILE"
sed -i'' -e "s/^DB_USER=.*/DB_USER=$db_user/" "$ENV_FILE"
sed -i'' -e "s/^DB_PASSWORD=.*/DB_PASSWORD=.*/"DB_PASSWORD=$db_password"/ "$ENV_FILE"
log_success ".env configurado com sucesso!"

# 3. Migrações
log_step "Executando migrações do banco"
(cd "$API_DIR" && node migrations/run_migrations.js)

# 4. Inicia servidores em novas janelas (100% sem admin)
start_server() {
    local title="$1"
    local dir="$2"
    local cmd="$3"

    if command -v wt >/dev/null 2>&1; then
        # Windows Terminal (melhor opção moderna no Windows 10/11)
        wt -w 0 nt -d "$dir" --title "$title" bash -c "$cmd; exec bash" 2>/dev/null || \
        wt -w 0 nt -d "$dir" --title "$title" cmd /k "$cmd" 2>/dev/null
    elif [[ "$OSTYPE" == msys* || "$OSTYPE" == cygwin* || -n "${WSL_DISTRO_NAME-}" ]]; then
        # Git Bash / WSL / Cygwin
        start "" cmd.exe /c "start \"$title\" cmd /k \"cd /d \"$dir\" && $cmd\"" 2>/dev/null || \
        powershell -Command "Start-Process cmd -ArgumentList '/k cd /d \"$dir\" && $cmd' -WindowStyle Normal" 2>/dev/null
    elif [[ "$OSTYPE" == darwin* ]]; then
        osascript -e "tell app \"Terminal\" to do script \"cd '$dir' && clear && $cmd\"" >/dev/null 2>&1 || true
    elif command -v gnome-terminal >/dev/null 2>&1; then
        gnome-terminal --title="$title" -- bash -c "cd '$dir'; exec bash -i" >/dev/null 2>&1 || true
    elif command -v xterm >/dev/null 2>&1; then
        xterm -T "$title" -e "cd '$dir' && $cmd; exec bash" >/dev/null 2>&1 || true
    else
        echo -e "${CYAN}[Manual] Execute em um novo terminal:${NC} cd \"$dir\" && $cmd"
    fi
}

log_step "Iniciando servidores em novas janelas..."
start_server "API - Quizzy Brainy"  "$API_DIR"    "npm run dev" &
sleep 1
start_server "WEB - Quizzy Brainy"  "$SCRIPT_DIR" "npm run dev" &

log_success "Tudo concluído com sucesso!"
echo -e "${GREEN}
╔══════════════════════════════════════╗
║      QUIZZY BRAINY PRONTO!           ║
║                                      ║
║   API rodando em: http://localhost:3000 ║
║   WEB rodando em: http://localhost:5050 ║
╚══════════════════════════════════════╝${NC}"
echo "Esta janela pode ser fechada com segurança."

# Aguarda apenas se estiver em ambiente interativo sem terminal automático
[[ -t 1 ]] && read -p "Pressione Enter para fechar esta janela..."
# Guia de Configuração Local (Windows, Linux e macOS)

O projeto Quizzy Brainy agora possui **scripts de setup automáticos para todos os sistemas operacionais**, sem precisar de privilégios administrativos.

Escolha o método correto conforme seu sistema operacional:

---

### Windows (recomendado)
Basta **dar dois cliques** no arquivo:

**`setup.bat`**  
→ Faz tudo automaticamente: instala dependências, configura o `.env`, roda migrações e abre as duas janelas dos servidores.

> Funciona no Windows 7, 8, 10 e 11  
> Não precisa abrir como administrador  
> Não precisa de PowerShell, WSL ou Git Bash

---

### Linux, macOS ou Windows com WSL / Git Bash
Execute no terminal:

```bash
chmod +x setup.sh    # apenas na primeira vez
./setup.sh
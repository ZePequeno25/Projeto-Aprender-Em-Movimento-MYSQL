# Guia de configuração local

Para iniciar o projeto corretamente, você **precisa executar o script `setup.ps1` antes de qualquer outra ação**.  
Ele automatiza a instalação de dependências, criação do `.env`, execução das migrações e inicialização dos servidores.

## Passo a passo

1. **Abra o PowerShell como Administrador**  
   Clique com o botão direito no menu Iniciar → `Windows PowerShell (Admin)`.

2. **Vá até a pasta do projeto**  
   ```powershell
   cd "C:\Users\kelvin\OneDrive\Documents\Projeto kelvin\quizzy-brainy-fun-b0af26551c41588c4270f7a4b5183b4d20cc827d"
   ```

3. **Execute o script de setup**  
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\setup.ps1
   ```

4. **Responda às perguntas**  
   - Informe o usuário do banco (Enter mantém `root`).
   - Informe a senha do banco (obrigatório).

5. **Aguarde a conclusão**  
   O script executa automaticamente:
   - `npm install` em `API/` e no frontend;
   - Criação do arquivo `API/.env` a partir de `API/.env.exemple`;
   - `node API/migrations/run_migrations.js`;
   - Abertura de duas janelas `cmd` com `npm run dev` (API e Web).

6. **Use as novas janelas**  
   - `API - Quizzy Brainy`: backend (porta 5050 por padrão).
   - `WEB - Quizzy Brainy`: frontend (porta 5173 por padrão).

Se ocorrer qualquer erro durante o processo, a janela do setup mostrará a mensagem e aguardará você pressionar Enter para fechar. Corrija o problema indicado e execute o script novamente.  
Após o setup inicial, sempre que precisar subir o projeto localmente, basta reutilizar as janelas da API e do frontend (não é necessário rodar `setup.ps1` toda vez, apenas quando quiser reinstalar / recriar o ambiente).***


[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Write-Step {
    param (
        [string]$Message
    )

    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Install-NpmDependencies {
    param (
        [string]$TargetPath,
        [string]$Label
    )

    Write-Step "Instalando dependências $Label..."
    Push-Location $TargetPath
    try {
        npm install | Write-Output
        if ($LASTEXITCODE -ne 0) {
            throw "npm install falhou em $Label."
        }
    }
    finally {
        Pop-Location
    }
}

function ConvertTo-PlainText {
    param (
        [SecureString]$SecureString
    )

    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function Configure-EnvFile {
    param (
        [string]$ExamplePath,
        [string]$EnvPath
    )

    if (-not (Test-Path $ExamplePath)) {
        throw ".env.exemple não foi encontrado em $ExamplePath."
    }

    Write-Step "Configurando arquivo .env da API..."

    $dbUserInput = Read-Host "Informe o usuário do banco (DB_USER) [Enter para manter root]"
    if ([string]::IsNullOrWhiteSpace($dbUserInput)) {
        $dbUserInput = "root"
    }

    $securePassword = Read-Host "Informe a senha do banco (DB_PASSWORD)" -AsSecureString
    $dbPasswordInput = ConvertTo-PlainText -SecureString $securePassword

    while ([string]::IsNullOrWhiteSpace($dbPasswordInput)) {
        Write-Warning "A senha não pode ficar vazia."
        $securePassword = Read-Host "Informe a senha do banco (DB_PASSWORD)" -AsSecureString
        $dbPasswordInput = ConvertTo-PlainText -SecureString $securePassword
    }

    Copy-Item -Path $ExamplePath -Destination $EnvPath -Force
    $envContent = Get-Content $EnvPath -Raw
    $envContent = $envContent -replace "(?m)^(\s*DB_USER)=.*$", "`$1=$dbUserInput"
    $envContent = $envContent -replace "(?m)^(\s*DB_PASSWORD)=.*$", "`$1=$dbPasswordInput"
    Set-Content -Path $EnvPath -Value $envContent -Encoding UTF8

    Write-Host "Arquivo .env configurado em $EnvPath."
}

function Run-Migrations {
    param (
        [string]$ApiPath
    )

    Write-Step "Executando migrações do banco..."
    Push-Location $ApiPath
    try {
        node migrations/run_migrations.js | Write-Output
        if ($LASTEXITCODE -ne 0) {
            throw "Execução das migrações falhou."
        }
    }
    finally {
        Pop-Location
    }
}

function Start-NewCmdProcess {
    param (
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )

    $cmdInstruction = "title $Title && cd /d `"$WorkingDirectory`" && $Command"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $cmdInstruction -WorkingDirectory $WorkingDirectory | Out-Null
}

try {
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location $scriptRoot

    $apiPath = Join-Path $scriptRoot "API"
    $envExamplePath = Join-Path $apiPath ".env.exemple"
    $envPath = Join-Path $apiPath ".env"

    Install-NpmDependencies -TargetPath $apiPath -Label "da API"
    Install-NpmDependencies -TargetPath $scriptRoot -Label "do frontend"
    Configure-EnvFile -ExamplePath $envExamplePath -EnvPath $envPath
    Run-Migrations -ApiPath $apiPath

    Write-Step "Iniciando servidores em novas janelas..."
    Start-NewCmdProcess -Title "API - Quizzy Brainy" -WorkingDirectory $apiPath -Command "npm run dev"
    Start-NewCmdProcess -Title "WEB - Quizzy Brainy" -WorkingDirectory $scriptRoot -Command "npm run dev"

    Write-Host ""
    Write-Host "Tudo pronto! Esta janela será fechada em 5 segundos." -ForegroundColor Green
    Start-Sleep -Seconds 5
}
catch {
    Write-Host ""
    Write-Error $_
    Read-Host "Ocorreu um erro. Pressione Enter para fechar"
}


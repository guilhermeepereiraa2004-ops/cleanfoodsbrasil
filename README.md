# Clean Foods Brasil

Site institucional estático da Clean Foods Brasil.

## Executar localmente

É necessário ter o Node.js 18 ou superior instalado. Não há dependências para instalar.

```bash
npm run dev
```

Caso o PowerShell bloqueie o arquivo `npm.ps1`, use o executável oficial do npm para Windows:

```powershell
npm.cmd run dev
```

O terminal mostrará um endereço como:

```text
http://localhost:4173
```

Abra esse endereço no navegador. Não digite o endereço sozinho no PowerShell, pois uma URL não é um comando. Para abrir pelo próprio PowerShell, use:

```powershell
Start-Process "http://localhost:4173"
```

Se a porta `4173` já estiver ocupada, o servidor escolherá automaticamente a próxima porta livre e mostrará o endereço correto. O servidor fica ativo até você pressionar `Ctrl+C` no terminal.

### Usar outra porta

No PowerShell:

```powershell
$env:PORT=5173; npm run dev
```

Para permitir acesso por outro dispositivo na mesma rede:

```powershell
$env:HOST="0.0.0.0"; npm run dev
```

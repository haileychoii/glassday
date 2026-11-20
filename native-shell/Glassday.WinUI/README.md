# Glassday WinUI shell

This Windows App SDK shell hosts the existing Glassday React/Vite dashboard in WebView2.

## Run

Start Vite from the repository root:

```powershell
npm.cmd run dev -- --host localhost
```

In another PowerShell window:

```powershell
$env:DOTNET_CLI_HOME = "$env:TEMP\glassday-dotnet"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
dotnet run --project native-shell\Glassday.WinUI\Glassday.WinUI.csproj
```

The default URL is `http://localhost:5173`. Set `GLASSDAY_DEV_URL` to use another Vite port.

The Tauri shell remains available as a fallback while this native path is verified.

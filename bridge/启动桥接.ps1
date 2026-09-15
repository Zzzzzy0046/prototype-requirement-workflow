#requires -Version 7.0
param(
 [Parameter(Mandatory)][string]$ProjectRp,
 [string]$AxureExe,
 [string]$SessionName='default',
 [int]$Port=45180,
 [switch]$RegisterMcp,
 [switch]$Resume
)
$ErrorActionPreference='Stop'
if(!$IsWindows){throw 'Windows only'}
if($SessionName -notmatch '^[a-zA-Z0-9_-]{1,40}$'){throw 'SessionName must contain only letters, digits, underscore or hyphen'}
$axNode=(Get-Command node -ErrorAction Stop).Source
if([int]((& $axNode -p 'process.versions.node.split(".")[0]')) -lt 20){throw 'Node.js 20+ required'}
if($RegisterMcp){$null=Get-Command codex -ErrorAction Stop}
. (Join-Path $PSScriptRoot 'compatibility.ps1')
if(!$AxureExe){
 $axRows=Get-ItemProperty 'HKLM:/Software/Microsoft/Windows/CurrentVersion/Uninstall/*','HKLM:/Software/WOW6432Node/Microsoft/Windows/CurrentVersion/Uninstall/*','HKCU:/Software/Microsoft/Windows/CurrentVersion/Uninstall/*' -ErrorAction SilentlyContinue
 $axCandidates=@($axRows|Where-Object {$_.DisplayName -eq 'Axure RP 11' -and $_.InstallLocation}|ForEach-Object {Join-Path $_.InstallLocation 'AxureRP11.exe'}|Where-Object {Test-Path -LiteralPath $_}|Select-Object -Unique)
 $axMatches=@($axCandidates|Where-Object {(Get-AxureCompatibility $_).liveWriteValidated})
 if($axMatches.Count -ne 1){throw 'Cannot choose one validated Axure installation. Supply -AxureExe with its full path.'}
 $AxureExe=$axMatches[0]
}
$axCompatibility=Get-AxureCompatibility $AxureExe
if(!$axCompatibility.liveWriteValidated){throw ($axCompatibility|ConvertTo-Json -Compress)}
$axProject=(Resolve-Path -LiteralPath $ProjectRp).Path
if([IO.Path]::GetExtension($axProject) -ne '.rp'){throw 'ProjectRp must be an existing .rp'}
if(!(Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/@modelcontextprotocol/sdk/package.json'))){throw 'Run npm ci --ignore-scripts inside this extracted folder first.'}
$axSessionDir=Join-Path $PSScriptRoot "sessions/$SessionName"
$axSessionFile=Join-Path $axSessionDir 'session.json'
if($Resume){
 $axPrevious=Get-Content -LiteralPath $axSessionFile -Raw|ConvertFrom-Json
 if([IO.Path]::GetFullPath($axPrevious.document) -ne $axProject){throw 'Resume project differs from session binding'}
 & (Join-Path $PSScriptRoot 'resume-live.ps1') -AxureExe $AxureExe -SessionFile $axSessionFile -BridgeDirectory (Join-Path $PSScriptRoot 'bin')
}else{
 & (Join-Path $PSScriptRoot 'start-project.ps1') -AxureExe $AxureExe -ProjectRp $axProject -BridgeDirectory (Join-Path $PSScriptRoot 'bin') -SessionDirectory $axSessionDir -Port $Port
}
if($RegisterMcp){
 & codex mcp add axure-prototype-bridge -- $axNode (Join-Path $PSScriptRoot 'mcp-live.mjs') --session $axSessionFile
 if($LASTEXITCODE -ne 0){throw 'MCP registration failed; Axure session may already be running. Do not start another copy.'}
}
Write-Host "Session ready to check: node verify-connection.mjs --session `"$axSessionFile`""
Write-Host 'Wait until Axure has opened the correct file. No successful connection is assumed by this launcher.'


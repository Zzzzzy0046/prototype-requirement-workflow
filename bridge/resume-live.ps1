param([Parameter(Mandatory)][string]$AxureExe,[Parameter(Mandatory)][string]$SessionFile,[string]$BridgeDirectory)
$ErrorActionPreference='Stop'
$axExe=(Resolve-Path -LiteralPath $AxureExe).Path
$axSession=(Resolve-Path -LiteralPath $SessionFile).Path
$axConfig=Get-Content -LiteralPath $axSession -Raw|ConvertFrom-Json
. (Join-Path $PSScriptRoot 'compatibility.ps1')
$axCompatibility=Get-AxureCompatibility $axExe
if(!$axCompatibility.liveWriteValidated){throw ($axCompatibility|ConvertTo-Json -Compress)}
$axBridge=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot ('adapters/'+$axCompatibility.adapter))).Path
foreach($axName in @('LiveHook.dll','LiveOperations.dll')){[void][Reflection.AssemblyName]::GetAssemblyName((Join-Path $axBridge $axName))}
$axConfig.hook=Join-Path $axBridge 'LiveHook.dll'
$axConfig.version=$axCompatibility.version
$axConfig.adapter=$axCompatibility.adapter
$axExpected=Join-Path ([IO.Path]::GetDirectoryName($axSession)) 'live-test.rp'
if($axConfig.mode -ne 'owned-project' -and ([IO.Path]::GetFullPath($axConfig.document) -ne $axExpected -or $axConfig.document -eq $axConfig.source)){throw 'Not an isolated session copy or explicitly bound owned project'}
if(!(Test-Path -LiteralPath $axConfig.document) -or !(Test-Path -LiteralPath $axConfig.hook)){throw 'Session document or hook missing'}
if($axConfig.port -lt 1024 -or $axConfig.port -gt 65535){throw 'Invalid port'}
$axProbe=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,[int]$axConfig.port)
try{$axProbe.Start()}finally{$axProbe.Stop()}
$axConfig.token=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
[IO.File]::WriteAllText($axSession,($axConfig|ConvertTo-Json))
$axStart=[Diagnostics.ProcessStartInfo]::new($axExe)
$axStart.UseShellExecute=$false;$axStart.WindowStyle=[Diagnostics.ProcessWindowStyle]::Hidden
$axStart.WorkingDirectory=Split-Path $axExe
$axStart.ArgumentList.Add($axConfig.document)
$axStart.Environment['DOTNET_STARTUP_HOOKS']=$axConfig.hook
$axStart.Environment['AXURE_LIVE_SESSION']=$axSession
$axProcess=[Diagnostics.Process]::Start($axStart)
[pscustomobject]@{pid=$axProcess.Id;port=$axConfig.port;document=$axConfig.document;session=$axSession}|ConvertTo-Json

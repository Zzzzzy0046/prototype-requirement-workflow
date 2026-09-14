param(
 [Parameter(Mandatory)][string]$AxureExe,
 [Parameter(Mandatory)][string]$ProjectRp,
 [Parameter(Mandatory)][string]$BridgeDirectory,
 [Parameter(Mandatory)][string]$SessionDirectory,
 [int]$Port=45174
)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'compatibility.ps1')
$axCompatibility=Get-AxureCompatibility $AxureExe
if(!$axCompatibility.liveWriteValidated){throw ($axCompatibility|ConvertTo-Json -Compress)}
$axDoc=(Resolve-Path -LiteralPath $ProjectRp).Path
if([IO.Path]::GetExtension($axDoc) -ne '.rp'){throw 'Project must be .rp'}
$axBridge=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot ('adapters/'+$axCompatibility.adapter))).Path
foreach($axName in @('LiveHook.dll','LiveOperations.dll')){[void][Reflection.AssemblyName]::GetAssemblyName((Join-Path $axBridge $axName))}
if(Test-Path -LiteralPath $SessionDirectory){throw 'Session directory already exists'}
if($Port -lt 1024 -or $Port -gt 65535){throw 'Invalid port'}
$axProbe=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$Port)
try{$axProbe.Start()}finally{$axProbe.Stop()}
$axSession=New-Item -ItemType Directory -Path $SessionDirectory
$axAcl=Get-Acl -LiteralPath $axSession.FullName
$axAcl.SetAccessRuleProtection($true,$false)
$axUser=[Security.Principal.WindowsIdentity]::GetCurrent().User
foreach($axSid in @($axUser,[Security.Principal.SecurityIdentifier]::new('S-1-5-18'))){$axAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($axSid,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))}
Set-Acl -LiteralPath $axSession.FullName -AclObject $axAcl
$axConfigPath=Join-Path $axSession.FullName 'session.json'
$axConfig=@{port=$Port;token=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32));document=$axDoc;mode='owned-project';hook=Join-Path $axBridge 'LiveHook.dll';version=$axCompatibility.version;adapter=$axCompatibility.adapter}
[IO.File]::WriteAllText($axConfigPath,($axConfig|ConvertTo-Json))
$axStart=[Diagnostics.ProcessStartInfo]::new($axCompatibility.exe)
$axStart.UseShellExecute=$false;$axStart.WindowStyle='Hidden'
$axStart.WorkingDirectory=Split-Path $axCompatibility.exe
$axStart.ArgumentList.Add($axDoc)
$axStart.Environment['DOTNET_STARTUP_HOOKS']=$axConfig.hook
$axStart.Environment['AXURE_LIVE_SESSION']=$axConfigPath
$axProcess=[Diagnostics.Process]::Start($axStart)
[pscustomobject]@{pid=$axProcess.Id;document=$axDoc;session=$axConfigPath;compatibility=$axCompatibility}|ConvertTo-Json -Depth 4

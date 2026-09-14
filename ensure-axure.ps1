#requires -Version 7.0
param([Parameter(Mandatory)][string]$Workspace,[string]$ProjectRp,[string]$AxureExe)
$ErrorActionPreference='Stop'
if(!$IsWindows){throw 'Windows required'}
$wfRoot=[IO.Path]::GetFullPath($Workspace)
if(!(Test-Path -LiteralPath $wfRoot -PathType Container)){throw 'Workspace must exist'}
$wfConfigFile=Join-Path $wfRoot '.axure-workflow.json'
$wfLockFile=Join-Path $wfRoot '.axure-start.lock'
try{$wfLock=[IO.File]::Open($wfLockFile,'OpenOrCreate','ReadWrite','None')}catch{throw 'Another startup check is running for this workspace. Wait for its result.'}
try{
 $wfConfig=if(Test-Path -LiteralPath $wfConfigFile){Get-Content -LiteralPath $wfConfigFile -Raw|ConvertFrom-Json}else{$null}
 if(!$ProjectRp -and $wfConfig){$ProjectRp=$wfConfig.projectRp}
 if(!$ProjectRp){throw 'PROJECT_REQUIRED: Specify the target RP. First use still needs a blank RP created and saved in Axure.'}
 $wfProject=(Resolve-Path -LiteralPath $ProjectRp).Path
 if([IO.Path]::GetExtension($wfProject) -ne '.rp'){throw 'Expected an existing .rp file'}
 if($wfConfig.projectRp -and [IO.Path]::GetFullPath($wfConfig.projectRp) -ne $wfProject){throw 'PROJECT_MISMATCH: This workspace is bound to a different RP.'}
 $wfNode=(Get-Command node -ErrorAction Stop).Source
 if([int](& $wfNode -p 'process.versions.node.split(".")[0]') -lt 20){throw 'Node.js 20+ required'}
 $wfBridge=Join-Path $PSScriptRoot 'bridge'
 $wfSessionFile=if($wfConfig.sessionFile){[IO.Path]::GetFullPath($wfConfig.sessionFile)}else{Join-Path $wfRoot '.axure-session/session.json'}
 $wfSession=if(Test-Path -LiteralPath $wfSessionFile){Get-Content -LiteralPath $wfSessionFile -Raw|ConvertFrom-Json}else{$null}
 if($wfSession){
  if([IO.Path]::GetFullPath($wfSession.document) -ne $wfProject){throw 'SESSION_MISMATCH: Session belongs to another RP.'}
  if($wfSession.port -lt 1024 -or $wfSession.port -gt 65535 -or $wfSession.token -notmatch '^[A-Fa-f0-9]{64}$'){throw 'Invalid local session configuration'}
 }
 function Read-WorkflowStatus {
  if(!$wfSession){return $null}
  try{
   Invoke-RestMethod -Uri "http://127.0.0.1:$($wfSession.port)/operations" -Method Post -ContentType application/json -Headers @{'X-Axure-Bridge-Token'=$wfSession.token} -Body '{"action":"status"}' -TimeoutSec 2
  }catch{return $null}
 }
 function Assert-WorkflowStatus($wfStatus){
  if($wfStatus.error){throw "BRIDGE_ERROR: $($wfStatus.message)"}
  if($wfStatus.faulted){throw 'BRIDGE_FAULTED: Stop writing and inspect the session.'}
  if($wfStatus.version -notin @('11.0.0.4134','11.0.0.4137','11.0.0.4149') -or !$wfStatus.document -or [IO.Path]::GetFullPath($wfStatus.document) -ne $wfProject){throw 'Unexpected bridge build or document'}
 }
 function Save-WorkflowConfig($wfPid){
  $wfData=if($wfConfig){$wfConfig}else{[pscustomobject]@{}}
  $wfValues=@{bundleRoot=$PSScriptRoot;projectRp=$wfProject;sessionFile=$wfSessionFile;outputDirectory=if($wfConfig.outputDirectory){$wfConfig.outputDirectory}else{Join-Path $wfRoot 'output'};axurePid=$wfPid}
  if($AxureExe){$wfValues.axureExe=$AxureExe}
  foreach($wfKey in $wfValues.Keys){$wfData|Add-Member -NotePropertyName $wfKey -NotePropertyValue $wfValues[$wfKey] -Force}
  [IO.File]::WriteAllText($wfConfigFile+'.tmp',($wfData|ConvertTo-Json))
  [IO.File]::Move($wfConfigFile+'.tmp',$wfConfigFile,$true)
 }
 # Install dependencies only when missing; repeated checks do not run npm ci.
 if(!(Test-Path -LiteralPath (Join-Path $wfBridge 'node_modules/@modelcontextprotocol/sdk/package.json')) -or !(Test-Path -LiteralPath (Join-Path $wfBridge 'node_modules/zod/package.json'))){
  Push-Location $wfBridge
  try{& npm ci --ignore-scripts --no-audit --no-fund;if($LASTEXITCODE -ne 0){throw 'Dependency installation failed'}}finally{Pop-Location}
 }
 $wfStatus=Read-WorkflowStatus
 if($wfStatus){
  Assert-WorkflowStatus $wfStatus
  Save-WorkflowConfig $wfStatus.pid
  [pscustomobject]@{ready=$true;action='reused';pid=$wfStatus.pid;document=$wfProject;sessionFile=$wfSessionFile}|ConvertTo-Json
  return
 }
 # An occupied previous endpoint is not evidence that it is safe to launch another process.
 if($wfSession){
  $wfProbe=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,[int]$wfSession.port)
  try{$wfProbe.Start()}catch{throw 'SESSION_UNRESPONSIVE: Previous endpoint is occupied. Inspect the existing Axure process; no restart attempted.'}finally{$wfProbe.Stop()}
 }
 $wfProcesses=@(Get-CimInstance Win32_Process -Filter "Name = 'AxureRP11.exe'")
 $wfMatch=@($wfProcesses|Where-Object {$_.CommandLine -and $_.CommandLine.IndexOf($wfProject,[StringComparison]::OrdinalIgnoreCase) -ge 0})
 if($wfConfig.axurePid -and ($wfProcesses|Where-Object ProcessId -eq $wfConfig.axurePid)){$wfMatch+=@($wfConfig.axurePid)}
 $wfTitle=[IO.Path]::GetFileNameWithoutExtension($wfProject)
 $wfWindows=@(Get-Process -Name AxureRP11 -ErrorAction SilentlyContinue|Where-Object {$_.MainWindowTitle -and $_.MainWindowTitle.IndexOf($wfTitle,[StringComparison]::OrdinalIgnoreCase) -ge 0})
 if($wfMatch.Count -gt 0 -or $wfWindows.Count -gt 0){throw 'PROJECT_OPEN: Save and close the target RP in its existing Axure window, then retry. No process was closed.'}
 try{$wfFileCheck=[IO.File]::Open($wfProject,'Open','ReadWrite','None');$wfFileCheck.Dispose()}catch{throw 'PROJECT_BUSY: Target RP is locked or not writable. Save and close it before retrying.'}
 . (Join-Path $wfBridge 'compatibility.ps1')
 if(!$AxureExe -and $wfConfig.axureExe){$AxureExe=$wfConfig.axureExe}
 if(!$AxureExe){
  $wfRows=Get-ItemProperty 'HKLM:/Software/Microsoft/Windows/CurrentVersion/Uninstall/*','HKLM:/Software/WOW6432Node/Microsoft/Windows/CurrentVersion/Uninstall/*','HKCU:/Software/Microsoft/Windows/CurrentVersion/Uninstall/*' -ErrorAction SilentlyContinue
  $wfCandidates=@($wfRows|Where-Object {$_.DisplayName -eq 'Axure RP 11' -and $_.InstallLocation}|ForEach-Object {Join-Path $_.InstallLocation 'AxureRP11.exe'}|Where-Object {Test-Path -LiteralPath $_}|Select-Object -Unique|Where-Object {(Get-AxureCompatibility $_).liveWriteValidated})
  if($wfCandidates.Count -ne 1){throw 'AXURE_PATH_REQUIRED: Cannot identify one supported Axure installation. Supply -AxureExe.'}
  $AxureExe=$wfCandidates[0]
 }
 $wfCompatibility=Get-AxureCompatibility $AxureExe
 if(!$wfCompatibility.liveWriteValidated){throw 'Unsupported Axure build; supported Windows builds: 11.0.0.4134, 11.0.0.4137, 11.0.0.4149'}
 $wfAction=if($wfSession){'resumed'}else{'started'}
 if($wfSession){
  & (Join-Path $wfBridge 'resume-live.ps1') -AxureExe $AxureExe -SessionFile $wfSessionFile -BridgeDirectory (Join-Path $wfBridge 'bin')
 }else{
  $wfProbe=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
  try{$wfProbe.Start();$wfPort=$wfProbe.LocalEndpoint.Port}finally{$wfProbe.Stop()}
  & (Join-Path $wfBridge 'start-project.ps1') -AxureExe $AxureExe -ProjectRp $wfProject -BridgeDirectory (Join-Path $wfBridge 'bin') -SessionDirectory (Split-Path $wfSessionFile) -Port $wfPort
 }
 $wfSession=Get-Content -LiteralPath $wfSessionFile -Raw|ConvertFrom-Json
 # Persist binding even if startup readiness fails, so the next attempt cannot launch a duplicate.
 Save-WorkflowConfig $null
 for($wfAttempt=0;$wfAttempt -lt 20;$wfAttempt++){
  $wfStatus=Read-WorkflowStatus
  if($wfStatus -and !$wfStatus.error){
   Assert-WorkflowStatus $wfStatus
   Save-WorkflowConfig $wfStatus.pid
   [pscustomobject]@{ready=$true;action=$wfAction;pid=$wfStatus.pid;document=$wfProject;sessionFile=$wfSessionFile}|ConvertTo-Json
   return
  }
  if($wfStatus.faulted){throw 'BRIDGE_FAULTED: No further startup attempts'}
  Start-Sleep -Milliseconds 500
 }
 throw 'STARTUP_NOT_READY: Axure was launched once but is not ready. Inspect its file/error dialog; do not start another copy.'
}finally{$wfLock.Dispose()}

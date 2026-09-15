#requires -Version 7.0
param(
 [Parameter(Mandatory)][string]$Workspace,
 [string]$ProjectRp,
 [string]$AxureExe,
 [switch]$PreviewOnly,
 [switch]$Resume,
 [switch]$RegisterMcp,
 [string]$SessionName='default',
 [int]$Port=45180
)
$ErrorActionPreference='Stop'
if(!$IsWindows){throw 'The complete Axure workflow requires Windows.'}
if($SessionName -notmatch '^[a-zA-Z0-9_-]{1,40}$'){throw 'Invalid SessionName'}
$wfWorkspace=[IO.Path]::GetFullPath($Workspace)
$wfSkill=Join-Path $wfWorkspace '.agents/skills/prototype-requirement-writer'
$wfSource=Join-Path $PSScriptRoot 'skills/prototype-requirement-writer'
$wfConfig=Join-Path $wfWorkspace '.axure-workflow.json'
if(!$PreviewOnly){
 if(!$ProjectRp){throw 'Supply the full path of your saved blank test RP with -ProjectRp, or use -PreviewOnly.'}
 $ProjectRp=(Resolve-Path -LiteralPath $ProjectRp).Path
}
if(Test-Path -LiteralPath $wfConfig){
 $wfPrevious=Get-Content -LiteralPath $wfConfig -Raw|ConvertFrom-Json
 if($wfPrevious.bundleRoot -ne $PSScriptRoot){throw 'Workspace already belongs to another bundle. Use a new workspace or explicitly migrate its configuration.'}
 if($ProjectRp -and $wfPrevious.projectRp -and $wfPrevious.projectRp -ne $ProjectRp){throw 'Workspace is already bound to another RP. Use a new workspace.'}
 if($wfPrevious.sessionName -ne $SessionName){throw 'Workspace session differs; use its original SessionName or a new workspace.'}
}
# Do not replace an existing customized skill silently.
if(Test-Path -LiteralPath $wfSkill){
 foreach($wfFile in Get-ChildItem -LiteralPath $wfSource -Recurse -File){
  $wfTarget=Join-Path $wfSkill ([IO.Path]::GetRelativePath($wfSource,$wfFile.FullName))
  if(!(Test-Path -LiteralPath $wfTarget) -or (Get-FileHash -LiteralPath $wfTarget).Hash -ne (Get-FileHash -LiteralPath $wfFile.FullName).Hash){throw 'A different prototype-requirement-writer already exists in this workspace. Use a fresh workspace or merge it explicitly.'}
 }
}
$wfNode=(Get-Command node -ErrorAction Stop).Source
if([int](& $wfNode -p 'process.versions.node.split(".")[0]') -lt 20){throw 'Node.js 20+ required'}
Push-Location (Join-Path $PSScriptRoot 'bridge')
try{& npm ci --ignore-scripts --no-audit --no-fund;if($LASTEXITCODE -ne 0){throw 'Dependency installation failed'}}finally{Pop-Location}
if(!(Test-Path -LiteralPath $wfSkill)){
 $null=New-Item -ItemType Directory -Path (Split-Path $wfSkill) -Force
 Copy-Item -LiteralPath $wfSource -Destination $wfSkill -Recurse
}
$wfData=@{bundleRoot=$PSScriptRoot;projectRp=$ProjectRp;sessionName=$SessionName;sessionFile=Join-Path $PSScriptRoot "bridge/sessions/$SessionName/session.json";outputDirectory=Join-Path $wfWorkspace 'output'}
if($PreviewOnly -and $wfPrevious -and $wfPrevious.projectRp){$wfData.projectRp=$wfPrevious.projectRp}
[IO.File]::WriteAllText($wfConfig,($wfData|ConvertTo-Json))
if(!$PreviewOnly){
 $wfArgs=@{ProjectRp=$ProjectRp;SessionName=$SessionName;Port=$Port;RegisterMcp=$RegisterMcp;Resume=$Resume}
 if($AxureExe){$wfArgs.AxureExe=$AxureExe}
 & (Join-Path $PSScriptRoot 'bridge/启动桥接.ps1') @wfArgs
 & $wfNode (Join-Path $PSScriptRoot 'bridge/verify-connection.mjs') --session $wfData.sessionFile
 if($LASTEXITCODE -ne 0){throw 'Axure connection failed. Do not draw yet; inspect the reported error.'}
}
Write-Host "Ready. Open this workspace in your Agent: $wfWorkspace"
Write-Host 'Use $prototype-requirement-writer and describe your requirements. See AGENT-START.md.'
if($PreviewOnly){Write-Host 'PreviewOnly config does not mean Axure is connected.'}

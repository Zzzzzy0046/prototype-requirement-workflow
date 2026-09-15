#requires -Version 7.0
param()
$ErrorActionPreference='Stop'
$wfRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$wfName='prototype-requirement-workflow-1.9.2'
$wfZip=Join-Path $wfRoot ('dist/'+$wfName+'.zip')
$wfSidecar=$wfZip+'.sha256.txt'
if((Test-Path -LiteralPath $wfZip) -or (Test-Path -LiteralPath $wfSidecar)){throw 'Sealed release already exists; use a new version, never overwrite'}

# Public bundle is an explicit runtime allowlist. Development notes, feedback,
# tests, source code and generated project data stay in the repository.
$wfPaths=@(
 'README-完整工作流.md',
 'AGENT-START.md',
 '开始完整工作流.ps1',
 'ensure-axure.ps1',
 'docs/竞品截图与功能框架驱动工作流规范.md',
 'examples/README.md',
 'bridge/启动桥接.ps1',
 'bridge/compatibility.ps1',
 'bridge/history.mjs',
 'bridge/mcp-live.mjs',
 'bridge/package-lock.json',
 'bridge/package.json',
 'bridge/planning.mjs',
 'bridge/resume-live.ps1',
 'bridge/scene.mjs',
 'bridge/start-project.ps1',
 'bridge/validate-plan.mjs',
 'bridge/verify-connection.mjs',
 'bridge/workflow.mjs'
)

foreach($wfTree in @(
 'skills/prototype-requirement-writer',
 'examples/reference',
 'bridge/adapters'
)){
 $wfTreeRoot=Join-Path $wfRoot $wfTree
 $wfPaths+=Get-ChildItem -LiteralPath $wfTreeRoot -File -Recurse | ForEach-Object {
  [IO.Path]::GetRelativePath($wfRoot,$_.FullName).Replace('\','/')
 }
}

$wfPaths=@($wfPaths | Sort-Object -Unique)
$wfForbidden='(^|/)(node_modules|sessions?|history|bin|obj|private|output|test-fixtures|src)(/|$)|(^|/)(session.json|axure-map.json|local-runtime.md|\.axure-workflow.json|试用反馈\.md|验证记录\.md|三版本验证\.md|compatibility-results\.json)$|\.(rp|rplib|exe|env|log|zip)$|(^|/)\.\.(/|$)'
$wfLines=foreach($wfRel in $wfPaths){
 if($wfRel -match $wfForbidden){throw "Forbidden bundle path: $wfRel"}
 $wfFull=[IO.Path]::GetFullPath((Join-Path $wfRoot $wfRel))
 if(!$wfFull.StartsWith($wfRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Path escape'}
 if(!(Test-Path -LiteralPath $wfFull -PathType Leaf)){throw "Missing file: $wfRel"}
 "$((Get-FileHash -LiteralPath $wfFull).Hash)  $wfRel"
}

[IO.File]::WriteAllText(
 (Join-Path $wfRoot 'SHA256SUMS.txt'),
 (($wfLines -join "`n")+"`n"),
 [Text.UTF8Encoding]::new($false)
)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$wfArchive=[IO.Compression.ZipFile]::Open($wfZip,[IO.Compression.ZipArchiveMode]::Create)
try{
 foreach($wfRel in @($wfPaths)+@('SHA256SUMS.txt')){
  $null=[IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
   $wfArchive,
   (Join-Path $wfRoot $wfRel),
   ($wfName+'/'+$wfRel),
   [IO.Compression.CompressionLevel]::Optimal
  )
 }
}finally{$wfArchive.Dispose()}

$wfZipHash=(Get-FileHash -LiteralPath $wfZip).Hash
[IO.File]::WriteAllText($wfSidecar,"$wfZipHash  $([IO.Path]::GetFileName($wfZip))`n",[Text.UTF8Encoding]::new($false))

[pscustomobject]@{
 zip=$wfZip
 files=$wfPaths.Count+1
 bytes=(Get-Item -LiteralPath $wfZip).Length
 sha256=$wfZipHash
 sidecar=$wfSidecar
}|ConvertTo-Json

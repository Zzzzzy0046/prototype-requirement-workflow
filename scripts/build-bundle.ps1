#requires -Version 7.0
param()
$ErrorActionPreference='Stop'
$wfRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$wfName='prototype-requirement-workflow-1.7.0'
$wfZip=Join-Path $wfRoot ('dist/'+$wfName+'.zip')
if(Test-Path -LiteralPath $wfZip){throw 'Sealed ZIP already exists; use a new version, never overwrite'}
# Use the previous maintained allowlist, not a recursive workspace scan.
$wfPaths=@(Get-Content -LiteralPath (Join-Path $wfRoot 'SHA256SUMS.txt') | ForEach-Object {if($_ -match '^[A-Fa-f0-9]{64}  (.+)$'){$Matches[1]}else{throw 'Invalid manifest'}})
$wfPaths+=@(
 'skills/prototype-requirement-writer/references/guided-intake.md',
 'skills/prototype-requirement-writer/references/house-review-profile.md',
 'examples/review-template-library/request.md',
 'examples/review-template-library/requirements-model.json',
 'examples/review-template-library/page-plan.json',
 'examples/review-template-library/scene.json'
)
$wfPaths=@($wfPaths | Sort-Object -Unique)
$wfLines=foreach($wfRel in $wfPaths){
 if($wfRel -match '(^|/)(node_modules|sessions|history|bin|obj|private|output)(/|$)|(^|/)(session.json|axure-map.json|local-runtime.md|\.axure-workflow.json)$|\.(rp|rplib|exe|env|log|zip)$|(^|/)\.\.(/|$)'){throw "Forbidden bundle path: $wfRel"}
 $wfFull=[IO.Path]::GetFullPath((Join-Path $wfRoot $wfRel))
 if(!$wfFull.StartsWith($wfRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Path escape'}
 if(!(Test-Path -LiteralPath $wfFull -PathType Leaf)){throw "Missing file: $wfRel"}
 "$((Get-FileHash -LiteralPath $wfFull).Hash)  $wfRel"
}
[IO.File]::WriteAllLines((Join-Path $wfRoot 'SHA256SUMS.txt'),$wfLines,[Text.UTF8Encoding]::new($false))
$wfArchive=[IO.Compression.ZipFile]::Open($wfZip,[IO.Compression.ZipArchiveMode]::Create)
try{foreach($wfRel in @($wfPaths)+@('SHA256SUMS.txt')){
 $null=[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($wfArchive,(Join-Path $wfRoot $wfRel),($wfName+'/'+$wfRel),[IO.Compression.CompressionLevel]::Optimal)
}}finally{$wfArchive.Dispose()}
[pscustomobject]@{zip=$wfZip;files=$wfPaths.Count+1;bytes=(Get-Item -LiteralPath $wfZip).Length;sha256=(Get-FileHash -LiteralPath $wfZip).Hash}|ConvertTo-Json

function Get-AxureCompatibility {
 param([Parameter(Mandatory)][string]$AxureExe)
 $exe=(Resolve-Path -LiteralPath $AxureExe).Path
 $version=(Get-Item -LiteralPath $exe).VersionInfo.FileVersion
 $runtimePath=[IO.Path]::ChangeExtension($exe,'.runtimeconfig.json')
 $runtime=$null
 if(Test-Path -LiteralPath $runtimePath){$runtime=(Get-Content -LiteralPath $runtimePath -Raw|ConvertFrom-Json).runtimeOptions.tfm}
 if(!$runtime -and (Test-Path -LiteralPath ($exe+'.config'))){
  $axXml=[xml](Get-Content -LiteralPath ($exe+'.config') -Raw)
  $runtime=[string]$axXml.configuration.startup.supportedRuntime.sku
 }
 # Version-specific native bindings are never assumed safe after an upgrade.
 $adapter=if($version -eq '11.0.0.4149' -and $runtime -eq 'net10.0'){'rp11-4149'}elseif($version -in @('11.0.0.4134','11.0.0.4137') -and $runtime -eq 'net8.0'){'rp11-'+$version.Split('.')[-1]}else{$null}
 $axFileApiValidated=$version -eq '9.0.0.3648' -and $runtime -eq '.NETFramework,Version=v4.5.2'
 [pscustomobject]@{exe=$exe;version=$version;runtime=$runtime;adapter=$adapter;liveWriteValidated=($null -ne $adapter);fileRoundtripValidated=$axFileApiValidated;reason=if($adapter){'Matches the tested RP11 live bridge build'}elseif($axFileApiValidated){'RP9 native Load/Save/reload tested; live editor adapter NOT implemented; RP11 files rejected'}else{'No validated native adapter for this build; do not modify version headers or bypass the guard'}}
}

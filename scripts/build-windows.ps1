$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
# Resolve Visual Studio dynamically instead of assuming a developer's installation.
$vswhere = "${env:ProgramFiles(x86)}/Microsoft Visual Studio/Installer/vswhere.exe"
$install = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (!$install) { throw 'Install Visual Studio C++ Build Tools first.' }
$msvc = Get-ChildItem "$install/VC/Tools/MSVC" -Directory | Sort-Object Name -Descending | Select-Object -First 1
$sdkRoot = "${env:ProgramFiles(x86)}/Windows Kits/10"
$sdk = Get-ChildItem "$sdkRoot/Include" -Directory | Where-Object { Test-Path "$($_.FullName)/um/windows.h" } | Sort-Object Name -Descending | Select-Object -First 1
if (!$sdk) { throw 'Windows SDK is missing.' }
$env:INCLUDE = "$($msvc.FullName)/include;$sdkRoot/Include/$($sdk.Name)/ucrt;$sdkRoot/Include/$($sdk.Name)/shared;$sdkRoot/Include/$($sdk.Name)/um"
$env:LIB = "$($msvc.FullName)/lib/x64;$sdkRoot/Lib/$($sdk.Name)/ucrt/x64;$sdkRoot/Lib/$($sdk.Name)/um/x64"
$env:PATH = "$($msvc.FullName)/bin/Hostx64/x64;" + $env:PATH
$buildRoot = Join-Path $repoRoot 'build'
New-Item -ItemType Directory -Force -Path $buildRoot | Out-Null
Push-Location $buildRoot
try {
  $sources = (Get-ChildItem "$repoRoot/src" -Filter '*.cpp').FullName
  & cl.exe /nologo /EHsc /std:c++17 /utf-8 /W4 /O2 /I"$repoRoot/include" $sources /Fe:app.exe
  if ($LASTEXITCODE -ne 0) { throw 'CLI build failed.' }
  & cl.exe /nologo /EHsc /std:c++17 /utf-8 /W4 /O2 /I"$repoRoot/include" "$repoRoot/tests/route-tests.cpp" "$repoRoot/src/Map.cpp" "$repoRoot/src/GPS.cpp" /Fe:route-tests.exe
  if ($LASTEXITCODE -ne 0) { throw 'Test build failed.' }
  & ./route-tests.exe
  if ($LASTEXITCODE -ne 0) { throw 'Routing regression failed.' }
  & ./app.exe "$repoRoot/input/input.txt"
  if ($LASTEXITCODE -ne 0) { throw 'Original sample failed.' }
} finally { Pop-Location }

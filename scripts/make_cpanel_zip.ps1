Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = Join-Path $PSScriptRoot "..\examguard-v1.2.2-cpanel.zip"
$zipPath = [System.IO.Path]::GetFullPath($zipPath)
$distPath = Join-Path $PSScriptRoot "..\dist"
$distPath = [System.IO.Path]::GetFullPath($distPath)

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

Get-ChildItem -Path $distPath -Recurse -Force | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $rel = $_.FullName.Substring($distPath.Length + 1).Replace('\', '/')
        if (-not ($rel -like '*.db*' -or $rel -like '*.sqlite*')) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel)
        }
    }
}
$zip.Dispose()

$check = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
Write-Output ("Total entries: " + $check.Entries.Count)
$check.Entries | ForEach-Object { Write-Output ($_.FullName + " (" + $_.Length + " bytes)") }
$check.Dispose()
Write-Output ("Zip created at: " + $zipPath)

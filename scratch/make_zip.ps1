Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = "D:\laragon\www\examguard\dist\examguard-cpanel-ready.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "D:\laragon\www\examguard\dist\index.html", "index.html")
if (Test-Path "D:\laragon\www\examguard\dist\.htaccess") {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "D:\laragon\www\examguard\dist\.htaccess", ".htaccess")
}
Get-ChildItem -Recurse "D:\laragon\www\examguard\dist\assets" | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $rel = $_.FullName.Substring("D:\laragon\www\examguard\dist\".Length)
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel)
    }
}
$zip.Dispose()
Write-Output "Zip successfully created: $(Get-Item $zipPath | Select-Object -ExpandProperty Length) bytes"

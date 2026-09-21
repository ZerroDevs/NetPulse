$src = 'c:\Users\Gaming\Desktop\Folders-Z\userscript\NetPulse'
$out = Join-Path $src 'release\NetPulse.zip'

if (Test-Path $out) { Remove-Item $out -Force }

Add-Type -Assembly 'System.IO.Compression.FileSystem'
$zip = [System.IO.Compression.ZipFile]::Open($out, 'Create')

$excludeDirs  = @('.git', 'release', 'node_modules')
$excludeFiles = @('verify_netpulse.js')

Get-ChildItem -Path $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1)

    # Skip if inside an excluded directory
    $skipDir = $false
    foreach ($ex in $excludeDirs) {
        if ($rel -like "$ex\*" -or $rel -like "$ex/*") {
            $skipDir = $true
            break
        }
    }
    if ($skipDir) { return }

    # Skip excluded top-level files
    if ($excludeFiles -contains $_.Name) { return }

    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip, $_.FullName, $rel, 'Optimal'
    ) | Out-Null

    Write-Host "  + $rel"
}

$zip.Dispose()
Write-Host "`nDone: $out"

$filePath = "src/components/reparaciones/condiciones/ComponenteDeslindes.tsx"
$content = Get-Content $filePath -Raw
$content = $content -replace 'ComponenteDeslind esProps','ComponenteDeslind esProps'
Set-Content $filePath -Value $content -NoNewline
Write-Host "File fixed successfully"

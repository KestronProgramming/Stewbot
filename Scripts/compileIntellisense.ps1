Write-Output "Clearing old type files"
$ConfirmPreference = 'None'
Get-ChildItem -Path "./types" -Filter "*.d.ts" -File -Recurse | Remove-Item -Force
Write-Output "Generating new type files"
npx tsc

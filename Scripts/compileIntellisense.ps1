Write-Output "Clearing old type files"
$ConfirmPreference = 'None'
# Get-ChildItem -Path "./types" -Filter "*.d.ts" -File -Recurse | Remove-Item -Force
# Get-ChildItem -Path "./temp" -File -Recurse | Remove-Item -Force


# This is so that the files can self-reference types that they themselves export (see database.js)
# Write-Output "Pre-generating files "
# mkdir ./temp/ -Force | Out-Null
# npx tsc --outDir ./temp

# Finally produce the final files
Write-Output "Generating type files"
npx tsc

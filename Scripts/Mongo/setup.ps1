Set-Location -Path $PSScriptRoot

# TODO: check exact version
if (-not (Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue)) {
    winget install MongoDB.Server
} else {
    Write-Output "MongoDB.Server is already installed."
}

# Setup the Mongod service
mongod --config "./mongod.cfg" --install

Start-Service -Name "MongoDB"

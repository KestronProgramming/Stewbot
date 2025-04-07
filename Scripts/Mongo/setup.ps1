#region RunAsAdmin
$currentProcess = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object System.Security.Principal.WindowsPrincipal($currentProcess)
$adminRole = [System.Security.Principal.WindowsBuiltInRole]::Administrator
if (-not $principal.IsInRole($adminRole)) {
    try {
        # Get the current script path
        $scriptPath = $MyInvocation.MyCommand.Definition
        if (-not $scriptPath) {
            # If running in terminal directly, use current location
            $scriptPath = "powershell.exe"
        }
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "powershell.exe"
        $processInfo.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" $args"
        $processInfo.Verb = "runas" # This triggers the UAC prompt
        $processInfo.UseShellExecute = $true
        [System.Diagnostics.Process]::Start($processInfo)
        exit
    }
    catch {
        Write-Warning "Failed to restart as administrator: $_"
        exit 1
    }
}
#endregion

Set-Location -Path $PSScriptRoot

# TODO: check exact version
if (-not (Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue)) {
    winget install MongoDB.Server
} else {
    Write-Output "MongoDB.Server is already installed..."
}

$mongoPath = Get-ChildItem -Path "C:\Program Files\MongoDB\Server\" -Directory | Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
$binPath = Join-Path $mongoPath "bin"
if ($env:Path -notlike "*$binPath*") {
    Write-Output "Adding MongoDB to system PATH..."
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
    $newPath = "$currentPath;$binPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
    Write-Output "MongoDB path added. Restart your terminal for changes to take effect."
} else {
    Write-Output "MongoDB is already in PATH."
}

#region MongoD
Write-Output "Setting up database service"

Stop-Service -Name "MongoDB" -ErrorAction SilentlyContinue

# Setup location for Stewbot's Data
$rootDir = (Get-Item -Path $PSScriptRoot).Parent.Parent.FullName
$databaseDir = Join-Path $rootDir "Database"
if (-not (Test-Path -Path $databaseDir)) {
    New-Item -Path $databaseDir -ItemType Directory | Out-Null
}

# Config
$mongoConfigPath = Join-Path $PSScriptRoot "mongodbWindows.conf"
$tempConfigPath = Join-Path $PSScriptRoot "mongodbWindows.conf_temp.conf"
(Get-Content $mongoConfigPath) -replace "<logFile>", "$databaseDir\mongod.log" -replace "<databaseDir>", "$databaseDir" | Set-Content $tempConfigPath
Copy-Item -Path $tempConfigPath -Destination (Join-Path $binPath "mongod.cfg") -Force
Remove-Item "$tempConfigPath"

# Setup Service
mongod.exe --remove
mongod.exe --config "$binPath\mongod.cfg" --install
Start-Service -Name "MongoDB"
Set-Service -StartupType Automatic -Name "MongoDB"
#endregion MongoD

Write-Output "Installing MongoDB Tools"
winget install MongoDB.DatabaseTools

$mongoToolsPath = Get-ChildItem -Path "C:\Program Files\MongoDB\Tools" -Directory | Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
$toolsBinPath = Join-Path $mongoToolsPath "bin"
if ($env:Path -notlike "*$toolsBinPath*") {
    Write-Output "Adding MongoDB Tools to system PATH..."
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
    $newPath = "$currentPath;$toolsBinPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
    Write-Output "MongoDB Tools path added. Restart your terminal for changes to take effect."
} else {
    Write-Output "MongoDB Tools are already in PATH."
}


pause;
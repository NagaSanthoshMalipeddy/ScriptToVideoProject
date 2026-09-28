# schedule-daily.ps1: register a Windows scheduled task that runs daily-video.ps1 every day.
#
#   pwsh pipeline/schedule-daily.ps1                 # start at 14:00, ready by 18:00
#   pwsh pipeline/schedule-daily.ps1 -At 15:00
#   pwsh pipeline/schedule-daily.ps1 -Remove
param([string]$At = "14:00", [string]$Deadline = "18:00", [switch]$Remove)
$ErrorActionPreference = "Stop"
$Name = "WhiteboardStudio-DailyVideo"
if ($Remove) { Unregister-ScheduledTask -TaskName $Name -Confirm:$false; "Removed $Name"; exit 0 }

$Root = Split-Path $PSScriptRoot -Parent
$copilot = (Get-Command copilot -ErrorAction Stop).Source
$shell = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
if (-not $shell) { $shell = (Get-Command powershell).Source }
$script = Join-Path $PSScriptRoot "daily-video.ps1"

$action = New-ScheduledTaskAction -Execute $shell -WorkingDirectory $Root `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -CopilotPath `"$copilot`" -Deadline $Deadline"
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 5) -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $Name -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
"Scheduled '$Name' daily at $At (deadline $Deadline)."
"Copilot CLI: $copilot"
"Run now:  Start-ScheduledTask -TaskName $Name"

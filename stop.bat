@echo off
powershell -Command "$p=Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 }; if ($p){$procId=$p[0].OwningProcess;$proc=Get-Process -Id $procId -ErrorAction SilentlyContinue; if ($proc -and $proc.ProcessName -eq 'node'){Write-Host ('Stopping Portfolio server (PID: '+$procId+')...');Stop-Process -Id $procId -Force;Write-Host 'Server stopped.'}else{Write-Host 'Process on port 3000 is not Node.js. Skipping.'}}else{Write-Host 'No node server found on port 3000.'}"
pause

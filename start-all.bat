@echo off
set ROOT=%~dp0

if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\wt.exe" (
    wt new-tab --title "register-service" cmd /k "cd /d "%ROOT%register-service" && docker compose up" ^
    ; new-tab --title "target-service"   cmd /k "cd /d "%ROOT%target-service" && docker compose up" ^
    ; new-tab --title "score-service"    cmd /k "cd /d "%ROOT%score-service" && docker compose up" ^
    ; new-tab --title "gateway"          cmd /k "cd /d "%ROOT%gateway" && docker compose up"
) else (
    start "register-service" cmd /k "cd /d "%ROOT%register-service" && docker compose up"
    start "target-service"   cmd /k "cd /d "%ROOT%target-service" && docker compose up"
    start "score-service"    cmd /k "cd /d "%ROOT%score-service" && docker compose up"
    start "gateway"          cmd /k "cd /d "%ROOT%gateway" && docker compose up"
)

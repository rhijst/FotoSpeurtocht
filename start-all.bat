@echo off
set ROOT=%~dp0

if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\wt.exe" (
    wt new-tab --title "minio"          cmd /k "cd /d "%ROOT%minio" && docker compose up" ^
    ; new-tab --title "rabbitMQ"         cmd /k "cd /d "%ROOT%rabbitmq" && docker compose up" ^
    ; new-tab --title "register-service" cmd /k "cd /d "%ROOT%register-service" && docker compose up" ^
    ; new-tab --title "target-service"   cmd /k "cd /d "%ROOT%target-service" && docker compose up" ^
    ; new-tab --title "score-service"    cmd /k "cd /d "%ROOT%score-service" && docker compose up" ^
    ; new-tab --title "gui"              cmd /k "cd /d "%ROOT%gui" && docker compose up" ^
    ; new-tab --title "gateway"          cmd /k "cd /d "%ROOT%gateway" && docker compose up"
) else (
    start "minio"            cmd /k "cd /d "%ROOT%minio" && docker compose up"
    start "rabbitMQ"         cmd /k "cd /d "%ROOT%rabbitmq" && docker compose up"
    start "register-service" cmd /k "cd /d "%ROOT%register-service" && docker compose up"
    start "target-service"   cmd /k "cd /d "%ROOT%target-service" && docker compose up"
    start "score-service"    cmd /k "cd /d "%ROOT%score-service" && docker compose up"
    start "gui"              cmd /k "cd /d "%ROOT%gui" && docker compose up"
    start "gateway"          cmd /k "cd /d "%ROOT%gateway" && docker compose up"
)

@echo off
set ROOT=%~dp0

if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\wt.exe" (
    wt new-tab --title "minio"           cmd /k "cd /d "%ROOT%minio" && docker compose up --build" ^
    ; new-tab --title "mail-service"     cmd /k "cd /d "%ROOT%mail-service" && docker compose up --build" ^
    ; new-tab --title "clock-service"    cmd /k "cd /d "%ROOT%clock-service" && docker compose up --build" ^
    ; new-tab --title "register-service" cmd /k "cd /d "%ROOT%register-service" && docker compose up --build" ^
    ; new-tab --title "rabbitMQ"         cmd /k "cd /d "%ROOT%rabbitmq" && docker compose up --build" ^
    ; new-tab --title "join-service"     cmd /k "cd /d "%ROOT%join-service" && docker compose up --build" ^
    ; new-tab --title "target-service"   cmd /k "cd /d "%ROOT%target-service" && docker compose up --build" ^
    ; new-tab --title "score-service"    cmd /k "cd /d "%ROOT%score-service" && docker compose up --build" ^
    ; new-tab --title "gui"              cmd /k "cd /d "%ROOT%gui" && docker compose up --build" ^
    ; new-tab --title "gateway"          cmd /k "cd /d "%ROOT%gateway" && docker compose up --build"
) else (
    start "minio"            cmd /k "cd /d "%ROOT%minio" && docker compose up --build"
    start "mail-service"     cmd /k "cd /d "%ROOT%mail-service" && docker compose up --build"
    start "clock-service"    cmd /k "cd /d "%ROOT%clock-service" && docker compose up --build"
    start "register-service" cmd /k "cd /d "%ROOT%register-service" && docker compose up --build"
    start "rabbitMQ"         cmd /k "cd /d "%ROOT%rabbitmq" && docker compose up --build"
    start "join-service"     cmd /k "cd /d "%ROOT%join-service" && docker compose up --build"
    start "target-service"   cmd /k "cd /d "%ROOT%target-service" && docker compose up --build"
    start "score-service"    cmd /k "cd /d "%ROOT%score-service" && docker compose up --build"
    start "gui"              cmd /k "cd /d "%ROOT%gui" && docker compose up --build"
    start "gateway"          cmd /k "cd /d "%ROOT%gateway" && docker compose up --build"
)

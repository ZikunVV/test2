@echo off
chcp 65001 >nul
echo ===================================================
echo   Загрузка проекта ЖКХ WORKFLOW на GitHub
echo ===================================================
echo.
echo Это скрипт для загрузки всего проекта на GitHub без
echo ошибки "Yowza, that's a lot of files. Try uploading fewer than 100".
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Программа Git не найдена на вашем компьютере.
    echo Пожалуйста, установите Git с официального сайта: https://git-scm.com/downloads
    echo Или установите GitHub Desktop: https://desktop.github.com/
    echo.
    pause
    exit /b 1
)

set /p REPO_URL="Вставьте ссылку на ваш репозиторий GitHub (например, https://github.com/username/my-repo.git): "

if "%REPO_URL%"=="" (
    echo [ОШИБКА] Ссылка на репозиторий не введена.
    pause
    exit /b 1
)

echo.
echo [1/5] Инициализация Git репозитория...
git init

echo [2/5] Добавление файлов проекта...
git add .

echo [3/5] Создание первого коммита...
git commit -m "Upload project to GitHub"

echo [4/5] Настройка ветки main...
git branch -M main

echo [5/5] Подключение к GitHub и отправка...
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ===================================================
    echo   УСПЕШНО! Проект загружен в репозиторий GitHub.
    echo ===================================================
) else (
    echo [ВНИМАНИЕ] Если возникла ошибка авторизации, выполните вход в GitHub
    echo через браузер или персональный токен (Personal Access Token).
)

echo.
pause

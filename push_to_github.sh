#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  Загрузка проекта ЖКХ WORKFLOW на GitHub"
echo "==================================================="
echo ""
echo "Этот скрипт загружает весь проект на GitHub без ошибки"
echo "\"Yowza, that's a lot of files. Try uploading fewer than 100\"."
echo ""

if ! command -v git &> /dev/null; then
    echo "[ОШИБКА] Программа Git не найдена."
    echo "Установите Git: https://git-scm.com/downloads или GitHub Desktop: https://desktop.github.com/"
    exit 1
fi

read -r -p "Вставьте ссылку на ваш репозиторий GitHub (например, https://github.com/username/my-repo.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "[ОШИБКА] Ссылка на репозиторий не введена."
    exit 1
fi

echo ""
echo "[1/5] Инициализация Git репозитория..."
git init

echo "[2/5] Добавление файлов проекта..."
git add .

echo "[3/5] Создание первого коммита..."
git commit -m "Upload project to GitHub"

echo "[4/5] Настройка ветки main..."
git branch -M main

echo "[5/5] Подключение к GitHub и отправка..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git push -u origin main

echo ""
echo "==================================================="
echo "  УСПЕШНО! Проект загружен в репозиторий GitHub."
echo "==================================================="

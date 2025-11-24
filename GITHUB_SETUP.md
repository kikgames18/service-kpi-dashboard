# Инструкция по загрузке проекта на GitHub

## Шаг 1: Создание репозитория на GitHub

1. Перейдите на https://github.com
2. Войдите в свой аккаунт (или создайте новый)
3. Нажмите кнопку **"+"** в правом верхнем углу → **"New repository"**
4. Заполните форму:
   - **Repository name**: `WEB_DASHBOARD_KPI`
   - **Description**: `Веб-дашборд KPI для "Сервис всем" - система управления заказами и сотрудниками`
   - **Visibility**: Выберите **Public** или **Private** (на ваше усмотрение)
   - **НЕ** ставьте галочки на "Add a README file", "Add .gitignore", "Choose a license" (у нас уже есть эти файлы)
5. Нажмите **"Create repository"**

## Шаг 2: Инициализация Git в проекте

Откройте терминал/PowerShell в папке проекта и выполните:

```bash
# Инициализация Git репозитория
git init

# Добавление всех файлов
git add .

# Создание первого коммита
git commit -m "Initial commit: Веб-дашборд KPI для Сервис всем"
```

## Шаг 3: Настройка Git (если еще не настроен)

Если вы еще не настроили Git, выполните:

```bash
git config --global user.name "Ваше Имя"
git config --global user.email "ваш-email@example.com"
```

## Шаг 4: Подключение к GitHub репозиторию

```bash
# Добавление удаленного репозитория
git remote add origin https://github.com/kikgames18/WEB_DASHBOARD_KPI.git

# Переименование основной ветки в main (если нужно)
git branch -M main

# Отправка кода на GitHub
git push -u origin main
```

Если GitHub запросит авторизацию:
- Используйте Personal Access Token вместо пароля
- Создайте токен: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
- Дайте права: `repo` (полный доступ к репозиториям)

## Шаг 5: Проверка

1. Обновите страницу репозитория на GitHub
2. Убедитесь, что все файлы загружены
3. Проверьте, что README.md отображается корректно

## Дальнейшая работа с репозиторием

### Добавление изменений

```bash
# Добавить все изменения
git add .

# Создать коммит
git commit -m "Описание изменений"

# Отправить на GitHub
git push
```

### Получение изменений с GitHub

```bash
git pull
```

### Просмотр статуса

```bash
git status
```

### Просмотр истории коммитов

```bash
git log
```

## Важные файлы для Git

Убедитесь, что файл `.gitignore` содержит:

```
# Зависимости
node_modules/
package-lock.json

# Переменные окружения
.env
.env.local
.env.production

# Сборка
dist/
build/

# Логи
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Загруженные файлы
server/uploads/*
!server/uploads/.gitkeep
```

## Проблемы и решения

### Ошибка "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/kikgames18/WEB_DASHBOARD_KPI.git
```

### Ошибка "failed to push some refs"

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Ошибка авторизации

Используйте Personal Access Token вместо пароля:
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Выберите права: `repo`
4. Скопируйте токен и используйте его как пароль

# Инструкция по развертыванию на GitHub

## Подготовка репозитория

### 1. Инициализация Git (если еще не сделано)

```bash
git init
```

### 2. Добавление файлов

```bash
git add .
git commit -m "Initial commit: KPI Dashboard for Service Business"
```

### 3. Создание репозитория на GitHub

1. Перейдите на https://github.com
2. Нажмите "New repository"
3. Заполните:
   - Repository name: `service-kpi-dashboard` (или другое имя)
   - Description: "Веб-дашборд для управления KPI сервисного центра"
   - Выберите Public или Private
   - **НЕ** добавляйте README, .gitignore или лицензию (они уже есть)
4. Нажмите "Create repository"

### 4. Подключение к GitHub

```bash
git remote add origin https://github.com/ваш-username/ваш-repo-name.git
git branch -M main
git push -u origin main
```

## Важные файлы для GitHub

### .gitignore
Убедитесь, что файл `.gitignore` содержит:
- `node_modules/`
- `.env` файлы (с секретами)
- `dist/` и `build/`
- Логи и временные файлы

### .env.example
Создайте примеры файлов `.env`:

**server/.env.example:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_kpi
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

**/.env.example:**
```
VITE_API_URL=http://localhost:3001/api
```

## Структура для GitHub

Убедитесь, что в репозитории есть:
- ✅ README.md (подробная документация)
- ✅ .gitignore (исключает секреты и зависимости)
- ✅ package.json (оба: корневой и server/)
- ✅ Все исходные файлы
- ✅ Миграции базы данных
- ❌ НЕ включайте: node_modules, .env файлы, dist/

## Дополнительные файлы (опционально)

### LICENSE
Можно добавить файл лицензии, если нужно.

### CONTRIBUTING.md
Если планируете принимать вклад от других разработчиков.

## После публикации

1. Обновите README.md с правильной ссылкой на репозиторий
2. Добавьте badges (опционально)
3. Создайте Issues для отслеживания задач
4. Настройте GitHub Actions для CI/CD (опционально)


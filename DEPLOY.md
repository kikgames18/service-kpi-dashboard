# Инструкция по развертыванию

## Подготовка к загрузке на GitHub

### 1. Проверка файлов

Убедитесь, что следующие файлы НЕ попадут в репозиторий (они в .gitignore):
- `server/.env` - содержит пароли и секреты
- `.env` - переменные окружения фронтенда
- `node_modules/` - зависимости
- `server/node_modules/` - зависимости бэкенда
- `dist/` - собранные файлы

### 2. Создание .env.example файлов

Создайте примеры файлов окружения для других разработчиков:

**server/.env.example:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_kpi
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3001
NODE_ENV=development
JWT_SECRET=your_secret_key_here
```

**.env.example (в корне):**
```
VITE_API_URL=http://localhost:3001/api
```

### 3. Команды для загрузки на GitHub

```bash
# Инициализация (если еще не сделано)
git init

# Добавление всех файлов
git add .

# Создание коммита
git commit -m "Initial commit: Веб-дашборд KPI для Сервис всем"

# Подключение к GitHub
git remote add origin https://github.com/kikgames18/service-kpi-dashboard.git

# Переименование ветки
git branch -M main

# Отправка на GitHub
git push -u origin main
```

## После загрузки

1. Обновите страницу репозитория на GitHub
2. Проверьте, что README.md отображается корректно
3. Убедитесь, что все файлы загружены
4. Проверьте, что файлы с секретами (.env) НЕ загружены

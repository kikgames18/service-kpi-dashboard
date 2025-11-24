# Быстрый старт

## Минимальные шаги для запуска проекта

### 1. Установка зависимостей

```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

### 2. Настройка базы данных

1. Откройте pgAdmin 4
2. Создайте базу данных `service_kpi`
3. Создайте файл `server/.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=service_kpi
   DB_USER=postgres
   DB_PASSWORD=ваш_пароль
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=secret_key_change_in_production
   ```
4. Выполните миграции:
   ```bash
   cd server
   node run-migrations.js
   ```

### 3. Запуск

**Терминал 1 (Backend):**
```bash
cd server
npm start
```

**Терминал 2 (Frontend):**
```bash
npm run dev
```

### 4. Вход

Откройте http://localhost:5173

- Email: `admin@service.ru`
- Пароль: `admin123`

Готово! 🎉

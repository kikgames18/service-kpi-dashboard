# Быстрый старт

## ⚠️ Важно: Проверьте PostgreSQL сервер

pgAdmin 4 - это только клиент. Убедитесь, что **PostgreSQL сервер** установлен и запущен:
- Откройте pgAdmin 4
- Если видите серверы в левой панели - сервер установлен ✅
- Если нет - установите PostgreSQL с https://www.postgresql.org/download/

## Шаг 1: Настройка базы данных

1. Откройте pgAdmin4
2. Подключитесь к серверу PostgreSQL (введите пароль, если требуется)
3. Создайте базу данных `service_kpi`:
   - Правый клик на "Databases" → Create → Database
   - Имя: `service_kpi`

4. Выполните миграции:

   **Автоматически (рекомендуется):**
   ```bash
   cd server
   npm install
   # Создайте .env файл (см. Шаг 2)
   node run-migrations.js
   ```

   **Или вручную через pgAdmin:**
   - Выберите базу данных `service_kpi`
   - Выполните SQL скрипты в следующем порядке:
     - `server/migrations/01_create_schema_fixed.sql`
     - `server/migrations/complete_setup.sql`

## Шаг 2: Запуск бэкенда

```bash
cd server
npm install
```

Создайте файл `.env` (скопируйте из `.env.example` или создайте вручную):
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_kpi
DB_USER=postgres
DB_PASSWORD=ваш_пароль_postgres
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

Запустите бэкенд:
```bash
npm start
```

Бэкенд запустится на `http://localhost:3001`

## Шаг 3: Запуск фронтенда

```bash
# В корневой папке проекта
npm install
```

Создайте файл `.env` в корне проекта:
```
VITE_API_URL=http://localhost:3001/api
```

Запустите фронтенд:
```bash
npm run dev
```

Фронтенд запустится на `http://localhost:5173`

## Вход в систему

- **Email**: `admin@service.ru`
- **Пароль**: `admin123`

## Решение проблем

### Ошибка "Failed to fetch"

1. Убедитесь, что бэкенд запущен (проверьте `http://localhost:3001/health`)
2. Проверьте, что в `.env` фронтенда указан правильный `VITE_API_URL`
3. Убедитесь, что PostgreSQL запущен и доступен
4. Проверьте параметры подключения к БД в `server/.env`

### Ошибка подключения к базе данных

1. Проверьте, что PostgreSQL запущен
2. Убедитесь, что база данных `service_kpi` создана
3. Проверьте параметры в `server/.env`:
   - `DB_HOST` (обычно `localhost`)
   - `DB_PORT` (обычно `5432`)
   - `DB_NAME` (должно быть `service_kpi`)
   - `DB_USER` (обычно `postgres`)
   - `DB_PASSWORD` (ваш пароль PostgreSQL)


# Настройка переменных окружения

## Создание файла .env

Создайте файл `.env` в папке `server` со следующим содержимым:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_kpi
DB_USER=postgres
DB_PASSWORD=123
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

## Создание через командную строку (Windows PowerShell):

```powershell
cd server
@"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_kpi
DB_USER=postgres
DB_PASSWORD=123
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
"@ | Out-File -FilePath .env -Encoding utf8
```

## Или создайте вручную:

1. Откройте папку `server`
2. Создайте новый файл с именем `.env`
3. Скопируйте содержимое выше в файл
4. Сохраните файл








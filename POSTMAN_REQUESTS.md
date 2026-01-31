# Полные запросы для тестирования в Postman

**Base URL:** `http://localhost:3001/api`

---

## 🔐 АУТЕНТИФИКАЦИЯ

### 1. Вход в систему (Login)

**Метод:** `POST`  
**URL:** `http://localhost:3001/api/auth/login`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@service.ru",
  "password": "admin123"
}
```

**Пример ответа (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "admin@service.ru",
    "full_name": "Администратор",
    "role": "admin"
  }
}
```

**Важно:** Сохраните `token` из ответа для использования в последующих запросах!

---

### 2. Регистрация нового пользователя

**Метод:** `POST`  
**URL:** `http://localhost:3001/api/auth/register`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Иван Иванов"
}
```

**Пример ответа (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "Иван Иванов",
    "role": "user"
  }
}
```

---

### 3. Получить текущего пользователя

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/auth/me`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "admin@service.ru",
    "full_name": "Администратор",
    "role": "admin"
  }
}
```

---

### 4. Изменить пароль

**Метод:** `POST`  
**URL:** `http://localhost:3001/api/auth/change-password`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newpassword123"
}
```

**Пример ответа (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

## 📦 ЗАКАЗЫ НА ОБСЛУЖИВАНИЕ

### 5. Получить все заказы

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/data/orders`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "order_number": "ORD-20241215-0001",
    "customer_name": "Иван Петров",
    "customer_phone": "+7 (999) 123-45-67",
    "device_type": "Ноутбук",
    "device_brand": "Lenovo",
    "device_model": "ThinkPad X1",
    "issue_description": "Не включается",
    "status": "in_progress",
    "priority": "high",
    "received_date": "2024-12-15T10:00:00.000Z",
    "completed_date": null,
    "estimated_cost": 5000,
    "final_cost": null,
    "assigned_to": "technician-uuid",
    "technician_name": "Петр Сидоров"
  }
]
```

---

### 6. Создать новый заказ

**Метод:** `POST`  
**URL:** `http://localhost:3001/api/data/orders`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "customer_name": "Алексей Смирнов",
  "customer_phone": "+7 (999) 555-12-34",
  "device_type": "Смартфон",
  "device_brand": "Samsung",
  "device_model": "Galaxy S21",
  "issue_description": "Разбит экран",
  "status": "pending",
  "priority": "normal",
  "estimated_cost": 8000,
  "assigned_to": null
}
```

**Обязательные поля:**
- `customer_name`
- `customer_phone`
- `device_type`
- `issue_description`

**Опциональные поля:**
- `device_brand`
- `device_model`
- `status` (по умолчанию: "pending")
- `priority` (по умолчанию: "normal")
- `estimated_cost`
- `assigned_to` (UUID техника)

**Пример ответа (201 Created):**
```json
{
  "id": "uuid-here",
  "order_number": "ORD-20241215-0002",
  "customer_name": "Алексей Смирнов",
  "customer_phone": "+7 (999) 555-12-34",
  "device_type": "Смартфон",
  "device_brand": "Samsung",
  "device_model": "Galaxy S21",
  "issue_description": "Разбит экран",
  "status": "pending",
  "priority": "normal",
  "received_date": "2024-12-15T12:00:00.000Z",
  "completed_date": null,
  "estimated_cost": 8000,
  "final_cost": null,
  "assigned_to": null
}
```

---

### 7. Обновить заказ

**Метод:** `PUT`  
**URL:** `http://localhost:3001/api/data/orders/:id`  
**Пример:** `http://localhost:3001/api/data/orders/123e4567-e89b-12d3-a456-426614174000`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):** (все поля опциональны)
```json
{
  "customer_name": "Алексей Смирнов (обновлено)",
  "customer_phone": "+7 (999) 555-99-99",
  "device_type": "Смартфон",
  "status": "in_progress",
  "priority": "high",
  "assigned_to": "technician-uuid-here"
}
```

**Пример ответа (200 OK):**
```json
{
  "id": "uuid-here",
  "order_number": "ORD-20241215-0002",
  "customer_name": "Алексей Смирнов (обновлено)",
  "customer_phone": "+7 (999) 555-99-99",
  "status": "in_progress",
  "priority": "high",
  "technician_name": "Петр Сидоров"
}
```

---

### 8. Удалить заказ

**Метод:** `DELETE`  
**URL:** `http://localhost:3001/api/data/orders/:id`  
**Пример:** `http://localhost:3001/api/data/orders/123e4567-e89b-12d3-a456-426614174000`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
{
  "message": "Order deleted successfully"
}
```

---

### 9. Получить вложения заказа

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/data/orders/:id/attachments`  
**Пример:** `http://localhost:3001/api/data/orders/123e4567-e89b-12d3-a456-426614174000/attachments`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "order_id": "order-uuid",
    "file_name": "photo.jpg",
    "file_path": "uploads/photo.jpg",
    "file_size": 102400,
    "uploaded_at": "2024-12-15T10:00:00.000Z"
  }
]
```

---

### 10. Загрузить вложение к заказу

**Метод:** `POST`  
**URL:** `http://localhost:3001/api/data/orders/:id/attachments`  
**Пример:** `http://localhost:3001/api/data/orders/123e4567-e89b-12d3-a456-426614174000/attachments`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (form-data):**
- Key: `file` (тип: File)
- Value: выберите файл для загрузки

**Пример ответа (201 Created):**
```json
{
  "id": "uuid-here",
  "order_id": "order-uuid",
  "file_name": "photo.jpg",
  "file_path": "uploads/photo.jpg",
  "file_size": 102400,
  "uploaded_at": "2024-12-15T10:00:00.000Z"
}
```

---

### 11. Скачать вложение

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/data/attachments/:id/download`  
**Пример:** `http://localhost:3001/api/data/attachments/123e4567-e89b-12d3-a456-426614174000/download`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ответ:** Файл будет скачан

---

### 12. Удалить вложение

**Метод:** `DELETE`  
**URL:** `http://localhost:3001/api/data/attachments/:id`  
**Пример:** `http://localhost:3001/api/data/attachments/123e4567-e89b-12d3-a456-426614174000`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
{
  "message": "Attachment deleted successfully"
}
```

---

## 👨‍🔧 ТЕХНИКИ

### 13. Получить всех техников

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/data/technicians`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "full_name": "Петр Сидоров",
    "specialization": "Ноутбуки и ПК",
    "hire_date": "2024-01-15",
    "is_active": true
  }
]
```

---

### 14. Создать техника

**Метод:** `POST`  
**URL:** `http://localhost:3001/api/data/technicians`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "full_name": "Иван Петров",
  "specialization": "Смартфоны",
  "hire_date": "2024-12-15",
  "is_active": true
}
```

**Обязательные поля:**
- `full_name`

**Опциональные поля:**
- `specialization`
- `hire_date` (по умолчанию: текущая дата)
- `is_active` (по умолчанию: true)

**Пример ответа (201 Created):**
```json
{
  "id": "uuid-here",
  "full_name": "Иван Петров",
  "specialization": "Смартфоны",
  "hire_date": "2024-12-15",
  "is_active": true
}
```

---

### 15. Обновить техника

**Метод:** `PUT`  
**URL:** `http://localhost:3001/api/data/technicians/:id`  
**Пример:** `http://localhost:3001/api/data/technicians/123e4567-e89b-12d3-a456-426614174000`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):** (все поля опциональны)
```json
{
  "full_name": "Иван Петров (обновлено)",
  "specialization": "Ноутбуки и смартфоны",
  "is_active": false
}
```

**Пример ответа (200 OK):**
```json
{
  "id": "uuid-here",
  "full_name": "Иван Петров (обновлено)",
  "specialization": "Ноутбуки и смартфоны",
  "hire_date": "2024-12-15",
  "is_active": false
}
```

---

### 16. Удалить техника

**Метод:** `DELETE`  
**URL:** `http://localhost:3001/api/data/technicians/:id`  
**Пример:** `http://localhost:3001/api/data/technicians/123e4567-e89b-12d3-a456-426614174000`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
{
  "message": "Technician deleted successfully"
}
```

---

## 📊 KPI МЕТРИКИ

### 17. Получить KPI метрики

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/data/kpi-metrics?limit=7`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query параметры:**
- `limit` (опционально, по умолчанию: 7) - количество записей

**Пример ответа (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "metric_date": "2024-12-15",
    "total_orders": 10,
    "completed_orders": 8,
    "revenue": 50000,
    "avg_completion_time": 24.5
  }
]
```

---

## 📝 ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ

### 18. Получить профиль текущего пользователя

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/data/profile`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
{
  "id": "uuid-here",
  "email": "admin@service.ru",
  "full_name": "Администратор",
  "role": "admin",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### 19. Обновить профиль

**Метод:** `PUT`  
**URL:** `http://localhost:3001/api/data/profile`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "full_name": "Новое имя"
}
```

**Пример ответа (200 OK):**
```json
{
  "id": "uuid-here",
  "email": "admin@service.ru",
  "full_name": "Новое имя",
  "role": "admin"
}
```

---

## 🔔 УВЕДОМЛЕНИЯ

### 20. Получить уведомления

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/data/notifications`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "user_id": "user-uuid",
    "message": "Новый заказ создан",
    "type": "info",
    "is_read": false,
    "created_at": "2024-12-15T10:00:00.000Z"
  }
]
```

---

### 21. Отметить уведомление как прочитанное

**Метод:** `PUT`  
**URL:** `http://localhost:3001/api/data/notifications/:id/read`  
**Пример:** `http://localhost:3001/api/data/notifications/123e4567-e89b-12d3-a456-426614174000/read`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
{
  "message": "Notification marked as read"
}
```

---

### 22. Отметить все уведомления как прочитанные

**Метод:** `PUT`  
**URL:** `http://localhost:3001/api/data/notifications/read-all`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
{
  "message": "All notifications marked as read"
}
```

---

## 💾 РЕЗЕРВНОЕ КОПИРОВАНИЕ

### 23. Создать резервную копию

**Метод:** `POST`  
**URL:** `http://localhost:3001/api/data/backup/create`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Пример ответа (200 OK):**
```json
{
  "version": "1.0",
  "created_at": "2024-12-15T12:00:00.000Z",
  "data": {
    "orders": [...],
    "technicians": [...],
    "users": [...],
    "audit_log": [...],
    "notifications": [...]
  }
}
```

**Важно:** Сохраните этот JSON в файл для восстановления!

---

### 24. Восстановить из резервной копии

**Метод:** `POST`  
**URL:** `http://localhost:3001/api/data/backup/restore`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "backup": {
    "version": "1.0",
    "created_at": "2024-12-15T12:00:00.000Z",
    "data": {
      "orders": [...],
      "technicians": [...],
      "users": [...],
      "audit_log": [...],
      "notifications": [...]
    }
  }
}
```

**Пример ответа (200 OK):**
```json
{
  "message": "Backup restored successfully"
}
```

**⚠️ ВНИМАНИЕ:** Восстановление удалит все существующие данные (кроме пользователей)!

---

## 📋 ЖУРНАЛ АУДИТА

### 25. Получить журнал аудита

**Метод:** `GET`  
**URL:** `http://localhost:3001/api/data/audit-log`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query параметры (все опциональны):**
- `entity_type` - тип сущности (например: "order", "technician", "profile")
- `entity_id` - ID сущности (UUID)
- `limit` - количество записей (по умолчанию: 100)

**Примеры URL:**
- Все записи: `http://localhost:3001/api/data/audit-log`
- Только заказы: `http://localhost:3001/api/data/audit-log?entity_type=order`
- Конкретный заказ: `http://localhost:3001/api/data/audit-log?entity_type=order&entity_id=123e4567-e89b-12d3-a456-426614174000`
- Ограничение: `http://localhost:3001/api/data/audit-log?limit=50`

**Пример ответа (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "entity_type": "order",
    "entity_id": "order-uuid",
    "action": "update",
    "changed_by": "user-uuid",
    "old_values": {
      "status": "pending",
      "priority": "normal"
    },
    "new_values": {
      "status": "in_progress",
      "priority": "high"
    },
    "created_at": "2024-12-15T10:00:00.000Z"
  }
]
```

---

## 🔍 HEALTH CHECK

### 26. Проверка состояния сервера

**Метод:** `GET`  
**URL:** `http://localhost:3001/health`  
**Headers:** не требуются

**Пример ответа (200 OK):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## 📝 ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ В POSTMAN

### Настройка переменных окружения

1. Создайте новое окружение в Postman
2. Добавьте переменные:
   - `base_url` = `http://localhost:3001/api`
   - `token` = (будет заполнено после логина)

### Настройка авторизации

1. Выполните запрос **"1. Вход в систему"**
2. Скопируйте `token` из ответа
3. В настройках окружения установите `token` = значение токена
4. Для всех защищенных запросов используйте:
   - **Type:** Bearer Token
   - **Token:** `{{token}}`

Или добавьте в Headers:
```
Authorization: Bearer {{token}}
```

### Коллекция Postman

Создайте коллекцию со следующими папками:
- 🔐 Authentication
- 📦 Orders
- 👨‍🔧 Technicians
- 📊 KPI Metrics
- 📝 Profile
- 🔔 Notifications
- 💾 Backup
- 📋 Audit Log

### Тестовые данные

**Тестовый администратор:**
- Email: `admin@service.ru`
- Password: `admin123`

**Статусы заказов:**
- `pending` - Ожидает
- `in_progress` - В работе
- `completed` - Завершен
- `cancelled` - Отменен

**Приоритеты:**
- `low` - Низкий
- `normal` - Обычный
- `high` - Высокий

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **Все запросы к `/api/data/*` требуют авторизации** (кроме `/health`)
2. **Токен действителен 30 дней** (настраивается в `server/auth.js`)
3. **При восстановлении резервной копии удаляются все данные** (кроме пользователей)
4. **Все UUID должны быть валидными** (формат: `123e4567-e89b-12d3-a456-426614174000`)
5. **Даты в формате ISO 8601** (например: `2024-12-15T10:00:00.000Z`)

---

## 🐛 ОБРАБОТКА ОШИБОК

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Решение:** Проверьте токен в заголовке Authorization

### 400 Bad Request
```json
{
  "error": "Required fields: customer_name, customer_phone, device_type, issue_description"
}
```
**Решение:** Убедитесь, что все обязательные поля заполнены

### 404 Not Found
```json
{
  "error": "Order not found"
}
```
**Решение:** Проверьте правильность UUID в URL

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
**Решение:** Проверьте логи сервера и состояние базы данных



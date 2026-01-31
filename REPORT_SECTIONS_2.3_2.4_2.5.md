# Разделы 2.3, 2.4, 2.5 для отчёта

## 2.3 Разработка базы данных

### 2.3.1 Выбор системы управления базами данных

Для веб-дашборда KPI была выбрана реляционная система управления базами данных **PostgreSQL версии 18**. Выбор обоснован следующими факторами:

- **Надёжность и стабильность**: PostgreSQL является одной из самых надёжных и проверенных временем СУБД с открытым исходным кодом
- **ACID-совместимость**: Полная поддержка транзакций обеспечивает целостность данных
- **Расширяемость**: Поддержка пользовательских типов данных, функций и триггеров на языке PL/pgSQL
- **Производительность**: Эффективная работа с большими объёмами данных и сложными запросами
- **Бесплатность**: Открытый исходный код без лицензионных ограничений

### 2.3.2 Процесс разработки базы данных

Разработка базы данных осуществлялась поэтапно, начиная с анализа требований предметной области предприятия "Сервис всем" (ремонт компьютерной и бытовой техники).

**Этап 1: Анализ требований и проектирование схемы**

На первом этапе был проведён анализ бизнес-процессов сервисного центра и определены основные сущности:
- Пользователи системы (администраторы и обычные пользователи)
- Техники/мастера, выполняющие ремонтные работы
- Заказы на обслуживание техники
- Метрики производительности (KPI)
- История изменений для аудита
- Уведомления для пользователей
- Вложения к заказам (фотографии, документы)

**Этап 2: Создание базы данных**

1. **Установка PostgreSQL:**
   - Установлен PostgreSQL сервер версии 18 на локальной машине разработки
   - Создана база данных с именем `service_kpi` через pgAdmin 4
   - Настроены параметры подключения (host: localhost, port: 5432, user: postgres)

2. **Настройка подключения:**
   - Создан файл `server/db.js` для управления подключением к базе данных
   - Реализован пул соединений (connection pool) с использованием библиотеки `pg` версии 8.11.3
   - Настроены параметры подключения через переменные окружения (файл `.env`):
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=service_kpi
     DB_USER=postgres
     DB_PASSWORD=123
     ```
   - Добавлена обработка ошибок подключения с автоматическим переподключением

**Этап 3: Создание основной схемы базы данных**

Создан SQL-скрипт миграции `01_create_schema_fixed.sql`, который последовательно создаёт все необходимые таблицы:

1. **Создание таблицы `profiles` (Пользователи):**
   ```sql
   CREATE TABLE IF NOT EXISTS profiles (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     email text UNIQUE NOT NULL,
     full_name text,
     role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
     password_hash text,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );
   ```
   - Использован тип UUID для уникальных идентификаторов (генерируется автоматически)
   - Добавлено ограничение UNIQUE для поля email
   - Добавлено ограничение CHECK для поля role (только 'admin' или 'user')
   - Поля created_at и updated_at автоматически заполняются текущей датой и временем

2. **Создание таблицы `technicians` (Техники):**
   ```sql
   CREATE TABLE IF NOT EXISTS technicians (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
     full_name text NOT NULL,
     specialization text CHECK (specialization IN ('computer', 'household', 'mobile', 'universal')),
     hire_date date DEFAULT CURRENT_DATE,
     is_active boolean DEFAULT true,
     created_at timestamptz DEFAULT now()
   );
   ```
   - Создана связь с таблицей profiles через внешний ключ profile_id
   - Добавлено ограничение CHECK для поля specialization
   - Поле is_active позволяет "мягко" удалять техников без физического удаления

3. **Создание таблицы `service_orders` (Заказы):**
   ```sql
   CREATE TABLE IF NOT EXISTS service_orders (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     order_number text UNIQUE NOT NULL,
     customer_name text NOT NULL,
     customer_phone text NOT NULL,
     device_type text NOT NULL CHECK (device_type IN ('computer', 'laptop', 'household_appliance', 'phone', 'other')),
     device_brand text,
     device_model text,
     issue_description text NOT NULL,
     status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
     priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
     assigned_to uuid REFERENCES technicians(id) ON DELETE SET NULL,
     received_date timestamptz DEFAULT now(),
     completed_date timestamptz,
     estimated_cost decimal(10, 2),
     final_cost decimal(10, 2),
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );
   ```
   - Создана связь с таблицей technicians через внешний ключ assigned_to
   - Добавлены множественные ограничения CHECK для валидации данных
   - Поля estimated_cost и final_cost используют тип DECIMAL для точного хранения денежных сумм
   - Поле order_number имеет ограничение UNIQUE для предотвращения дублирования номеров

4. **Создание таблицы `kpi_metrics` (Метрики KPI):**
   ```sql
   CREATE TABLE IF NOT EXISTS kpi_metrics (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     metric_date date NOT NULL UNIQUE,
     total_orders integer DEFAULT 0,
     completed_orders integer DEFAULT 0,
     cancelled_orders integer DEFAULT 0,
     revenue decimal(10, 2) DEFAULT 0,
     avg_completion_time_hours decimal(10, 2),
     customer_satisfaction decimal(3, 2),
     created_at timestamptz DEFAULT now()
   );
   ```
   - Поле metric_date имеет ограничение UNIQUE для хранения одной записи метрик на дату

**Этап 4: Создание индексов для оптимизации**

После создания таблиц были добавлены индексы для ускорения выполнения запросов:

```sql
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_received_date ON service_orders(received_date);
CREATE INDEX IF NOT EXISTS idx_service_orders_assigned_to ON service_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_date ON kpi_metrics(metric_date);
```

Индексы созданы для полей, которые часто используются в условиях WHERE и ORDER BY.

**Этап 5: Создание функций и триггеров**

1. **Функция автоматического обновления `updated_at`:**
   ```sql
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = now();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```
   - Функция написана на языке PL/pgSQL
   - Автоматически обновляет поле updated_at при изменении записи

2. **Триггеры для таблиц profiles и service_orders:**
   ```sql
   CREATE TRIGGER update_profiles_updated_at
     BEFORE UPDATE ON profiles
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   
   CREATE TRIGGER update_service_orders_updated_at
     BEFORE UPDATE ON service_orders
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   ```
   - Триггеры срабатывают перед обновлением записи (BEFORE UPDATE)
   - Автоматически вызывают функцию update_updated_at_column()

**Этап 6: Добавление функционала аудита и уведомлений**

Создан дополнительный SQL-скрипт миграции `add_audit_and_notifications.sql`:

1. **Создание таблицы `audit_log` (Журнал аудита):**
   ```sql
   CREATE TABLE IF NOT EXISTS audit_log (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     entity_type text NOT NULL,
     entity_id uuid NOT NULL,
     action text NOT NULL,
     changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
     old_values jsonb,
     new_values jsonb,
     changed_fields text[],
     created_at timestamptz DEFAULT now()
   );
   ```
   - Использован тип JSONB для гибкого хранения структурированных данных изменений
   - Поле changed_fields содержит массив имён изменённых полей для быстрого поиска
   - Созданы индексы для оптимизации запросов по entity_type, entity_id, created_at, changed_by

2. **Создание таблицы `notifications` (Уведомления):**
   ```sql
   CREATE TABLE IF NOT EXISTS notifications (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
     type text NOT NULL,
     title text NOT NULL,
     message text NOT NULL,
     link text,
     is_read boolean DEFAULT false,
     created_at timestamptz DEFAULT now()
   );
   ```
   - Связь с таблицей profiles с каскадным удалением (ON DELETE CASCADE)
   - Созданы индексы для оптимизации запросов по user_id, is_read, created_at

3. **Создание таблицы `order_attachments` (Вложения к заказам):**
   ```sql
   CREATE TABLE IF NOT EXISTS order_attachments (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
     file_name text NOT NULL,
     file_path text NOT NULL,
     file_size integer,
     file_type text,
     uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
     created_at timestamptz DEFAULT now()
   );
   ```
   - Связь с таблицей service_orders с каскадным удалением
   - Хранение метаданных файлов (имя, путь, размер, тип)

4. **Создание функции `create_audit_log`:**
   ```sql
   CREATE OR REPLACE FUNCTION create_audit_log(
     p_entity_type text,
     p_entity_id uuid,
     p_action text,
     p_changed_by uuid,
     p_old_values jsonb DEFAULT NULL,
     p_new_values jsonb DEFAULT NULL
   )
   RETURNS void AS $$
   DECLARE
     v_changed_fields text[];
   BEGIN
     IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
       SELECT array_agg(key) INTO v_changed_fields
       FROM jsonb_each(p_new_values)
       WHERE p_old_values->>key IS DISTINCT FROM p_new_values->>key;
     END IF;
     
     INSERT INTO audit_log (...) VALUES (...);
   END;
   $$ LANGUAGE plpgsql;
   ```
   - Функция автоматически определяет список изменённых полей, сравнивая old_values и new_values
   - Используется в приложении для создания записей аудита

**Этап 7: Создание системы миграций**

Для управления версиями схемы базы данных была создана система миграций:

1. **Создан скрипт `server/run-migrations.js`:**
   - Читает SQL-файлы из папки `migrations/`
   - Выполняет их последовательно
   - Обрабатывает ошибки (игнорирует ошибки о том, что объекты уже существуют)
   - Выводит подробные логи выполнения

2. **Структура миграций:**
   - `01_create_schema_fixed.sql` - основная схема БД
   - `add_audit_and_notifications.sql` - функционал аудита и уведомлений
   - `add_password_hash.sql` - добавление поля password_hash
   - `fix_profiles_table.sql` - исправление структуры таблицы profiles
   - `complete_setup.sql` - создание тестового пользователя

3. **Выполнение миграций:**
   ```bash
   cd server
   node run-migrations.js
   ```
   - Скрипт автоматически выполняет все миграции в правильном порядке
   - Создаёт тестового пользователя-администратора (admin@service.ru / admin123)

**Этап 8: Настройка безопасности**

1. **Хеширование паролей:**
   - Реализовано хеширование паролей с помощью библиотеки `bcryptjs` версии 2.4.3
   - Алгоритм bcrypt автоматически добавляет соль к каждому паролю
   - Хеши паролей хранятся в поле `password_hash` таблицы `profiles`

2. **Параметризованные запросы:**
   - Все SQL-запросы в приложении используют параметризацию для предотвращения SQL-инъекций
   - Пример: `SELECT * FROM profiles WHERE email = $1` вместо конкатенации строк

3. **Валидация данных:**
   - Ограничения CHECK на уровне базы данных обеспечивают валидность данных
   - Ограничения NOT NULL предотвращают создание записей с пустыми обязательными полями
   - Ограничения UNIQUE предотвращают дублирование данных

**Этап 9: Тестирование и отладка**

1. **Создан скрипт проверки БД `server/check-db.js`:**
   - Проверяет наличие всех таблиц
   - Проверяет наличие тестового пользователя
   - Выводит информацию о структуре БД

2. **Создан скрипт добавления тестовых данных `server/seed-data.js`:**
   - Добавляет тестовых техников
   - Добавляет тестовые заказы
   - Используется для разработки и тестирования

**Этап 10: Реализация резервного копирования**

Реализован функционал резервного копирования и восстановления данных:

1. **Создание резервной копии:**
   - Экспорт всех данных из таблиц в JSON-формат
   - Включение метаданных (версия системы, дата создания, количество записей)
   - Автоматическое скачивание JSON-файла

2. **Восстановление из резервной копии:**
   - Импорт данных из JSON-файла
   - Очистка существующих данных перед восстановлением
   - Валидация формата файла перед восстановлением

### 2.3.2 Проектирование схемы базы данных

Проектирование базы данных осуществлялось с учётом требований предметной области предприятия "Сервис всем" (ремонт компьютерной и бытовой техники). Была разработана нормализованная реляционная схема, состоящая из следующих основных таблиц:

#### 2.3.2.1 Таблица `profiles` (Пользователи системы)

Таблица хранит информацию о пользователях системы (администраторах и обычных пользователях).

**Структура таблицы:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор пользователя, генерируется автоматически
- `email` (TEXT, UNIQUE, NOT NULL) - электронная почта пользователя (используется для входа)
- `full_name` (TEXT) - полное имя пользователя
- `role` (TEXT, NOT NULL, DEFAULT 'user') - роль пользователя: 'admin' (администратор) или 'user' (обычный пользователь)
- `password_hash` (TEXT) - хеш пароля пользователя, созданный с помощью bcrypt
- `created_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время создания записи
- `updated_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время последнего обновления записи

**Особенности:**
- Поле `email` имеет ограничение UNIQUE для предотвращения дублирования учётных записей
- Поле `role` имеет ограничение CHECK, разрешающее только значения 'admin' или 'user'
- Пароли хранятся в виде хешей, созданных с помощью алгоритма bcrypt (соль генерируется автоматически)

#### 2.3.2.2 Таблица `technicians` (Техники/Мастера)

Таблица хранит информацию о сотрудниках-техниках, выполняющих ремонтные работы.

**Структура таблицы:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор техника
- `profile_id` (UUID, REFERENCES profiles(id) ON DELETE SET NULL) - связь с профилем пользователя (опционально)
- `full_name` (TEXT, NOT NULL) - полное имя техника
- `specialization` (TEXT, CHECK) - специализация: 'computer' (компьютеры), 'household' (бытовая техника), 'mobile' (мобильные устройства), 'universal' (универсал)
- `hire_date` (DATE, DEFAULT CURRENT_DATE) - дата приёма на работу
- `is_active` (BOOLEAN, DEFAULT true) - флаг активности техника (true - работает, false - уволен/неактивен)
- `created_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время создания записи

**Особенности:**
- Связь с таблицей `profiles` позволяет связать техника с учётной записью пользователя
- Поле `specialization` имеет ограничение CHECK для контроля допустимых значений
- Поле `is_active` позволяет "мягко" удалять техников без физического удаления записей

#### 2.3.2.3 Таблица `service_orders` (Заказы на обслуживание)

Основная таблица системы, хранящая информацию о заказах на ремонт техники.

**Структура таблицы:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор заказа
- `order_number` (TEXT, UNIQUE, NOT NULL) - номер заказа (уникальный, генерируется автоматически)
- `customer_name` (TEXT, NOT NULL) - имя клиента
- `customer_phone` (TEXT, NOT NULL) - телефон клиента
- `device_type` (TEXT, NOT NULL, CHECK) - тип устройства: 'computer' (компьютер), 'laptop' (ноутбук), 'household_appliance' (бытовая техника), 'phone' (телефон), 'other' (другое)
- `device_brand` (TEXT) - марка устройства
- `device_model` (TEXT) - модель устройства
- `issue_description` (TEXT, NOT NULL) - описание проблемы/неисправности
- `status` (TEXT, DEFAULT 'pending', CHECK) - статус заказа: 'pending' (ожидает), 'in_progress' (в работе), 'completed' (завершён), 'cancelled' (отменён)
- `priority` (TEXT, DEFAULT 'normal', CHECK) - приоритет: 'low' (низкий), 'normal' (нормальный), 'high' (высокий), 'urgent' (срочный)
- `assigned_to` (UUID, REFERENCES technicians(id) ON DELETE SET NULL) - идентификатор назначенного техника
- `received_date` (TIMESTAMPTZ, DEFAULT now()) - дата и время приёма заказа
- `completed_date` (TIMESTAMPTZ) - дата и время завершения заказа (NULL, если не завершён)
- `estimated_cost` (DECIMAL(10, 2)) - предварительная стоимость ремонта
- `final_cost` (DECIMAL(10, 2)) - итоговая стоимость ремонта
- `created_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время создания записи
- `updated_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время последнего обновления записи

**Особенности:**
- Поле `order_number` имеет ограничение UNIQUE для предотвращения дублирования номеров заказов
- Множественные ограничения CHECK обеспечивают валидность данных (статус, приоритет, тип устройства)
- Связь с таблицей `technicians` через `assigned_to` позволяет назначать заказы техникам
- Поля `estimated_cost` и `final_cost` используют тип DECIMAL для точного хранения денежных сумм

#### 2.3.2.4 Таблица `kpi_metrics` (KPI метрики)

Таблица для хранения агрегированных метрик производительности за определённые даты.

**Структура таблицы:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор записи метрики
- `metric_date` (DATE, NOT NULL, UNIQUE) - дата, за которую собраны метрики
- `total_orders` (INTEGER, DEFAULT 0) - общее количество заказов за день
- `completed_orders` (INTEGER, DEFAULT 0) - количество завершённых заказов
- `cancelled_orders` (INTEGER, DEFAULT 0) - количество отменённых заказов
- `revenue` (DECIMAL(10, 2), DEFAULT 0) - выручка за день
- `avg_completion_time_hours` (DECIMAL(10, 2)) - среднее время выполнения заказа в часах
- `customer_satisfaction` (DECIMAL(3, 2)) - оценка удовлетворённости клиентов (от 0.00 до 5.00)
- `created_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время создания записи

**Особенности:**
- Поле `metric_date` имеет ограничение UNIQUE, что позволяет хранить только одну запись метрик на дату
- Метрики могут рассчитываться автоматически или вручную администратором

#### 2.3.2.5 Таблица `audit_log` (Журнал аудита)

Таблица для отслеживания всех изменений в системе (кто, что, когда и как изменил).

**Структура таблицы:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор записи аудита
- `entity_type` (TEXT, NOT NULL) - тип сущности: 'order' (заказ), 'technician' (техник), 'profile' (профиль)
- `entity_id` (UUID, NOT NULL) - идентификатор изменённой сущности
- `action` (TEXT, NOT NULL) - действие: 'create' (создание), 'update' (обновление), 'delete' (удаление)
- `changed_by` (UUID, REFERENCES profiles(id) ON DELETE SET NULL) - идентификатор пользователя, который внёс изменение
- `old_values` (JSONB) - значения полей до изменения (в формате JSON)
- `new_values` (JSONB) - значения полей после изменения (в формате JSON)
- `changed_fields` (TEXT[]) - массив имён изменённых полей
- `created_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время изменения

**Особенности:**
- Использование типа JSONB позволяет гибко хранить структурированные данные изменений
- Поле `changed_fields` содержит массив имён полей, которые были изменены, для быстрого поиска
- Связь с таблицей `profiles` позволяет отслеживать, кто внёс изменения

#### 2.3.2.6 Таблица `notifications` (Уведомления)

Таблица для хранения уведомлений пользователей системы.

**Структура таблицы:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор уведомления
- `user_id` (UUID, REFERENCES profiles(id) ON DELETE CASCADE) - идентификатор пользователя-получателя
- `type` (TEXT, NOT NULL) - тип уведомления: 'info' (информация), 'warning' (предупреждение), 'error' (ошибка), 'success' (успех)
- `title` (TEXT, NOT NULL) - заголовок уведомления
- `message` (TEXT, NOT NULL) - текст уведомления
- `link` (TEXT) - ссылка на связанный ресурс (опционально)
- `is_read` (BOOLEAN, DEFAULT false) - флаг прочтения уведомления
- `created_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время создания уведомления

**Особенности:**
- Связь с таблицей `profiles` с каскадным удалением (ON DELETE CASCADE) - при удалении пользователя удаляются все его уведомления
- Поле `is_read` позволяет отслеживать непрочитанные уведомления

#### 2.3.2.7 Таблица `order_attachments` (Вложения к заказам)

Таблица для хранения информации о файлах, прикреплённых к заказам (фотографии, документы и т.д.).

**Структура таблицы:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор вложения
- `order_id` (UUID, REFERENCES service_orders(id) ON DELETE CASCADE) - идентификатор заказа
- `file_name` (TEXT, NOT NULL) - имя файла
- `file_path` (TEXT, NOT NULL) - путь к файлу на сервере
- `file_size` (INTEGER) - размер файла в байтах
- `file_type` (TEXT) - MIME-тип файла
- `uploaded_by` (UUID, REFERENCES profiles(id) ON DELETE SET NULL) - идентификатор пользователя, загрузившего файл
- `created_at` (TIMESTAMPTZ, DEFAULT now()) - дата и время загрузки файла

**Особенности:**
- Связь с таблицей `service_orders` с каскадным удалением - при удалении заказа удаляются все связанные файлы
- Хранение метаданных файла (имя, размер, тип) позволяет отображать информацию о файлах без необходимости обращения к файловой системе

### 2.3.3 Индексы базы данных

Для оптимизации производительности запросов были созданы следующие индексы:

1. **Индексы для таблицы `service_orders`:**
   - `idx_service_orders_status` - индекс по полю `status` для быстрого фильтрования заказов по статусу
   - `idx_service_orders_received_date` - индекс по полю `received_date` для сортировки и фильтрации по дате
   - `idx_service_orders_assigned_to` - индекс по полю `assigned_to` для быстрого поиска заказов по назначенному технику

2. **Индексы для таблицы `kpi_metrics`:**
   - `idx_kpi_metrics_date` - индекс по полю `metric_date` для быстрого поиска метрик по дате

3. **Индексы для таблицы `audit_log`:**
   - `idx_audit_log_entity` - составной индекс по полям `entity_type` и `entity_id` для быстрого поиска изменений конкретной сущности
   - `idx_audit_log_created_at` - индекс по полю `created_at` для сортировки по дате
   - `idx_audit_log_changed_by` - индекс по полю `changed_by` для поиска изменений конкретного пользователя

4. **Индексы для таблицы `notifications`:**
   - `idx_notifications_user_id` - индекс по полю `user_id` для быстрого поиска уведомлений пользователя
   - `idx_notifications_is_read` - индекс по полю `is_read` для фильтрации непрочитанных уведомлений
   - `idx_notifications_created_at` - индекс по полю `created_at` для сортировки по дате

5. **Индексы для таблицы `order_attachments`:**
   - `idx_order_attachments_order_id` - индекс по полю `order_id` для быстрого поиска вложений заказа

### 2.3.4 Триггеры и функции базы данных

#### 2.3.4.1 Функция автоматического обновления `updated_at`

Создана функция `update_updated_at_column()`, которая автоматически обновляет поле `updated_at` при изменении записи:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Триггеры, использующие эту функцию:**
- `update_profiles_updated_at` - автоматически обновляет `updated_at` в таблице `profiles`
- `update_service_orders_updated_at` - автоматически обновляет `updated_at` в таблице `service_orders`

#### 2.3.4.2 Функция создания записей аудита

Создана функция `create_audit_log()`, которая создаёт записи в журнале аудита:

```sql
CREATE OR REPLACE FUNCTION create_audit_log(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_changed_by uuid,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void AS $$
```

Функция автоматически определяет список изменённых полей, сравнивая `old_values` и `new_values`, и сохраняет их в поле `changed_fields`.

### 2.3.5 Связи между таблицами (Foreign Keys)

База данных использует внешние ключи (Foreign Keys) для обеспечения целостности данных:

1. **`technicians.profile_id` → `profiles.id`**
   - Связь техника с профилем пользователя
   - ON DELETE SET NULL - при удалении профиля поле становится NULL

2. **`service_orders.assigned_to` → `technicians.id`**
   - Связь заказа с назначенным техником
   - ON DELETE SET NULL - при удалении техника поле становится NULL

3. **`audit_log.changed_by` → `profiles.id`**
   - Связь записи аудита с пользователем, внёсшим изменение
   - ON DELETE SET NULL - при удалении пользователя поле становится NULL

4. **`notifications.user_id` → `profiles.id`**
   - Связь уведомления с пользователем-получателем
   - ON DELETE CASCADE - при удалении пользователя удаляются все его уведомления

5. **`order_attachments.order_id` → `service_orders.id`**
   - Связь вложения с заказом
   - ON DELETE CASCADE - при удалении заказа удаляются все связанные вложения

6. **`order_attachments.uploaded_by` → `profiles.id`**
   - Связь вложения с пользователем, загрузившим файл
   - ON DELETE SET NULL - при удалении пользователя поле становится NULL

### 2.3.6 Миграции базы данных

Разработка базы данных осуществлялась через систему миграций - последовательность SQL-скриптов, которые создают и модифицируют структуру базы данных. Это позволяет:

- **Версионирование схемы**: Каждая миграция представляет собой версию схемы БД
- **Воспроизводимость**: Возможность создать идентичную базу данных на любом сервере
- **Откат изменений**: При необходимости можно откатить миграции

**Основные миграции:**

1. **`01_create_schema_fixed.sql`** - создание основной схемы базы данных:
   - Таблицы: `profiles`, `technicians`, `service_orders`, `kpi_metrics`
   - Индексы для оптимизации запросов
   - Функции и триггеры для автоматического обновления `updated_at`

2. **`add_audit_and_notifications.sql`** - добавление функционала аудита и уведомлений:
   - Таблицы: `audit_log`, `notifications`, `order_attachments`
   - Функция `create_audit_log()` для создания записей аудита
   - Дополнительные индексы

3. **`add_password_hash.sql`** - добавление поля `password_hash` в таблицу `profiles`

4. **`fix_profiles_table.sql`** - исправление структуры таблицы `profiles`

### 2.3.7 Подключение к базе данных

Подключение к базе данных осуществляется через пул соединений (connection pool) библиотеки `pg` (PostgreSQL клиент для Node.js). Пул соединений позволяет:

- **Эффективное использование ресурсов**: Переиспользование соединений вместо создания новых для каждого запроса
- **Управление нагрузкой**: Ограничение количества одновременных соединений
- **Обработка ошибок**: Автоматическое переподключение при разрыве соединения

**Конфигурация подключения** (файл `server/db.js`):

```javascript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'service_kpi',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});
```

Параметры подключения хранятся в файле `.env` для безопасности и удобства настройки.

### 2.3.8 Безопасность базы данных

Реализованы следующие меры безопасности:

1. **Хеширование паролей**: Все пароли хранятся в виде хешей, созданных с помощью bcrypt (алгоритм bcrypt автоматически добавляет соль)
2. **Параметризованные запросы**: Все SQL-запросы используют параметризацию для предотвращения SQL-инъекций
3. **Валидация данных**: Ограничения CHECK и NOT NULL на уровне базы данных обеспечивают валидность данных
4. **Уникальные ограничения**: Поля `email` и `order_number` имеют ограничения UNIQUE для предотвращения дублирования
5. **Каскадное удаление**: Правильно настроенные внешние ключи с ON DELETE CASCADE/SET NULL обеспечивают целостность данных при удалении записей

### 2.3.9 Резервное копирование и восстановление

Реализован функционал резервного копирования и восстановления данных:

- **Создание резервной копии**: Экспорт всех данных из таблиц в JSON-формат
- **Восстановление из резервной копии**: Импорт данных из JSON-файла с очисткой существующих данных
- **Метаданные**: Резервная копия содержит информацию о версии, дате создания и количестве записей

Резервное копирование доступно только администраторам системы.

---

## 2.4 Разработка пользовательского интерфейса

### 2.4.1 Выбор технологий для фронтенда

Для разработки пользовательского интерфейса были выбраны следующие технологии:

- **React 18.3.1** - современная библиотека для построения пользовательских интерфейсов с компонентным подходом
- **TypeScript 5.5.3** - типизированный JavaScript для повышения надёжности кода и предотвращения ошибок
- **Vite 5.4.2** - быстрый инструмент сборки и dev-сервер с поддержкой Hot Module Replacement (HMR)
- **Tailwind CSS 3.4.1** - utility-first CSS-фреймворк для быстрой стилизации компонентов
- **Lucide React** - библиотека иконок для современного дизайна

### 2.4.2 Процесс разработки пользовательского интерфейса

Разработка пользовательского интерфейса осуществлялась поэтапно, начиная с настройки проекта и заканчивая реализацией всех функциональных компонентов.

**Этап 1: Инициализация проекта и настройка окружения**

1. **Создание проекта с Vite:**
   - Использован шаблон `react-ts` для создания проекта с React и TypeScript
   - Команда: `npm create vite@latest . -- --template react-ts`
   - Это создало базовую структуру проекта с файлами:
     - `index.html` - точка входа HTML
     - `src/main.tsx` - точка входа React приложения
     - `src/App.tsx` - корневой компонент приложения
     - `vite.config.ts` - конфигурация Vite
     - `tsconfig.json` - конфигурация TypeScript
     - `package.json` - зависимости проекта

2. **Настройка Vite:**
   - Создан файл `vite.config.ts` с конфигурацией:
     ```typescript
     import { defineConfig } from 'vite';
     import react from '@vitejs/plugin-react';
     
     export default defineConfig({
       plugins: [react()],
       optimizeDeps: {
         exclude: ['lucide-react'],
       },
     });
     ```
   - Настроен плагин React для обработки JSX
   - Исключена библиотека `lucide-react` из оптимизации зависимостей для корректной работы

3. **Установка зависимостей:**
   - Установлен React 18.3.1 и React DOM
   - Установлен TypeScript 5.5.3 и типы для React
   - Установлен Vite 5.4.2 и плагин для React
   - Установлен Tailwind CSS 3.4.1 и необходимые плагины (PostCSS, Autoprefixer)
   - Установлена библиотека иконок Lucide React
   - Команда: `npm install`

4. **Настройка Tailwind CSS:**
   - Создан файл `tailwind.config.js`:
     ```javascript
     export default {
       content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
       darkMode: 'class', // Включаем темную тему через класс
       theme: {
         extend: {},
       },
       plugins: [],
     };
     ```
   - Настроен `darkMode: 'class'` для поддержки тёмной темы через класс на элементе
   - Указаны пути к файлам для сканирования классов Tailwind
   - Создан файл `src/index.css` с директивами Tailwind:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

**Этап 2: Создание архитектуры приложения**

1. **Структура папок:**
   - Создана папка `src/components/` для переиспользуемых компонентов
   - Создана папка `src/pages/` для страниц приложения
   - Создана папка `src/contexts/` для React контекстов (управление состоянием)
   - Создана папка `src/lib/` для утилит и API клиента
   - Создана папка `src/utils/` для вспомогательных функций
   - Создана папка `src/components/charts/` для компонентов графиков

2. **Настройка TypeScript:**
   - Настроен `tsconfig.json` с строгими правилами типизации
   - Включена проверка типов для всех файлов
   - Настроены пути импорта для удобства разработки

**Этап 3: Реализация системы аутентификации**

1. **Создание контекста аутентификации (`src/contexts/AuthContext.tsx`):**
   - Реализован React Context для глобального управления состоянием аутентификации
   - Создан интерфейс `AuthContextType` с методами:
     - `signIn(email, password)` - вход в систему
     - `signOut()` - выход из системы
     - `loadUser()` - загрузка информации о текущем пользователе
   - Реализовано хранение JWT-токена в `localStorage`
   - Реализована автоматическая проверка валидности токена при загрузке приложения
   - Добавлена проверка роли пользователя (`isAdmin`)

2. **Создание API клиента (`src/lib/api.ts`):**
   - Реализован централизованный клиент для всех запросов к backend
   - Настроено автоматическое добавление JWT-токена к заголовкам запросов
   - Реализована обработка ошибок (401 - перенаправление на страницу входа)
   - Созданы методы для всех операций:
     - Аутентификация: `login()`, `logout()`, `getCurrentUser()`, `changePassword()`
     - Заказы: `getOrders()`, `createOrder()`, `updateOrder()`, `deleteOrder()`
     - Техники: `getTechnicians()`, `createTechnician()`, `updateTechnician()`, `deleteTechnician()`
     - Метрики: `getKPIMetrics()`, `getOrdersStats()`
     - Аудит: `getAuditLog()`
     - Уведомления: `getNotifications()`, `markNotificationAsRead()`
     - Резервное копирование: `createBackup()`, `restoreBackup()`
     - Файлы: `uploadFile()`, `deleteFile()`

3. **Создание страницы входа (`src/components/LoginPage.tsx`):**
   - Реализована форма входа с полями "Email" и "Пароль"
   - Добавлена валидация полей (проверка на пустые значения)
   - Реализована обработка ошибок аутентификации с отображением сообщений
   - Добавлена ссылка "Забыли пароль?" (для будущей реализации)
   - Реализовано автоматическое перенаправление на главную страницу при успешном входе
   - Использован Tailwind CSS для стилизации формы

**Этап 4: Реализация основной структуры приложения**

1. **Создание компонента Dashboard (`src/components/Dashboard.tsx`):**
   - Реализован главный компонент приложения, который управляет навигацией
   - Создана система маршрутизации через состояние `currentPage`
   - Реализована функция `renderPage()`, которая отображает нужную страницу в зависимости от `currentPage`
   - Интегрированы компоненты `Sidebar` и `Header`

2. **Создание боковой панели навигации (`src/components/Sidebar.tsx`):**
   - Реализовано меню навигации с пунктами:
     - Дашборд
     - Заказы
     - Техники
     - История изменений
     - Резервное копирование (только для администраторов)
     - Справочный раздел
     - Профиль
   - Добавлена подсветка активного пункта меню
   - Реализована проверка роли пользователя для отображения административных пунктов
   - Использован Tailwind CSS для адаптивного дизайна
   - Добавлена поддержка тёмной и светлой темы

3. **Создание шапки приложения (`src/components/Header.tsx`):**
   - Реализовано отображение названия приложения
   - Добавлен переключатель темы (светлая/тёмная)
   - Интегрирован компонент `NotificationBell` для отображения уведомлений
   - Реализовано меню пользователя с информацией о текущем пользователе и кнопкой выхода

**Этап 5: Реализация системы тем**

1. **Создание контекста темы (`src/contexts/ThemeContext.tsx`):**
   - Реализован React Context для управления темой интерфейса
   - Создана функция `toggleTheme()` для переключения между светлой и тёмной темой
   - Реализовано сохранение выбранной темы в `localStorage`
   - Реализовано автоматическое применение темы при загрузке приложения
   - Добавлен класс `dark` на элемент `<html>` для активации тёмной темы в Tailwind CSS

2. **Интеграция темы во все компоненты:**
   - Все компоненты используют классы Tailwind с префиксом `dark:` для тёмной темы
   - Пример: `bg-white dark:bg-gray-900` - белый фон в светлой теме, тёмно-серый в тёмной
   - Реализована плавная анимация переключения темы

**Этап 6: Реализация главной страницы (Дашборд)**

1. **Создание страницы дашборда (`src/pages/DashboardPage.tsx`):**
   - Реализована загрузка данных о заказах и техниках через API
   - Создана система фильтрации по периодам (7 дней, 30 дней, 90 дней, 365 дней)
   - Реализовано вычисление метрик:
     - Общее количество заказов
     - Количество завершённых заказов
     - Общая выручка
     - Среднее время выполнения заказа

2. **Создание компонента MetricCard (`src/components/MetricCard.tsx`):**
   - Реализована карточка для отображения метрики с иконкой
   - Добавлена поддержка отображения изменения метрики (рост/падение)
   - Использованы иконки из библиотеки Lucide React

3. **Создание компонентов графиков:**
   - **DonutChart** (`src/components/charts/DonutChart.tsx`):
     - Реализована круговая диаграмма (donut chart) с использованием SVG
     - Добавлена интерактивность (подсветка сегментов при наведении)
     - Реализована легенда с названиями и значениями
   
   - **LineChart** (`src/components/charts/LineChart.tsx`):
     - Реализован линейный график для отображения динамики заказов
     - Добавлены точки данных с подсказками при наведении
     - Реализована адаптивная шкала осей
   
   - **PieChart** (`src/components/charts/PieChart.tsx`):
     - Реализована круговая диаграмма для распределения по приоритетам
     - Добавлена цветовая индикация для разных приоритетов
   
   - **BarChart** (`src/components/charts/BarChart.tsx`):
     - Реализована столбчатая диаграмма для отображения заказов по техникам
     - Добавлена горизонтальная прокрутка для большого количества техников
   
   - **StackedBarChart** (`src/components/charts/StackedBarChart.tsx`):
     - Реализована столбчатая диаграмма с группировкой для выручки по типам устройств
     - Добавлена цветовая индикация для разных типов устройств
     - Реализована легенда

**Этап 7: Реализация страницы заказов**

1. **Создание страницы заказов (`src/pages/OrdersPage.tsx`):**
   - Реализована таблица со всеми заказами
   - Добавлена система поиска по номеру заказа, имени клиента, телефону
   - Реализована фильтрация:
     - По статусу (все, ожидает, в работе, завершён, отменён)
     - По дате (сегодня, неделя, месяц, все, произвольный период)
   - Реализована сортировка по различным полям (нажатие на заголовок колонки)
   - Реализована пагинация с настраиваемым количеством записей на странице (10, 25, 50, 100)

2. **Создание модального окна создания заказа (`src/components/CreateOrderModal.tsx`):**
   - Реализована форма с полями:
     - Клиент (имя, телефон)
     - Устройство (тип, марка, модель)
     - Описание проблемы
     - Статус, приоритет, назначенный техник
     - Предварительная стоимость
   - Добавлена валидация обязательных полей
   - Реализована обработка ошибок с отображением сообщений
   - Добавлена возможность закрытия модального окна по клику вне окна или по клавише Escape

3. **Создание модального окна редактирования заказа (`src/components/EditOrderModal.tsx`):**
   - Реализована форма, аналогичная форме создания, но с предзаполненными данными
   - Добавлена возможность редактирования всех полей заказа
   - Реализована загрузка и отображение вложений к заказу
   - Добавлена возможность загрузки новых файлов
   - Реализована возможность удаления файлов (только для администраторов)

4. **Создание компонента вложений (`src/components/OrderAttachments.tsx`):**
   - Реализовано отображение списка файлов, прикреплённых к заказу
   - Добавлена возможность загрузки файлов через `<input type="file">`
   - Реализована обработка загрузки файлов через API с использованием FormData
   - Добавлена возможность просмотра файлов (открытие в новой вкладке)
   - Реализована возможность удаления файлов

5. **Реализация экспорта данных (`src/utils/export.ts`):**
   - Создана функция `exportToCSV()` для экспорта в формат CSV
   - Создана функция `exportToExcel()` для экспорта в формат XLSX (используется библиотека)
   - Создана функция `exportToPDF()` для экспорта в формат PDF (используется библиотека)
   - Создана функция `exportTo1C()` для экспорта в специальный формат для интеграции с 1С
   - Все функции автоматически скачивают файл на компьютер пользователя

**Этап 8: Реализация страницы техников**

1. **Создание страницы техников (`src/pages/TechniciansPage.tsx`):**
   - Реализована таблица со всеми техниками
   - Добавлена система поиска по имени техника
   - Реализована фильтрация по специализации и статусу
   - Добавлено отображение статистики (количество заказов, процент завершённых)

2. **Создание модальных окон для техников:**
   - `CreateTechnicianModal.tsx` - форма создания нового техника
   - `EditTechnicianModal.tsx` - форма редактирования техника
   - Обе формы содержат валидацию и обработку ошибок

**Этап 9: Реализация страницы истории изменений**

1. **Создание страницы истории изменений (`src/pages/AuditLogPage.tsx`):**
   - Реализована таблица со всеми изменениями в системе
   - Добавлена фильтрация:
     - По типу сущности (заказ, техник, профиль)
     - По действию (создание, обновление, удаление)
     - По пользователю
     - По дате
   - Реализована функция `formatChanges()` для форматирования изменений в читаемый формат:
     - Для заказов: "Статус: Ожидает → В работе"
     - Для техников: "Был техник Иван Иванов → стал Пётр Петров"
     - Для профилей: "Имя: Иван Иванов → Пётр Петров"
     - Специальная обработка смены пароля (без отображения значений)
   - Добавлена пагинация

**Этап 10: Реализация страницы профиля**

1. **Создание страницы профиля (`src/pages/ProfilePage.tsx`):**
   - Реализовано отображение информации о текущем пользователе
   - Добавлена форма редактирования профиля (имя, email)
   - Реализована форма смены пароля:
     - Поле для текущего пароля
     - Поле для нового пароля
     - Поле для подтверждения нового пароля
     - Валидация (минимальная длина, совпадение паролей)
   - Реализована обработка ошибок с отображением сообщений

**Этап 11: Реализация страницы резервного копирования**

1. **Создание страницы резервного копирования (`src/pages/BackupPage.tsx`):**
   - Реализована кнопка "Создать резервную копию" с автоматическим скачиванием JSON-файла
   - Реализована загрузка файла резервной копии через `<input type="file">`
   - Добавлено предупреждение о том, что восстановление удалит все текущие данные
   - Реализовано поле подтверждения (нужно ввести "ПОДТВЕРДИТЬ")
   - Добавлено отображение метаданных резервной копии (версия, дата, количество записей)
   - Реализована обработка ошибок при восстановлении

**Этап 12: Реализация справочного раздела**

1. **Создание страницы справки (`src/pages/HelpPage.tsx`):**
   - Реализовано руководство по использованию с описанием всех разделов
   - Добавлена прокрутка для длинных разделов
   - Реализован поиск по руководству
   - Добавлен раздел FAQ с раскрывающимися вопросами и ответами
   - Реализован поиск по FAQ
   - Добавлена контактная информация разработчика
   - Отображение версии системы

**Этап 13: Реализация системы уведомлений**

1. **Создание компонента уведомлений (`src/components/NotificationBell.tsx`):**
   - Реализована иконка колокольчика с счётчиком непрочитанных уведомлений
   - Добавлено выпадающее меню со списком уведомлений
   - Реализована цветовая индикация типов уведомлений (информация, предупреждение, ошибка, успех)
   - Добавлена возможность перехода по ссылке из уведомления
   - Реализована автоматическая отметка уведомлений как прочитанных при открытии списка
   - Добавлено автоматическое обновление списка уведомлений

**Этап 14: Реализация компонента пагинации**

1. **Создание компонента пагинации (`src/components/Pagination.tsx`):**
   - Реализована навигация по страницам с кнопками "Предыдущая" и "Следующая"
   - Добавлено отображение номеров страниц
   - Реализован переход на конкретную страницу по клику на номер
   - Добавлено отображение информации о текущей странице и общем количестве записей
   - Реализован адаптивный дизайн для мобильных устройств

**Этап 15: Оптимизация и доработка**

1. **Оптимизация производительности:**
   - Использован `React.memo` для предотвращения ненужных перерисовок компонентов
   - Использован `useMemo` для мемоизации вычислений (метрики, фильтры)
   - Использован `useCallback` для мемоизации функций-обработчиков
   - Оптимизированы запросы к API (батчинг, кэширование)

2. **Адаптивный дизайн:**
   - Все компоненты адаптированы для различных размеров экранов:
     - Десктоп (≥1024px): полная версия
     - Планшет (768px - 1023px): адаптированная версия
     - Мобильный (<768px): компактная версия с выпадающим меню
   - Использованы responsive breakpoints Tailwind CSS

3. **Обработка ошибок:**
   - Реализована обработка сетевых ошибок (ERR_CONNECTION_REFUSED, таймауты)
   - Реализована обработка ошибок сервера (400, 401, 403, 404, 500)
   - Добавлены понятные сообщения об ошибках для пользователя
   - Реализовано автоматическое перенаправление на страницу входа при истечении сессии

4. **Валидация форм:**
   - Реализована проверка обязательных полей
   - Реализована проверка формата email
   - Реализована проверка формата телефона
   - Реализована проверка минимальной длины пароля
   - Реализована проверка совпадения паролей при смене

**Этап 16: Тестирование и отладка**

1. **Тестирование функционала:**
   - Протестирована аутентификация (вход, выход)
   - Протестированы CRUD операции для заказов и техников
   - Протестирована работа графиков и метрик
   - Протестирована система уведомлений
   - Протестировано резервное копирование и восстановление

2. **Исправление ошибок:**
   - Исправлены ошибки отображения данных
   - Исправлены ошибки валидации форм
   - Исправлены ошибки работы с файлами
   - Оптимизирована производительность при работе с большими объёмами данных

### 2.4.3 Основные страницы приложения

#### 2.4.3.1 Страница входа (LoginPage)

**Расположение:** `src/components/LoginPage.tsx`

**Функционал:**
- Форма входа с полями "Email" и "Пароль"
- Валидация введённых данных
- Обработка ошибок аутентификации
- Ссылка "Забыли пароль?" (для будущей реализации)
- Автоматическое перенаправление на главную страницу при успешном входе

**Дизайн:**
- Центрированная форма входа
- Адаптивный дизайн для мобильных устройств
- Поддержка тёмной и светлой темы

#### 2.4.3.2 Главная страница / Дашборд (DashboardPage)

**Расположение:** `src/pages/DashboardPage.tsx`

**Функционал:**
- Отображение ключевых метрик (KPI) в виде карточек:
  - Общее количество заказов
  - Завершённые заказы
  - Выручка
  - Среднее время выполнения
- Интерактивные графики и диаграммы:
  - Круговая диаграмма распределения заказов по статусам
  - Линейный график динамики заказов за период
  - Круговая диаграмма распределения заказов по приоритетам
  - Столбчатая диаграмма заказов по техникам
  - Столбчатая диаграмма выручки по типам устройств (stacked bar chart)
- Фильтрация данных по периодам: 7 дней, 30 дней, 90 дней, 365 дней
- Автоматическое обновление данных

**Компоненты:**
- `MetricCard` - карточка с метрикой и иконкой
- `DonutChart` - круговая диаграмма
- `LineChart` - линейный график
- `PieChart` - круговая диаграмма
- `BarChart` - столбчатая диаграмма
- `StackedBarChart` - столбчатая диаграмма с группировкой

#### 2.4.3.3 Страница заказов (OrdersPage)

**Расположение:** `src/pages/OrdersPage.tsx`

**Функционал:**
- Таблица всех заказов с колонками:
  - Номер заказа
  - Клиент (имя и телефон)
  - Устройство (тип, марка, модель)
  - Описание проблемы
  - Статус
  - Приоритет
  - Назначенный техник
  - Даты (приём, завершение)
  - Стоимость (предварительная, итоговая)
- Поиск по номеру заказа, имени клиента, телефону
- Фильтрация:
  - По статусу (все, ожидает, в работе, завершён, отменён)
  - По дате (сегодня, неделя, месяц, все, произвольный период)
- Сортировка по различным полям
- Пагинация (настраиваемое количество записей на странице: 10, 25, 50, 100)
- Создание нового заказа (кнопка "Создать заказ")
- Редактирование заказа (кнопка редактирования)
- Удаление заказа (только для администраторов)
- Экспорт данных:
  - Экспорт в CSV
  - Экспорт в Excel
  - Экспорт в PDF
  - Экспорт в 1С (специальный формат для интеграции)

**Модальные окна:**
- `CreateOrderModal` - форма создания нового заказа
- `EditOrderModal` - форма редактирования существующего заказа

#### 2.4.3.4 Страница техников (TechniciansPage)

**Расположение:** `src/pages/TechniciansPage.tsx`

**Функционал:**
- Таблица всех техников с колонками:
  - ФИО
  - Специализация
  - Дата приёма на работу
  - Статус (активен/неактивен)
  - Количество заказов
  - Статистика выполнения
- Поиск по имени техника
- Фильтрация по специализации и статусу
- Создание нового техника (кнопка "Добавить техника")
- Редактирование техника
- Деактивация/активация техника (мягкое удаление)

**Модальные окна:**
- `CreateTechnicianModal` - форма создания нового техника
- `EditTechnicianModal` - форма редактирования техника

#### 2.4.3.5 Страница истории изменений (AuditLogPage)

**Расположение:** `src/pages/AuditLogPage.tsx`

**Функционал:**
- Таблица всех изменений в системе с колонками:
  - Дата и время изменения
  - Тип сущности (заказ, техник, профиль)
  - Действие (создание, обновление, удаление)
  - Кто внёс изменение
  - Детали изменений (старое значение → новое значение)
- Фильтрация:
  - По типу сущности
  - По действию
  - По пользователю
  - По дате
- Поиск по различным полям
- Пагинация
- Форматированное отображение изменений:
  - Для заказов: отображение изменений полей с понятными названиями
  - Для техников: отображение изменений с именами техников
  - Для профилей: отображение изменений имени и email
  - Специальная обработка смены пароля (без отображения значений)

**Особенности:**
- Отображение изменений в читаемом формате (например, "Был техник Иван Иванов → стал Пётр Петров")
- Подсветка изменённых полей

#### 2.4.3.6 Страница профиля (ProfilePage)

**Расположение:** `src/pages/ProfilePage.tsx`

**Функционал:**
- Отображение информации о текущем пользователе:
  - Email
  - Полное имя
  - Роль (администратор/пользователь)
- Редактирование профиля:
  - Изменение полного имени
  - Изменение email
- Смена пароля:
  - Ввод текущего пароля
  - Ввод нового пароля
  - Подтверждение нового пароля
  - Валидация пароля (минимальная длина, совпадение паролей)

#### 2.4.3.7 Страница резервного копирования (BackupPage)

**Расположение:** `src/pages/BackupPage.tsx`

**Функционал:**
- Создание резервной копии:
  - Кнопка "Создать резервную копию"
  - Автоматическое скачивание JSON-файла с данными
  - Отображение метаданных резервной копии (версия, дата создания, количество записей)
- Восстановление из резервной копии:
  - Загрузка JSON-файла
  - Предупреждение о том, что все текущие данные будут удалены
  - Подтверждение восстановления
- Отображение информации о том, какие данные включены в резервную копию:
  - Заказы
  - Техники
  - Пользователи
  - История изменений
  - Уведомления

**Доступ:** Только для администраторов

#### 2.4.3.8 Справочный раздел (HelpPage)

**Расположение:** `src/pages/HelpPage.tsx`

**Функционал:**
- Руководство по использованию:
  - Описание раздела "Дашборд"
  - Описание раздела "Заказы"
  - Описание раздела "Техники"
  - Описание раздела "История изменений"
  - Описание раздела "Профиль"
  - Описание раздела "Резервное копирование"
  - Прокручиваемый контент для длинных разделов
- Поиск по руководству
- FAQ (Часто задаваемые вопросы):
  - Вопросы и ответы в раскрывающемся формате
  - Поиск по FAQ
- Контактная информация:
  - Email разработчика
  - Телефон разработчика
- Версия системы

### 2.4.4 Переиспользуемые компоненты

#### 2.4.4.1 Боковая панель навигации (Sidebar)

**Расположение:** `src/components/Sidebar.tsx`

**Функционал:**
- Навигационное меню с пунктами:
  - Дашборд
  - Заказы
  - Техники
  - История изменений
  - Резервное копирование (только для администраторов)
  - Справочный раздел
  - Профиль
- Подсветка активного пункта меню
- Адаптивный дизайн (сворачивание на мобильных устройствах)
- Поддержка тёмной и светлой темы

#### 2.4.4.2 Шапка приложения (Header)

**Расположение:** `src/components/Header.tsx`

**Функционал:**
- Отображение названия приложения
- Переключатель темы (светлая/тёмная)
- Иконка уведомлений с счётчиком непрочитанных
- Меню пользователя:
  - Имя пользователя
  - Роль
  - Кнопка выхода

#### 2.4.4.3 Карточка метрики (MetricCard)

**Расположение:** `src/components/MetricCard.tsx`

**Функционал:**
- Отображение метрики с:
  - Иконкой
  - Заголовком
  - Значением
  - Изменением (опционально, с индикатором роста/падения)
- Поддержка различных цветовых схем

#### 2.4.4.4 Колокольчик уведомлений (NotificationBell)

**Расположение:** `src/components/NotificationBell.tsx`

**Функционал:**
- Иконка колокольчика с счётчиком непрочитанных уведомлений
- Выпадающий список уведомлений:
  - Тип уведомления (информация, предупреждение, ошибка, успех)
  - Заголовок и текст
  - Дата создания
  - Ссылка на связанный ресурс (опционально)
  - Отметка о прочтении
- Автоматическое обновление списка уведомлений

#### 2.4.4.5 Пагинация (Pagination)

**Расположение:** `src/components/Pagination.tsx`

**Функционал:**
- Навигация по страницам:
  - Кнопки "Предыдущая" и "Следующая"
  - Номера страниц
  - Переход на конкретную страницу
- Отображение информации о текущей странице и общем количестве записей
- Адаптивный дизайн

#### 2.4.4.6 Компоненты графиков

**Расположение:** `src/components/charts/`

**Типы графиков:**
- `BarChart.tsx` - столбчатая диаграмма
- `DonutChart.tsx` - круговая диаграмма (donut chart)
- `LineChart.tsx` - линейный график
- `PieChart.tsx` - круговая диаграмма
- `StackedBarChart.tsx` - столбчатая диаграмма с группировкой
- `WaterfallChart.tsx` - каскадная диаграмма

**Особенности:**
- Использование SVG для отрисовки графиков
- Адаптивный дизайн
- Поддержка тёмной и светлой темы
- Интерактивность (подсветка при наведении, легенды)

#### 2.4.4.7 Модальные окна

**Модальные окна для заказов:**
- `CreateOrderModal.tsx` - создание нового заказа
- `EditOrderModal.tsx` - редактирование заказа

**Модальные окна для техников:**
- `CreateTechnicianModal.tsx` - создание нового техника
- `EditTechnicianModal.tsx` - редактирование техника

**Общие особенности модальных окон:**
- Формы с валидацией полей
- Обработка ошибок
- Закрытие по клику вне окна или по клавише Escape
- Адаптивный дизайн

#### 2.4.4.8 Вложения к заказам (OrderAttachments)

**Расположение:** `src/components/OrderAttachments.tsx`

**Функционал:**
- Отображение списка файлов, прикреплённых к заказу
- Загрузка новых файлов
- Просмотр файлов (открытие в новой вкладке)
- Удаление файлов (только для администраторов)
- Отображение метаданных файлов (имя, размер, дата загрузки)

### 2.4.5 Управление состоянием

#### 2.4.5.1 Контекст аутентификации (AuthContext)

**Расположение:** `src/contexts/AuthContext.tsx`

**Функционал:**
- Хранение информации о текущем пользователе
- Управление JWT-токеном (сохранение в localStorage)
- Проверка прав доступа (администратор/пользователь)
- Методы входа и выхода
- Автоматическая проверка валидности токена

#### 2.4.5.2 Контекст темы (ThemeContext)

**Расположение:** `src/contexts/ThemeContext.tsx`

**Функционал:**
- Управление темой интерфейса (светлая/тёмная)
- Сохранение выбранной темы в localStorage
- Автоматическое применение темы ко всем компонентам
- Переключатель темы в шапке приложения

### 2.4.6 API клиент

**Расположение:** `src/lib/api.ts`

**Функционал:**
- Централизованный клиент для взаимодействия с backend API
- Методы для всех операций:
  - Аутентификация (вход, выход, смена пароля)
  - CRUD операции для заказов
  - CRUD операции для техников
  - Получение метрик KPI
  - Работа с историей изменений
  - Работа с уведомлениями
  - Резервное копирование
  - Загрузка файлов
- Автоматическое добавление JWT-токена к запросам
- Обработка ошибок (401 - перенаправление на страницу входа)

### 2.4.7 Утилиты

#### 2.4.7.1 Экспорт данных

**Расположение:** `src/utils/export.ts`

**Функционал:**
- Экспорт данных в различные форматы:
  - CSV (Comma-Separated Values)
  - Excel (XLSX)
  - PDF (Portable Document Format)
  - 1С (специальный формат для интеграции с 1С)
- Форматирование данных для экспорта
- Автоматическое скачивание файлов

### 2.4.8 Адаптивный дизайн

Пользовательский интерфейс полностью адаптирован для различных размеров экранов:

- **Десктоп** (≥1024px): Полная версия с боковой панелью и всеми функциями
- **Планшет** (768px - 1023px): Адаптированная версия с оптимизированным расположением элементов
- **Мобильный** (<768px): Компактная версия с выпадающим меню навигации

Использование Tailwind CSS обеспечивает:
- Responsive breakpoints для различных размеров экранов
- Гибкую сетку для расположения элементов
- Адаптивные размеры шрифтов и отступов

### 2.4.9 Темная и светлая тема

Реализована поддержка двух тем интерфейса:

- **Светлая тема**: Классический светлый интерфейс с тёмным текстом на светлом фоне
- **Тёмная тема**: Современный тёмный интерфейс со светлым текстом на тёмном фоне

**Особенности:**
- Переключение темы в реальном времени без перезагрузки страницы
- Сохранение выбранной темы в localStorage
- Автоматическое применение темы ко всем компонентам
- Поддержка системной темы (опционально)

### 2.4.10 Обработка ошибок и валидация

**Валидация форм:**
- Проверка обязательных полей
- Проверка формата email
- Проверка формата телефона
- Проверка минимальной длины пароля
- Проверка совпадения паролей при смене

**Обработка ошибок:**
- Отображение сообщений об ошибках в формах
- Обработка сетевых ошибок (ERR_CONNECTION_REFUSED, таймауты)
- Обработка ошибок сервера (400, 401, 403, 404, 500)
- Автоматическое перенаправление на страницу входа при истечении сессии

### 2.4.11 Производительность

**Оптимизации:**
- Использование React.memo для предотвращения ненужных перерисовок
- Lazy loading для компонентов (опционально)
- Мемоизация вычислений с помощью useMemo и useCallback
- Оптимизация запросов к API (кэширование, батчинг)
- Минификация и сжатие при сборке для продакшена

---

## 2.5 Подробная инструкция работы с программой

### 2.5.1 Первый запуск и вход в систему

#### 2.5.1.1 Запуск приложения

1. **Запуск backend-сервера:**
   - Откройте окно PowerShell или командную строку
   - Перейдите в папку `server`: `cd server`
   - Запустите сервер: `node server.js` или `npm start`
   - Дождитесь сообщения "Server running on http://localhost:3001"

2. **Запуск frontend-приложения:**
   - Откройте новое окно PowerShell или командную строку
   - Перейдите в корневую папку проекта
   - Запустите Vite: `npm run dev` или `npx vite`
   - Дождитесь сообщения "Local: http://localhost:5173"

3. **Открытие приложения в браузере:**
   - Откройте браузер (Chrome, Firefox, Edge и т.д.)
   - Перейдите по адресу: `http://localhost:5173`
   - Откроется страница входа в систему

#### 2.5.1.2 Вход в систему

1. **Тестовые учётные данные:**
   - Email: `admin@service.ru`
   - Пароль: `admin123`

2. **Процесс входа:**
   - Введите email в поле "Email"
   - Введите пароль в поле "Пароль"
   - Нажмите кнопку "Войти"
   - При успешном входе вы будете перенаправлены на главную страницу (Дашборд)

3. **Обработка ошибок:**
   - При неверном email или пароле отобразится сообщение об ошибке
   - Проверьте правильность введённых данных и попробуйте снова

### 2.5.2 Главная страница (Дашборд)

#### 2.5.2.1 Обзор метрик

На главной странице отображаются ключевые метрики производительности (KPI):

- **Общее количество заказов** - общее число заказов за выбранный период
- **Завершённые заказы** - количество завершённых заказов
- **Выручка** - общая выручка за период
- **Среднее время выполнения** - среднее время выполнения заказа в часах

#### 2.5.2.2 Графики и диаграммы

1. **Распределение заказов по статусам** (круговая диаграмма):
   - Показывает процентное соотношение заказов по статусам (ожидает, в работе, завершён, отменён)
   - При наведении на сегмент отображается количество и процент

2. **Динамика заказов** (линейный график):
   - Показывает изменение количества заказов по дням за выбранный период
   - Позволяет отследить тренды и пики нагрузки

3. **Распределение заказов по приоритетам** (круговая диаграмма):
   - Показывает процентное соотношение заказов по приоритетам (низкий, нормальный, высокий, срочный)

4. **Заказы по техникам** (столбчатая диаграмма):
   - Показывает количество заказов, назначенных каждому технику
   - Позволяет оценить загрузку техников

5. **Выручка по типам устройств** (столбчатая диаграмма с группировкой):
   - Показывает выручку по каждому типу устройства (компьютер, ноутбук, бытовая техника, телефон, другое)
   - Позволяет определить наиболее прибыльные типы устройств

#### 2.5.2.3 Фильтрация по периодам

В верхней части страницы расположены кнопки для выбора периода:

- **7 дней** - данные за последние 7 дней
- **30 дней** - данные за последний месяц
- **90 дней** - данные за последние 3 месяца
- **365 дней** - данные за последний год

При выборе периода все метрики и графики автоматически обновляются.

### 2.5.3 Работа с заказами

#### 2.5.3.1 Просмотр списка заказов

1. **Переход на страницу заказов:**
   - В боковом меню нажмите на пункт "Заказы"
   - Откроется страница со списком всех заказов

2. **Структура таблицы заказов:**
   - Номер заказа - уникальный номер заказа
   - Клиент - имя и телефон клиента
   - Устройство - тип, марка и модель устройства
   - Описание проблемы - краткое описание неисправности
   - Статус - текущий статус заказа (цветовая индикация)
   - Приоритет - приоритет заказа (цветовая индикация)
   - Техник - имя назначенного техника (или "Не назначен")
   - Даты - дата приёма и дата завершения (если завершён)
   - Стоимость - предварительная и итоговая стоимость

3. **Сортировка:**
   - Нажмите на заголовок колонки для сортировки по этому полю
   - Повторное нажатие изменит направление сортировки (по возрастанию/убыванию)

#### 2.5.3.2 Поиск и фильтрация заказов

1. **Поиск:**
   - Введите текст в поле поиска в верхней части страницы
   - Поиск выполняется по номеру заказа, имени клиента и телефону
   - Результаты обновляются автоматически при вводе

2. **Фильтрация по статусу:**
   - Выберите статус из выпадающего списка "Статус"
   - Доступные варианты: "Все", "Ожидает", "В работе", "Завершён", "Отменён"
   - Таблица автоматически обновится

3. **Фильтрация по дате:**
   - Выберите период из выпадающего списка "Дата"
   - Доступные варианты: "Все", "Сегодня", "Неделя", "Месяц", "Произвольный период"
   - При выборе "Произвольный период" появятся поля для ввода начальной и конечной даты

#### 2.5.3.3 Создание нового заказа

1. **Открытие формы создания:**
   - Нажмите кнопку "Создать заказ" в верхней части страницы
   - Откроется модальное окно с формой

2. **Заполнение формы:**
   - **Клиент:**
     - Имя клиента (обязательное поле)
     - Телефон клиента (обязательное поле)
   - **Устройство:**
     - Тип устройства (обязательное поле): компьютер, ноутбук, бытовая техника, телефон, другое
     - Марка устройства (опционально)
     - Модель устройства (опционально)
   - **Проблема:**
     - Описание проблемы (обязательное поле)
   - **Настройки:**
     - Статус (по умолчанию: "Ожидает")
     - Приоритет (по умолчанию: "Нормальный")
     - Назначенный техник (опционально, можно оставить "Не назначен")
   - **Стоимость:**
     - Предварительная стоимость (опционально)

3. **Сохранение заказа:**
   - Нажмите кнопку "Создать заказ"
   - При успешном создании модальное окно закроется, и новый заказ появится в таблице
   - При ошибке отобразится сообщение об ошибке

#### 2.5.3.4 Редактирование заказа

1. **Открытие формы редактирования:**
   - Найдите нужный заказ в таблице
   - Нажмите кнопку "Редактировать" (иконка карандаша) в строке заказа
   - Откроется модальное окно с формой, заполненной текущими данными заказа

2. **Изменение данных:**
   - Измените нужные поля (все поля можно редактировать, кроме номера заказа)
   - Можно изменить статус, приоритет, назначить или переназначить техника
   - Можно обновить описание проблемы
   - Можно изменить стоимость (предварительную и итоговую)

3. **Сохранение изменений:**
   - Нажмите кнопку "Сохранить изменения"
   - При успешном сохранении модальное окно закроется, и изменения отобразятся в таблице
   - Все изменения автоматически записываются в историю изменений

#### 2.5.3.5 Удаление заказа

**Внимание:** Удаление заказа доступно только администраторам!

1. **Удаление заказа:**
   - Найдите нужный заказ в таблице
   - Нажмите кнопку "Удалить" (иконка корзины) в строке заказа
   - Подтвердите удаление в диалоговом окне
   - Заказ будет удалён из базы данных (вместе со всеми связанными файлами)

#### 2.5.3.6 Работа с файлами заказа

1. **Просмотр вложений:**
   - Откройте заказ для редактирования
   - В нижней части формы отображается раздел "Вложения"
   - Список всех прикреплённых файлов с информацией (имя, размер, дата загрузки)

2. **Загрузка файлов:**
   - В разделе "Вложения" нажмите кнопку "Выбрать файлы"
   - Выберите файлы на вашем компьютере (можно выбрать несколько файлов)
   - Файлы автоматически загрузятся на сервер
   - Загруженные файлы отобразятся в списке

3. **Просмотр файлов:**
   - Нажмите на имя файла в списке вложений
   - Файл откроется в новой вкладке браузера

4. **Удаление файлов:**
   - **Внимание:** Удаление файлов доступно только администраторам!
   - Нажмите кнопку "Удалить" рядом с файлом
   - Подтвердите удаление
   - Файл будет удалён с сервера

#### 2.5.3.7 Экспорт данных

1. **Экспорт в CSV:**
   - Нажмите кнопку "Экспорт" в верхней части страницы
   - Выберите "Экспорт в CSV"
   - Файл автоматически скачается на ваш компьютер

2. **Экспорт в Excel:**
   - Нажмите кнопку "Экспорт"
   - Выберите "Экспорт в Excel"
   - Файл автоматически скачается в формате XLSX

3. **Экспорт в PDF:**
   - Нажмите кнопку "Экспорт"
   - Выберите "Экспорт в PDF"
   - Файл автоматически скачается в формате PDF

4. **Экспорт в 1С:**
   - Нажмите кнопку "Экспорт 1С" в верхней части страницы
   - Файл автоматически скачается в специальном формате для импорта в 1С

**Примечание:** Экспортируются только заказы, отображаемые в текущей таблице (с учётом фильтров и поиска).

#### 2.5.3.8 Пагинация

1. **Настройка количества записей на странице:**
   - В нижней части таблицы выберите количество записей из выпадающего списка
   - Доступные варианты: 10, 25, 50, 100
   - Таблица автоматически обновится

2. **Навигация по страницам:**
   - Используйте кнопки "Предыдущая" и "Следующая" для перехода между страницами
   - Нажмите на номер страницы для перехода на конкретную страницу
   - В центре отображается информация о текущей странице и общем количестве записей

### 2.5.4 Работа с техниками

#### 2.5.4.1 Просмотр списка техников

1. **Переход на страницу техников:**
   - В боковом меню нажмите на пункт "Техники"
   - Откроется страница со списком всех техников

2. **Структура таблицы техников:**
   - ФИО - полное имя техника
   - Специализация - специализация техника (компьютеры, бытовая техника, мобильные устройства, универсал)
   - Дата приёма - дата приёма на работу
   - Статус - активен или неактивен
   - Заказы - количество назначенных заказов
   - Статистика - процент завершённых заказов

#### 2.5.4.2 Поиск и фильтрация техников

1. **Поиск:**
   - Введите имя техника в поле поиска
   - Результаты обновляются автоматически

2. **Фильтрация:**
   - По специализации: выберите специализацию из выпадающего списка
   - По статусу: выберите "Все", "Активные" или "Неактивные"

#### 2.5.4.3 Создание нового техника

1. **Открытие формы создания:**
   - Нажмите кнопку "Добавить техника" в верхней части страницы
   - Откроется модальное окно с формой

2. **Заполнение формы:**
   - ФИО (обязательное поле)
   - Специализация (обязательное поле): компьютер, бытовая техника, мобильные устройства, универсал
   - Дата приёма (по умолчанию: сегодняшняя дата)
   - Статус (по умолчанию: "Активен")

3. **Сохранение:**
   - Нажмите кнопку "Создать техника"
   - При успешном создании модальное окно закроется, и новый техник появится в таблице

#### 2.5.4.4 Редактирование техника

1. **Открытие формы редактирования:**
   - Найдите нужного техника в таблице
   - Нажмите кнопку "Редактировать" в строке техника
   - Откроется модальное окно с формой, заполненной текущими данными

2. **Изменение данных:**
   - Можно изменить ФИО, специализацию, дату приёма и статус

3. **Сохранение изменений:**
   - Нажмите кнопку "Сохранить изменения"
   - Изменения отобразятся в таблице

#### 2.5.4.5 Деактивация техника

1. **Деактивация:**
   - Откройте форму редактирования техника
   - Измените статус на "Неактивен"
   - Сохраните изменения
   - Техник больше не будет отображаться в списке активных техников и не сможет быть назначен на новые заказы

**Примечание:** Деактивация не удаляет техника из базы данных, что позволяет сохранить историю его работы.

### 2.5.5 История изменений

#### 2.5.5.1 Просмотр истории изменений

1. **Переход на страницу истории:**
   - В боковом меню нажмите на пункт "История изменений"
   - Откроется страница со всеми изменениями в системе

2. **Структура таблицы:**
   - Дата и время - когда было внесено изменение
   - Тип - тип сущности (заказ, техник, профиль)
   - Действие - тип действия (создание, обновление, удаление)
   - Кто изменил - имя пользователя, который внёс изменение
   - Изменения - детальное описание изменений в читаемом формате

#### 2.5.5.2 Фильтрация истории

1. **Фильтрация по типу сущности:**
   - Выберите тип из выпадающего списка: "Все", "Заказ", "Техник", "Профиль"

2. **Фильтрация по действию:**
   - Выберите действие: "Все", "Создание", "Обновление", "Удаление"

3. **Фильтрация по пользователю:**
   - Выберите пользователя из списка всех пользователей системы

4. **Фильтрация по дате:**
   - Выберите период: "Все", "Сегодня", "Неделя", "Месяц", "Произвольный период"

#### 2.5.5.3 Формат отображения изменений

Изменения отображаются в понятном формате:

- **Для заказов:**
  - "Статус: Ожидает → В работе"
  - "Приоритет: Нормальный → Высокий"
  - "Был техник Иван Иванов → стал Пётр Петров"
  - "Описание проблемы: [старое описание] → [новое описание]"

- **Для техников:**
  - "ФИО: Иван Иванов → Пётр Петров"
  - "Специализация: Компьютеры → Универсал"
  - "Статус: Активен → Неактивен"

- **Для профилей:**
  - "Имя: Иван Иванов → Пётр Петров"
  - "Email: ivan@example.com → petr@example.com"
  - "Смена пароля" (без отображения значений пароля)

### 2.5.6 Профиль пользователя

#### 2.5.6.1 Просмотр профиля

1. **Переход на страницу профиля:**
   - В боковом меню нажмите на пункт "Профиль"
   - Откроется страница с информацией о вашем профиле

2. **Отображаемая информация:**
   - Email (нельзя изменить)
   - Полное имя
   - Роль (администратор или пользователь)

#### 2.5.6.2 Редактирование профиля

1. **Изменение имени:**
   - Введите новое полное имя в поле "Полное имя"
   - Нажмите кнопку "Сохранить изменения"
   - Изменения сохранятся и отобразятся на странице

2. **Изменение email:**
   - Введите новый email в поле "Email"
   - Нажмите кнопку "Сохранить изменения"
   - **Внимание:** Email должен быть уникальным в системе

#### 2.5.6.3 Смена пароля

1. **Открытие формы смены пароля:**
   - На странице профиля найдите раздел "Смена пароля"

2. **Заполнение формы:**
   - Введите текущий пароль в поле "Текущий пароль"
   - Введите новый пароль в поле "Новый пароль"
   - Подтвердите новый пароль в поле "Подтверждение пароля"

3. **Требования к паролю:**
   - Минимальная длина: 6 символов
   - Новый пароль и подтверждение должны совпадать

4. **Сохранение:**
   - Нажмите кнопку "Изменить пароль"
   - При успешной смене пароля отобразится сообщение об успехе
   - При ошибке (неверный текущий пароль) отобразится сообщение об ошибке

### 2.5.7 Резервное копирование (только для администраторов)

#### 2.5.7.1 Создание резервной копии

1. **Переход на страницу резервного копирования:**
   - В боковом меню нажмите на пункт "Резервное копирование"
   - **Внимание:** Этот пункт доступен только администраторам!

2. **Создание резервной копии:**
   - Нажмите кнопку "Создать резервную копию"
   - Система соберёт все данные из базы данных:
     - Заказы
     - Техники
     - Пользователи
     - История изменений
     - Уведомления
   - JSON-файл с резервной копией автоматически скачается на ваш компьютер
   - Имя файла содержит дату и время создания: `backup_YYYY-MM-DD_HH-MM-SS.json`

3. **Метаданные резервной копии:**
   - После создания резервной копии на странице отобразятся метаданные:
     - Версия системы
     - Дата и время создания
     - Количество записей каждого типа

#### 2.5.7.2 Восстановление из резервной копии

1. **Загрузка файла резервной копии:**
   - На странице резервного копирования найдите раздел "Восстановление из резервной копии"
   - Нажмите кнопку "Выбрать файл"
   - Выберите JSON-файл с резервной копией на вашем компьютере

2. **Подтверждение восстановления:**
   - **ВНИМАНИЕ:** Восстановление из резервной копии удалит все текущие данные в базе данных!
   - После выбора файла появится предупреждение
   - Введите "ПОДТВЕРДИТЬ" в поле подтверждения
   - Нажмите кнопку "Восстановить из резервной копии"

3. **Процесс восстановления:**
   - Система проверит формат файла
   - Удалит все существующие данные
   - Загрузит данные из резервной копии
   - При успешном восстановлении отобразится сообщение об успехе
   - При ошибке отобразится сообщение об ошибке с описанием проблемы

**Важные замечания:**
- Резервное копирование рекомендуется выполнять регулярно (например, ежедневно)
- Храните резервные копии в безопасном месте
- Перед восстановлением убедитесь, что файл резервной копии не повреждён
- Восстановление может занять некоторое время в зависимости от объёма данных

### 2.5.8 Справочный раздел

#### 2.5.8.1 Руководство по использованию

1. **Переход в справочный раздел:**
   - В боковом меню нажмите на пункт "Справочный раздел"
   - Откроется страница с руководством

2. **Содержание руководства:**
   - Описание раздела "Дашборд" - как работать с главной страницей и метриками
   - Описание раздела "Заказы" - как создавать, редактировать и управлять заказами
   - Описание раздела "Техники" - как управлять техниками
   - Описание раздела "История изменений" - как просматривать историю
   - Описание раздела "Профиль" - как редактировать профиль и менять пароль
   - Описание раздела "Резервное копирование" - как создавать и восстанавливать резервные копии

3. **Поиск по руководству:**
   - Введите текст в поле поиска в верхней части страницы
   - Результаты будут отфильтрованы по введённому тексту

#### 2.5.8.2 FAQ (Часто задаваемые вопросы)

1. **Просмотр FAQ:**
   - На странице справочного раздела найдите раздел "Часто задаваемые вопросы"
   - Вопросы отображаются в раскрывающемся формате

2. **Работа с FAQ:**
   - Нажмите на вопрос, чтобы раскрыть ответ
   - Повторное нажатие свернёт ответ
   - Можно раскрыть несколько вопросов одновременно

3. **Поиск по FAQ:**
   - Используйте поле поиска для фильтрации вопросов
   - Поиск выполняется по тексту вопроса и ответа

#### 2.5.8.3 Контактная информация

На странице справочного раздела внизу отображается контактная информация разработчика:
- Email: mr.ropap@yandex.ru
- Телефон: +7 (900) 201-54-65

### 2.5.9 Уведомления

#### 2.5.9.1 Просмотр уведомлений

1. **Открытие списка уведомлений:**
   - В шапке приложения найдите иконку колокольчика
   - Рядом с иконкой отображается счётчик непрочитанных уведомлений (красный кружок с числом)
   - Нажмите на иконку, чтобы открыть список уведомлений

2. **Типы уведомлений:**
   - **Информация** (синий) - информационные сообщения
   - **Предупреждение** (жёлтый) - предупреждения
   - **Ошибка** (красный) - сообщения об ошибках
   - **Успех** (зелёный) - сообщения об успешных операциях

3. **Содержание уведомления:**
   - Заголовок
   - Текст сообщения
   - Дата и время создания
   - Ссылка на связанный ресурс (опционально)

#### 2.5.9.2 Отметка о прочтении

- При открытии списка уведомлений непрочитанные уведомления автоматически отмечаются как прочитанные
- Счётчик непрочитанных уведомлений обновляется автоматически

### 2.5.10 Переключение темы

1. **Переключение темы:**
   - В шапке приложения найдите переключатель темы (иконка солнца/луны)
   - Нажмите на переключатель
   - Тема интерфейса изменится на противоположную (светлая ↔ тёмная)
   - Выбранная тема сохраняется и применяется при следующем входе в систему

2. **Поддержка тем:**
   - **Светлая тема:** Классический светлый интерфейс
   - **Тёмная тема:** Современный тёмный интерфейс

### 2.5.11 Выход из системы

1. **Выход:**
   - В шапке приложения нажмите на имя пользователя или аватар
   - В выпадающем меню нажмите "Выйти"
   - Вы будете перенаправлены на страницу входа
   - Ваша сессия будет завершена, и для повторного входа потребуется ввести пароль

### 2.5.12 Решение типичных проблем

#### 2.5.12.1 Ошибка "Не удается получить доступ к сайту"

**Причина:** Backend или frontend сервер не запущен.

**Решение:**
1. Проверьте, что backend-сервер запущен (окно PowerShell с сообщением "Server running on http://localhost:3001")
2. Проверьте, что frontend-сервер запущен (окно PowerShell с сообщением "Local: http://localhost:5173")
3. Если серверы не запущены, запустите их согласно инструкции в разделе 2.5.1.1

#### 2.5.12.2 Ошибка "401 Unauthorized" или автоматический выход из системы

**Причина:** Истёк срок действия JWT-токена или токен недействителен.

**Решение:**
1. Войдите в систему заново, введя email и пароль
2. Если проблема повторяется, проверьте настройки JWT_SECRET в файле `.env` на сервере

#### 2.5.12.3 Ошибка при создании или редактировании заказа

**Причина:** Не заполнены обязательные поля или неверный формат данных.

**Решение:**
1. Проверьте, что все обязательные поля заполнены (отмечены звёздочкой *)
2. Проверьте формат введённых данных (например, телефон должен содержать только цифры)
3. Проверьте сообщение об ошибке в форме - оно укажет на конкретную проблему

#### 2.5.12.4 Данные не обновляются на странице

**Причина:** Проблема с подключением к backend или кэширование браузера.

**Решение:**
1. Обновите страницу (F5 или Ctrl+R)
2. Проверьте консоль браузера (F12) на наличие ошибок
3. Проверьте, что backend-сервер работает (откройте http://localhost:3001/health в браузере)

#### 2.5.12.5 Ошибка при загрузке файлов

**Причина:** Файл слишком большой или неверный формат.

**Решение:**
1. Проверьте размер файла (рекомендуемый максимум: 10 МБ)
2. Проверьте формат файла (поддерживаются изображения, документы, архивы)
3. Попробуйте загрузить файл снова

---

**Конец инструкции**


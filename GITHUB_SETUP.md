# Инструкция по публикации на GitHub

## Быстрый старт

### 1. Инициализация Git (если еще не сделано)

```bash
# В корневой папке проекта
git init
```

### 2. Добавление всех файлов

```bash
git add .
git commit -m "Initial commit: KPI Dashboard for Service Business"
```

### 3. Создание репозитория на GitHub

1. Перейдите на https://github.com и войдите в аккаунт
2. Нажмите кнопку **"+"** в правом верхнем углу → **"New repository"**
3. Заполните форму:
   - **Repository name**: `service-kpi-dashboard` (или другое имя)
   - **Description**: "Веб-дашборд для управления KPI сервисного центра 'Сервис всем'"
   - Выберите **Public** или **Private**
   - **НЕ** ставьте галочки на "Add a README file", "Add .gitignore", "Choose a license" (они уже есть)
4. Нажмите **"Create repository"**

### 4. Подключение локального репозитория к GitHub

```bash
# Замените YOUR_USERNAME и YOUR_REPO_NAME на ваши данные
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Что будет в репозитории

### ✅ Включено:
- Все исходные файлы (`.ts`, `.tsx`, `.js`, `.sql`)
- Конфигурационные файлы (`package.json`, `vite.config.ts`, `tsconfig.json`)
- Документация (`README.md`, `DEPLOY.md`, `QUICKSTART.md`)
- Примеры конфигурации (`.env.example`)
- Миграции базы данных
- `.gitignore` файл

### ❌ НЕ включено (благодаря .gitignore):
- `node_modules/` (зависимости)
- `.env` файлы (секретные данные)
- `dist/` и `build/` (собранные файлы)
- Логи и временные файлы

## После публикации

### Обновление README

После создания репозитория обновите README.md, заменив:
```markdown
git clone <ваш-repo-url>
```

На:
```markdown
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Дополнительные настройки (опционально)

1. **Topics (теги)**: Добавьте теги к репозиторию:
   - `react`
   - `typescript`
   - `nodejs`
   - `postgresql`
   - `kpi-dashboard`
   - `dashboard`

2. **Описание**: Обновите описание репозитория

3. **Website**: Если есть деплой, добавьте ссылку

## Команды для работы с Git

### Первая публикация
```bash
git init
git add .
git commit -m "Initial commit: KPI Dashboard"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Обновление репозитория
```bash
git add .
git commit -m "Описание изменений"
git push
```

### Просмотр статуса
```bash
git status
```

## Важные замечания

⚠️ **НЕ коммитьте файлы с секретами:**
- `server/.env` - содержит пароли к БД и JWT секреты
- `.env` - содержит URL API

✅ **Эти файлы уже в .gitignore:**
- Все `.env` файлы
- `node_modules/`
- Собранные файлы

## Проверка перед публикацией

Перед первым push убедитесь:

```bash
# Проверьте, что секреты не попадут в репозиторий
git status

# Убедитесь, что .env файлы не добавлены
git check-ignore server/.env .env
# Должно вернуть пути к файлам (значит они игнорируются)
```

## Структура для GitHub

```
service-kpi-dashboard/
├── .gitignore          ✅
├── .env.example        ✅
├── README.md           ✅
├── DEPLOY.md           ✅
├── GITHUB_SETUP.md     ✅
├── QUICKSTART.md       ✅
├── package.json        ✅
├── vite.config.ts      ✅
├── server/
│   ├── .env.example    ✅
│   ├── package.json    ✅
│   ├── server.js       ✅
│   └── ...
└── src/
    └── ...
```

---

**Готово!** После выполнения этих шагов ваш проект будет на GitHub.


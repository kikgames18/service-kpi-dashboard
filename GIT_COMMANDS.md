# Команды для загрузки проекта на GitHub

## Ваша информация:
- **GitHub username**: kikgames18
- **Существующий репозиторий**: https://github.com/kikgames18/service-kpi-dashboard
- **Новый репозиторий (опционально)**: WEB_DASHBOARD_KPI

## Шаг 1: Настройка Git (выполнить один раз)

Откройте **новое** окно PowerShell и выполните:

```powershell
# Настройка имени пользователя
git config --global user.name "kikgames18"

# Настройка email (используйте ваш email от GitHub)
git config --global user.email "ваш-email@example.com"
```

## Шаг 2: Выбор варианта

### Вариант A: Обновить существующий репозиторий service-kpi-dashboard (РЕКОМЕНДУЕТСЯ)

Если вы хотите обновить существующий репозиторий, перейдите к **Шагу 3**.

### Вариант B: Создать новый репозиторий WEB_DASHBOARD_KPI

1. Перейдите на https://github.com
2. Войдите в аккаунт **kikgames18**
3. Нажмите **"+"** → **"New repository"**
4. Заполните:
   - **Repository name**: `WEB_DASHBOARD_KPI`
   - **Description**: `Веб-дашборд KPI для "Сервис всем" - система управления заказами и сотрудниками`
   - **Visibility**: Public или Private (на ваше усмотрение)
   - **НЕ** ставьте галочки на "Add a README file", "Add .gitignore", "Choose a license"
5. Нажмите **"Create repository"**

## Шаг 3: Инициализация Git в проекте

Откройте PowerShell в папке проекта и выполните:

```powershell
# Перейдите в папку проекта
cd "C:\Users\German\Downloads\project-bolt-sb1-qsjjhlj4 (1)\project"

# Инициализация Git репозитория
git init

# Добавление всех файлов
git add .

# Создание первого коммита
git commit -m "Initial commit: Веб-дашборд KPI для Сервис всем"
```

## Шаг 4: Подключение к GitHub и отправка

### Если обновляете существующий репозиторий service-kpi-dashboard:

```powershell
# Добавление удаленного репозитория (если еще не добавлен)
git remote add origin https://github.com/kikgames18/service-kpi-dashboard.git

# Или обновление URL (если уже добавлен)
git remote set-url origin https://github.com/kikgames18/service-kpi-dashboard.git

# Переименование основной ветки в main
git branch -M main

# Отправка кода на GitHub (обновление существующего репозитория)
git push -u origin main --force
```

⚠️ **Внимание**: `--force` перезапишет старую версию. Если хотите сохранить историю коммитов, используйте обычный `git push` (но может потребоваться сначала сделать `git pull`).

### Если создаете новый репозиторий WEB_DASHBOARD_KPI:

```powershell
# Добавление удаленного репозитория
git remote add origin https://github.com/kikgames18/WEB_DASHBOARD_KPI.git

# Переименование основной ветки в main
git branch -M main

# Отправка кода на GitHub
git push -u origin main
```

## Если Git запросит авторизацию:

GitHub больше не принимает пароли. Используйте **Personal Access Token**:

1. Перейдите: https://github.com/settings/tokens
2. Нажмите **"Generate new token"** → **"Generate new token (classic)"**
3. Заполните:
   - **Note**: `WEB_DASHBOARD_KPI access`
   - **Expiration**: Выберите срок действия (например, 90 дней)
   - **Select scopes**: Отметьте **`repo`** (полный доступ к репозиториям)
4. Нажмите **"Generate token"**
5. **Скопируйте токен** (он показывается только один раз!)
6. При запросе пароля в PowerShell вставьте этот токен

## Проверка

После выполнения команд:
1. Обновите страницу репозитория на GitHub:
   - Если обновляли существующий: https://github.com/kikgames18/service-kpi-dashboard
   - Если создали новый: https://github.com/kikgames18/WEB_DASHBOARD_KPI
2. Убедитесь, что все файлы загружены
3. Проверьте, что README.md отображается корректно
4. Убедитесь, что все новые функции описаны в документации

## Дальнейшая работа

### Добавление изменений:

```powershell
git add .
git commit -m "Описание изменений"
git push
```

### Получение изменений:

```powershell
git pull
```

### Просмотр статуса:

```powershell
git status
```

## Возможные проблемы

### Ошибка "remote origin already exists"

```powershell
# Удаление старого remote
git remote remove origin

# Добавление нового (для существующего репозитория)
git remote add origin https://github.com/kikgames18/service-kpi-dashboard.git

# Или для нового репозитория
git remote add origin https://github.com/kikgames18/WEB_DASHBOARD_KPI.git
```

### Ошибка "failed to push some refs"

```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Git не найден в PowerShell

1. Перезапустите PowerShell (закройте и откройте заново)
2. Или добавьте Git в PATH вручную:
   - Обычно Git устанавливается в: `C:\Program Files\Git\cmd`
   - Добавьте этот путь в переменную окружения PATH

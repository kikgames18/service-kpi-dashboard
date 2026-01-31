# Обновление существующего репозитория service-kpi-dashboard

## Ваша ситуация:
✅ У вас уже есть репозиторий: https://github.com/kikgames18/service-kpi-dashboard  
✅ Там старая версия проекта  
✅ Нужно обновить его новой версией с всеми функциями

## Команды для обновления (выполните в PowerShell):

```powershell
# 1. Перейдите в папку проекта
cd "C:\Users\German\Downloads\project-bolt-sb1-qsjjhlj4 (1)\project"

# 2. Настройка Git (если еще не настроено)
git config --global user.name "kikgames18"
git config --global user.email "ваш-email@example.com"

# 3. Инициализация Git (если еще не инициализирован)
git init

# 4. Добавление всех файлов
git add .

# 5. Создание коммита с новой версией
git commit -m "Update: Полная версия веб-дашборда KPI

- Добавлено резервное копирование
- Добавлен экспорт в 1С
- Добавлена история изменений (audit log)
- Добавлена система уведомлений
- Добавлена загрузка файлов к заказам
- Добавлена страница профиля с изменением пароля
- Добавлен справочный раздел с FAQ
- Улучшен дизайн и адаптивность
- Добавлена темная тема
- Полная документация в README.md"

# 6. Подключение к существующему репозиторию
git remote add origin https://github.com/kikgames18/service-kpi-dashboard.git

# Если получите ошибку "remote origin already exists", выполните:
# git remote remove origin
# git remote add origin https://github.com/kikgames18/service-kpi-dashboard.git

# 7. Переименование ветки в main
git branch -M main

# 8. Отправка на GitHub (обновление репозитория)
git push -u origin main --force
```

⚠️ **Важно**: 
- `--force` перезапишет старую версию новой
- Если хотите сохранить историю коммитов, сначала выполните `git pull origin main --allow-unrelated-histories`, затем `git push -u origin main` (без --force)

## Если Git запросит авторизацию:

GitHub требует **Personal Access Token** вместо пароля:

1. Перейдите: https://github.com/settings/tokens
2. Нажмите **"Generate new token"** → **"Generate new token (classic)"**
3. Заполните:
   - **Note**: `service-kpi-dashboard update`
   - **Expiration**: Выберите срок (например, 90 дней)
   - **Select scopes**: Отметьте **`repo`** (полный доступ к репозиториям)
4. Нажмите **"Generate token"**
5. **Скопируйте токен** (он показывается только один раз!)
6. При запросе пароля в PowerShell вставьте этот токен

## После обновления:

1. Обновите страницу: https://github.com/kikgames18/service-kpi-dashboard
2. Убедитесь, что все новые файлы загружены
3. Проверьте, что README.md обновлен с полной документацией
4. Убедитесь, что все функции описаны

## Что будет обновлено:

✅ Полная документация в README.md  
✅ Все новые функции (резервное копирование, экспорт в 1С, и т.д.)  
✅ Обновленные компоненты и страницы  
✅ Новая структура проекта  
✅ Файлы .env.example для примеров конфигурации








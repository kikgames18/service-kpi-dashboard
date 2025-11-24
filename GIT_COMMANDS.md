# Команды Git для публикации на GitHub

## ⚠️ ВАЖНО: Перезапустите PowerShell после установки Git!

После установки Git **обязательно закройте и заново откройте PowerShell**, чтобы Git стал доступен.

## Команды для выполнения

Откройте **новый** PowerShell и выполните команды по порядку:

### 1. Перейдите в папку проекта

```powershell
cd "c:\Users\German\Downloads\project-bolt-sb1-qsjjhlj4 (1)\project"
```

### 2. Инициализация Git

```powershell
git init
```

### 3. Добавление файлов

```powershell
git add .
```

### 4. Первый коммит

```powershell
git commit -m "Initial commit: KPI Dashboard for Service Business"
```

### 5. Подключение к GitHub

```powershell
git remote add origin https://github.com/kikgames18/service-kpi-dashboard.git
```

### 6. Переименование ветки

```powershell
git branch -M main
```

### 7. Отправка на GitHub

```powershell
git push -u origin main
```

## При выполнении `git push`

GitHub запросит авторизацию:

1. **Username**: введите `kikgames18`
2. **Password**: введите **Personal Access Token** (не пароль от GitHub!)

### Как получить Personal Access Token:

1. Перейдите: https://github.com/settings/tokens
2. Нажмите **"Generate new token"** → **"Generate new token (classic)"**
3. Заполните:
   - **Note**: `KPI Dashboard Project`
   - **Expiration**: выберите срок (например, 90 дней)
   - **Scopes**: отметьте `repo` (полный доступ к репозиториям)
4. Нажмите **"Generate token"**
5. **Скопируйте токен** (он показывается только один раз!)
6. Используйте этот токен как пароль при `git push`

## Все команды одной строкой (после перезапуска PowerShell)

```powershell
cd "c:\Users\German\Downloads\project-bolt-sb1-qsjjhlj4 (1)\project"
git init
git add .
git commit -m "Initial commit: KPI Dashboard for Service Business"
git remote add origin https://github.com/kikgames18/service-kpi-dashboard.git
git branch -M main
git push -u origin main
```

## Проверка установки Git

Перед выполнением команд проверьте:

```powershell
git --version
```

Должна отобразиться версия (например, `git version 2.43.0`)

Если команда не работает:
1. Убедитесь, что Git установлен
2. **Перезапустите PowerShell** (закройте и откройте заново)
3. Попробуйте снова

## После успешного push

Откройте в браузере:
```
https://github.com/kikgames18/service-kpi-dashboard
```

Вы должны увидеть все файлы проекта!


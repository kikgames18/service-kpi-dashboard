# Исправление проблем с Git

## Проблема: Git требует настройки имени и email

Выполните эти команды в PowerShell:

### 1. Настройка Git (замените на свои данные)

```powershell
git config --global user.name "kikgames18"
git config --global user.email "ваш-email@example.com"
```

**Важно:** Замените `ваш-email@example.com` на ваш реальный email (можно использовать email, привязанный к GitHub)

### 2. Создание коммита

```powershell
git commit -m "Initial commit: KPI Dashboard for Service Business"
```

### 3. Отправка на GitHub

```powershell
git push -u origin main
```

## Все команды по порядку:

```powershell
# Настройка Git (выполните один раз)
git config --global user.name "kikgames18"
git config --global user.email "ваш-email@example.com"

# Создание коммита
git commit -m "Initial commit: KPI Dashboard for Service Business"

# Отправка на GitHub
git push -u origin main
```

## Примечания:

- Предупреждения о LF/CRLF можно игнорировать - это нормально для Windows
- При `git push` GitHub запросит авторизацию (используйте Personal Access Token)


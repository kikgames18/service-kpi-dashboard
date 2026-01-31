# Исправление ошибки WSL/Docker Desktop

## Ошибка
```
Wsl/Service/RegisterDistro/CreateVm/MountDisk/HCS/ERROR_NOT_FOUND
```

## Решения (попробуйте по порядку)

### Решение 1: Перезапуск WSL и Docker Desktop

1. **Закройте Docker Desktop полностью** (через системный трей)

2. **Откройте PowerShell от имени администратора** и выполните:

```powershell
# Остановка всех WSL дистрибутивов
wsl --shutdown

# Перезапуск Docker Desktop (если нужно)
# Или просто закройте и откройте Docker Desktop снова
```

### Решение 2: Проверка и включение компонентов Windows

1. **Откройте PowerShell от имени администратора**

2. **Проверьте включенные компоненты:**
```powershell
Get-WindowsOptionalFeature -Online | Where-Object {$_.FeatureName -like "*WSL*" -or $_.FeatureName -like "*VirtualMachine*"}
```

3. **Включите необходимые компоненты:**
```powershell
# Включить WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Включить платформу виртуальных машин
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Перезагрузите компьютер после выполнения команд
```

### Решение 3: Обновление WSL

```powershell
# Откройте PowerShell от имени администратора
wsl --update
wsl --set-default-version 2
wsl --shutdown
```

### Решение 4: Удаление и переустановка Docker Desktop WSL дистрибутива

```powershell
# Откройте PowerShell от имени администратора

# Остановка WSL
wsl --shutdown

# Удаление дистрибутива docker-desktop (если существует)
wsl --unregister docker-desktop
wsl --unregister docker-desktop-data

# Перезапустите Docker Desktop - он создаст дистрибутивы заново
```

### Решение 5: Проверка файла виртуального диска

Если файл `ext4.vhdx` поврежден:

1. **Найдите файл:**
   - Путь: `%LOCALAPPDATA%\Docker\wsl\data\ext4.vhdx`
   - Или: `C:\Users\<ваше_имя>\AppData\Local\Docker\wsl\data\ext4.vhdx`

2. **Сделайте резервную копию** (переименуйте файл)

3. **Удалите поврежденный дистрибутив:**
```powershell
wsl --unregister docker-desktop-data
```

4. **Перезапустите Docker Desktop** - он создаст новый диск

### Решение 6: Полная переустановка Docker Desktop

1. **Удалите Docker Desktop** через "Параметры Windows" → "Приложения"

2. **Удалите остатки WSL:**
```powershell
wsl --unregister docker-desktop
wsl --unregister docker-desktop-data
```

3. **Удалите папки Docker:**
   - `%LOCALAPPDATA%\Docker`
   - `%APPDATA%\Docker`

4. **Переустановите Docker Desktop** с официального сайта:
   https://www.docker.com/products/docker-desktop

### Решение 7: Если Docker не нужен для этого проекта

**Этот проект НЕ требует Docker!** Он использует:
- Node.js напрямую
- PostgreSQL напрямую (через pgAdmin)

**Вы можете:**
1. Просто не запускать Docker Desktop
2. Отключить автозапуск Docker Desktop:
   - Откройте "Диспетчер задач" → "Автозагрузка"
   - Найдите Docker Desktop и отключите

## Быстрая проверка WSL

```powershell
# Проверка версии WSL
wsl --version

# Список установленных дистрибутивов
wsl --list --verbose

# Статус WSL
wsl --status
```

## Если ничего не помогло

1. **Проверьте логи Docker Desktop:**
   - Откройте Docker Desktop
   - Settings → Troubleshoot → View logs

2. **Проверьте логи WSL:**
   - Путь: `%USERPROFILE%\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu*\LocalState\`

3. **Обновите Windows** до последней версии

4. **Проверьте антивирус** - он может блокировать WSL

## Важно для этого проекта

**Вам НЕ нужен Docker для работы с этим проектом!**

Проект работает напрямую с:
- Node.js (установлен локально)
- PostgreSQL (установлен локально)

Просто запустите проект согласно README.md без Docker Desktop.




<<<<<<< HEAD
=======




>>>>>>> 135d295 (Финальная версия УП)

# Release

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.zh-CN.md">中文</a>
</p>

# 🐳 Развёртывание Vicariustab на Ubuntu Server

Данное руководство содержит исчерпывающие инструкции по установке полнофункциональной инфраструктуры системы **Vicariustab** с поддержкой реляционных СУБД (MySQL / PostgreSQL) и шифрованием данных.

---

## 📋 Системные требования

* **ОС:** Ubuntu Server 20.04 LTS / 22.04 LTS / 24.04 LTS
* **Процессор:** 1 core (рекомендуется 2)
* **Оперативная память:** 1 GB RAM (рекомендуется 2 GB, особенно при развертывании СУБД на том же сервере)
* **Дисковое пространство:** минимум 10 GB свободного места
* **Сеть:** статический IP-адрес, открытые порты `8080` (или `80`/`443` при проксировании)

---

## 🛠️ Шаг 1. Первоначальная подготовка Ubuntu Server

Перед установкой обновите индекс пакетов операционной системы и установите необходимые базовые утилиты:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates build-essential ufw
```

---

## 📦 Шаг 2. Развертывание приложения (Два Способа)

Вы можете выбрать наиболее подходящий вам способ запуска Vicariustab. **Способ А (Docker)** является наиболее предпочтительным, так как полностью изолирует приложение и исключает конфликты глобальных зависимостей Node.js.

### Способ А: Развертывание через Docker / Docker Compose

#### 1. Установка Docker и плагина Docker Compose
```bash
# Добавление официального репозитория Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

# Установка Docker и Compose
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Разрешение использовать docker без root-прав (для текущего пользователя)
sudo usermod -aG docker $USER
```
*Важно: Для применения прав Docker перезайдите в SSH-сессию.*

#### 2. Клонирование и первый запуск
Убедитесь, что вы находитесь в домашней директории своего пользователя и у вас нет "двойных" вложенных папок:
```bash
cd ~
git clone https://github.com/llDecsterll/vicariustab.git
cd vicariustab

# Проверьте наличие файлов Dockerfile и docker-compose.yml
ls -la

# Сборка образа и фоновый запуск контейнера Vicariustab
docker compose build --no-cache
docker compose up -d
```
Приложение запустится на порту `8080` вашего сервера.

#### Альтернатива: Vicariustab + MySQL в одном Docker Compose

```bash
docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build
```

Хост в настройках СУБД: **`mysql`**. Подробнее — [README.ru.md](./README.ru.md).

#### 3. Внешний домен и HTTPS (Caddy + Let's Encrypt)

1. Направьте **A-запись DNS** вашего домена на IP сервера (например `stack.company.com` → `203.0.113.10`).
2. Откройте порты **80** и **443** в файерволе (`sudo ufw allow 80,443/tcp`).
3. В `.env` на сервере:

```bash
STACK_DOMAIN=stack.company.com
STACK_TLS_EMAIL=admin@company.com
DB_ENCRYPTION_KEY=ваш-длинный-секрет
```

4. Запуск с автоматическим TLS:

```bash
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```

С MySQL:

```bash
docker compose -f docker-compose.yml -f docker-compose.mysql.yml -f docker-compose.caddy.yml up -d --build
```

Приложение будет доступно по **`https://stack.company.com`**. Caddy получает и продлевает сертификаты Let's Encrypt. Внутренний порт `8080` наружу не публикуется — только через HTTPS-прокси.

**Без Docker:** пример Nginx + Let's Encrypt — [`deploy/nginx-https.example.conf`](./deploy/nginx-https.example.conf). На сервере задайте `TRUST_PROXY=true`.

В **Настройках → Общие параметры** укажите публичный URL (`https://…`) — он сохраняется в базе данных.

---

### Способ Б: Нативный запуск на Ubuntu Server (с помощью PM2)

Используйте этот метод, если вы не хотите использовать Docker.

#### 1. Установка Node.js v20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 2. Клонирование репозитория и сборка
```bash
cd ~
git clone https://github.com/llDecsterll/vicariustab.git
cd vicariustab

# Устанавливаем зависимости
npm install

# Собираем клиентскую часть и серверный TypeScript
npm run build
```

#### 3. Настройка менеджера процессов PM2
PM2 будет следить за тем, чтобы узел Vicariustab работал 24/7 и автоматически поднимался при перезагрузках операционной системы:
```bash
sudo npm install -g pm2

# Запускаем скомпилированный CJS сервер
PORT=8080 NODE_ENV=production pm2 start deploy/ecosystem.config.cjs --env production

# Настройка автозапуска
pm2 startup systemd
```
*Консоль выведет длинную команду `sudo env PATH=...`. Обязательно скопируйте её целиком, вставьте в консоль и нажмите Enter для активации службы.*

Затем сохраните конфигурацию запущенных приложений:
```bash
pm2 save
```

---

## 🗄️ Шаг 3. Развертывание и настройка базы данных (Linux СУБД)

База данных Vicariustab может работать в режиме локального шифрования файлов (по умолчанию), но для промышленного использования, стабильного многопользовательского доступа с разных компьютеров и отказоустойчивости рекомендуется использовать полноценную СУБД.

---

### Вариант 1: Развертывание базы данных MySQL (Ubuntu локально)

#### 1. Установка сервера
```bash
sudo apt update
sudo apt install -y mysql-server
```

#### 2. Включение удаленного сетевого доступа
По умолчанию MySQL слушает внутреннюю петлю `127.0.0.1`. Изменим настройки на `0.0.0.0`, чтобы Vicariustab из Docker контейнера или другие филиалы могли подключиться:
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```
Найдите строки:
```ini
bind-address            = 127.0.0.1
# mysqlx-bind-address   = 127.0.0.1
```
Замените их на:
```ini
bind-address            = 0.0.0.0
# mysqlx-bind-address   = 0.0.0.0
```
Сохраните изменения (`Ctrl+O` -> `Enter` -> `Ctrl+X`).

#### 3. Настройка СУБД, создание базы и пользователей
Войдите в MySQL CLI:
```bash
sudo mysql
```
Выполните команды:
```sql
-- Создание выделенной базы данных в UTF-8
CREATE DATABASE stack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя с удаленным доступом '%' (Задайте надежный пароль!)
CREATE USER 'stack_user'@'%' IDENTIFIED BY 'StrongSecPassword@2026';

-- Предоставление прав пользователю на базу данных
GRANT ALL PRIVILEGES ON stack_db.* TO 'stack_user'@'%';

FLUSH PRIVILEGES;
EXIT;
```

#### 4. Перезапуск службы и настройка межсетевого экрана (Firewall)
```bash
sudo systemctl restart mysql
sudo systemctl enable mysql

# Разрешаем входящие соединения на порт MySQL
sudo ufw allow 3306/tcp
sudo ufw reload
```

---

### Вариант 2: Развертывание PostgreSQL (Ubuntu локально)

#### 1. Установка сервера
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```

#### 2. Настройка прослушивания сетевых адресов
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```
Найдите строку `#listen_addresses = 'localhost'` и раскомментируйте её (уберите `#`), установив прослушивание всех интерфейсов:
```ini
listen_addresses = '*'
```
Сохраните изменения. Откройте правила доступа клиентских паролей:
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```
Добавьте в самый конец файла строчку разрешения для внешних хостов по паролю:
```text
host    all             all             0.0.0.0/0               scram-sha-256
```
Сохраните и закройте текстовый редактор.

#### 3. Настройка базы данных и учетной записи
Войдите в консоль PostgreSQL:
```bash
sudo -i -u postgres psql
```
Выполните команды:
```sql
-- Создание пользователя 'stack_user'
CREATE USER stack_user WITH PASSWORD 'StrongSecPassword@2026';

-- Создание базы данных и назначение владельца
CREATE DATABASE stack_db OWNER stack_user;

\q
exit
```

#### 4. Перезапуск службы и настройка Firewall
```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql

# Разрешаем входящий порт PostgreSQL
sudo ufw allow 5432/tcp
sudo ufw reload
```

---

## 🔗 Шаг 4. Подключение СУБД через интерфейс Vicariustab

После успешной установки веб-интерфейса и базы данных, вам остается связать их через настройки:

1. Откройте Vicariustab в вашем браузере: `http://<IP-АДРЕС_СЕРВЕРА>:8080` (или `8080` в зависимости от вашего порта).
2. Авторизуйтесь: **Логин:** `admin`, **Пароль:** `admin`.
3. Перейдите в раздел **«Настройки»** -> Вкладка **«Параметры СУБД (MySQL / PostgreSQL)»**.
4. Заполните данные вашей запущенной СУБД:
   * **Тип базы данных:** Выберите `MySQL` или `PostgreSQL`.
   * **Хост / IP:** `mysql` (Docker Compose), `172.17.0.1`, `host.docker.internal` или `localhost` (режим host-сети — см. `docker-compose.host.yml`).
   * **Порт:** `3306` (MySQL) или `5432` (PostgreSQL).
   * **Название БД:** `stack_db`.
   * **Пользователь:** `stack_user`.
   * **Пароль:** Ваш пароль (например, `StrongSecPassword@2026`).
5. Нажмите кнопку **«Проверить соединение»**. Если всё сделано верно, загорится плашка **«Подключение успешно установлено!»**.
6. Нажмите кнопку **«Применить СУБД и мигрировать»**. Данные мгновенно синхронизируются внутри вашей новой реляционной таблицы безопасности, и приложение перезапустится.

---

## 🔐 Безопасность и шифрование

Все данные ТМЦ, ТТН, сотрудники, сетевые приборы, складские запасы и пароли пользователей сохраняются в СУБД в **строго зашифрованном виде** по стандарту **AES-256-CBC**. Это защищает вас от несанкционированного доступа к базе данных напрямую или кражи дампов третьими лицами.

Шифрование и расшифрование осуществляются на лету на стороне NodeJS-сервера с использованием системного ключа шифрования `DB_ENCRYPTION_KEY`, задаваемого в переменных окружения.

---

## 📋 Диагностика и устранение неполадок

### 1. Ошибка клонирования или сборки Dockerfile (нет такого файла)
**Причина:** Клонирование произведено рекурсивно или внутри уже существующей директории Vicariustab, из-за чего создалась вложенная структура `~/vicariustab/Vicariustab`.
**Решение:** Проверьте ваше текущее местоположение:
```bash
pwd
# Если вы находитесь в ~/vicariustab/Vicariustab — скопируйте файлы на один уровень выше или запустите Docker Compose из папки, где действительно хранится Dockerfile.
```

### 2. Ошибка "Connection Refused" при проверке подключения к СУБД
**Решение:**
1. Проверьте, запущен ли сервис базы данных: `sudo systemctl status mysql` или `sudo systemctl status postgresql`.
2. Убедитесь, что изменили параметр `bind-address` на `0.0.0.0` или `*` в конфигурационных файлах СУБД, иначе база данных отвергает любые входящие сетевые пакеты снаружи.
3. Проверьте ваш Firewall: `sudo ufw status`. Порты `3306` и `5432` должны иметь статус `ALLOW`.

### 3. Как узнать IP-адрес шлюза Docker хоста?
Если база данных запущена локально на хосте Ubuntu, а приложение крутится в докере, приложению нужен IP-адрес хоста для доступа к портам `3306` / `5432`. Узнать этот адрес можно командой:
```bash
ip addr show docker0 | grep inet
# Обычно IP-адрес шлюза: 172.17.0.1
```
Укажите `172.17.0.1` в поле **"Хост / IP"** в настройках системы.

---

## 🚀 Готово!
Теперь ваша система учета IT-активов **Vicariustab** развернута в надежном, защищенном промышленном режиме и сохраняет все данные с автоматическим шифрованием! Любой пользователь с любого браузера или компьютера сможет получить санкционированный доступ к актуальной информации.

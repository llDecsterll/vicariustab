# 🚀 Orbit

<p align="center">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&style=flat-square" alt="Docker Ready" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&style=flat-square" alt="Node.js 20+" />
  <img src="https://img.shields.io/badge/PM2-Service-blue?style=flat-square" alt="PM2" />
  <img src="https://img.shields.io/badge/MySQL-8+-4479A1?logo=mysql&style=flat-square" alt="MySQL" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql&style=flat-square" alt="PostgreSQL" />
</p>

<p align="center">
  <strong>Современная система учёта IT-инфраструктуры, оборудования, лицензий и складских запасов</strong>
</p>

---

# 📖 О проекте

**Orbit** — веб-система промышленного уровня для централизованного учёта IT-активов организации.

Система позволяет вести:

* Учёт компьютеров и ноутбуков
* Учёт серверов
* Учёт принтеров и МФУ
* Учёт сетевого оборудования
* Учёт лицензий
* Учёт расходных материалов
* Учёт складских остатков
* Закрепление техники за сотрудниками
* Инвентаризацию имущества

Все данные могут храниться в централизованной базе данных MySQL или PostgreSQL и доступны через веб-интерфейс из любого современного браузера.

---

# 🔑 Лицензирование

* После установки автоматически формируется уникальный код запроса лицензии.
* Доступен ознакомительный период сроком 30 дней.
* После окончания пробного периода требуется активация лицензии.
* Ключ активации выдаётся отдельно через сервер лицензирования.
* Лицензия привязывается к оборудованию сервера.

---

# ✨ Возможности

## 🖥 Учёт оборудования

* Компьютеры
* Ноутбуки
* Серверы
* Моноблоки
* Принтеры
* Сканеры
* МФУ
* Коммутаторы
* Маршрутизаторы
* История эксплуатации

## 🌐 Сетевое картографирование

* IP-адреса
* VLAN
* Коммутаторы
* Маршрутизаторы
* Патч-панели

## 📦 Складской учёт

* Приход ТМЦ
* Списание ТМЦ
* Остатки
* Инвентаризация
* История движения

## 👥 Кадровый учёт

* Отделы
* Сотрудники
* Материально ответственные лица
* Закрепление техники

## 🔒 Безопасность

* AES-256-CBC
* Шифрование настроек БД
* Автоматическое переподключение к СУБД
* Защита конфигурации

---

# 📋 Системные требования

## Минимальные

| Компонент | Требование    |
| --------- | ------------- |
| CPU       | 2 ядра        |
| RAM       | 4 ГБ          |
| Диск      | 20 ГБ SSD     |
| ОС        | Ubuntu 22.04+ |
| Node.js   | 20+           |

## Рекомендуемые

| Компонент | Требование       |
| --------- | ---------------- |
| CPU       | 4+ ядра          |
| RAM       | 8+ ГБ            |
| Диск      | 50+ ГБ SSD       |
| ОС        | Ubuntu 24.04 LTS |

---

# 🛠 Установка Orbit

## Шаг 1. Подготовка сервера

Подключитесь к серверу по SSH.

Обновите систему:

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Шаг 2. Установка системных зависимостей

```bash
sudo apt install -y \
git \
curl \
wget \
nano \
zip \
unzip \
build-essential \
ca-certificates \
software-properties-common \
apt-transport-https \
gnupg \
ufw
```

Проверка:

```bash
git --version
curl --version
```

---

## Шаг 3. Установка Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

sudo apt install -y nodejs
```

Проверка:

```bash
node -v
npm -v
```

---

## Шаг 4. Получение проекта

### Через HTTPS

```bash
git clone https://github.com/llDecsterll/Orbit.git

cd Orbit
```

### Через SSH

```bash
git clone git@github.com:llDecsterll/Orbit.git

cd Orbit
```

---

## Шаг 5. Создание конфигурации

Создайте файл настроек:

```bash
cp .env.example .env
```

Отредактируйте:

```bash
nano .env
```

Пример:

```env
PORT=8080

NODE_ENV=production

DB_ENCRYPTION_KEY=CHANGE_THIS_TO_RANDOM_SECRET_KEY
```

---

## Шаг 6. Установка зависимостей Orbit

```bash
npm install
```

или

```bash
npm ci
```

Проверка:

```bash
npm ls --depth=0
```

---

## Шаг 7. Сборка проекта

```bash
npm run build
```

После сборки должна появиться директория:

```text
dist/
```

---

# 🚀 Запуск Orbit

## Вариант А. PM2 (рекомендуется)

### Установка PM2

```bash
sudo npm install -g pm2
```

### Запуск

```bash
PORT=8080 NODE_ENV=production pm2 start dist/server.cjs --name orbit-system
```

### Проверка

```bash
pm2 status
```

Статус должен быть:

```text
orbit-system online
```

### Просмотр логов

```bash
pm2 logs orbit-system
```

### Автозапуск после перезагрузки

```bash
pm2 startup systemd
```

Выполните команду, которую покажет PM2.

После этого:

```bash
pm2 save
```

---

## Вариант Б. Docker

### Установка Docker

```bash
sudo apt update

sudo apt install -y docker.io docker-compose-v2
```

Добавьте пользователя в группу Docker:

```bash
sudo usermod -aG docker $USER
```

Перезайдите по SSH.

Проверка:

```bash
docker --version
docker compose version
```

### Сборка контейнеров

```bash
docker compose build --no-cache
```

### Запуск

```bash
docker compose up -d
```

### Проверка

```bash
docker ps
```

---

# 🗄 Настройка MySQL

## Установка

```bash
sudo apt install -y mysql-server
```

## Запуск

```bash
sudo systemctl enable mysql
sudo systemctl start mysql
```

## Создание базы данных

Вход в MySQL:

```bash
sudo mysql
```

Создайте базу данных:

```sql
CREATE DATABASE orbit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'orbit_user'@'%' IDENTIFIED BY 'StrongPassword';

GRANT ALL PRIVILEGES ON orbit_db.* TO 'orbit_user'@'%';

FLUSH PRIVILEGES;
```

Проверка подключения:

```bash
mysql -h 127.0.0.1 -u orbit_user -p orbit_db
```

---

# 🐘 Настройка PostgreSQL

## Установка

```bash
sudo apt install -y postgresql postgresql-contrib
```

## Создание пользователя и БД

```bash
sudo -u postgres psql
```

```sql
CREATE USER orbit_user WITH PASSWORD 'StrongPassword';

CREATE DATABASE orbit_db OWNER orbit_user;
```

Проверка подключения:

```bash
psql -U orbit_user -d orbit_db -h localhost
```

---

# 🔗 Подключение базы данных к Orbit

Откройте браузер:

```text
http://IP_СЕРВЕРА:8080
```

Стандартные учётные данные:

```text
Логин: admin
Пароль: admin
```

Перейдите:

```text
Настройки → Параметры СУБД
```

Укажите:

### Для MySQL

```text
Тип: MySQL
Хост: 127.0.0.1
Порт: 3306
База данных: orbit_db
Пользователь: orbit_user
Пароль: StrongPassword
```

### Для PostgreSQL

```text
Тип: PostgreSQL
Хост: 127.0.0.1
Порт: 5432
База данных: orbit_db
Пользователь: orbit_user
Пароль: StrongPassword
```

Нажмите:

```text
Проверить соединение
```

Затем:

```text
Применить СУБД и мигрировать
```

---

# 🔄 Обновление Orbit

```bash
cd ~/Orbit

git fetch origin

git pull origin main

npm install

npm run build

pm2 restart orbit-system
```

Проверка:

```bash
pm2 status
```

---

# 💾 Резервное копирование

## MySQL

Создание резервной копии:

```bash
mysqldump -u orbit_user -p orbit_db > orbit_backup.sql
```

Восстановление:

```bash
mysql -u orbit_user -p orbit_db < orbit_backup.sql
```

## PostgreSQL

Создание резервной копии:

```bash
pg_dump orbit_db > orbit_backup.sql
```

Восстановление:

```bash
psql orbit_db < orbit_backup.sql
```

---

# 🛠 Диагностика

Проверка Orbit:

```bash
pm2 status
```

Проверка логов:

```bash
pm2 logs orbit-system
```

Проверка порта приложения:

```bash
sudo ss -tulpn | grep 8080
```

Проверка MySQL:

```bash
sudo ss -tulpn | grep 3306
```

Проверка PostgreSQL:

```bash
sudo ss -tulpn | grep 5432
```

Проверка Docker:

```bash
docker ps
```

---

# 📂 Структура проекта

```text
Orbit/
│
├── src/
├── public/
├── server.ts
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── .env.example
├── README.md
└── DOCKER.md
```

---

# ⭐ Поддержка проекта

Если проект оказался полезным:

* Поставьте ⭐ репозиторию
* Создавайте Issues
* Отправляйте Pull Requests
* Сообщайте об ошибках и предлагайте улучшения

---

# 📜 Лицензия

Copyright © Orbit Team

Все права защищены.

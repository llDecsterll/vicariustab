# 🚀 Uvwstack

<p align="center">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&style=for-the-badge" alt="Docker Ready">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&style=for-the-badge" alt="Node.js 20">
  <img src="https://img.shields.io/badge/PM2-Supported-blue?style=for-the-badge" alt="PM2">
  <img src="https://img.shields.io/badge/License-Commercial-orange?style=for-the-badge" alt="License">
</p>

<p align="center">
  <strong>Современная система учета IT-инфраструктуры, оборудования, лицензий и складских ресурсов</strong>
</p>

---

## 📋 Содержание

- [О проекте](#-о-проекте)
- [Основные возможности](#-основные-возможности)
- [Лицензирование](#-лицензирование)
- [Технологический стек](#-технологический-стек)
- [Установка](#-установка)
  - [Docker](#-вариант-1-docker-compose-рекомендуется)
  - [PM2](#-вариант-2-нативная-установка-pm2)
- [Настройка базы данных](#-настройка-базы-данных)
  - [MySQL](#mysql)
  - [PostgreSQL](#postgresql)
- [Подключение СУБД](#-подключение-базы-данных-в-uvwstack)
- [Структура проекта](#-структура-проекта)
- [Переменные окружения](#-переменные-окружения)
- [Обновление системы](#-обновление-системы)
- [Авторское право](#-авторское-право)
- [Контакты](#-контакты)

---

# 📖 О проекте

**Uvwstack** — профессиональная веб-система централизованного учета и инвентаризации IT-активов предприятия.

Платформа предназначена для:

- системных администраторов;
- IT-отделов;
- материально ответственных лиц;
- технических служб предприятий;
- государственных и коммерческих организаций.

Система позволяет вести полный учет:

- компьютеров;
- серверов;
- сетевого оборудования;
- оргтехники;
- комплектующих;
- лицензий;
- складских запасов;
- расходных материалов.

Все данные хранятся централизованно и доступны через веб-интерфейс из любого современного браузера.

---

# ✨ Основные возможности

## 🖥 Учет оборудования

- ПК и ноутбуки
- Серверы
- Принтеры и МФУ
- Коммутаторы и маршрутизаторы
- Комплектующие
- История эксплуатации

## 🌐 Сетевая инфраструктура

- Учет IP-адресов
- Патч-панели
- Маршрутизаторы
- Сетевая топология
- Карта подключений

## 📦 Складской учет

- Приход и списание
- Инвентаризация
- Остатки на складе
- Картриджи
- Расходные материалы
- Лицензии

## 👥 Управление ответственными лицами

- Закрепление техники за сотрудниками
- Привязка оборудования к отделам
- История перемещений
- Контроль материальной ответственности

## 🔐 Безопасность

- AES-256-CBC шифрование данных
- Защищенное хранение параметров подключения
- Автоматическое переподключение к СУБД
- Работа в распределенной инфраструктуре

---

# 🔑 Лицензирование

Система использует механизм аппаратно-привязанной активации.

### Ознакомительный период

- 30 дней бесплатного использования
- Отсчет начинается после первого запуска

### Активация

При установке автоматически формируется:

```text
REQ-XXXX-XXXX-XXXX-CHKS
```

На основе данного запроса выдается ключ вида:

```text
UTKIN-XXXX-XXXX-XXXX
```

### Особенности лицензии

✅ Привязка к оборудованию

✅ Проверка цифровой подписи

✅ Защита от копирования ключей

✅ Отдельный сервер лицензирования

❌ Генерация ключей внутри клиента невозможна

---

# 🛠 Технологический стек

| Компонент | Технология |
|-----------|------------|
| Frontend | React |
| Backend | Node.js |
| API | Express |
| База данных | MySQL / PostgreSQL |
| Контейнеризация | Docker |
| Процесс-менеджер | PM2 |
| Шифрование | AES-256-CBC |

---

# 🚀 Установка

## Подготовка сервера

```bash
cd ~

rm -rf uvwstack
```

---

## Клонирование репозитория

```bash
git clone https://github.com/llDecsterll/uvwstack.git

cd uvwstack
```

---

# 🐳 Вариант 1: Docker Compose (Рекомендуется)

## Установка Docker

```bash
sudo apt update

sudo apt install -y docker.io docker-compose-v2

sudo usermod -aG docker $USER
```

Перезайдите в SSH-сессию.

---

## Запуск проекта

```bash
docker compose build --no-cache

docker compose up -d
```

После завершения сборки система будет доступна через браузер.

---

# ⚙ Вариант 2: Нативная установка (PM2)

## Установка Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

sudo apt install -y nodejs build-essential
```

---

## Установка зависимостей

```bash
cp .env.example .env

npm install

npm run build
```

---

## Установка PM2

```bash
sudo npm install -g pm2
```

---

## Запуск приложения

```bash
PORT=8080 NODE_ENV=production pm2 start dist/server.cjs --name "uvwstack-system"
```

---

## Автозапуск после перезагрузки

```bash
pm2 startup systemd
```

Выполните команду, которую покажет PM2.

После этого:

```bash
pm2 save
```

---

# 🗄 Настройка базы данных

## MySQL

### Установка

```bash
sudo apt update

sudo apt install -y mysql-server

sudo systemctl enable mysql
sudo systemctl start mysql
```

### Создание БД

```sql
CREATE DATABASE orbit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'orbit_user'@'%' IDENTIFIED BY 'StrongSecPassword@2026';

GRANT ALL PRIVILEGES ON orbit_db.* TO 'orbit_user'@'%';

FLUSH PRIVILEGES;
```

---

## PostgreSQL

### Установка

```bash
sudo apt update

sudo apt install -y postgresql postgresql-contrib
```

### Создание пользователя и базы

```sql
CREATE USER orbit_user WITH PASSWORD 'StrongSecPassword@2026';

CREATE DATABASE orbit_db OWNER orbit_user;
```

---

# 🔗 Подключение базы данных в Uvwstack

После запуска системы откройте:

```text
http://SERVER_IP:8080
```

### Стандартные данные входа

```text
Логин: admin
Пароль: admin
```

### Настройки подключения

| Параметр | Значение |
|-----------|-----------|
| Тип БД | MySQL / PostgreSQL |
| База данных | orbit_db |
| Пользователь | orbit_user |
| Порт MySQL | 3306 |
| Порт PostgreSQL | 5432 |

После проверки подключения нажмите:

```text
Применить СУБД и мигрировать
```

Система автоматически:

- создаст таблицы;
- выполнит миграции;
- зашифрует настройки подключения;
- перенесет существующие данные;
- настроит автоматическое подключение.

---

# 📂 Структура проекта

```text
Uvwstack/
│
├── src/
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

# 🔧 Переменные окружения

| Переменная | Описание |
|------------|-----------|
| PORT | HTTP-порт приложения |
| DB_ENCRYPTION_KEY | Ключ AES-256 |
| NODE_ENV | production / development |

Пример:

```env
PORT=8080

NODE_ENV=production

DB_ENCRYPTION_KEY=your-secret-key
```

---

# 🔄 Обновление системы

```bash
cd ~/uvwstack

git pull origin main

npm install

npm run build

pm2 restart uvwstack-system
```

---

# 📜 Авторское право

© Уткин Владислав Вячеславович

Все права защищены.

Подробная информация находится в файле:

```text
COPYRIGHT.md
```

---

# 📞 Контакты

📧 E-mail:

```text
assetorbit@icloud.com
```

📨 Telegram:

```text
@Dexterll
```

---

# ⭐ Поддержка проекта

Если Uvwstack оказался полезным:

- Поставьте ⭐ репозиторию
- Сообщайте об ошибках через Issues
- Предлагайте новые функции
- Свяжитесь для получения корпоративной лицензии

---

<p align="center">
  Сделано для эффективного управления IT-инфраструктурой 🚀
</p>

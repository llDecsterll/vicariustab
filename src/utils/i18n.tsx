/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { createContext, useContext, useState, useEffect } from "react";


export type Language = 'en' | 'ru' | 'zh';

// Comprehensive translation catalog for Vicariustab IT Asset Management platform
const dictionary: Record<string, Record<Language, string>> = {
  // Navigation & Tabs
  "Дашборд": {
    ru: "Дашборд",
    en: "Dashboard",
    zh: "仪表盘"
  },
  "Объекты": {
    ru: "Объекты",
    en: "Locations",
    zh: "地点"
  },
  "Оборудование": {
    ru: "Оборудование",
    en: "Equipment",
    zh: "设备"
  },
  "Компьютеры": {
    ru: "Компьютеры",
    en: "Computer",
    zh: "电脑"
  },
  "Сетевое оборуд.": {
    ru: "Сетевое оборуд.",
    en: "Hardware",
    zh: "网络设备"
  },
  "Сотрудники": {
    ru: "Сотрудники",
    en: "Employees",
    zh: "员工"
  },
  "Склад / ТМЦ": {
    ru: "Склад / ТМЦ",
    en: "Warehouse / Stocks",
    zh: "仓库与库存"
  },
  "Гарантия": {
    ru: "Гарантия",
    en: "Warranty",
    zh: "保修"
  },
  "Гарантия и обсл.": {
    ru: "Гарантия и обсл.",
    en: "Warranty & Serv.",
    zh: "保修与维护"
  },
  "Склад ИТ": {
    ru: "Склад ИТ",
    en: "IT Warehouse",
    zh: "IT 仓库"
  },
  "Учет ПО": {
    ru: "Учет ПО",
    en: "Software Asset Management",
    zh: "软件资产管理"
  },
  "Другое оборуд.": {
    ru: "Другое оборуд.",
    en: "Other Equip.",
    zh: "其它硬件"
  },
  "Свернуть": {
    ru: "Свернуть",
    en: "Collapse",
    zh: "折叠侧栏"
  },
  "Вечная лицензия": {
    ru: "Вечная лицензия",
    en: "Lifetime License",
    zh: "永久授权证书"
  },
  "Пробный период: ": {
    ru: "Пробный период: ",
    en: "Trial period: ",
    zh: "测试用期: "
  },
  " дн.": {
    ru: " дн.",
    en: " days",
    zh: " 天"
  },
  "Лицензия: до ": {
    ru: "Лицензия: до ",
    en: "License Expiration Date: ",
    zh: "许可证有效期至: "
  },
  "г.": {
    ru: "г.",
    en: "y",
    zh: "年"
  },
  "Аудиты": {
    ru: "Аудиты",
    en: "Audits",
    zh: "审计"
  },
  "Отчетность": {
    ru: "Отчетность",
    en: "Reports",
    zh: "报表"
  },
  "Кибербезопасность": {
    ru: "Кибербезопасность",
    en: "Cybersecurity",
    zh: "网络安全"
  },
  "Двухэтапная аутентификация (2FA)": {
    ru: "Двухэтапная аутентификация (2FA)",
    en: "Two-factor authentication (2FA)",
    zh: "双因素认证 (2FA)"
  },
  "Защитите учётную запись кодом из Google Authenticator, Microsoft Authenticator или аналога.": {
    ru: "Защитите учётную запись кодом из Google Authenticator, Microsoft Authenticator или аналога.",
    en: "Protect your account with a code from Google Authenticator, Microsoft Authenticator, or similar.",
    zh: "使用 Google Authenticator、Microsoft Authenticator 或类似应用中的验证码保护您的账户。"
  },
  "2FA включена": {
    ru: "2FA включена",
    en: "2FA enabled",
    zh: "已启用 2FA"
  },
  "2FA не включена": {
    ru: "2FA не включена",
    en: "2FA not enabled",
    zh: "未启用 2FA"
  },
  "Включить 2FA": {
    ru: "Включить 2FA",
    en: "Enable 2FA",
    zh: "启用 2FA"
  },
  "Подготовка…": {
    ru: "Подготовка…",
    en: "Preparing…",
    zh: "准备中…"
  },
  "1. Установите приложение аутентификатора на телефон. 2. Добавьте учётную запись по секрету или ссылке ниже. 3. Введите 6-значный код для подтверждения.": {
    ru: "1. Установите приложение аутентификатора на телефон. 2. Добавьте учётную запись по секрету или ссылке ниже. 3. Введите 6-значный код для подтверждения.",
    en: "1. Install an authenticator app on your phone. 2. Add the account using the secret or link below. 3. Enter the 6-digit code to confirm.",
    zh: "1. 在手机上安装身份验证器应用。2. 使用下方密钥或链接添加账户。3. 输入 6 位验证码进行确认。"
  },
  "Секретный ключ": {
    ru: "Секретный ключ",
    en: "Secret key",
    zh: "密钥"
  },
  "Код подтверждения": {
    ru: "Код подтверждения",
    en: "Confirmation code",
    zh: "确认码"
  },
  "Проверка…": {
    ru: "Проверка…",
    en: "Verifying…",
    zh: "验证中…"
  },
  "Подтвердить и включить": {
    ru: "Подтвердить и включить",
    en: "Confirm and enable",
    zh: "确认并启用"
  },
  "Для отключения 2FA введите текущий код из приложения аутентификатора.": {
    ru: "Для отключения 2FA введите текущий код из приложения аутентификатора.",
    en: "To disable 2FA, enter the current code from your authenticator app.",
    zh: "要禁用 2FA，请输入身份验证器应用中的当前验证码。"
  },
  "Отключение…": {
    ru: "Отключение…",
    en: "Disabling…",
    zh: "正在禁用…"
  },
  "Отключить 2FA": {
    ru: "Отключить 2FA",
    en: "Disable 2FA",
    zh: "禁用 2FA"
  },
  "Не удалось начать настройку двухэтапной аутентификации.": {
    ru: "Не удалось начать настройку двухэтапной аутентификации.",
    en: "Failed to start two-factor authentication setup.",
    zh: "无法开始双因素认证设置。"
  },
  "Введите 6-значный код из приложения аутентификатора.": {
    ru: "Введите 6-значный код из приложения аутентификатора.",
    en: "Enter the 6-digit code from your authenticator app.",
    zh: "请输入身份验证器应用中的 6 位验证码。"
  },
  "Неверный код. Убедитесь, что время на телефоне синхронизировано.": {
    ru: "Неверный код. Убедитесь, что время на телефоне синхронизировано.",
    en: "Invalid code. Make sure your phone time is synchronized.",
    zh: "验证码无效。请确保手机时间已同步。"
  },
  "Двухэтапная аутентификация успешно включена.": {
    ru: "Двухэтапная аутентификация успешно включена.",
    en: "Two-factor authentication enabled successfully.",
    zh: "双因素认证已成功启用。"
  },
  "Неверный код двухэтапной аутентификации.": {
    ru: "Неверный код двухэтапной аутентификации.",
    en: "Invalid two-factor authentication code.",
    zh: "双因素认证验证码无效。"
  },
  "Неверный код двухэтапной аутентификации. Попробуйте снова.": {
    ru: "Неверный код двухэтапной аутентификации. Попробуйте снова.",
    en: "Invalid two-factor code. Please try again.",
    zh: "双因素验证码无效。请重试。"
  },
  "Двухэтапная аутентификация отключена.": {
    ru: "Двухэтапная аутентификация отключена.",
    en: "Two-factor authentication disabled.",
    zh: "双因素认证已禁用。"
  },
  "Введите 6-значный код из приложения Google Authenticator или аналога.": {
    ru: "Введите 6-значный код из приложения Google Authenticator или аналога.",
    en: "Enter the 6-digit code from Google Authenticator or a similar app.",
    zh: "请输入 Google Authenticator 或类似应用中的 6 位验证码。"
  },
  "Код двухэтапной аутентификации": {
    ru: "Код двухэтапной аутентификации",
    en: "Two-factor authentication code",
    zh: "双因素认证验证码"
  },
  "Вернуться к вводу пароля": {
    ru: "Вернуться к вводу пароля",
    en: "Back to password entry",
    zh: "返回密码输入"
  },
  "Подтвердить код": {
    ru: "Подтвердить код",
    en: "Confirm code",
    zh: "确认验证码"
  },
  "Загрузка данных…": {
    ru: "Загрузка данных…",
    en: "Loading…",
    zh: "正在加载…"
  },
  "Сессия истекла. Выйдите и войдите снова, затем повторите настройку 2FA.": {
    ru: "Сессия истекла. Выйдите и войдите снова, затем повторите настройку 2FA.",
    en: "Session expired. Log out and sign in again, then retry 2FA setup.",
    zh: "会话已过期。请退出并重新登录，然后再次设置双因素认证。"
  },
  "Конфликт версий данных: загружены актуальные данные с сервера. Повторите изменение.": {
    ru: "Конфликт версий данных: загружены актуальные данные с сервера. Повторите изменение.",
    en: "Data version conflict: loaded the latest data from the server. Please retry your change.",
    zh: "数据版本冲突：已从服务器加载最新数据。请重新执行您的更改。"
  },
  "Лицензия активна (ключ скрыт для вашей роли)": {
    ru: "Лицензия активна (ключ скрыт для вашей роли)",
    en: "License is active (key hidden for your role)",
    zh: "许可证已激活（根据您的角色隐藏密钥）"
  },
  "Лицензия установки активна на сервере": {
    ru: "Лицензия установки активна на сервере",
    en: "Server installation license is active",
    zh: "服务器安装许可证已激活"
  },
  "Клиент не активирован локальным ключом. Расширенные функции (Excel, резервные копии, обновления) доступны только после активации ключа администратором.": {
    ru: "Клиент не активирован локальным ключом. Расширенные функции (Excel, резервные копии, обновления) доступны только после активации ключа администратором.",
    en: "This client is not activated with a local license key. Advanced features (Excel, backups, updates) are available only after an administrator activates the key.",
    zh: "此客户端未使用本地许可证密钥激活。高级功能（Excel、备份、更新）仅在管理员激活密钥后可用。"
  },
  "1. Установите приложение аутентификатора на телефон. 2. Отсканируйте QR-код или добавьте учётную запись по секрету. 3. Введите 6-значный код для подтверждения.": {
    ru: "1. Установите приложение аутентификатора на телефон. 2. Отсканируйте QR-код или добавьте учётную запись по секрету. 3. Введите 6-значный код для подтверждения.",
    en: "1. Install an authenticator app on your phone. 2. Scan the QR code or add the account with the secret key. 3. Enter the 6-digit code to confirm.",
    zh: "1. 在手机上安装身份验证器应用。2. 扫描二维码或使用密钥添加账户。3. 输入 6 位验证码进行确认。"
  },
  "Не удалось загрузить статус 2FA.": {
    ru: "Не удалось загрузить статус 2FA.",
    en: "Failed to load 2FA status.",
    zh: "无法加载双因素认证状态。"
  },
  "Учётная запись не найдена. Выйдите из системы и войдите снова.": {
    ru: "Учётная запись не найдена. Выйдите из системы и войдите снова.",
    en: "Account not found. Log out and sign in again.",
    zh: "未找到账户。请退出并重新登录。"
  },
  "QR-код для настройки 2FA": {
    ru: "QR-код для настройки 2FA",
    en: "2FA setup QR code",
    zh: "2FA 设置二维码"
  },
  "Журнал действий": {
    ru: "Журнал действий",
    en: "Activity Log",
    zh: "操作日志"
  },
  "Настройки": {
    ru: "Настройки",
    en: "Settings",
    zh: "设置"
  },
  "Сетевое оборудование": {
    ru: "Сетевое оборудование",
    en: "Hardware",
    zh: "网络设备"
  },
  "Активна": {
    ru: "Активна",
    en: "Active",
    zh: "活动"
  },
  "БЛОКИРОВКА ВВОДА": {
    ru: "БЛОКИРОВКА ВВОДА",
    en: "INPUT BLOCKED",
    zh: "输入已锁定"
  },
  "Вставьте ссылку на favicon .ico/.png или оставьте пустым": {
    ru: "Вставьте ссылку на favicon .ico/.png или оставьте пустым",
    en: "Paste a link to favicon .ico/.png or leave empty",
    zh: "粘贴 favicon .ico/.png 链接或留空"
  },
  "Вставьте ссылку на PNG/SVG или оставьте пустым": {
    ru: "Вставьте ссылку на PNG/SVG или оставьте пустым",
    en: "Paste a link to PNG/SVG or leave empty",
    zh: "粘贴 PNG/SVG 链接或留空"
  },
  "Выбран:": {
    ru: "Выбран:",
    en: "Selected:",
    zh: "已选:"
  },
  "дн.": {
    ru: "дн.",
    en: "d.",
    zh: "天"
  },
  "До": {
    ru: "До",
    en: "Until",
    zh: "直至"
  },
  "ед.": {
    ru: "ед.",
    en: "items",
    zh: "项"
  },
  "Заправлен": {
    ru: "Заправлен",
    en: "Refilled",
    zh: "已加墨"
  },
  "Инвентаризация": {
    ru: "Инвентаризация",
    en: "Inventory",
    zh: "资产盘点"
  },
  "Копировать в буфер": {
    ru: "Копировать в буфер",
    en: "Copy to clipboard",
    zh: "复制到剪贴板"
  },
  "На заправке": {
    ru: "На заправке",
    en: "Refilling",
    zh: "加墨中"
  },
  "Не активирована": {
    ru: "Не активирована",
    en: "Not activated",
    zh: "未激活"
  },
  "Неверный ключ активации. Проверьте правильность ввода.": {
    ru: "Неверный ключ активации. Проверьте правильность ввода.",
    en: "Invalid activation key. Please check the input.",
    zh: "激活密钥无效。请检查输入。"
  },
  "Обновить доступы": {
    ru: "Обновить доступы",
    en: "Update accesses",
    zh: "更新访问权限"
  },
  "Открыть Telegram (@Dexterll)": {
    ru: "Открыть Telegram (@Dexterll)",
    en: "Open Telegram (@Dexterll)",
    zh: "打开 Telegram (@Dexterll)"
  },
  "Открыть ИТ-склад": {
    ru: "Открыть ИТ-склад",
    en: "Open IT Warehouse",
    zh: "打开 IT 仓库"
  },
  "Открыть объекты": {
    ru: "Открыть объекты",
    en: "Open locations",
    zh: "打开地点"
  },
  "Открыть раздел компьютеров": {
    ru: "Открыть раздел компьютеров",
    en: "Open computers section",
    zh: "打开计算机部分"
  },
  "Открыть раздел сетевого оборудования": {
    ru: "Открыть раздел сетевого оборудования",
    en: "Open network equipment section",
    zh: "打开网络设备部分"
  },
  "Открыть репозиторий": {
    ru: "Открыть репозиторий",
    en: "Open repository",
    zh: "打开存储库"
  },
  "Открыть список сотрудников": {
    ru: "Открыть список сотрудников",
    en: "Open employees list",
    zh: "打开员工列表"
  },
  "Открыть учет лицензий и ПО": {
    ru: "Открыть учет лицензий и ПО",
    en: "Open software and licenses",
    zh: "打开软件和许可证"
  },
  "Отправить письмо (vicariustab@icloud.com)": {
    ru: "Отправить письмо (vicariustab@icloud.com)",
    en: "Send email (vicariustab@icloud.com)",
    zh: "发送电子邮件 (vicariustab@icloud.com)"
  },
  "Отчеты": {
    ru: "Отчеты",
    en: "Reports",
    zh: "报告"
  },
  "Ошибка импорта:": {
    ru: "Ошибка импорта:",
    en: "Import error:",
    zh: "导入错误："
  },
  "Платформа успешно обновлена до стабильной актуальной версии": {
    ru: "Платформа успешно обновлена до стабильной актуальной версии",
    en: "Platform successfully updated to the latest stable version",
    zh: "平台已成功更新至最新的稳定版本"
  },
  "Поиск сотрудников...": {
    ru: "Поиск сотрудников...",
    en: "Search employees...",
    zh: "搜索员工..."
  },
  "Пустой": {
    ru: "Пустой",
    en: "Empty",
    zh: "空"
  },
  "Редактировать": {
    ru: "Редактировать",
    en: "Edit",
    zh: "编辑"
  },
  "Скрыть ключ": {
    ru: "Скрыть ключ",
    en: "Hide key",
    zh: "隐藏密钥"
  },
  "Создать отдел": {
    ru: "Создать отдел",
    en: "Create department",
    zh: "创建部门"
  },
  "Создать собственный ИТ отдел / департамент": {
    ru: "Создать собственный ИТ отдел / департамент",
    en: "Create own IT department",
    zh: "创建自己的 IT 部门"
  },
  "Счет № 4758 от 12.05.2026": {
    ru: "Счет № 4758 от 12.05.2026",
    en: "Invoice No. 4758 from 12.05.2026",
    zh: "发票编号 4758 日期为 12.05.2026"
  },
  "Удаленка": {
    ru: "Удаленка",
    en: "Remote",
    zh: "远程办公"
  },
  "У сотрудников:": {
    ru: "У сотрудников:",
    en: "With employees:",
    zh: "员工持有："
  },
  "Успешная активация! Ключ принят. Система полностью разблокирована.": {
    ru: "Успешная активация! Ключ принят. Система полностью разблокирована.",
    en: "Successful activation! Key accepted. System fully unlocked.",
    zh: "激活成功！密钥已被接受。系统已完全解锁。"
  },
  "Уткин В.В. | Все права защищены.": {
    ru: "Уткин В.В. | Все права защищены.",
    en: "V.V. Utkin | All rights reserved.",
    zh: "V.V. Utkin | 版权所有。"
  },
  "шт.": {
    ru: "шт.",
    en: "pcs.",
    zh: "件"
  },
  "Цвет:": {
    ru: "Цвет:",
    en: "Color:",
    zh: "颜色："
  },
  "Оборудование на складе": {
    ru: "Оборудование на складе",
    en: "Warehouse Equipment",
    zh: "在库设备"
  },
  "ПО и Лицензии": {
    ru: "ПО и Лицензии",
    en: "Software & Licenses",
    zh: "软件与证书"
  },
  "Всего портов:": {
    ru: "Всего портов:",
    en: "Total ports:",
    zh: "网口总数:"
  },
  "На сумму:": {
    ru: "На сумму:",
    en: "Total value:",
    zh: "资产估值总额:"
  },
  "Активных:": {
    ru: "Активных:",
    en: "Active:",
    zh: "活动状态:"
  },
  "С оборудованием:": {
    ru: "С оборудованием:",
    en: "With devices:",
    zh: "配发设备:"
  },
  "Лицензий всего:": {
    ru: "Лицензий всего:",
    en: "Total licenses:",
    zh: "授权证书总额:"
  },
  "прикреплено к объектам": {
    ru: "прикреплено к объектам",
    en: "assigned to locations",
    zh: "绑定至运营地点"
  },
  "прикреплены к сотрудникам": {
    ru: "прикреплены к сотрудникам",
    en: "assigned to employees",
    zh: "配发至公司员工"
  },
  "Смотреть все объекты": {
    ru: "Смотреть все объекты",
    en: "View all locations",
    zh: "查看所有地点"
  },
  "Смотреть все сетевое оборудование": {
    ru: "Смотреть все сетевое оборудование",
    en: "View all network equipment",
    zh: "查看所有网络设备"
  },
  "Смотреть все компьютеры": {
    ru: "Смотреть все компьютеры",
    en: "View all computers",
    zh: "查看所有计算设备"
  },
  "Смотреть всех сотрудников": {
    ru: "Смотреть всех сотрудников",
    en: "View all employees",
    zh: "查看所有入职员工"
  },
  "Смотреть весь склад": {
    ru: "Смотреть весь склад",
    en: "View full warehouse",
    zh: "查看完整仓库"
  },
  "Списание": {
    ru: "Списание",
    en: "Write-off",
    zh: "折旧与报废"
  },
  "Расходные материалы": {
    ru: "Расходные материалы",
    en: "Consumables",
    zh: "耗材部件"
  },

  // Interface Buttons & General Actions
  "Добавить": {
    ru: "Добавить",
    en: "Add",
    zh: "增加"
  },
  "Изменить": {
    ru: "Изменить",
    en: "Edit",
    zh: "编辑"
  },
  "Удалить": {
    ru: "Удалить",
    en: "Delete",
    zh: "删除"
  },
  "Сохранить": {
    ru: "Сохранить",
    en: "Save",
    zh: "保存"
  },
  "Отмена": {
    ru: "Отмена",
    en: "Cancel",
    zh: "取消"
  },
  "Поиск": {
    ru: "Поиск",
    en: "Search",
    zh: "搜索"
  },
  "Фильтр": {
    ru: "Фильтр",
    en: "Filter",
    zh: "筛选"
  },
  "Скачать": {
    ru: "Скачать",
    en: "Download",
    zh: "下载"
  },
  "Загрузить": {
    ru: "Загрузить",
    en: "Upload",
    zh: "上传"
  },
  "Поиск по оборудованию, сотруднику, объекту...": {
    ru: "Поиск по оборудованию, сотруднику, объекту...",
    en: "Search by hardware, employee, location...",
    zh: "通过硬件、员工、地点进行搜索..."
  },
  "Поиск по оборудованию, серийному номеру, сотруднику...": {
    ru: "Поиск по оборудованию, серийному номеру, сотруднику...",
    en: "Search by hardware, serial number, employee...",
    zh: "按设备、序列号、员工搜索..."
  },
  "Результаты поиска ({count})": {
    ru: "Результаты поиска ({count})",
    en: "Search results ({count})",
    zh: "搜索结果 ({count})"
  },
  'Ничего не найдено по запросу "{query}"': {
    ru: 'Ничего не найдено по запросу "{query}"',
    en: 'No results for "{query}"',
    zh: '未找到与 "{query}" 匹配的结果'
  },
  "Все": {
    ru: "Все",
    en: "All",
    zh: "全部"
  },
  "Каталог объектов и филиалов": {
    ru: "Каталог объектов и филиалов",
    en: "Location & Branch Directory",
    zh: "分部地点名录"
  },
  "Сетевые маршрутизаторы и коммутаторы": {
    ru: "Сетевые маршрутизаторы и коммутаторы",
    en: "Network Routers & Switches",
    zh: "网络路由器与交换机"
  },
  "Учет компьютеров на руках": {
    ru: "Учет компьютеров на руках",
    en: "Workstations & Laptop Inventory",
    zh: "个人电脑资产核算"
  },
  "Каталог корпоративных сотрудников": {
    ru: "Каталог корпоративных сотрудников",
    en: "Corporate Employees Directory",
    zh: "企业全体员工通讯录"
  },
  "Склад ИТ-оборудования и ТМЦ": {
    ru: "Склад ИТ-оборудования и ТМЦ",
    en: "IT Equipment Warehouse & Stocks",
    zh: "IT设备仓库与物资"
  },
  "Учет лицензий и программного обеспечения": {
    ru: "Учет лицензий и программного обеспечения",
    en: "Software & Licenses Inventory",
    zh: "软件及许可证资产管理"
  },
  "Инвентаризационные проверки": {
    ru: "Инвентаризационные проверки",
    en: "Inventory Audit Sessions",
    zh: "资产盘点日常审计"
  },
  "Сроки гарантийного обслуживания": {
    ru: "Сроки гарантийного обслуживания",
    en: "Warranty Coverage Periods",
    zh: "设备保修生命周期"
  },
  "Аналитическая отчетность": {
    ru: "Аналитическая отчетность",
    en: "Analytical Reports Hub",
    zh: "综合分析审计报告"
  },
  "Журнал операций (Аудит)": {
    ru: "Журнал операций (Аудит)",
    en: "Security Operations Audit Log",
    zh: "系统安全操作日志"
  },
  "Конфигурация параметров": {
    ru: "Конфигурация параметров",
    en: "Workspace Workspace Configurations & Brackets",
    zh: "系统工作区配置与白标化"
  },
  "Учет периферии и мониторов": {
    ru: "Учет периферии и мониторов",
    en: "Peripherals & Monitors Inventory",
    zh: "周边外设与液晶显示器"
  },
  "Учет оргтехники": {
    ru: "Учет оргтехники",
    en: "Office Printers Directory",
    zh: "办公打印与扫描设备"
  },
  "Системы видеонаблюдения": {
    ru: "Системы видеонаблюдения",
    en: "CCTV Camera Systems Monitor",
    zh: "闭路监控视频摄像系统"
  },
  "Учет расходных материалов": {
    ru: "Учет расходных материалов",
    en: "Consumables Inventory Directory",
    zh: "打印耗材部件盘点"
  },
  "Другое неучтенное оборудование": {
    ru: "Другое неучтенное оборудование",
    en: "Other Uncategorized Stocks",
    zh: "未归类资产备件"
  },

  // Statuses & Categories (mapping exact database values to UI labels)
  "В работе": {
    ru: "В работе",
    en: "In Service",
    zh: "使用中"
  },
  "На ремонте": {
    ru: "На ремонте",
    en: "Under Repair",
    zh: "维修中"
  },
  "На складе": {
    ru: "На складе",
    en: "In Stock",
    zh: "在库"
  },
  "Списано": {
    ru: "Списано",
    en: "Scrapped",
    zh: "已报废"
  },
  "Работает": {
    ru: "Работает",
    en: "Active",
    zh: "在职"
  },
  "Уволен": {
    ru: "Уволен",
    en: "Terminated",
    zh: "已离职"
  },
  "В отпуске": {
    ru: "В отпуске",
    en: "On Leave",
    zh: "休假中"
  },
  "На удаленном рабочем месте": {
    ru: "На удаленном рабочем месте",
    en: "Remote Location",
    zh: "远程办公"
  },
  "В наличии": {
    ru: "В наличии",
    en: "Available",
    zh: "有现货"
  },
  "Заказано": {
    ru: "Заказано",
    en: "On Order",
    zh: "已订购"
  },
  "Завершена": {
    ru: "Завершена",
    en: "Completed",
    zh: "已完成"
  },
  "В процессе": {
    ru: "В процессе",
    en: "In Progress",
    zh: "进行中"
  },
  "Запланирована": {
    ru: "Запланирована",
    en: "Scheduled",
    zh: "已计划"
  },

  // Dashboard translations
  "Сводные данные инфраструктуры": {
    ru: "Сводные данные инфраструктуры",
    en: "Infrastructure Summary Analytics",
    zh: "基础设施综合数据析"
  },
  "Активные Объекты": {
    ru: "Активные Объекты",
    en: "Active Locations",
    zh: "活跃分部地点"
  },
  "Сетевые Устройства": {
    ru: "Сетевые Устройства",
    en: "Network Devices",
    zh: "网络端点设备"
  },
  "Компьютеры и ПК": {
    ru: "Компьютеры и ПК",
    en: "Workstations & PCs",
    zh: "台式机与电脑"
  },
  "Штат Сотрудников": {
    ru: "Штат Сотрудников",
    en: "Active Staff",
    zh: "在职员工总数"
  },
  "Позиций на складе": {
    ru: "Позиций на складе",
    en: "Warehouse Items",
    zh: "在库库存物品"
  },
  "На сумму": {
    ru: "На сумму",
    en: "Total Valuation",
    zh: "库存总估值"
  },
  "Распределение по статусам": {
    ru: "Распределение по статусам",
    en: "Status Distribution Chart",
    zh: "资产状态分布图"
  },
  "Категории оборудования": {
    ru: "Категории оборудования",
    en: "Equipment Category Share",
    zh: "设备类别份额"
  },
  "Поступления на склад": {
    ru: "Поступления на склад",
    en: "Stock Inbound Log",
    zh: "仓库入库日志"
  },
  "Списания ТМЦ": {
    ru: "Списания ТМЦ",
    en: "Stock Outbound Log",
    zh: "材料报废日志"
  },
  "Последние действия в системе": {
    ru: "Последние действия в системе",
    en: "Recent System Events Log",
    zh: "系统最近的操作日志"
  },
  "Добро пожаловать": {
    ru: "Добро пожаловать",
    en: "Welcome",
    zh: "欢迎"
  },
  "Обзор состояния вашей инфраструктуры на сегодня": {
    ru: "Обзор состояния вашей инфраструктуры на сегодня",
    en: "Overview of your infrastructure status for today",
    zh: "今日基础设施状态概览"
  },
  "Динамика оборудования": {
    ru: "Динамика оборудования",
    en: "Equipment dynamics",
    zh: "设备动态"
  },
  "Статусы оборудования": {
    ru: "Статусы оборудования",
    en: "Equipment statuses",
    zh: "设备状态"
  },
  "Требуют внимания": {
    ru: "Требуют внимания",
    en: "Requires attention",
    zh: "需要关注"
  },
  "Последнее обновление": {
    ru: "Последнее обновление",
    en: "Last updated",
    zh: "最后更新"
  },
  "сегодня": {
    ru: "сегодня",
    en: "today",
    zh: "今天"
  },
  "Всего единиц": {
    ru: "Всего единиц",
    en: "Total units",
    zh: "总数量"
  },
  "Выдано": {
    ru: "Выдано",
    en: "Issued",
    zh: "已发放"
  },
  "Последние действия": {
    ru: "Последние действия",
    en: "Recent actions",
    zh: "最近操作"
  },
  "Оборудование по объектам": {
    ru: "Оборудование по объектам",
    en: "Equipment by location",
    zh: "按地点的设备"
  },
  "Проверено": {
    ru: "Проверено",
    en: "Checked",
    zh: "已核对"
  },
  "Осталось": {
    ru: "Осталось",
    en: "Remaining",
    zh: "剩余"
  },
  "Объектов": {
    ru: "Объектов",
    en: "Locations",
    zh: "地点数"
  },
  "Перейти к инвентаризации": {
    ru: "Перейти к инвентаризации",
    en: "Go to inventory",
    zh: "前往盘点"
  },
  "Нет запланированных инвентаризаций": {
    ru: "Нет запланированных инвентаризаций",
    en: "No scheduled inventories",
    zh: "暂无计划的盘点"
  },
  "Кто принимает:": {
    ru: "Кто принимает:",
    en: "Accepted by:",
    zh: "验收人："
  },
  "Все действия": {
    ru: "Все действия",
    en: "All actions",
    zh: "全部操作"
  },
  "Перейти к сетевому оборудованию": {
    ru: "Перейти к сетевому оборудованию",
    en: "Go to network equipment",
    zh: "前往网络设备"
  },
  "Отпуск": {
    ru: "Отпуск",
    en: "On leave",
    zh: "休假"
  },
  "Системные блоки": {
    ru: "Системные блоки",
    en: "Desktop PCs",
    zh: "台式机"
  },
  "Язык": {
    ru: "Язык",
    en: "Language",
    zh: "语言"
  },
  "Квартал": {
    ru: "Квартал",
    en: "Quarter",
    zh: "季度"
  },
  "Месяц": {
    ru: "Месяц",
    en: "Month",
    zh: "月"
  },
  "Год": {
    ru: "Год",
    en: "Year",
    zh: "年"
  },
  "Прогресс": {
    ru: "Прогресс",
    en: "Progress",
    zh: "进度"
  },
  "за период": {
    ru: "за период",
    en: "for period",
    zh: "本期"
  },
  "Добавлено": {
    ru: "Добавлено",
    en: "Added",
    zh: "新增"
  },
  "Всего": {
    ru: "Всего",
    en: "Total",
    zh: "总计"
  },
  "Период": {
    ru: "Период",
    en: "Period",
    zh: "周期"
  },
  "Смотреть все": {
    ru: "Смотреть все",
    en: "View all",
    zh: "查看全部"
  },
  "Нет срочных уведомлений": {
    ru: "Нет срочных уведомлений",
    en: "No urgent notifications",
    zh: "暂无紧急通知"
  },
  "Журнал пуст": {
    ru: "Журнал пуст",
    en: "Activity log is empty",
    zh: "日志为空"
  },
  "позиций": {
    ru: "позиций",
    en: "items",
    zh: "项"
  },
  "Перейти на склад": {
    ru: "Перейти на склад",
    en: "Go to warehouse",
    zh: "前往仓库"
  },
  "Работа": {
    ru: "Работа",
    en: "Working",
    zh: "在岗"
  },
  "Нет данных": {
    ru: "Нет данных",
    en: "No data",
    zh: "暂无数据"
  },
  "Не завершена инвентаризация": {
    ru: "Не завершена инвентаризация",
    en: "Inventory not completed",
    zh: "盘点未完成"
  },
  "Осталось проверить": {
    ru: "Осталось проверить",
    en: "Remaining to check",
    zh: "待核对"
  },
  "Гарантия истекает через {n} дней": {
    ru: "Гарантия истекает через {n} дней",
    en: "Warranty expires in {n} days",
    zh: "保修将在 {n} 天后到期"
  },
  "Истекает гарантия": {
    ru: "Истекает гарантия",
    en: "Warranty expiring",
    zh: "保修即将到期"
  },
  "Инв. №": {
    ru: "Инв. №",
    en: "Inv. No.",
    zh: "资产编号"
  },
  "Вчера": {
    ru: "Вчера",
    en: "Yesterday",
    zh: "昨天"
  },
  "Аудит завершен": {
    ru: "Аудит завершен",
    en: "Audit completed",
    zh: "审计已完成"
  },
  "Успешно завершена инвентаризация ID: {id}. Выявлено {n} расхождений.": {
    ru: "Успешно завершена инвентаризация ID: {id}. Выявлено {n} расхождений.",
    en: "Inventory completed successfully. ID: {id}. {n} discrepancies found.",
    zh: "盘点已成功完成。ID：{id}。发现 {n} 处差异。"
  },
  "Удалена инвентаризация": {
    ru: "Удалена инвентаризация",
    en: "Inventory audit deleted",
    zh: "盘点记录已删除"
  },
  "Из базы удалена инвентаризационная проверка \"{title}\" (ID: {id})": {
    ru: "Из базы удалена инвентаризационная проверка \"{title}\" (ID: {id})",
    en: "Inventory audit \"{title}\" removed from database (ID: {id})",
    zh: "已从数据库删除盘点记录 \"{title}\"（ID：{id}）"
  },
  "Начата инвентаризационная проверка \"{title}\" (Объект: {obj})": {
    ru: "Начата инвентаризационная проверка \"{title}\" (Объект: {obj})",
    en: "Inventory audit started: \"{title}\" (Location: {obj})",
    zh: "已开始盘点：\"{title}\"（地点：{obj}）"
  },
  "Запущен аудит": {
    ru: "Запущен аудит",
    en: "Audit started",
    zh: "审计已启动"
  },

  // Locations / Objects view
  "Учет объектов и филиалов": {
    ru: "Учет объектов и филиалов",
    en: "Location & Branch Directory",
    zh: "地点与分支机构账单"
  },
  "Добавить новый объект": {
    ru: "Добавить новый объект",
    en: "Add New Location",
    zh: "添加新地点支部"
  },
  "Название объекта": {
    ru: "Название объекта",
    en: "Location Title",
    zh: "地点名称"
  },
  "Адрес объекта": {
    ru: "Адрес объекта",
    en: "Physical Address",
    zh: "地点物理地址"
  },
  "Устройства": {
    ru: "Устройства",
    en: "Devices",
    zh: "台设备"
  },
  "Сетевое": {
    ru: "Сетевое",
    en: "Network",
    zh: "台网络"
  },
  "Детали": {
    ru: "Детали",
    en: "Details",
    zh: "详细内容"
  },

  // Computers View
  "Реестр компьютерного оборудования": {
    ru: "Реестр компьютерного оборудования",
    en: "Workstation & Computer Registry",
    zh: "计算机与台式设备登记册"
  },
  "Экспорт в CSV": {
    ru: "Экспорт в CSV",
    en: "Export CSV",
    zh: "导出 CSV"
  },
  "Добавить компьютер": {
    ru: "Добавить компьютер",
    en: "Add Computer",
    zh: "添加计算机"
  },
  "Категория": {
    ru: "Категория",
    en: "Category",
    zh: "类别"
  },
  "Модель": {
    ru: "Модель",
    en: "Model",
    zh: "型号"
  },
  "Инвентарный №": {
    ru: "Инвентарный №",
    en: "Asset ID #",
    zh: "资产盘点编号"
  },
  "Сотрудник": {
    ru: "Сотрудник",
    en: "Assignee / Employee",
    zh: "领用人 / 职员"
  },
  "Расположение": {
    ru: "Расположение",
    en: "Physical Depot",
    zh: "所在地点位置"
  },
  "Компоненты": {
    ru: "Компоненты",
    en: "Components",
    zh: "更换的组件"
  },
  "Картриджи": {
    ru: "Картриджи",
    en: "Printer cartridges",
    zh: "打印机墨盒"
  },

  // Network View
  "Сетевая инфраструктура объектов": {
    ru: "Сетевая инфраструктура объектов",
    en: "Network Infrastructure Hub",
    zh: "分部网络基础设施"
  },
  "Добавить сетевое устройство": {
    ru: "Добавить сетевое устройство",
    en: "Add Network Device",
    zh: "添加网络设备"
  },
  "Название устройства": {
    ru: "Название устройства",
    en: "Device Name",
    zh: "网络设备名称"
  },
  "Тип устройства": {
    ru: "Тип устройства",
    en: "Device Specification",
    zh: "网络设备类型"
  },
  "IP-адрес": {
    ru: "IP-адрес",
    en: "IP Address",
    zh: "IP 网络地址"
  },
  "Кол-во портов": {
    ru: "Кол-во портов",
    en: "Ports Count",
    zh: "物理网口数"
  },
  "Поиск по названию или IP-адресу...": {
    ru: "Поиск по названию или IP-адресу...",
    en: "Search by name or IP address...",
    zh: "按名称或 IP 地址搜索..."
  },
  "Добавить сетевое оборудование": {
    ru: "Добавить сетевое оборудование",
    en: "Add Network Equipment",
    zh: "添加网络设备"
  },
  "Редактировать сетевое оборудование": {
    ru: "Редактировать сетевое оборудование",
    en: "Edit Network Equipment",
    zh: "编辑网络设备"
  },
  "Все типы": {
    ru: "Все типы",
    en: "All Types",
    zh: "所有类型"
  },
  "Все объекты": {
    ru: "Все объекты",
    en: "All Locations",
    zh: "所有地点"
  },
  "Коммутаторы": {
    ru: "Коммутаторы",
    en: "Switches",
    zh: "交换机"
  },
  "Маршрутизаторы": {
    ru: "Маршрутизаторы",
    en: "Routers",
    zh: "路由器"
  },
  "Точки доступа": {
    ru: "Точки доступа",
    en: "Access Points",
    zh: "接入点"
  },
  "Локация / Объект": {
    ru: "Локация / Объект",
    en: "Location / Object",
    zh: "地点 / 对象"
  },
  "Устройства не найдены по заданным критериям фильтрации": {
    ru: "Устройства не найдены по заданным критериям фильтрации",
    en: "No devices found matching the specified filters",
    zh: "没有找到符合指定筛选条件的设备"
  },
  "Например, HPE Aruba 2930F": {
    ru: "Например, HPE Aruba 2930F",
    en: "For example, HPE Aruba 2930F",
    zh: "例如 HPE Aruba 2930F"
  },
  "Разместить на объекте": {
    ru: "Разместить на объекте",
    en: "Place at Location",
    zh: "部署在地点"
  },
  "Например, 10.0.1.1": {
    ru: "Например, 10.0.1.1",
    en: "For example, 10.0.1.1",
    zh: "例如 10.0.1.1"
  },
  "Количество сетевых портов": {
    ru: "Количество сетевых портов",
    en: "Number of Network Ports",
    zh: "网络端口数量"
  },
  "4 порта": {
    ru: "4 порта",
    en: "4 ports",
    zh: "4 端口"
  },
  "5 портов": {
    ru: "5 портов",
    en: "5 ports",
    zh: "5 端口"
  },
  "8 портов": {
    ru: "8 портов",
    en: "8 ports",
    zh: "8 端口"
  },
  "12 портов": {
    ru: "12 портов",
    en: "12 ports",
    zh: "12 端口"
  },
  "16 портов": {
    ru: "16 портов",
    en: "16 ports",
    zh: "16 端口"
  },
  "24 порта": {
    ru: "24 порта",
    en: "24 ports",
    zh: "24 端口"
  },
  "48 портов": {
    ru: "48 портов",
    en: "48 ports",
    zh: "48 端口"
  },
  "96 портов": {
    ru: "96 портов",
    en: "96 ports",
    zh: "96 端口"
  },
  "Другое количество...": {
    ru: "Другое количество...",
    en: "Other quantity...",
    zh: "其他数量..."
  },
  "Укажите число": {
    ru: "Укажите число",
    en: "Specify Number",
    zh: "指定数字"
  },
  "Настройка состояния портов": {
    ru: "Настройка состояния портов",
    en: "Port Status Configuration",
    zh: "端口状态配置"
  },
  "Включен (зеленый)": {
    ru: "Включен (зеленый)",
    en: "Enabled (green)",
    zh: "已启用 (绿色)"
  },
  "Выключен (серый)": {
    ru: "Выключен (серый)",
    en: "Disabled (gray)",
    zh: "已禁用 (灰色)"
  },
  "Поврежден (красный)": {
    ru: "Поврежден (красный)",
    en: "Damaged (red)",
    zh: "已损坏 (红色)"
  },
  "Порт": {
    ru: "Порт",
    en: "Port",
    zh: "端口"
  },
  "Выключен / Отключен": {
    ru: "Выключен / Отключен",
    en: "Disabled / Disconnected",
    zh: "禁用 / 断开连接"
  },
  "Включен / Работает": {
    ru: "Включен / Работает",
    en: "Enabled / Active",
    zh: "启用 / 在线"
  },
  "Поврежден": {
    ru: "Поврежден",
    en: "Damaged",
    zh: "损坏"
  },
  "Создать устройство": {
    ru: "Создать устройство",
    en: "Create Device",
    zh: "创建设备"
  },

  // Employees View
  "Штатные сотрудники организации": {
    ru: "Штатные сотрудники организации",
    en: "Corporate Employees Directory",
    zh: "集团及部门在职员工"
  },
  "ФИО сотрудника": {
    ru: "ФИО сотрудника",
    en: "Employee Full Name",
    zh: "员工真实姓名"
  },
  "Должность": {
    ru: "Должность",
    en: "Corporate Role",
    zh: "所任公司职务"
  },
  "Отдел": {
    ru: "Отдел",
    en: "Department",
    zh: "所属职能部门"
  },
  "Закрепленное оборудование": {
    ru: "Закрепленное оборудование",
    en: "Issued Assets",
    zh: "领用的固定资产"
  },
  "Добавить сотрудника": {
    ru: "Добавить сотрудника",
    en: "Add Employee",
    zh: "添加新员工"
  },

  // Warehouse View
  "Учет материально-технических ценностей (Склад)": {
    ru: "Учет материально-технических ценностей (Склад)",
    en: "Warehouse Stock & Logistics",
    zh: "仓库材料及固定资产物资"
  },
  "Добавить позицию": {
    ru: "Добавить позицию",
    en: "Add Stock Item",
    zh: "增加库存物资"
  },
  "Цена за единицу (руб)": {
    ru: "Цена за единицу (руб)",
    en: "Unit Cost (RUB)",
    zh: "单价 (卢布)"
  },
  "Общая стоимость": {
    ru: "Общая стоимость",
    en: "Total Cost",
    zh: "总成本"
  },
  "Количество": {
    ru: "Количество",
    en: "Qty",
    zh: "数量"
  },
  "Название позиции": {
    ru: "Название позиции",
    en: "Item Designation",
    zh: "物资项目名称"
  },

  // Warranties View
  "Мониторинг гарантийных обязательств": {
    ru: "Мониторинг гарантийных обязательств",
    en: "Warranty Period Monitor",
    zh: "固定资产保修期监视"
  },
  "Добавить гарантию": {
    ru: "Добавить гарантию",
    en: "Add Warranty",
    zh: "增加保修合同"
  },
  "Осталось дней": {
    ru: "Осталось дней",
    en: "Days Remaining",
    zh: "剩余可用天数"
  },

  // Audits View
  "Инвентаризационные аудиты оборудования": {
    ru: "Инвентаризационные аудиты оборудования",
    en: "Inventory Audit Sessions",
    zh: "对账与盘点审计任务"
  },
  "Новый аудит": {
    ru: "Новый аудит",
    en: "Create Audit",
    zh: "新建盘点审计"
  },
  "Проверено позиций": {
    ru: "Проверено позиций",
    en: "Audited items",
    zh: "审计已查资产"
  },
  "Найдено расхождений": {
    ru: "Найдено расхождений",
    en: "Mismatches",
    zh: "异常差异数量"
  },

  // Reports View
  "Отчетность и аналитические срезы": {
    ru: "Отчетность и аналитические срезы",
    en: "Corporate Reports & Infrastructure Analytics",
    zh: "报告中心与架构维度剖"
  },
  "Сводный отчет": {
    ru: "Сводный отчет",
    en: "Consolidated Master Report",
    zh: "综合对账全报表"
  },
  "Экспорт во все форматы": {
    ru: "Экспорт во все форматы",
    en: "Bulk Export Directory",
    zh: "导出各种数据格式"
  },

  // Cybersecurity View
  "Контроль информационной безопасности": {
    ru: "Контроль информационной безопасности",
    en: "Cybersecurity & Vulnerability Controller",
    zh: "网络信息与端点安全管理器"
  },
  "Сканировать сеть": {
    ru: "Сканировать сеть",
    en: "Start Grid Scan",
    zh: "启动网络安全扫描"
  },
  "Состояние защиты": {
    ru: "Состояние защиты",
    en: "Overall Protection Grade",
    zh: "网络边界整体防御等级"
  },

  // Settings view
  "Настройки рабочей зоны и брендинга": {
    ru: "Настройки рабочей зоны и брендинга",
    en: "Workspace Workspace Configurations & White-labeling",
    zh: "工作空间定制与品牌化配置"
  },
  "Язык платформы (Language)": {
    ru: "Язык платформы",
    en: "Platform Language",
    zh: "平台系统语言"
  },
  "Выберите основной язык интерфейса": {
    ru: "Выберите основной язык интерфейса",
    en: "Select main application interface language",
    zh: "选择平台系统的主要界面语言"
  },
  "Управление пользователями": {
    ru: "Управление пользователями",
    en: "System Users & Access Controls",
    zh: "用户管理与权限网关"
  },
  "СБ-защищенный режим": {
    ru: "СБ-защищенный режим",
    en: "Security Compliance Mode",
    zh: "安全局合规防护模式"
  },
  "Резервное копирование и перенос данных платформы": {
    ru: "Резервное копирование и перенос данных платформы",
    en: "Platform Backup Engine & Database Portability",
    zh: "平台级备份恢复与数据转移引擎"
  },
  "Центр управления обновлениями Vicariustab": {
    ru: "Центр управления обновлениями Vicariustab",
    en: "Vicariustab Platform Core Updater",
    zh: "Vicariustab系统内核更新管理器"
  },
  "Экспортировать данные платформы (без ключа активации)": {
    ru: "Экспортировать данные платформы (без ключа активации)",
    en: "Export Platform DB (Excluding Activation Keys)",
    zh: "导出业务数据库 (不包含注册密钥)"
  },
  "Выйти из системы": {
    ru: "Выйти из системы",
    en: "Log Out of System",
    zh: "退出安全登录"
  },
  "Лицензия успешно активирована": {
    ru: "Лицензия успешно активирована",
    en: "License activated successfully",
    zh: "注册证书已成功激活"
  },
  "Сбросить демонстрационную БД": {
    ru: "Сбросить демонстрационную БД",
    en: "Factory Reset Demo DB",
    zh: "清空重置演示数据库"
  },
  "ДОСТУП К СИСТЕМЕ ПРИОСТАНОВЛЕН": {
    ru: "ДОСТУП К СИСТЕМЕ ПРИОСТАНОВЛЕН",
    en: "SYSTEM WORKSPACE SUSPENDED",
    zh: "系统工作区访问已暂停"
  },
  "Ознакомительный (30 дней) или годовой период использования ПО завершен.": {
    ru: "Ознакомительный (30 дней) или годовой период использования ПО завершен.",
    en: "Evaluation period (30 days) or annual subscription cycle has run its course.",
    zh: "资产评估试用周期（30天）或年度软件授权已到期终止。"
  },
  "❌ Лицензионный статус не подтвержден или срок действия исчерпан.": {
    ru: "❌ Лицензионный статус не подтвержден или срок действия исчерпан.",
    en: "❌ Software status unverified or operating period has expired.",
    zh: "❌ 系统运行证书未被确认或到期状态失效。"
  },
  "Для продолжения работы введите действующий лицензионный ключ активации (UTKIN-YYYY-HASH).": {
    ru: "Для продолжения работы введите действующий лицензионный ключ активации (UTKIN-YYYY-HASH).",
    en: "To resume asset inventory database services, input a valid license code (UTKIN-YYYY-HASH).",
    zh: "若要恢复正常台账功能，请在此输入官方发行的软件密钥（UTKIN-YYYY-HASH）。"
  },
  "Уникальный Код Запроса Лицензии": {
    ru: "Уникальный Код Запроса Лицензии",
    en: "Unique Machine Request Code",
    zh: "硬终端唯一产品授权请求码"
  },
  "Лицензионный Ключ Активации": {
    ru: "Лицензионный Ключ Активации",
    en: "Product License Key",
    zh: "注册证书激活密钥"
  },
  "Разблокировать систему": {
    ru: "Разблокировать систему",
    en: "Unlock Workstation Console",
    zh: "一键激活并进入系统"
  },
  "Для получения или покупки годовой лицензии свяжитесь по почте:": {
    ru: "Для получения или покупки годовой лицензии свяжитесь по почте:",
    en: "To obtain or renew annual cloud subscription licenses, please email:",
    zh: "如有采购延期或全额支持需求，请联络官方邮箱："
  },
  "Копировать": {
    ru: "Копировать",
    en: "Copy Request Code",
    zh: "点击复制"
  },
  "Скопировано": {
    ru: "Скопировано",
    en: "Copied",
    zh: "已复制"
  },
  "Код запроса лицензии успешно скопирован в буфер обмена!": {
    ru: "Код запроса лицензии успешно скопирован в буфер обмена!",
    en: "Machine request code has been copied to clipboard!",
    zh: "硬终端激活请求码已顺利复制到系统剪切板！"
  },
  "Введен некорректный ключ активации! Обратитесь по адресу vicariustab@icloud.com за новым ключом.": {
    ru: "Введен некорректный ключ активации! Обратитесь по адресу vicariustab@icloud.com за новым ключом.",
    en: "Invalid activation key entered! Please contact support at vicariustab@icloud.com.",
    zh: "您键入的密匙字符不合规，如有疑问请联络 vicariustab@icloud.com。"
  },
  "Ознакомительный период (30 дней)": {
    ru: "Ознакомительный период (30 дней)",
    en: "Evaluation trial window (30 days)",
    zh: "全功能试用红利期（30个日历天）"
  },
  "Осталось дней до истечения:": {
    ru: "Осталось дней до истечения:",
    en: "Remaining trial period:",
    zh: "系统试用寿命倒计时："
  },
  "из": {
    ru: "из",
    en: "of",
    zh: "天，已用"
  },
  "После окончания ознакомительного периода доступ к системе будет автоматически заблокирован до момента активации.": {
    ru: "После окончания ознакомительного периода доступ к системе будет автоматически заблокирован до момента активации.",
    en: "System is configured to suspend read/write capabilities upon trial completion prior to key entry.",
    zh: "试用周期届满之后，如果不注入激活密匙，整个台账底表将被自动强制锁定而无法录入和修改。"
  },
  "ВВЕСТИ ЛИЦЕНЗИОННЫЙ КЛЮЧ АКТИВАЦИИ": {
    ru: "ВВЕСТИ ЛИЦЕНЗИОННЫЙ КЛЮЧ АКТИВАЦИИ",
    en: "ENTER REGISTERED ACTIVATION CLUES",
    zh: "输 入 登 记 授 权 密 钥"
  },
  "Активировать": {
    ru: "Активировать",
    en: "Activate Vicariustab Code",
    zh: "确认激活"
  },
  "ОБНАРУЖЕНО ВМЕШАТЕЛЬСТВО В СИСТЕМУ": {
    ru: "ОБНАРУЖЕНО ВМЕШАТЕЛЬСТВО В СИСТЕМУ",
    en: "LOCAL RUNTIME MANIPULATION ERROR!",
    zh: "【严重警报】检测到本地数据库非法篡改！"
  },
  "Внимание! Обнаружено несанкционированное изменение локальной базы данных демо-периода. Работа системы приостановлена в целях защиты целостности данных. Пожалуйста, введите официальный лицензионный ключ для восстановления доступа.": {
    ru: "Внимание! Обнаружено несанкционированное изменение локальной базы данных демо-периода. Работа системы приостановлена в целях защиты целостности данных. Пожалуйста, введите официальный лицензионный ключ для восстановления доступа.",
    en: "Warning! Local evaluation database clock modification attempt detected. Operation suspended to protect telemetry data and integrity rules. Place verified code to override this lock.",
    zh: "警告！安全芯片监测到有人试图非法篡改试用时间标记。为了抵御非授权写入、竭诚维护企业台账数据高可用完整性，主程序已被强制挂起挂锁，请出示官方购买的数字签名Key用以解锁恢复。"
  },
  "Служба защиты временно заблокировала попытки ввода ключа из-за частых ошибок (перебор). Повторите попытку через:": {
    ru: "Служба защиты временно заблокировала попытки ввода ключа из-за частых ошибок (перебор). Повторите попытку через:",
    en: "Protection module has temporarily locked input slots due to multiple key authentication failures. Cooling down for:",
    zh: "安全套接字已敏锐监测到高频碰撞密码（暴力破解），目前输入接口已被临时拦截熔断，冷静时间倒计时："
  },
  "сек.": {
    ru: "сек.",
    en: "sec.",
    zh: "秒"
  },
  "Все права защищены": {
    ru: "Все права защищены",
    en: "All Rights Reserved",
    zh: "著作版权所有"
  },
  "Введено некорректный ключ активации!": {
    ru: "Введено некорректный ключ активации!",
    en: "Specified product license is incorrect!",
    zh: "指定的密匙信息验证不予通过！"
  },
  "Общие системные параметры": {
    ru: "Общие системные параметры",
    en: "General Systems Settings",
    zh: "常规系统参数设置"
  },
  "Настройки успешно сохранены в локальном диске!": {
    ru: "Настройки успешно сохранены в локальном диске!",
    en: "Settings successfully saved to local device!",
    zh: "设置已成功保存到本地存储中！"
  },
  "Личные настройки (язык, дашборд) сохраняются на сервере в вашем профиле и доступны с любого устройства.": {
    ru: "Личные настройки (язык, дашборд) сохраняются на сервере в вашем профиле и доступны с любого устройства.",
    en: "Personal settings (language, dashboard) are saved on the server in your profile and available on any device.",
    zh: "个人设置（语言、仪表盘）保存在服务器上的您的个人资料中，可在任何设备上使用。"
  },

  // Subheaders & details
  "Администратор": {
    ru: "Администратор",
    en: "Administrator",
    zh: "管理员"
  },
  "Редактирование": {
    ru: "Редактирование",
    en: "Editor Mode",
    zh: "记录编辑员"
  },
  "Просмотр": {
    ru: "Просмотр",
    en: "Auditor Viewer",
    zh: "安全审计员"
  },
  "Вход в учетную запись": {
    ru: "Вход в учетную запись",
    en: "Secure Log In Gateway",
    zh: "计算机安全认证网关"
  },
  "Введите пароль": {
    ru: "Введите пароль",
    en: "Enter authorization password",
    zh: "输入身份认证口令"
  },
  "Неверный пароль.": {
    ru: "Неверный пароль.",
    en: "Invalid credential password.",
    zh: "输入认证验证码错误。"
  },
  "Войти": {
    ru: "Войти",
    en: "Sign In",
    zh: "执行登入"
  },
  "Ноутбук": {
    ru: "Ноутбук",
    en: "Laptop",
    zh: "便携式笔记本"
  },
  "ПК": {
    ru: "ПК",
    en: "Desktop PC",
    zh: "台式工作站"
  },
  "Монитор": {
    ru: "Монитор",
    en: "Monitor",
    zh: "液晶显示器"
  },
  "Видеонаблюдение": {
    ru: "Видеонаблюдение",
    en: "CCTV",
    zh: "视频监控"
  },
  "Расходники": {
    ru: "Расходники",
    en: "Consumables",
    zh: "耗材部件"
  },
  "Другое": {
    ru: "Другое",
    en: "Other IT assets",
    zh: "其他 IT 资产"
  },
  "Маршрутизатор": {
    ru: "Маршрутизатор",
    en: "Router",
    zh: "路由器"
  },
  "Коммутатор": {
    ru: "Коммутатор",
    en: "Switch",
    zh: "交换机"
  },
  "Точка доступа": {
    ru: "Точка доступа",
    en: "Wireless Access Point",
    zh: "无线AP接点"
  },
  "Номер счета и число": {
    ru: "Номер счета и число",
    en: "Invoice number and date",
    zh: "发票号码和日期"
  },
  "Модель устройства / ноутбука": {
    ru: "Модель устройства / ноутбука",
    en: "Device / Laptop Model",
    zh: "设备/笔记本型号"
  },
  "Модель устройства": {
    ru: "Модель устройства",
    en: "Device model",
    zh: "设备型号"
  },
  "Серийный номер устройства": {
    ru: "Серийный номер устройства",
    en: "Device Serial Number",
    zh: "设备序列号"
  },
  "Процессор (Модель)": {
    ru: "Процессор (Модель)",
    en: "Processor (Model)",
    zh: "处理器 (型号)"
  },
  "Процессор (Серийный №)": {
    ru: "Процессор (Серийный №)",
    en: "Processor (Serial No.)",
    zh: "处理器 (序列号)"
  },
  "Материнская плата (Модель)": {
    ru: "Материнская плата (Модель)",
    en: "Motherboard (Model)",
    zh: "主板 (型号)"
  },
  "Материнская плата (Серийный №)": {
    ru: "Материнская плата (Серийный №)",
    en: "Motherboard (Serial No.)",
    zh: "主板 (序列号)"
  },
  "Оперативная память": {
    ru: "Оперативная память",
    en: "RAM",
    zh: "内存 (RAM)"
  },
  "Оперативная память (Серийный №)": {
    ru: "Оперативная память (Серийный №)",
    en: "RAM (Serial No.)",
    zh: "内存 (序列号)"
  },
  "Накопитель (SSD / HDD)": {
    ru: "Накопитель (SSD / HDD)",
    en: "Storage (SSD / HDD)",
    zh: "存储 (SSD / HDD)"
  },
  "Накопитель (Серийный №)": {
    ru: "Накопитель (Серийный №)",
    en: "Storage (Serial No.)",
    zh: "存储 (序列号)"
  },
  "Видеокарта": {
    ru: "Видеокарта",
    en: "Graphics Card",
    zh: "显卡 (GPU)"
  },
  "Видеокарта (Серийный №)": {
    ru: "Видеокарта (Серийный №)",
    en: "Graphics Card (Serial No.)",
    zh: "显卡 (序列号)"
  },
  "Блок питания": {
    ru: "Блок питания",
    en: "Power Supply",
    zh: "电源 (PSU)"
  },
  "Блок питания (Серийный №)": {
    ru: "Блок питания (Серийный №)",
    en: "Power Supply (Serial No.)",
    zh: "电源 (序列号)"
  },
  "Корпус ПК": {
    ru: "Корпус ПК",
    en: "PC Case",
    zh: "机箱 (Case)"
  },
  "Системный блок ПК": {
    ru: "Системный блок ПК",
    en: "Workstation PC",
    zh: "台式电脑主机"
  },
  "Процессор (CPU):": {
    ru: "Процессор (CPU):",
    en: "Processor (CPU):",
    zh: "处理器 (CPU):"
  },
  "Материнская плата:": {
    ru: "Материнская плата:",
    en: "Motherboard:",
    zh: "主板:"
  },
  "Оперативная память (RAM):": {
    ru: "Оперативная память (RAM):",
    en: "RAM:",
    zh: "内存 (RAM):"
  },
  "Накопитель (SSD / HDD):": {
    ru: "Накопитель (SSD / HDD):",
    en: "Storage (SSD / HDD):",
    zh: "存储 (SSD / HDD):"
  },
  "Видеокарта (GPU):": {
    ru: "Видеокарта (GPU):",
    en: "Graphics Card (GPU):",
    zh: "显卡 (GPU):"
  },
  "Блок питания (PSU):": {
    ru: "Блок питания (PSU):",
    en: "Power Supply (PSU):",
    zh: "电源 (PSU):"
  },
  "Не указан": {
    ru: "Не указан",
    en: "Not specified",
    zh: "未指定"
  },
  "Не указана": {
    ru: "Не указана",
    en: "Not specified",
    zh: "未指定"
  },
  "Спецификация комплектующих и документы": {
    ru: "Спецификация комплектующих и документы",
    en: "Hardware Specifications & Documents",
    zh: "硬件规格和文档"
  },
  "Аппаратные компоненты": {
    ru: "Аппаратные компоненты",
    en: "Hardware Components",
    zh: "硬件组件"
  },
  "Корпус (Case):": {
    ru: "Корпус (Case):",
    en: "Case:",
    zh: "机箱 (Case):"
  },
  "Реквизиты документов": {
    ru: "Реквизиты документов",
    en: "Documents Info",
    zh: "单据详情"
  },
  "Оплаченный счет:": {
    ru: "Оплаченный счет:",
    en: "Paid Invoice:",
    zh: "已付账单:"
  },
  "Служебная записка:": {
    ru: "Служебная записка:",
    en: "Internal Memo:",
    zh: "内部呈批件:"
  },
  "Гарантийный талон:": {
    ru: "Гарантийный талон:",
    en: "Warranty Card:",
    zh: "保修凭证:"
  },
  "Счет не прописан": {
    ru: "Счет не прописан",
    en: "Invoice details not specified",
    zh: "未输入账单明细"
  },
  "Реквизиты записки не указаны": {
    ru: "Реквизиты записки не указаны",
    en: "Memo info not specified",
    zh: "未指定批件号"
  },
  "Гарантия не указана": {
    ru: "Гарантия не указана",
    en: "Warranty details not specified",
    zh: "未输入保修期限"
  },
  "Инвентарный номер:": {
    ru: "Инвентарный номер:",
    en: "Inventory number:",
    zh: "资产编号:"
  },
  "Учет картриджей (Принтеры и МФУ)": {
    ru: "Учет картриджей (Принтеры и МФУ)",
    en: "Cartridges Tracking (Printers & MFPs)",
    zh: "耗材墨盒跟踪 (打印机和多功能一体机)"
  },
  "Прикрепленные картриджи не найдены. Вы можете поставить расходники на контроль.": {
    ru: "Прикрепленные картриджи не найдены. Вы можете поставить расходники на контроль.",
    en: "No attached cartridges found. You can monitor consumables.",
    zh: "未找到关联墨盒。您可以添加耗材监控。"
  },
  "Обслуживание:": {
    ru: "Обслуживание:",
    en: "Service:",
    zh: "维护时间:"
  },
  "Списать картридж": {
    ru: "Списать картридж",
    en: "Decommission cartridge",
    zh: "核销耗材"
  },
  "Режим просмотра: Добавление, редактирование объектов и загрузка своих иконок ограничены.": {
    ru: "Режим просмотра: Добавление, редактирование объектов и загрузка своих иконок ограничены.",
    en: "Viewing Mode: Adding, editing objects and uploading custom icons are restricted.",
    zh: "游览模式：添加、编辑对象以及上传自定义图标受到限制。"
  },
  "Поиск объектов...": {
    ru: "Поиск объектов...",
    en: "Search objects...",
    zh: "搜索分部地点..."
  },
  "Добавить объект": {
    ru: "Добавить объект",
    en: "Add Object",
    zh: "增加地点"
  },
  "Филиал": {
    ru: "Филиал",
    en: "Branch",
    zh: "分支机构"
  },
  "Редактировать параметры": {
    ru: "Редактировать параметры",
    en: "Edit Parameters",
    zh: "编辑参数"
  },
  "Удалить объект": {
    ru: "Удалить объект",
    en: "Delete Object",
    zh: "删除地点"
  },
  "Сетевых систем": {
    ru: "Сетевых систем",
    en: "Network Systems",
    zh: "网络系统数量"
  },
  "Компьютеров": {
    ru: "Компьютеров",
    en: "Workstations",
    zh: "电脑数量"
  },
  "Посмотреть подробный паспорт →": {
    ru: "Посмотреть подробный паспорт →",
    en: "View Detailed Passport →",
    zh: "查看详细信息 →"
  },
  "Редактировать локацию/объект": {
    ru: "Редактировать локацию/объект",
    en: "Edit Location/Object",
    zh: "编辑地点/分部"
  },
  "Например, Офис на Мира": {
    ru: "Например, Офис на Мира",
    en: "For example, Office on Mira",
    zh: "例如：和平路办公室"
  },
  "Физический адрес": {
    ru: "Физический адрес",
    en: "Physical Address",
    zh: "物理地址"
  },
  "г. Москва, ул. Примерная, д. 10": {
    ru: "г. Москва, ул. Примерная, д. 10",
    en: "Moscow, Primernaya street, 10",
    zh: "北京市、示范路10号"
  },
  "Иконка или Свой Логотип": {
    ru: "Иконка или Свой Логотип",
    en: "Icon or Custom Logo",
    zh: "选择图标或自定义标志"
  },
  "Загрузить свой значок": {
    ru: "Загрузить свой значок",
    en: "Upload your icon",
    zh: "上传自定义图标"
  },
  "SVG, PNG, JPG (квадратный)": {
    ru: "SVG, PNG, JPG (квадратный)",
    en: "SVG, PNG, JPG (square)",
    zh: "SVG、PNG、JPG (方形图案)"
  },
  "Обзоры": {
    ru: "Обзоры",
    en: "Browse",
    zh: "浏览文件"
  },
  "Сохранить изменения": {
    ru: "Сохранить изменения",
    en: "Save Changes",
    zh: "保存修改"
  },
  "Создать объект": {
    ru: "Создать объект",
    en: "Create Object",
    zh: "创建地点"
  },
  "Ошибка: Загрузка гарантийных талонов ограничена для Вашей роли.": {
    ru: "Ошибка: Загрузка гарантийных талонов ограничена для Вашей роли.",
    en: "Error: Uploading warranty cards is restricted for your role.",
    zh: "错误：您的角色被限制上传保修单卡。"
  },
  "Пожалуйста, выберите файл в формате PDF!": {
    ru: "Пожалуйста, выберите файл в формате PDF!",
    en: "Please select a file in PDF format!",
    zh: "请选择PDF格式的文件！"
  },
  "Ошибка: Удаление файлов ограничено для Вашей роли.": {
    ru: "Ошибка: Удаление файлов ограничено для Вашей роли.",
    en: "Error: Deleting files is restricted for your role.",
    zh: "错误：您的角色被限制删除文件。"
  },
  "Содержимое талона недоступно.": {
    ru: "Содержимое талона недоступно.",
    en: "The contents of the warranty card are unavailable.",
    zh: "保修单卡内容不可用。"
  },
  "Поиск по устройству, инвентарному или провайдеру...": {
    ru: "Поиск по устройству, инвентарному или провайдеру...",
    en: "Search by device, inventory or provider...",
    zh: "按设备、库存号或服务商搜索..."
  },
  "Действует": {
    ru: "Действует",
    en: "Active",
    zh: "有效中"
  },
  "Истекает": {
    ru: "Истекает",
    en: "Expiring",
    zh: "即将过期"
  },
  "Истекла": {
    ru: "Истекла",
    en: "Expired",
    zh: "已过期"
  },
  "Действующая гарантия": {
    ru: "Действующая гарантия",
    en: "Active Warranty",
    zh: "有效保修"
  },
  "Срок истекает (<60 дней)": {
    ru: "Срок истекает (<60 дней)",
    en: "Expiring soon (<60 days)",
    zh: "即将到期（<60天内）"
  },
  "Истекшая гарантия": {
    ru: "Истекшая гарантия",
    en: "Expired Warranty",
    zh: "已过期保修"
  },
  "Оборудование / Спецификация": {
    ru: "Оборудование / Спецификация",
    en: "Equipment / Specification",
    zh: "设备 / 规格"
  },
  "Инв. номер": {
    ru: "Инв. номер",
    en: "Inv. number",
    zh: "资产编号"
  },
  "Провайдер обслуживания": {
    ru: "Провайдер обслуживания",
    en: "Service Provider",
    zh: "服务提供商"
  },
  "Гарантийный талон": {
    ru: "Гарантийный талон",
    en: "Warranty Card",
    zh: "保修单卡"
  },
  "Дата покупки": {
    ru: "Дата покупки",
    en: "Purchase Date",
    zh: "购买日期"
  },
  "Окончание гарантии": {
    ru: "Окончание гарантии",
    en: "Warranty Expiration",
    zh: "保修截止日期"
  },
  "Статус": {
    ru: "Статус",
    en: "Status",
    zh: "状态"
  },
  "Действие": {
    ru: "Действие",
    en: "Actions",
    zh: "操作"
  },
  "Действует (осталось {days} дн.)": {
    ru: "Действует (осталось {days} дн.)",
    en: "Active ({days} days remaining)",
    zh: "有效（剩余 {days} 天）"
  },
  "Истекает (осталось {days} дн.)": {
    ru: "Истекает (осталось {days} дн.)",
    en: "Expiring ({days} days remaining)",
    zh: "即将到期（剩余 {days} 天）"
  },
  "Истекла ({days} дн. назад)": {
    ru: "Истекла ({days} дн. назад)",
    en: "Expired ({days} days ago)",
    zh: "已过期（{days} 天前）"
  },
  "Скачать PDF": {
    ru: "Скачать PDF",
    en: "Download PDF",
    zh: "下载 PDF"
  },
  "Удалить файл?": {
    ru: "Удалить файл?",
    en: "Delete file?",
    zh: "删除文件吗？"
  },
  "Да": {
    ru: "Да",
    en: "Yes",
    zh: "是"
  },
  "Нет": {
    ru: "Нет",
    en: "No",
    zh: "否"
  },
  "Удалить файл": {
    ru: "Удалить файл",
    en: "Delete file",
    zh: "删除文件"
  },
  "Прикрепить PDF": {
    ru: "Прикрепить PDF",
    en: "Attach PDF",
    zh: "上传 PDF"
  },
  "Не прикреплен": {
    ru: "Не прикреплен",
    en: "Not attached",
    zh: "未上传文件"
  },
  "Удалить?": {
    ru: "Удалить?",
    en: "Delete?",
    zh: "删除吗？"
  },
  "Удалить позицию со склада? Связанное оборудование будет удалено из реестра.": {
    ru: "Удалить позицию со склада? Связанное оборудование будет удалено из реестра.",
    en: "Remove this warehouse item? Linked equipment records will also be deleted.",
    zh: "从仓库删除此条目？关联的设备记录也将被删除。"
  },
  "Удалить позицию": {
    ru: "Удалить позицию",
    en: "Delete warehouse item",
    zh: "删除仓库条目"
  },
  "Удалить из гарантии": {
    ru: "Удалить из гарантии",
    en: "Remove from warranty",
    zh: "从保修中移出"
  },
  "Только чтение": {
    ru: "Только чтение",
    en: "Read Only",
    zh: "仅限只读"
  },
  "Редактировать гарантию": {
    ru: "Редактировать гарантию",
    en: "Edit Warranty Details",
    zh: "编辑保修选项"
  },
  "Оборудование:": {
    ru: "Оборудование:",
    en: "Equipment:",
    zh: "设备名称："
  },
  "Инвентарный №:": {
    ru: "Инвентарный №:",
    en: "Inventory No:",
    zh: "库存资产号："
  },
  "Срок гарантии (мес.)": {
    ru: "Срок гарантии (мес.)",
    en: "Warranty period (months)",
    zh: "保修期限（月）"
  },
  "Обслуживающий сервис-провайдер": {
    ru: "Обслуживающий сервис-провайдер",
    en: "Serving Service Provider",
    zh: "保修维护服务商"
  },
  "Скачать оригинальный файл": {
    ru: "Скачать оригинальный файл",
    en: "Download original file",
    zh: "下载原始文件"
  },
  "Убрать талон": {
    ru: "Убрать талон",
    en: "Remove card",
    zh: "移除保修卡"
  },
  "Выбрать PDF-талон": {
    ru: "Выбрать PDF-талон",
    en: "Select PDF card",
    zh: "选择PDF单卡文件"
  },
  "Файл талона отсутствует": {
    ru: "Файл талона отсутствует",
    en: "No card file present",
    zh: "缺少保修卡文件"
  },
  "Интегрированный просмотр документов": {
    ru: "Интегрированный просмотр документов",
    en: "Integrated Document Viewer",
    zh: "安全集成文档预览管理"
  },
  "Документ готов к просмотру": {
    ru: "Документ готов к просмотру",
    en: "Document Ready for Viewing",
    zh: "文件已准备好查阅"
  },
  "Встроенные браузерные плагины PDF блокируются политикой безопасности Chrome внутри защищенного фрейма разработчика.": {
    ru: "Встроенные браузерные плагины PDF блокируются политикой безопасности Chrome внутри защищенного фрейма разработчика.",
    en: "Built-in browser PDF plugins are blocked by Chrome security policies inside the secure developer iframe.",
    zh: "由于由于安全原因，Chrome安全策略会限制在该框架中直接预览PDF文件。"
  },
  "Пожалуйста, откройте документ в новой вкладке или скачайте его. Это безопасно и откроет файл в оригинальном разрешении.": {
    ru: "Пожалуйста, откройте документ в новой вкладке или скачайте его. Это безопасно и откроет файл в оригинальном разрешении.",
    en: "Please open the document in a new tab or download it. This is safe and will display the file in its original resolution.",
    zh: "请在新窗口中打开文件，或者直接下载该文件。这是一个安全的选项，可以直接查阅原始保修文档。"
  },
  "Открыть в новой вкладке": {
    ru: "Открыть в новой вкладке",
    en: "Open in New Tab",
    zh: "在新标签页中打开"
  },
  "Скачать файл (.pdf)": {
    ru: "Скачать файл (.pdf)",
    en: "Download file (.pdf)",
    zh: "直接下载文件 (.pdf)"
  },
  "ТехСпецификация Оборудования": {
    ru: "ТехСпецификация Оборудования",
    en: "Equipment Technical Specification",
    zh: "设备技术规格信息"
  },
  "Система инвентаризации корпорации": {
    ru: "Система инвентаризации корпорации",
    en: "Corporate Inventory System",
    zh: "企业资产库存管理信息系统"
  },
  "Имя файла": {
    ru: "Имя файла",
    en: "File Name",
    zh: "文件名称"
  },
  "Документ-Класс": {
    ru: "Документ-Класс",
    en: "Document Class",
    zh: "文件类型分类"
  },
  "PDF-СПЕЦИФИКАЦИЯ": {
    ru: "PDF-СПЕЦИФИКАЦИЯ",
    en: "PDF SPECIFICATION",
    zh: "PDF 资产保修规格明细"
  },
  "Размер файла": {
    ru: "Размер файла",
    en: "File Size",
    zh: "文件实际大小"
  },
  "Статус гарантийн. службы": {
    ru: "Статус гарантийн. службы",
    en: "Warranty Service Status",
    zh: "售后保修服务安全状态"
  },
  "АКТИВЕН И ПРОВЕРЕН • ОК": {
    ru: "АКТИВЕН И ПРОВЕРЕН • ОК",
    en: "ACTIVE & VERIFIED • OK",
    zh: "已激活并核对安全 • 正常"
  },
  "Гарантийный талон оцифрован и привязан к системе в зашифрованном виде (Base64). Талон доступен для скачивания в любой момент.": {
    ru: "Гарантийный талон оцифрован и привязан к системе в зашифрованном виде (Base64). Талон доступен для скачивания в любой момент.",
    en: "The warranty card is digitized and securely linked to the system in encrypted format (Base64). You can download it at any time.",
    zh: "保修单卡已完成数字化同步，并以安全编码（Base64）格式保存在系统中。您可以随时下载此保修凭证。"
  },
  "База данных: ИТ-Орбита СУБД": {
    ru: "База данных: ИТ-Орбита СУБД",
    en: "Database: IT-Vicariustab DBMS",
    zh: "数据库：IT-Vicariustab 数据库安全层"
  },
  "Система PDF-просмотра • Лист 1 из 1": {
    ru: "Система PDF-просмотра • Лист 1 из 1",
    en: "PDF Viewing System • Page 1 of 1",
    zh: "PDF 在线预览管理系统 • 第 1 页 / 共 1 页"
  },
  "Параметры и конфигурация рабочей среды": {
    ru: "Параметры и конфигурация рабочей среды",
    en: "Workspace Parameters and Configuration",
    zh: "工作区参数与配置"
  },
  "Настройте учетные записи сотрудников, назначьте логины и пароли, измените оформление панели и кастомизируйте иконки.": {
    ru: "Настройте учетные записи сотрудников, назначьте логины и пароли, измените оформление панели и кастомизируйте иконки.",
    en: "Configure employee accounts, assign logins and passwords, change panel styling and customize icons.",
    zh: "配置员工账户，分配登录名和密码，更改面板样式并自定义图标。"
  },
  "Ваш личный профиль": {
    ru: "Ваш личный профиль",
    en: "Your Personal Profile",
    zh: "您的个人资料"
  },
  "Вы вошли как:": {
    ru: "Вы вошли как:",
    en: "You are logged in as:",
    zh: "您已登录为："
  },
  "Права доступа:": {
    ru: "Права доступа:",
    en: "Access rights:",
    zh: "访问权限："
  },
  "Нажмите на аватар, чтобы загрузить своё фото": {
    ru: "Нажмите на аватар, чтобы загрузить своё фото",
    en: "Click your avatar to upload a photo",
    zh: "点击头像上传照片"
  },
  "Сменить свой аватар сотрудника:": {
    ru: "Сменить свой аватар сотрудника:",
    en: "Change employee avatar:",
    zh: "更改员工头像："
  },
  "Ссылка на кастомное фото": {
    ru: "Ссылка на кастомное фото",
    en: "Link to custom image",
    zh: "自定义图片链接"
  },
  "Самостоятельное изменение логина и пароля": {
    ru: "Самостоятельное изменение логина и пароля",
    en: "Change Login and Password Independently",
    zh: "自主更改用户名和密码"
  },
  "Здесь Вы можете изменить свои параметры авторизации без обращения к администратору": {
    ru: "Здесь Вы можете изменить свои параметры авторизации без обращения к администратору",
    en: "Here you can change your authorization credentials without contacting the admin",
    zh: "在此您可以自己更改登录凭证，无需联系管理员"
  },
  "Ваши учетные данные для авторизации успешно обновлены!": {
    ru: "Ваши учетные данные для авторизации успешно обновлены!",
    en: "Your authorization credentials have been successfully updated!",
    zh: "您的登录凭证已成功更新！"
  },
  "Логин для входа": {
    ru: "Логин для входа",
    en: "Login username",
    zh: "登录用户名"
  },
  "Новый пароль": {
    ru: "Новый пароль",
    en: "New password",
    zh: "新密码"
  },
  "Роль доступа (Изменение запрещено)": {
    ru: "Роль доступа (Изменение запрещено)",
    en: "Access role (Changing restricted)",
    zh: "访问角色 (不可自主修改)"
  },
  "Администратор (Полный)": {
    ru: "Администратор (Полный)",
    en: "Administrator (Full)",
    zh: "系统管理员 (全部权限)"
  },
  "Обратите внимание:": {
    ru: "Обратите внимание:",
    en: "Please note:",
    zh: "请注意："
  },
  "Согласно требованиям безопасности, только": {
    ru: "Согласно требованиям безопасности, только",
    en: "According to security requirements, only",
    zh: "根据安全合规审计要求，只有"
  },
  "может изменять уровень прав и ролей доступа для сотрудников.": {
    ru: "может изменять уровень прав и ролей доступа для сотрудников.",
    en: "can change access levels and roles for employees.",
    zh: "可以对员工的系统访问级别以及角色进行调整。"
  },
  "Экспортируйте или импортируйте базу данных в один клик. По соображениям безопасности СБ, лицензионный ключ всегда исключается из резервной копии.": {
    ru: "Экспортируйте или импортируйте базу данных в один клик. По соображениям безопасности СБ, лицензионный ключ всегда исключается из резервной копии.",
    en: "Export or import database with one click. For security compliance, the license activation key is always excluded from backup files.",
    zh: "一键导出或导入数据库。出于安全考虑，备份文件中将排除许可证密钥。"
  },
  "Резервное копирование (Скачивание JSON)": {
    ru: "Резервное копирование (Скачивание JSON)",
    en: "Database Backup (Download JSON)",
    zh: "备份数据存储 (下载 JSON)"
  },
  "Создайте полную резервную копию всех сущностей Вашей платформы Vicariustab (компьютеры, сотрудники, серверы, оргтехника, журналы изменений, аудит). При этом сам лицензионный ключ активации исключается из файла. Это позволяет переносить базу данных на любые другие независимые серверы Vicariustab без дублирования или компрометации Вашей лицензии.": {
    ru: "Создайте полную резервную копию всех сущностей Вашей платформы Vicariustab (компьютеры, сотрудники, серверы, оргтехника, журналы изменений, аудит). При этом сам лицензионный ключ активации исключается из файла. Это позволяет переносить базу данных на любые другие независимые серверы Vicariustab без дублирования или компрометации Вашей лицензии.",
    en: "Create a full backup of all entities of your Vicariustab platform (computers, employees, servers, peripherals, logs, audits). The license key is automatically excluded, allowing database migration to other Vicariustab instances without duplicate key conflicts.",
    zh: "创建 Vicariustab 平台所有实体（计算机、雇员、服务器、办公设备、日志、审计）的完整备份。备份自动排除许可证密钥，可在新实例部署。"
  },
  "Резервная копия полностью автономна и сохраняется на Вашем устройстве в формате JSON.": {
    ru: "Резервная копия полностью автономна и сохраняется на Вашем устройстве в формате JSON.",
    en: "The backup is completely offline and saved to your device in JSON format.",
    zh: "备份文件完全离线，并以 JSON 格式存储到本地设备。"
  },
  "Восстановление из резервной копии": {
    ru: "Восстановление из резервной копии",
    en: "Restore from Backup",
    zh: "从备份中还原"
  },
  "Выберите ранее экспортированный файл резервной копии JSON на локальном диске для мгновенного восстановления структуры организации, сотрудников и оборудования. Внимание: Все текущие локальные записи будут перезаписаны. Ваш текущий ключ активации при этом останется неизменным.": {
    ru: "Выберите ранее экспортированный файл резервной копии JSON на локальном диске для мгновенного восстановления структуры организации, сотрудников и оборудования. Внимание: Все текущие локальные записи будут перезаписаны. Ваш текущий ключ активации при этом останется неизменным.",
    en: "Select a previously exported JSON backup file on your local disk to instantly restore workspace structure, employees, and devices. Warning: All current local entries will be overwritten. Your current activation key will remain intact.",
    zh: "选择从本地导入先前导出的 JSON 备份文件，以即时恢复分部结构、员工和设备。警告：本地当前的全部内容将被覆盖。您的许可证状态将保持不变。"
  },
  "Перетащите сюда или нажмите для выбора JSON файла": {
    ru: "Перетащите сюда или нажмите для выбора JSON файла",
    en: "Drag & drop here or click to select JSON file",
    zh: "拖拽文件到此，或者点击选择本地 JSON"
  },
  "Поддерживаются файлы *.json": {
    ru: "Поддерживаются файлы *.json",
    en: "JSON files supported (*.json)",
    zh: "仅支持扩展名为 *.json 的文件"
  },
  "Пожалуйста, подождите... Выполняется разбор резервной копии и восстановление таблиц...": {
    ru: "Пожалуйста, подождите... Выполняется разбор резервной копии и восстановление таблиц...",
    en: "Please wait... Parsing backup file and restoring database tables...",
    zh: "请稍等... 正在解析备份并恢复数据库表..."
  },
  "Восстановление успешно завершено! Перезапуск платформы для применения...": {
    ru: "Восстановление успешно завершено! Перезапуск платформы для применения...",
    en: "Restore completed successfully! Restarting the platform...",
    zh: "导入还原成功！核心系统即将重启以应用数据..."
  },
  "Не удалось прочитать загруженный файл.": {
    ru: "Не удалось прочитать загруженный файл.",
    en: "Failed to read the uploaded file.",
    zh: "无法读取上传的文件。"
  },
  "Обновите программное ядро платформы в один клик. Поддерживается прямая проверка и обновление из репозитория GitHub или ручная загрузка архива релиза.": {
    ru: "Обновите программное ядро платформы в один клик. Поддерживается прямая проверка и обновление из репозитория GitHub или ручная загрузка архива релиза.",
    en: "Update the software core in one click. Direct code updates from GitHub or manual ZIP archive uploads are supported.",
    zh: "一键升级平台核心。支持直接拉取 GitHub 软件源或手动上传发布版 .ZIP 压缩包。"
  },
  "Версия ядра:": {
    ru: "Версия ядра:",
    en: "Core Version:",
    zh: "核心版本："
  },
  "Параметры и источник сборки": {
    ru: "Параметры и источник сборки",
    en: "Build parameters and source",
    zh: "升级选项及构建源"
  },
  "Репозиторий GitHub": {
    ru: "Репозиторий GitHub",
    en: "GitHub Repository",
    zh: "GitHub 仓库拉取"
  },
  "Архив с GitHub (.zip)": {
    ru: "Архив с GitHub (.zip)",
    en: "GitHub Archive (.zip)",
    zh: "GitHub 离线压缩包 (.zip)"
  },
  "Официальный репозиторий проекта": {
    ru: "Официальный репозиторий проекта",
    en: "Official project repository",
    zh: "项目官方仓库地址"
  },
  "Официальный репозиторий обновлений Vicariustab": {
    ru: "Официальный репозиторий обновлений Vicariustab",
    en: "Official Vicariustab update repository",
    zh: "Vicariustab 官方更新仓库"
  },
  "Выберите ZIP-архив релиза c GitHub": {
    ru: "Выберите ZIP-архив релиза c GitHub",
    en: "Select release ZIP archive from GitHub",
    zh: "选择 GitHub 发布版 ZIP 文件"
  },
  "Нажмите для выбора zip-архива релиза": {
    ru: "Нажмите для выбора zip-архива релиза",
    en: "Click to select release zip archive",
    zh: "点击选择本地 zip 压缩包"
  },
  "Поддерживаются файлы *.zip": {
    ru: "Поддерживаются файлы *.zip",
    en: "ZIP files supported (*.zip)",
    zh: "支持 *.zip 统一规范文件"
  },
  "Внимание: Обновление ядра Vicariustab перезаписывает только программную часть приложения. Ваши локально сохраненные данные, сотрудники, схемы сети и журналы аудита останутся целыми и невредимыми!": {
    ru: "Внимание: Обновление ядра Vicariustab перезаписывает только программную часть приложения. Ваши локально сохраненные данные, сотрудники, схемы сети и журналы аудита останутся целыми и невредимыми!",
    en: "Attention: Core update only overwrites application files. Your locally saved entries, employees, schemas, and audit logs will remain intact!",
    zh: "注意事项：平台升级仅重新构建和覆盖软件的系统程序代码。您的本地数据、关联雇员、网络架构图等一切静态资源都将完整保留！"
  },
  "Выполняется компиляция кода ядра Vicariustab...": {
    ru: "Выполняется компиляция кода ядра Vicariustab...",
    en: "Compiling Vicariustab core code...",
    zh: "正在重新编译 Vicariustab 核心系统代码..."
  },
  "Запустить обновление ядра системы": {
    ru: "Запустить обновление ядра системы",
    en: "Run Core System Update",
    zh: "开始拉取并更新核心系统"
  },
  "Терминал Docker сборщика (Stdout/Stderr)": {
    ru: "Терминал Docker сборщика (Stdout/Stderr)",
    en: "Docker Builder Terminal (Stdout/Stderr)",
    zh: "Docker 沙盒容器终端实时输入输出 (Stdout/Stderr)"
  },
  "Компиляция кода, верификация синтаксиса и перезавод локального приложения в Docker контейнере логируется в реальном времени. При сбоях сборщик автоматически откатит изменения до стабильной версии.": {
    ru: "Компиляция кода, верификация синтаксиса и перезавод локального приложения в Docker контейнере логируется в реальном времени. При сбоях сборщик автоматически откатит изменения до стабильной версии.",
    en: "Code compilation, syntax checks, and restart log are output in real time. On failures, it auto-rolls back to the stable version.",
    zh: "代码编译、语法合规审计及本地容器热重载日志一律实时归档。如发生升级错误，构建管线将自动回滚至先前稳定版本。"
  },
  "Поток вывода транслятора": {
    ru: "Поток вывода транслятора",
    en: "Translator output stream",
    zh: "升级器调试状态输出"
  },
  "Ожидание запуска сессии обновления...": {
    ru: "Ожидание запуска сессии обновления...",
    en: "Waiting for upgrade session to start...",
    zh: "正在等待启动系统更新和调试会话..."
  },
  "Название организации / рабочей зоны": {
    ru: "Название организации / рабочей зоны",
    en: "Organization / Workspace Name",
    zh: "企业或单位名称 / 工作区标识"
  },
  "Email Администратора / Уведомления": {
    ru: "Email Администратора / Уведомления",
    en: "Administrator Email / Notifications",
    zh: "系统管理员邮箱 / 消息推报服务"
  },
  "Ссылка на значок сайта / Favicon (URL)": {
    ru: "Ссылка на значок сайта / Favicon (URL)",
    en: "Favicon URL",
    zh: "站点导航标签叶图标 Favicon (URL)"
  },
  "Значок сайта / Favicon": {
    ru: "Значок сайта / Favicon",
    en: "Site favicon",
    zh: "站点图标 / Favicon"
  },
  "Логотип сайта в верхней панели": {
    ru: "Логотип сайта в верхней панели",
    en: "Top bar logo",
    zh: "顶部栏标志"
  },
  "Логотип навигационной панели": {
    ru: "Логотип навигационной панели",
    en: "Sidebar logo",
    zh: "导航栏标志"
  },
  "Загрузить с компьютера": {
    ru: "Загрузить с компьютера",
    en: "Upload from computer",
    zh: "从电脑上传"
  },
  "PNG, SVG, ICO, WEBP": {
    ru: "PNG, SVG, ICO, WEBP",
    en: "PNG, SVG, ICO and WEBP",
    zh: "PNG、SVG、ICO、WEBP"
  },
  "Ссылка на логотип сайта в верхней панели (URL)": {
    ru: "Ссылка на логотип сайта в верхней панели (URL)",
    en: "Top bar site logo URL",
    zh: "顶部系统顶栏标志 URL 链接 (URL)"
  },
  "Ссылка на логотип навигационной панели (URL)": {
    ru: "Ссылка на логотип навигационной панели (URL)",
    en: "Sidebar logo URL",
    zh: "左侧边导航栏标志 LOGO 链接 (URL)"
  },
  "Кастомизация панели навигации": {
    ru: "Кастомизация панели навигации",
    en: "Sidebar Navigation Styling",
    zh: "导航控制面板个性卡属性装扮"
  },
  "Цвет фона панели навигации": {
    ru: "Цвет фона панели навигации",
    en: "Navigation sidebar background color",
    zh: "左侧导轨背景自定义颜色"
  },
  "Прозрачность панели": {
    ru: "Прозрачность панели",
    en: "Panel transparency",
    zh: "侧边栏透明度比例调整"
  },
  "Снижение прозрачности мягко размывает фон без потери читаемости текста.": {
    ru: "Снижение прозрачности мягко размывает фон без потери читаемости текста.",
    en: "Reducing opacity applies background blur without losing text legibility.",
    zh: "适度降低透明度可在维持文字清晰辨识的前提下，柔和模糊背景。"
  },
  "Ваши текущие права (\"Просмотр\") не позволяют изменять глобальные системные параметры.": {
    ru: "Ваши текущие права (\"Просмотр\") не позволяют изменять глобальные системные параметры.",
    en: "Your role ('Viewer') does not allow changing global parameters.",
    zh: "您当前的普通（\"查看\"）访问角色禁止调控和修改系统属性。"
  },
  "Сохранить системные изменения": {
    ru: "Сохранить системные изменения",
    en: "Save System Parameters",
    zh: "保存全局设置"
  },
  "Обслуживание Базы Данных": {
    ru: "Обслуживание Базы Данных",
    en: "Database Diagnostics & Service",
    zh: "底层数据库管理与维护"
  },
  "Если Вы вносили изменения или случайно удалили элементы, можно восстановить исходные демонстрационные данные (соответствующие Вашему скриншоту) в один клик.": {
    ru: "Если Вы вносили изменения или случайно удалили элементы, можно восстановить исходные демонстрационные данные (соответствующие Вашему скриншоту) в один клик.",
    en: "If you made errors or accidentally deleted any entities, restore the original sample demonstration dataset with one click.",
    zh: "若您在操作中产生错误或意外删除了资产，可一键将其还原重设至内置的预设演示数据。"
  },
  "База данных успешно сброшена!": {
    ru: "База данных успешно сброшена!",
    en: "Database reset successfully!",
    zh: "本地数据库已成功重装覆盖！"
  },
  "Переустановить / Сбросить БД": {
    ru: "Переустановить / Сбросить БД",
    en: "Restore Default Settings",
    zh: "恢复默认设置"
  },
  "Вы уверены? Все текущие изменения (добавленные объекты, оборудование, сотрудники) будут сброшены к демо-данным.": {
    ru: "Вы уверены? Все текущие изменения (добавленные объекты, оборудование, сотрудники) будут сброшены к демо-данным.",
    en: "Are you sure? All current modifications (added objects, workstations, employees) will be replaced with demo entries.",
    zh: "您确定吗？这将清除所有当前本地手动变更（添加的设备、分部和雇员等），覆盖并还原为系统演示预设数据。"
  },
  "Да, Сбросить Все": {
    ru: "Да, Сбросить Все",
    en: "Yes, Reset All",
    zh: "确定，重置一切"
  },
  "Полностью удалить все данные инвентаризации: объекты, сотрудников, оборудование, склад, ПО и аудиты. Учётные записи, лицензия и настройки интерфейса сохранятся.": {
    ru: "Полностью удалить все данные инвентаризации: объекты, сотрудников, оборудование, склад, ПО и аудиты. Учётные записи, лицензия и настройки интерфейса сохранятся.",
    en: "Permanently delete all inventory data: sites, employees, equipment, warehouse, software, and audits. User accounts, license, and UI settings will be kept.",
    zh: "永久删除所有盘点数据：站点、员工、设备、仓库、软件和审计。用户账户、许可证和界面设置将保留。"
  },
  "База данных полностью очищена!": {
    ru: "База данных полностью очищена!",
    en: "Database fully cleared!",
    zh: "数据库已完全清空！"
  },
  "Полностью очистить базу данных": {
    ru: "Полностью очистить базу данных",
    en: "Clear database completely",
    zh: "完全清空数据库"
  },
  "Вы уверены? Будут безвозвратно удалены все объекты, сотрудники, оборудование, склад, ПО и инвентаризации. Учётные записи, лицензия и настройки системы сохранятся.": {
    ru: "Вы уверены? Будут безвозвратно удалены все объекты, сотрудники, оборудование, склад, ПО и инвентаризации. Учётные записи, лицензия и настройки системы сохранятся.",
    en: "Are you sure? All sites, employees, equipment, warehouse, software, and audits will be permanently deleted. User accounts, license, and system settings will be kept.",
    zh: "您确定吗？所有站点、员工、设备、仓库、软件和审计将被永久删除。用户账户、许可证和系统设置将保留。"
  },
  "Да, очистить всё": {
    ru: "Да, очистить всё",
    en: "Yes, clear everything",
    zh: "是的，全部清空"
  },
  "Очистка…": {
    ru: "Очистка…",
    en: "Clearing…",
    zh: "清空中…"
  },
  "Очистка доступна только администратору.": {
    ru: "Очистка доступна только администратору.",
    en: "Only an administrator can clear the database.",
    zh: "仅管理员可以清空数据库。"
  },
  "Не удалось очистить базу данных": {
    ru: "Не удалось очистить базу данных",
    en: "Failed to clear the database",
    zh: "无法清空数据库"
  },
  "Очистка отклонена: лицензия истекла или недействительна.": {
    ru: "Очистка отклонена: лицензия истекла или недействительна.",
    en: "Clear rejected: license expired or invalid.",
    zh: "清空被拒绝：许可证已过期或无效。"
  },
  "Лицензирование и активация продукта": {
    ru: "Лицензирование и активация продукта",
    en: "License and Product Activation",
    zh: "软件许可证及证书激活中心"
  },
  "Управление лицензионным статусом локальной (on-premises) инсталляции. Разработчик: Куратор лицензий Уткин В.В.": {
    ru: "Управление лицензионным статусом локальной (on-premises) инсталляции. Разработчик: Куратор лицензий Уткин В.В.",
    en: "Manage license status of local (on-premises) installation. Developer: Coordinator Utkin V.V.",
    zh: "企业本地化独立私有化服务器许可状态管理。负责人：Utkin V.V."
  },
  "Управление лицензионным статусом локальной (on-premises) инсталляции Vicariustab.": {
    ru: "Управление лицензионным статусом локальной (on-premises) инсталляции Vicariustab.",
    en: "Manage the license status of your local (on-premises) Vicariustab installation.",
    zh: "管理本地（私有化部署）Vicariustab 实例的许可证状态。"
  },
  "Публичный URL и домен (HTTPS)": {
    ru: "Публичный URL и домен (HTTPS)",
    en: "Public URL and domain (HTTPS)",
    zh: "公共 URL 与域名 (HTTPS)"
  },
  "Укажите адрес, по которому пользователи открывают Vicariustab из интернета (например https://vicariustab.company.com).": {
    ru: "Укажите адрес, по которому пользователи открывают Vicariustab из интернета (например https://vicariustab.company.com).",
    en: "Enter the address users use to access Vicariustab from the internet (e.g. https://vicariustab.company.com).",
    zh: "填写用户从互联网访问 Vicariustab 的地址（例如 https://vicariustab.company.com）。"
  },
  "Обнаружен доступ:": {
    ru: "Обнаружен доступ:",
    en: "Detected access:",
    zh: "检测到访问："
  },
  "Docker: задайте STACK_DOMAIN в .env и запустите docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d. Без Docker: см. deploy/nginx-https.example.conf": {
    ru: "Docker: задайте STACK_DOMAIN в .env и запустите docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d. Без Docker: см. deploy/nginx-https.example.conf",
    en: "Docker: set STACK_DOMAIN in .env and run docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d. Without Docker: see deploy/nginx-https.example.conf",
    zh: "Docker：在 .env 中设置 STACK_DOMAIN，然后运行 docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d。非 Docker：见 deploy/nginx-https.example.conf"
  },
  "Оборудование добавляется через «Склад ИТ» → Поступление. После приёмки оно автоматически попадает в нужную группу.": {
    ru: "Оборудование добавляется через «Склад ИТ» → Поступление. После приёмки оно автоматически попадает в нужную группу.",
    en: "Add equipment via IT Warehouse → Receipt. After intake it is automatically routed to the correct equipment group.",
    zh: "请通过「IT 仓库」→「入库」添加设备。入库后将自动分配到对应设备分组。"
  },
  "На склад": {
    ru: "На склад",
    en: "To warehouse",
    zh: "入库"
  },
  "Текущий Лицензионный Статус": {
    ru: "Текущий Лицензионный Статус",
    en: "Current License Status",
    zh: "当前软件许可证证书状态"
  },
  "Уникальный Код Запроса Лицензии:": {
    ru: "Уникальный Код Запроса Лицензии:",
    en: "Unique License Request Code:",
    zh: "系统环境唯一特配指纹特征校验码："
  },
  "System MAC-адрес (для диагностики):": {
    ru: "System MAC-адрес (для диагностики):",
    en: "System MAC address (for diagnostics):",
    zh: "绑定主网卡实体 MAC 硬件地址 (用于高级审计评估)："
  },
  "Система успешно активирована!": {
    ru: "Система успешно активирована!",
    en: "System activated successfully!",
    zh: "核心系统已成功获发合法激活认证！"
  },
  "Тип лицензии:": {
    ru: "Тип лицензии:",
    en: "License type:",
    zh: "系统版本及授权类别："
  },
  "Срок окончания действия:": {
    ru: "Срок окончания действия:",
    en: "Expiration date:",
    zh: "认证证书剩余有效截止时间："
  },
  "Владелец лицензии:": {
    ru: "Владелец лицензии:",
    en: "License owner:",
    zh: "证书归属合法持有单位全称："
  },
  "Почта:": {
    ru: "Почта:",
    en: "Email:",
    zh: "注册邮箱："
  },
  "Телефон:": {
    ru: "Телефон:",
    en: "Phone:",
    zh: "联系方式："
  },
  "Активный ключ:": {
    ru: "Активный ключ:",
    en: "Active key:",
    zh: "当前主激活密匙序列号："
  },
  "Сбросить / Деактивировать ключ": {
    ru: "Сбросить / Деактивировать ключ",
    en: "Deactivate Licence Key",
    zh: "注销并卸载许可证"
  },
  "Действует пробный ознакомительный период (30 дней)": {
    ru: "Действует пробный ознакомительный период (30 дней)",
    en: "Trial period active (30 days)",
    zh: "演示试用模式剩余测试倒计时 (最高30天)"
  },
  "Обратный отсчет в реальном времени:": {
    ru: "Обратный отсчет в реальном времени:",
    en: "Countdown in real-time:",
    zh: "物理生存倒计时："
  },
  "Текущий статус периода:": {
    ru: "Текущий статус периода:",
    en: "Current period status:",
    zh: "试用剩余天数详情统计："
  },
  "Счётчик времени запущен с момента первого запуска системы. После окончания ознакомительного периода доступ к системе будет автоматически заблокирован до момента активации.": {
    ru: "Счётчик времени запущен с момента первого запуска системы. После окончания ознакомительного периода доступ к системе будет автоматически заблокирован до момента активации.",
    en: "The trial timer counts down continuously since the first platform startup. Upon expiration, access is suspended until activation.",
    zh: "时间计数器自创建该数据库实例起开始流逝。试用期届满后，核心业务管理流程将被自动暂停锁定，直至提交有效的数字激活认证。"
  },
  "Сотрудники с доступом в панель": {
    ru: "Сотрудники с доступом в панель",
    en: "Staff with access to the admin panel",
    zh: "有权访问管理面板的员工"
  },
  "Роли определяют доступ к редактированию и администрированию.": {
    ru: "Роли определяют доступ к редактированию и администрированию.",
    en: "Roles dictate permissions for modifications and admin panels.",
    zh: "权限等级明确了能否配置资产、审核和管理其他账户。"
  },
  "Ваша роль:": {
    ru: "Ваша роль:",
    en: "Your role:",
    zh: "您的当前级别："
  },
  "Вы": {
    ru: "Вы",
    en: "You",
    zh: "您"
  },
  "Заблок.": {
    ru: "Заблок.",
    en: "Blocked",
    zh: "已锁定"
  },
  "Редактировать сотрудника": {
    ru: "Редактировать сотрудника",
    en: "Edit Staff Access",
    zh: "修改职员权限属性"
  },
  "Разблокировать": {
    ru: "Разблокировать",
    en: "Unlock Access",
    zh: "允许并恢复登录"
  },
  "Заблокировать": {
    ru: "Заблокировать",
    en: "Suspend Login",
    zh: "挂起并停用该账户"
  },
  "Удалить право доступа": {
    ru: "Удалить право доступа",
    en: "Revoke Access Rights",
    zh: "撤销职员一切控制台访问特权"
  },
  "Электронная почта": {
    ru: "Электронная почта",
    en: "Electronic mail (E-mail)",
    zh: "电子邮箱 (E-mail)"
  },
  "Логин": {
    ru: "Логин",
    en: "Username (Login)",
    zh: "登录凭证 (Username)"
  },
  "Пароль": {
    ru: "Пароль",
    en: "Security Password",
    zh: "安全密码"
  },
  "Роль доступа": {
    ru: "Роль доступа",
    en: "Access Role Privilege",
    zh: "授权角色类别"
  },
  "Просмотр (Viewer)": {
    ru: "Просмотр (Viewer)",
    en: "Viewing (Viewer)",
    zh: "普通查看等级 (Viewer)"
  },
  "Редактирование (Editor)": {
    ru: "Редактирование (Editor)",
    en: "Modifying (Editor)",
    zh: "信息编辑修改权限 (Editor)"
  },
  "Администрирование (Admin)": {
    ru: "Администрирование (Admin)",
    en: "Full Admin Control (Admin)",
    zh: "核心级超管权限 (Admin)"
  },
  "Просмотр/Аудит": {
    ru: "Просмотр/Аудит",
    en: "Viewer / Auditor",
    zh: "普通查看 / 数据审计"
  },
  "Добавление закрыто": {
    ru: "Добавление закрыто",
    en: "Creation restricted",
    zh: "增补员工名录已锁定"
  },
  "Создавать аккаунты сотрудников и настраивать роли имеет право только": {
    ru: "Создавать аккаунты сотрудников и настраивать роли имеет право только",
    en: "Creating staff accounts and adjusting access rules is permitted only to the",
    zh: "依据合规守则，对职员账户的增、删以及授权仅对"
  },
  "Выбрать роль (Доступ)": {
    ru: "Выбрать роль (Доступ)",
    en: "Select Role Access level",
    zh: "指派所属安全组和级别"
  },
  "Просмотр (Запрещено вносить изменения)": {
    ru: "Просмотр (Запрещено вносить изменения)",
    en: "Viewer (Restricted from making any changes)",
    zh: "普通只读访问 (禁止追加和修改任何条目)"
  },
  "Редактирование (Разрешено вносить изменения)": {
    ru: "Редактирование (Разрешено вносить изменения)",
    en: "Editor (Permitted to make general changes)",
    zh: "中级编辑权限 (可管理和修改常规项)"
  },
  "Администрирование (Полный доступ и управление правами)": {
    ru: "Администрирование (Полный доступ и управление правами)",
    en: "Admin (Full workspace control & staff access setup)",
    zh: "高级系统超管 (全面控权及调换员工角色)"
  },
  "Выберите фото (Аватар)": {
    ru: "Выберите фото (Аватар)",
    en: "Choose photo (Avatar)",
    zh: "挑选个人形象头像"
  },
  "Создать учетную запись": {
    ru: "Создать учетную запись",
    en: "Register Account Entry",
    zh: "生成全新准入授权登录条目"
  },
  "Перезапуск ядра Vicariustab": {
    ru: "Перезапуск ядра Vicariustab",
    en: "Hot Rebooting Vicariustab Core",
    zh: "Vicariustab 安全组件热重启"
  },
  "Пожалуйста, не закрывайте вкладку. Обновленные файлы, базы данных и параметры сессии применяются автоматически прямо сейчас.": {
    ru: "Пожалуйста, не закрывайте вкладку. Обновленные файлы, базы данных и параметры сессии применяются автоматически прямо сейчас.",
    en: "Please do not close this tab. Updated modules, databases, and workspace parameters are active in real-time.",
    zh: "请不要关闭该浏览器标签页。变更的核心程序、存储数据及全局变量正在极速融合就位。"
  },
  "Вечная (Без ограничений)": {
    ru: "Вечная (Без ограничений)",
    en: "Perpetual (No expiration)",
    zh: "永久版（无任何时间时效限制）"
  },
  "Годовая": {
    ru: "Годовая",
    en: "Annual license",
    zh: "按年授权版"
  },
  "год": {
    ru: "год",
    en: "year",
    zh: " 年 "
  }
,
  "Устройство": {
    ru: "Устройство",
    en: "Device",
    zh: "设备"
  },
  "Действия": {
    ru: "Действия",
    en: "Actions",
    zh: "操作"
  },
  "Конфигурация комплектующих ПК": {
    ru: "Конфигурация комплектующих ПК",
    en: "PC Components Configuration",
    zh: "个人电脑组件配置"
  },
  "Адрес": {
    ru: "Адрес",
    en: "Address",
    zh: "地址"
  },
  "Сетевое обор.": {
    ru: "Сетевое обор.",
    en: "Network Equip.",
    zh: "网络设备"
  },
  "Наименование": {
    ru: "Наименование",
    en: "Name",
    zh: "名称"
  },
  "Тип": {
    ru: "Тип",
    en: "Type",
    zh: "类型"
  },
  "Объект": {
    ru: "Объект",
    en: "Location",
    zh: "位置"
  },
  "ФИО": {
    ru: "ФИО",
    en: "Full Name",
    zh: "全名"
  },
  "+ Поступление": {
    ru: "+ Поступление",
    en: "+ Receipt",
    zh: "+ 收据"
  },
  "Ед. изм.": {
    ru: "Ед. изм.",
    en: "Unit",
    zh: "单位"
  },
  "Стоимость за ед.": {
    ru: "Стоимость за ед.",
    en: "Unit Cost",
    zh: "单价"
  },
  "Название оборудования": {
    ru: "Название оборудования",
    en: "Equipment Name",
    zh: "设备名称"
  },
  "Категория/Тип": {
    ru: "Категория/Тип",
    en: "Category/Type",
    zh: "分类/类型"
  },
  "Закреплено за объектом": {
    ru: "Закреплено за объектом",
    en: "Assigned to Location",
    zh: "分配到位置"
  },
  "Локальный IP-адрес": {
    ru: "Локальный IP-адрес",
    en: "Local IP Address",
    zh: "本地IP地址"
  },
  "Количество (ед.)": {
    ru: "Количество (ед.)",
    en: "Quantity (units)",
    zh: "数量（单位）"
  },
  "Офис": {
    ru: "Офис",
    en: "Office",
    zh: "办公室"
  },
  "Склад": {
    ru: "Склад",
    en: "Storeroom",
    zh: "库房"
  },
  "ЦОД": {
    ru: "ЦОД",
    en: "Data Center",
    zh: "数据中心"
  },
  "Сеть": {
    ru: "Сеть",
    en: "Network",
    zh: "网络"
  },
  "Зона ПК": {
    ru: "Зона ПК",
    en: "PC Zone",
    zh: "电脑区"
  },
  "Защита": {
    ru: "Защита",
    en: "Security",
    zh: "安全"
  },
  "Персона": {
    ru: "Персона",
    en: "Person",
    zh: "人员"
  },
  "(Только Админ)": {
    ru: "(Только Админ)",
    en: "(Admin Only)",
    zh: "（仅管理员）"
  },
  "ч.": {
    ru: "ч.",
    en: "h.",
    zh: "时"
  },
  "мин.": {
    ru: "мин.",
    en: "min.",
    zh: "分"
  },
  "дн. осталось": {
    ru: "дн. осталось",
    en: "days left",
    zh: "剩余天数"
  },
  "Все права защищены.": {
    ru: "Все права защищены.",
    en: "All rights reserved.",
    zh: "版权所有。"
  },
  "Все статусы": {
    ru: "Все статусы",
    en: "All statuses",
    zh: "所有状态"
  },
  "Название и разработчик": {
    ru: "Название и разработчик",
    en: "Name and Developer",
    zh: "名称和开发者"
  },
  "Лицензионный Ключ": {
    ru: "Лицензионный Ключ",
    en: "License Key",
    zh: "许可证密钥"
  },
  "Мест (Лицензий)": {
    ru: "Мест (Лицензий)",
    en: "Seats (Licenses)",
    zh: "席位（许可证）"
  },
  "Сотрудник / Локация": {
    ru: "Сотрудник / Локация",
    en: "Employee / Location",
    zh: "员工/位置"
  },
  "Срок действия": {
    ru: "Срок действия",
    en: "Expiration Date",
    zh: "到期日期"
  },
  "Программное обеспечение не найдено": {
    ru: "Программное обеспечение не найдено",
    en: "Software not found",
    zh: "未找到软件"
  },
  "Попробуйте изменить поисковый запрос или фильтры": {
    ru: "Попробуйте изменить поисковый запрос или фильтры",
    en: "Try modifying your search query or filters",
    zh: "尝试修改您的搜索查询或过滤条件"
  },
  "Показать ключ": {
    ru: "Показать ключ",
    en: "Show key",
    zh: "显示密钥"
  },
  "Куплено:": {
    ru: "Куплено:",
    en: "Purchased:",
    zh: "已购买："
  },
  "Бессрочная": {
    ru: "Бессрочная",
    en: "Perpetual",
    zh: "永久"
  },
  "Локация •": {
    ru: "Локация •",
    en: "Location •",
    zh: "位置 •"
  },
  "Сформирован автоматически системой учета": {
    ru: "Сформирован автоматически системой учета",
    en: "Generated automatically by the inventory system",
    zh: "由库存系统自动生成"
  },
  "Прикрепленные ресурсы по группам": {
    ru: "Прикрепленные ресурсы по группам",
    en: "Attached resources by group",
    zh: "按组分组的附属资源"
  },
  "Инв:": {
    ru: "Инв:",
    en: "Inv:",
    zh: "库存号："
  },
  "Локация:": {
    ru: "Локация:",
    en: "Location:",
    zh: "位置："
  },
  "Размер:": {
    ru: "Размер:",
    en: "Size:",
    zh: "大小："
  },
  "Загружен:": {
    ru: "Загружен:",
    en: "Uploaded:",
    zh: "上传："
  },
  "Где установлен": {
    ru: "Где установлен",
    en: "Installed on",
    zh: "安装位置"
  },
  "Изменить на \"В работе\"": {
    ru: "Изменить на \"В работе\"",
    en: "Change to \"In use\"",
    zh: "更改为“在用”"
  },
  "Списать (\"Списано\")": {
    ru: "Списать (\"Списано\")",
    en: "Write off (\"Written off\")",
    zh: "核销（“已核销”）"
  },
  "Расходный материал (Картридж) —": {
    ru: "Расходный материал (Картридж) —",
    en: "Consumable (Cartridge) —",
    zh: "耗材（硒鼓）—"
  },
  "Причина:": {
    ru: "Причина:",
    en: "Reason:",
    zh: "原因："
  },
  "Отдел:": {
    ru: "Отдел:",
    en: "Department:",
    zh: "部门："
  },
  "Объект:": {
    ru: "Объект:",
    en: "Location:",
    zh: "位置："
  },
  "Без привязки": {
    ru: "Без привязки",
    en: "Unassigned",
    zh: "未分配"
  },
  "Доступ заблокирован: Период ознакомления или годовой лицензии завершен. Для разблокировки перейдите на страницу активации и введите ключ.": {
    ru: "Доступ заблокирован: Период ознакомления или годовой лицензии завершен. Для разблокировки перейдите на страницу активации и введите ключ.",
    en: "Access blocked: Trial or annual license period expired. To unlock, go to the activation page and enter the key.",
    zh: "访问被阻止：试用或年度许可期限已过。要解锁，请转到激活页面并输入密钥。"
  },
  "Несоответствие контрольной сигнатуры безопасности демо-версии.": {
    ru: "Несоответствие контрольной сигнатуры безопасности демо-версии.",
    en: "Mismatch in demo version security signature.",
    zh: "试用版安全签名不匹配。"
  },
  "Ошибка: Редактирование заблокировано в режиме просмотра.": {
    ru: "Ошибка: Редактирование заблокировано в режиме просмотра.",
    en: "Error: Editing is blocked in view mode.",
    zh: "错误：在查看模式下禁止编辑。"
  },
  "Ошибка: Добавление фотографий ограничено для Вашей роли.": {
    ru: "Ошибка: Добавление фотографий ограничено для Вашей роли.",
    en: "Error: Adding photos is restricted for your role.",
    zh: "错误：您的角色被限制添加照片。"
  },
  "Ошибка: Прикрепление PDF файлов ограничено для Вашей роли.": {
    ru: "Ошибка: Прикрепление PDF файлов ограничено для Вашей роли.",
    en: "Error: Attaching PDF files is restricted for your role.",
    zh: "错误：您的角色被限制附加PDF文件。"
  },
  "Ошибка: Удаление PDF документов ограничено для Вашей роли.": {
    ru: "Ошибка: Удаление PDF документов ограничено для Вашей роли.",
    en: "Error: Deleting PDF documents is restricted for your role.",
    zh: "错误：您的角色被限制删除PDF文档。"
  },
  "Содержимое документа недоступно.": {
    ru: "Содержимое документа недоступно.",
    en: "Document content is unavailable.",
    zh: "文档内容不可用。"
  },
  "Пожалуйста, выберите принтер или МФУ из списка!": {
    ru: "Пожалуйста, выберите принтер или МФУ из списка!",
    en: "Please select a printer or MFP from the list!",
    zh: "请从列表中选择一台打印机或多功能一体机！"
  },
  "Указанное устройство Оргтехники не найдено.": {
    ru: "Указанное устройство Оргтехники не найдено.",
    en: "Specified office equipment device not found.",
    zh: "未找到指定的办公设备。"
  },
  "Укажите название комплектующей и характеристики заменяемой детали!": {
    ru: "Укажите название комплектующей и характеристики заменяемой детали!",
    en: "Please specify the component name and characteristics of the replaced part!",
    zh: "请指定更换部件的组件名称和特性！"
  },
  "Ошибка: Удаление ограничено для Вашей роли.": {
    ru: "Ошибка: Удаление ограничено для Вашей роли.",
    en: "Error: Deletion is restricted for your role.",
    zh: "错误：您的角色被限制删除操作。"
  },
  "ФИО СОТРУДНИКА": {
    ru: "ФИО СОТРУДНИКА",
    en: "EMPLOYEE FULL NAME",
    zh: "员工全名"
  },
  "ЭЛЕКТРОННАЯ ПОЧТА": {
    ru: "ЭЛЕКТРОННАЯ ПОЧТА",
    en: "EMAIL",
    zh: "电子邮件"
  },
  "ЛОГИН": {
    ru: "ЛОГИН",
    en: "LOGIN",
    zh: "登录名"
  },
  "ПАРОЛЬ": {
    ru: "ПАРОЛЬ",
    en: "PASSWORD",
    zh: "密码"
  },
  "ВЫБРАТЬ РОЛЬ (ДОСТУП)": {
    ru: "ВЫБРАТЬ РОЛЬ (ДОСТУП)",
    en: "SELECT ROLE (ACCESS)",
    zh: "选择角色（权限）"
  },
  "ВЫБЕРИТЕ ФОТО (АВАТАР)": {
    ru: "ВЫБЕРИТЕ ФОТО (АВАТАР)",
    en: "SELECT PHOTO (AVATAR)",
    zh: "选择照片（头像）"
  },
  "Интерактивные отчеты и аналитика": {
    ru: "Интерактивные отчеты и аналитика",
    en: "Interactive Reports and Analytics",
    zh: "交互式报告和分析"
  },
  "Сводные графики распределения ресурсов, стоимостной аудит и выгрузка печатных форм.": {
    ru: "Сводные графики распределения ресурсов, стоимостной аудит и выгрузка печатных форм.",
    en: "Summary charts of resource distribution, cost audit, and export of printed forms.",
    zh: "资源分配摘要图表、成本审计和打印表单导出。"
  },
  "Напечатать отчет": {
    ru: "Напечатать отчет",
    en: "Print report",
    zh: "打印报告"
  },
  "МАСШТАБ АНАЛИТИКИ:": {
    ru: "МАСШТАБ АНАЛИТИКИ:",
    en: "ANALYTICS SCALE:",
    zh: "分析规模："
  },
  "Вся компания": {
    ru: "Вся компания",
    en: "Entire company",
    zh: "全公司"
  },
  "По отдельным объектам": {
    ru: "По отдельным объектам",
    en: "By individual locations",
    zh: "按各个地点"
  },
  "БАЛАНСОВАЯ СТОИМОСТЬ СКЛАДА": {
    ru: "БАЛАНСОВАЯ СТОИМОСТЬ СКЛАДА",
    en: "WAREHOUSE BOOK VALUE",
    zh: "仓库账面价值"
  },
  "КОМПЬЮТЕРОВ НА РУКАХ": {
    ru: "КОМПЬЮТЕРОВ НА РУКАХ",
    en: "COMPUTERS ISSUED",
    zh: "已发出的计算机"
  },
  "ОБОРУДОВАНИЯ В РЕМОНТЕ": {
    ru: "ОБОРУДОВАНИЯ В РЕМОНТЕ",
    en: "EQUIPMENT IN REPAIR",
    zh: "维修中的设备"
  },
  "РОУТЕРОВ / КОММУТАТОРОВ": {
    ru: "РОУТЕРОВ / КОММУТАТОРОВ",
    en: "ROUTERS / SWITCHES",
    zh: "路由器/交换机"
  },
  "Статус техники в компании": {
    ru: "Статус техники в компании",
    en: "Hardware status",
    zh: "硬件状态"
  },
  "Категории Склада ИТ (По цене)": {
    ru: "Категории Склада ИТ (По цене)",
    en: "ABC Analysis Categories",
    zh: "ABC分析类别"
  },
  "Журнал системных действий": {
    ru: "Журнал системных действий",
    en: "System Action Log",
    zh: "系统操作日志"
  },
  "Автоматическое протоколирование всех операций с компьютерами, сотрудниками, складом и филиалами.": {
    ru: "Автоматическое протоколирование всех операций с компьютерами, сотрудниками, складом и филиалами.",
    en: "Automatic logging of all operations with computers, employees, warehouse, and branches.",
    zh: "自动记录所有关于电脑、员工、仓库和分支机构的操作。"
  },
  "Очистить логи": {
    ru: "Очистить логи",
    en: "Clear logs",
    zh: "清除日志"
  },
  "Инвентаризация и Сверка ТМЦ": {
    ru: "Инвентаризация и Сверка ТМЦ",
    en: "Inventory and Asset Reconciliation",
    zh: "资产盘点和核对"
  },
  "Планирование и проведение физической сверки ТМЦ на объектах с ведением приказов комиссии, контролеров и печатных актов.": {
    ru: "Планирование и проведение физической сверки ТМЦ на объектах с ведением приказов комиссии, контролеров и печатных актов.",
    en: "Planning and conducting physical asset reconciliation at locations with commission orders, controllers, and printed acts.",
    zh: "通过委员会命令、控制员和印刷法案，计划和进行在地点的实物资产对账。"
  },
  "Запустить новую инвентаризацию": {
    ru: "Запустить новую инвентаризацию",
    en: "Start new inventory",
    zh: "开始新盘点"
  },
  "Избранное": {
    ru: "Избранное",
    en: "Favorites",
    zh: "收藏夹"
  },
  "Системный статус": {
    ru: "Системный статус",
    en: "System Status",
    zh: "系统状态"
  },
  "СИСТЕМНЫЙ СТАТУС": {
    ru: "СИСТЕМНЫЙ СТАТУС",
    en: "SYSTEM STATUS",
    zh: "系统状态"
  },
  "КАТЕГОРИЯ": {
    ru: "КАТЕГОРИЯ",
    en: "CATEGORY",
    zh: "分类"
  },
  "Все категории": {
    ru: "Все категории",
    en: "All Categories",
    zh: "所有分类"
  },
  "Оборудование не найдено по заданным фильтрам": {
    ru: "Оборудование не найдено по заданным фильтрам",
    en: "No equipment found matching the specified filters",
    zh: "未找到符合指定过滤条件的设备"
  },
  "Склад пуст или товар по данному штрихкоду не найден.": {
    ru: "Склад пуст или товар по данному штрихкоду не найден.",
    en: "Warehouse is empty or item not found by this barcode.",
    zh: "仓库为空或未通过此条形码找到项目。"
  },
  "Нет оборудования на данном объекте": {
    ru: "Нет оборудования на данном объекте",
    en: "No equipment at this location",
    zh: "此位置没有设备"
  },
  "Вне склада ТМЦ отсутствуют на хранении.": {
    ru: "Вне склада ТМЦ отсутствуют на хранении.",
    en: "There are no assets stored outside the warehouse.",
    zh: "仓库外部没有存放任何资产。"
  },
  "Процентное распределение компьютеров по эксплуатационному статусу.": {
    ru: "Процентное распределение компьютеров по эксплуатационному статусу.",
    en: "Percentage distribution of computers by operational status.",
    zh: "按操作状态划分的计算机百分比分布。"
  },
  "Суммированная стоимость ТМЦ, ожидающих распределения на складе.": {
    ru: "Суммированная стоимость ТМЦ, ожидающих распределения на складе.",
    en: "Total value of items waiting for distribution in the warehouse.",
    zh: "仓库中等待分配的物品总价值。"
  },
  "Инвентаризационные проверки не запланированы.": {
    ru: "Инвентаризационные проверки не запланированы.",
    en: "No inventory checks are scheduled.",
    zh: "没有安排盘点检查。"
  },
  "Запустите первую плановую инвентаризацию, назначив комиссию, контролирующих и проводящих специалистов.": {
    ru: "Запустите первую плановую инвентаризацию, назначив комиссию, контролирующих и проводящих специалистов.",
    en: "Start the first regular inventory by appointing a commission, supervisors, and specialists conducting it.",
    zh: "通过任命委员会、监督员和执行专家来启动第一次常规盘点。"
  },
  "Наличие:": {
    ru: "Наличие:",
    en: "In stock: ",
    zh: "库存："
  },
  "в": {
    ru: "в",
    en: "in",
    zh: "在"
  },
  "товарных категориях.": {
    ru: "товарных категориях.",
    en: "product categories.",
    zh: "产品类别中。"
  },
  "Инициировал:": {
    ru: "Инициировал:",
    en: "Initiated by:",
    zh: "发起人："
  },
  "Журнал логов пуст.": {
    ru: "Журнал логов пуст.",
    en: "The log log is empty.",
    zh: "日志日志为空。"
  },
  "Фильтр по журналу событий...": {
    ru: "Фильтр по журналу событий...",
    en: "Filter by event log...",
    zh: "按事件日志过滤..."
  },
  "Кто проводит:": {
    ru: "Кто проводит:",
    en: "Who conducts:",
    zh: "谁进行："
  },
  "Кто контролирует:": {
    ru: "Кто контролирует:",
    en: "Who controls:",
    zh: "谁控制："
  },
  "Всего ТМЦ": {
    ru: "Всего ТМЦ",
    en: "Total inventory",
    zh: "总库存"
  },
  "Расхождения": {
    ru: "Расхождения",
    en: "Discrepancies",
    zh: "差异"
  },
  "Дата": {
    ru: "Дата",
    en: "Date",
    zh: "日期"
  },
  "Приказ и примечания к началу:": {
    ru: "Приказ и примечания к началу:",
    en: "Order and notes to start:",
    zh: "启动顺序和注意事项："
  },
  "Заключительное решение комиссии:": {
    ru: "Заключительное решение комиссии:",
    en: "Final decision of the commission:",
    zh: "委员会的最终决定："
  },
  "Прикрепленные печатные формы:": {
    ru: "Прикрепленные печатные формы:",
    en: "Attached printables:",
    zh: "附打印件："
  },
  "Нет сгенерированных печатных документов": {
    ru: "Нет сгенерированных печатных документов",
    en: "No printed documents generated",
    zh: "没有生成打印文档"
  },
  "Перейти к завершению и выводам (Заключению)": {
    ru: "Перейти к завершению и выводам (Заключению)",
    en: "Go to conclusion and conclusions (Conclusion)",
    zh: "得出结论和结论（Conclusion）"
  },
  "Регистрация инвентаризации": {
    ru: "Регистрация инвентаризации",
    en: "Inventory registration",
    zh: "库存登记"
  },
  "Регистрация приказа и запуск проверки": {
    ru: "Регистрация приказа и запуск проверки",
    en: "Registering an order and launching a check",
    zh: "注册订单并发起检查"
  },
  "Наименование инвентаризации / Тема": {
    ru: "Наименование инвентаризации / Тема",
    en: "Inventory name / Subject",
    zh: "库存名称/主题"
  },
  "Объект проведения проверки (Локация)": {
    ru: "Объект проведения проверки (Локация)",
    en: "Object of inspection (Location)",
    zh: "检查对象（地点）"
  },
  "Все подразделения и офисы": {
    ru: "Все подразделения и офисы",
    en: "All divisions and offices",
    zh: "各部门及办公室"
  },
  "Оборудование этого объекта будет проверено комиссией": {
    ru: "Оборудование этого объекта будет проверено комиссией",
    en: "The equipment of this facility will be checked by the commission",
    zh: "该设施的设备将由委员会检查"
  },
  "Кто проводит проверку": {
    ru: "Кто проводит проверку",
    en: "Who conducts the inspection",
    zh: "由谁进行检查"
  },
  "Служба системного администрирования": {
    ru: "Служба системного администрирования",
    en: "System Administration Service",
    zh: "系统管理服务"
  },
  "Кто контролирует": {
    ru: "Кто контролирует",
    en: "Who controls",
    zh: "谁控制"
  },
  "Бухгалтерия и Руководство ИТ": {
    ru: "Бухгалтерия и Руководство ИТ",
    en: "Accounting and IT Management",
    zh: "会计和信息技术管理"
  },
  "Шевченко М.В. (Директор по ИТ)": {
    ru: "Шевченко М.В. (Директор по ИТ)",
    en: "Shevchenko M.V. (IT Director)",
    zh: "舍甫琴科 M.V. （信息技术总监）"
  },
  "Основание / Примечание / Распоряжение": {
    ru: "Основание / Примечание / Распоряжение",
    en: "Reason / Note / Order",
    zh: "原因/备注/订单"
  },
  "Печатная форма:": {
    ru: "Печатная форма:",
    en: "Printing form:",
    zh: "印刷形式："
  },
  "Будет автоматически сформирован": {
    ru: "Будет автоматически сформирован",
    en: "Will be automatically generated",
    zh: "会自动生成"
  },
  "с закреплением ответственной комиссии и контролирующих лиц в машиносчитываемом акте.": {
    ru: "с закреплением ответственной комиссии и контролирующих лиц в машиносчитываемом акте.",
    en: "with the recording of the responsible commission and controlling persons in a machine-readable act.",
    zh: "以机器可读的方式记录负责的委员会和控制人员。"
  },
  "Зарегистрировать и запустить": {
    ru: "Зарегистрировать и запустить",
    en: "Register and launch",
    zh: "注册并启动"
  },
  "Подвести итоги и составить заключение": {
    ru: "Подвести итоги и составить заключение",
    en: "Summarize and draw a conclusion",
    zh: "总结并得出结论"
  },
  "Завершение итогов, расчет расхождений": {
    ru: "Завершение итогов, расчет расхождений",
    en: "Completion of results, calculation of discrepancies",
    zh: "完成结果，计算差异"
  },
  "Количество выявленных расхождений / дефектов": {
    ru: "Количество выявленных расхождений / дефектов",
    en: "Number of discrepancies/defects identified",
    zh: "发现的差异/缺陷数量"
  },
  "Введите 0 если расхождений не найдено и база полностью соответствует действительности.": {
    ru: "Введите 0 если расхождений не найдено и база полностью соответствует действительности.",
    en: "Enter 0 if no discrepancies are found and the database is completely accurate.",
    zh: "如果没有发现差异并且数据库完全准确，请输入 0。"
  },
  "Заключение экспертной комиссии (Решение / Выводы)": {
    ru: "Заключение экспертной комиссии (Решение / Выводы)",
    en: "Conclusion of the expert commission (Decision / Conclusions)",
    zh: "专家委员会结论（决定/结论）"
  },
  "Прикрепить акт выполненной инвентаризации (PDF)": {
    ru: "Прикрепить акт выполненной инвентаризации (PDF)",
    en: "Attach the completed inventory report (PDF)",
    zh: "附上完整的库存报告 (PDF)"
  },
  "Выберите или перетащите PDF акт": {
    ru: "Выберите или перетащите PDF акт",
    en: "Select or drag PDF document",
    zh: "选择或拖动 PDF 文档"
  },
  "Файл будет загружен напрямую во вложение к аудиту": {
    ru: "Файл будет загружен напрямую во вложение к аудиту",
    en: "The file will be uploaded directly to the audit attachment",
    zh: "文件将直接上传至审核附件"
  },
  "Подтвердить сверку и выгрузить Акт": {
    ru: "Подтвердить сверку и выгрузить Акт",
    en: "Confirm the reconciliation and upload the Report",
    zh: "确认对账并上传报告"
  },
  "Предварительный просмотр печатной формы компании": {
    ru: "Предварительный просмотр печатной формы компании",
    en: "Company Print Preview",
    zh: "公司打印预览"
  },
  "Распечатать / PDF": {
    ru: "Распечатать / PDF",
    en: "Print / PDF",
    zh: "打印/PDF"
  },
  "Система учета ИТ-оборудования Equipment Management Pro. Документ подписан электронной цифровой подписью комиссионных инспекторов.": {
    ru: "Система учета ИТ-оборудования Equipment Management Pro. Документ подписан электронной цифровой подписью комиссионных инспекторов.",
    en: "Equipment Management Pro IT equipment accounting system. The document is signed with an electronic digital signature of commission inspectors.",
    zh: "设备管理专业IT设备会计系统。该文件由委员会检查员进行电子数字签名。"
  },
  "Закрыть просмотр": {
    ru: "Закрыть просмотр",
    en: "Close viewing",
    zh: "近距离观看"
  },
  "Удалить законченную инвентаризацию": {
    ru: "Удалить законченную инвентаризацию",
    en: "Delete completed inventory",
    zh: "删除已完成的库存"
  },
  "Например, Плановый аудит ИТ-склада": {
    ru: "Например, Плановый аудит ИТ-склада",
    en: "For example, Scheduled audit of an IT warehouse",
    zh: "例如，IT 仓库的计划审核"
  },
  "Например, Очередная полугодовая инвентаризация ТМЦ. Сверить серийники...": {
    ru: "Например, Очередная полугодовая инвентаризация ТМЦ. Сверить серийники...",
    en: "For example, the next six-month inventory of goods and materials. Check serial numbers...",
    zh: "例如，未来六个月的货物和材料库存。检查序列号..."
  },
  "Например, По результатам сверки все приборы в наличии. Выявлен 1 жесткий диск для списания. Излишков нет...": {
    ru: "Например, По результатам сверки все приборы в наличии. Выявлен 1 жесткий диск для списания. Излишков нет...",
    en: "For example, Based on the results of reconciliation, all devices are available. 1 hard drive identified for write-off. There is no surplus...",
    zh: "例如，根据协调结果，所有设备均可用。 1 个硬盘已确定要注销。没有多余的..."
  },
  "Ноутбуки": {
    ru: "Ноутбуки",
    en: "Laptops",
    zh: "笔记本电脑"
  },
  "Персональные компьютеры (ПК)": {
    ru: "Персональные компьютеры (ПК)",
    en: "Personal computers (PCs)",
    zh: "个人电脑 (PC)"
  },
  "Мониторы": {
    ru: "Мониторы",
    en: "Monitors",
    zh: "显示器"
  },
  "Основная информация": {
    ru: "Основная информация",
    en: "Basic information",
    zh: "基本信息"
  },
  "Сотрудник владелец": {
    ru: "Сотрудник владелец",
    en: "Employee owner",
    zh: "员工业主"
  },
  "Склад ИТ (Свободен)": {
    ru: "Склад ИТ (Свободен)",
    en: "Warehouse IT (Free)",
    zh: "仓库 IT（免费）"
  },
  "Филиал / Локация": {
    ru: "Филиал / Локация",
    en: "Branch / Location",
    zh: "分行/地点"
  },
  "Статус устройства": {
    ru: "Статус устройства",
    en: "Device status",
    zh: "设备状态"
  },
  "Списано (Архив)": {
    ru: "Списано (Архив)",
    en: "Written off (Archive)",
    zh: "注销（存档）"
  },
  "Сопроводительные документы": {
    ru: "Сопроводительные документы",
    en: "Accompanying documents",
    zh: "随附文件"
  },
  "Счет (реквизиты, номер, комментарий)": {
    ru: "Счет (реквизиты, номер, комментарий)",
    en: "Account (details, number, comment)",
    zh: "帐户（详细信息、数量、评论）"
  },
  "Прикрепить оригинал счета (PDF)": {
    ru: "Прикрепить оригинал счета (PDF)",
    en: "Attach original invoice (PDF)",
    zh: "附上原始发票 (PDF)"
  },
  "Загрузить PDF": {
    ru: "Загрузить PDF",
    en: "Download PDF",
    zh: "下载PDF"
  },
  "Служебная записка (прописать реквизиты)": {
    ru: "Служебная записка (прописать реквизиты)",
    en: "Service memo (fill in details)",
    zh: "服务备忘录（填写详细信息）"
  },
  "Прикрепить служебную записку (PDF)": {
    ru: "Прикрепить служебную записку (PDF)",
    en: "Attach a memo (PDF)",
    zh: "附上备忘录 (PDF)"
  },
  "Гарантийный талон (реквизиты, срок)": {
    ru: "Гарантийный талон (реквизиты, срок)",
    en: "Warranty card (details, period)",
    zh: "保修卡（详细内容、期限）"
  },
  "Прикрепить гарантийный талон (PDF)": {
    ru: "Прикрепить гарантийный талон (PDF)",
    en: "Attach warranty card (PDF)",
    zh: "附上保修卡 (PDF)"
  },
  "Поиск по модели, инвентарному, сотруднику...": {
    ru: "Поиск по модели, инвентарному, серийному номеру...",
    en: "Search by model, inventory, serial number...",
    zh: "按型号、库存、序列号搜索..."
  },
  "Счет № 4758-ИТ от 12.05.2026 на сумму 85 000 руб.": {
    ru: "Счет № 4758-ИТ от 12.05.2026 на сумму 85 000 руб.",
    en: "Invoice No. 4758-IT dated May 12, 2026 for the amount of RUB 85,000.",
    zh: "发票编号：4758-IT，日期为 2026 年 5 月 12 日，金额为 85,000 卢布。"
  },
  "Служебная записка СЗ-88 от ИТ-отдела о выделении рабочего ПК": {
    ru: "Служебная записка СЗ-88 от ИТ-отдела о выделении рабочего ПК",
    en: "Service memo SZ-88 from the IT department about the allocation of a working PC",
    zh: "IT 部门关于分配工作 PC 的服务备忘录 SZ-88"
  },
  "Гарантия Ситилинк до 12.05.2029 (36 мес)": {
    ru: "Гарантия Ситилинк до 12.05.2029 (36 мес)",
    en: "Citylink warranty until 05/12/2029 (36 months)",
    zh: "Citylink 保修期至 2029 年 5 月 12 日（36 个月）"
  },
  "(прикреплено к объектам)": {
    ru: "(прикреплено к объектам)",
    en: "(attached to objects)",
    zh: "（附着在物体上）"
  },
  "(прикреплены к сотрудникам)": {
    ru: "(прикреплены к сотрудникам)",
    en: "(attached to employees)",
    zh: "（附员工）"
  },
  "- Списание": {
    ru: "- Списание",
    en: "- Write-off",
    zh: "- 注销"
  },
  "Элемент не найден": {
    ru: "Элемент не найден",
    en: "Item not found",
    zh: "未找到项目"
  },
  "Закрыть": {
    ru: "Закрыть",
    en: "Close",
    zh: "关闭"
  },
  "На данном объекте нет зарегистрированной техники.": {
    ru: "На данном объекте нет зарегистрированной техники.",
    en: "There is no registered equipment at this facility.",
    zh: "该设施没有注册设备。"
  },
  "Вычислительная техника (ПК и Ноутбуки)": {
    ru: "Вычислительная техника (ПК и Ноутбуки)",
    en: "Computers (PCs and Laptops)",
    zh: "计算机（个人电脑和笔记本电脑）"
  },
  "Сетевое инфраструктурное оборудование": {
    ru: "Сетевое инфраструктурное оборудование",
    en: "Network infrastructure equipment",
    zh: "网络基础设施设备"
  },
  "Средства отображения (Мониторы)": {
    ru: "Средства отображения (Мониторы)",
    en: "Display Media (Monitors)",
    zh: "显示媒体（显示器）"
  },
  "Периферия и другое оборудование": {
    ru: "Периферия и другое оборудование",
    en: "Peripherals and other equipment",
    zh: "外围设备及其他设备"
  },
  "За сотрудником не закреплен ни один рабочий компьютер.": {
    ru: "За сотрудником не закреплен ни один рабочий компьютер.",
    en: "The employee is not assigned a single work computer.",
    zh: "没有为员工分配一台工作计算机。"
  },
  "Не назначен": {
    ru: "Не назначен",
    en: "Not assigned",
    zh: "未分配"
  },
  "Расположение / Офис": {
    ru: "Расположение / Офис",
    en: "Location/Office",
    zh: "地点/办公室"
  },
  "Не определено": {
    ru: "Не определено",
    en: "Not definitely",
    zh: "不一定"
  },
  "Установлено на объекте": {
    ru: "Установлено на объекте",
    en: "Installed on site",
    zh: "现场安装"
  },
  "Локация удалена.": {
    ru: "Локация удалена.",
    en: "Location has been removed.",
    zh: "位置已被删除。"
  },
  "Печать Акта": {
    ru: "Печать Акта",
    en: "Seal of the Act",
    zh: "法案印章"
  },
  "Режим просмотра: Изменение параметров карточки и загрузка медиафайлов ограничены.": {
    ru: "Режим просмотра: Изменение параметров карточки и загрузка медиафайлов ограничены.",
    en: "Viewing mode: Changing card parameters and downloading media files are limited.",
    zh: "观看模式：更改卡参数和下载媒体文件受到限制。"
  },
  "Изменить фото": {
    ru: "Изменить фото",
    en: "Change photo",
    zh: "更改照片"
  },
  "Загрузить фото": {
    ru: "Загрузить фото",
    en: "Upload photo",
    zh: "上传照片"
  },
  "Принтер": {
    ru: "Принтер",
    en: "Printer",
    zh: "打印机"
  },
  "Клавиатура": {
    ru: "Клавиатура",
    en: "Keyboard",
    zh: "键盘"
  },
  "Мышь": {
    ru: "Мышь",
    en: "Mouse",
    zh: "鼠标"
  },
  "Клавиатура + мышь": {
    ru: "Клавиатура + мышь",
    en: "Input devices",
    zh: "输入设备"
  },
  "Видеокамера": {
    ru: "Видеокамера",
    en: "Camcorder",
    zh: "摄像机"
  },
  "Видеорегистратор": {
    ru: "Видеорегистратор",
    en: "DVR",
    zh: "硬盘录像机"
  },
  "Сетевое хранилище": {
    ru: "Сетевое хранилище",
    en: "Network storage",
    zh: "网络存储"
  },
  "Инструмент": {
    ru: "Инструмент",
    en: "Tool",
    zh: "工具"
  },
  "Картридж": {
    ru: "Картридж",
    en: "Printer cartridge",
    zh: "打印机墨盒"
  },
  "Группа оборудования": {
    ru: "Группа оборудования",
    en: "Equipment group",
    zh: "设备组"
  },
  "Текущий Статус": {
    ru: "Текущий Статус",
    en: "Current Status",
    zh: "目前状况"
  },
  "Тип Устройства": {
    ru: "Тип Устройства",
    en: "Device Type",
    zh: "设备类型"
  },
  "Установленное Количество": {
    ru: "Установленное Количество",
    en: "Set Quantity",
    zh: "设定数量"
  },
  "Департамент": {
    ru: "Департамент",
    en: "Department",
    zh: "部门"
  },
  "Продажи": {
    ru: "Продажи",
    en: "Sales",
    zh: "销售"
  },
  "Разработка": {
    ru: "Разработка",
    en: "Development",
    zh: "开发"
  },
  "Бухгалтерия": {
    ru: "Бухгалтерия",
    en: "Accounting",
    zh: "会计"
  },
  "Маркетинг": {
    ru: "Маркетинг",
    en: "Marketing",
    zh: "营销"
  },
  "Дизайн": {
    ru: "Дизайн",
    en: "Design",
    zh: "设计"
  },
  "Тестирование": {
    ru: "Тестирование",
    en: "QA / Testing",
    zh: "质量保证"
  },
  "Руководство": {
    ru: "Руководство",
    en: "Management",
    zh: "管理"
  },
  "Эл. почта": {
    ru: "Эл. почта",
    en: "Email",
    zh: "电子邮箱"
  },
  "Телефон": {
    ru: "Телефон",
    en: "phone number",
    zh: "电话号码"
  },
  "Название филиала": {
    ru: "Название филиала",
    en: "Branch name",
    zh: "分支机构名称"
  },
  "Адрес расположения": {
    ru: "Адрес расположения",
    en: "Location address",
    zh: "所在地址"
  },
  "Стоимость единицы": {
    ru: "Стоимость единицы",
    en: "Unit cost",
    zh: "单价"
  },
  "Капитализация запаса": {
    ru: "Капитализация запаса",
    en: "Inventory value",
    zh: "库存资产价值"
  },
  "Обзор": {
    ru: "Обзор",
    en: "Overview",
    zh: "概览"
  },
  "Добавить PDF": {
    ru: "Добавить PDF",
    en: "Add PDF",
    zh: "添加PDF"
  },
  "Нет прикрепленных файлов.": {
    ru: "Нет прикрепленных файлов.",
    en: "No attached files.",
    zh: "没有附件。"
  },
  "Открыть": {
    ru: "Открыть",
    en: "Open",
    zh: "打开"
  },
  "Вы уверены?": {
    ru: "Вы уверены?",
    en: "Are you sure?",
    zh: "您确定吗？"
  },
  "Разные документы": {
    ru: "Разные документы",
    en: "Various documents",
    zh: "各类文档"
  },
  "Для расходных материалов замена запчастей и ремонт не предусмотрены. Вы можете": {
    ru: "Для расходных материалов замена запчастей и ремонт не предусмотрены. Вы можете",
    en: "Parts replacement and repair are not applicable for consumables. You can",
    zh: "耗材不适用零件更换和维修。您可以"
  },
  "привязать (закрепить)": {
    ru: "привязать (закрепить)",
    en: "assign (link)",
    zh: "绑定（分配）"
  },
  "Привязать к оргтехнике": {
    ru: "Привязать к оргтехнике",
    en: "Assign to office equipment",
    zh: "绑定到办公设备"
  },
  "В системе еще не создано принтеров или МФУ (устройств класса «Оргтехника») для привязки. Сначала добавьте оргтехнику в каталог.": {
    ru: "В системе еще не создано принтеров или МФУ (устройств класса «Оргтехника») для привязки. Сначала добавьте оргтехнику в каталог.",
    en: "No printers or MFPs (Office Equipment class) have been added yet. Please add office equipment to the catalog first.",
    zh: "系统中尚未添加打印机或多功能一体机（办公设备类）。请先将办公设备添加到目录中。"
  },
  "Выберите принтер / МФУ": {
    ru: "Выберите принтер / МФУ",
    en: "Select printer / MFP",
    zh: "选择打印机/多功能一体机"
  },
  "-- Выберите печатное устройство --": {
    ru: "-- Выберите печатное устройство --",
    en: "-- Select printing device --",
    zh: "-- 选择打印设备 --"
  },
  "Цвет картриджа": {
    ru: "Цвет картриджа",
    en: "Cartridge color",
    zh: "墨盒颜色"
  },
  "Черный (Black)": {
    ru: "Черный (Black)",
    en: "Black",
    zh: "黑色（Black）"
  },
  "Cyan (Голубой)": {
    ru: "Cyan (Голубой)",
    en: "Cyan",
    zh: "青色（Cyan）"
  },
  "Magenta (Пурпурный)": {
    ru: "Magenta (Пурпурный)",
    en: "Magenta",
    zh: "品红（Magenta）"
  },
  "Yellow (Желтый)": {
    ru: "Yellow (Желтый)",
    en: "Yellow",
    zh: "黄色（Yellow）"
  },
  "Разноцветный": {
    ru: "Разноцветный",
    en: "Multicolor",
    zh: "多色"
  },
  "Состояние": {
    ru: "Состояние",
    en: "Condition",
    zh: "状态"
  },
  "Дата установки": {
    ru: "Дата установки",
    en: "Installation date",
    zh: "安装日期"
  },
  "Статус расходного мат.": {
    ru: "Статус расходного мат.",
    en: "Consumable status",
    zh: "耗材状态"
  },
  "Оставить без изменений": {
    ru: "Оставить без изменений",
    en: "Leave unchanged",
    zh: "保持不变"
  },
  "Выполнить привязку": {
    ru: "Выполнить привязку",
    en: "Confirm assignment",
    zh: "确认绑定"
  },
  "Этот расходный материал в настоящий момент не числится установленным ни на одном печатном оборудовании.": {
    ru: "Этот расходный материал в настоящий момент не числится установленным ни на одном печатном оборудовании.",
    en: "This consumable is not currently registered as installed on any printing device.",
    zh: "该耗材当前未登记为安装在任何打印设备上。"
  },
  "Данный расходник обнаружен в конфигурации следующих устройств оргтехники:": {
    ru: "Данный расходник обнаружен в конфигурации следующих устройств оргтехники:",
    en: "This consumable was found in the configuration of the following office devices:",
    zh: "该耗材在以下办公设备配置中被发现："
  },
  "Перейти": {
    ru: "Перейти",
    en: "Go to",
    zh: "前往"
  },
  "Замена комплектующих и ремонт": {
    ru: "Замена комплектующих и ремонт",
    en: "Parts replacement and repairs",
    zh: "零件更换与维修"
  },
  "Ремонты или замены запчастей не зафиксированы. Устройство находится в исходной заводской комплектации.": {
    ru: "Ремонты или замены запчастей не зафиксированы. Устройство находится в исходной заводской комплектации.",
    en: "No repairs or part replacements recorded. Device is in original factory configuration.",
    zh: "无维修或零件更换记录。设备处于原始出厂配置。"
  },
  "Было:": {
    ru: "Было:",
    en: "Was:",
    zh: "原来："
  },
  "Новое:": {
    ru: "Новое:",
    en: "New:",
    zh: "新的："
  },
  "Физическое состояние портов": {
    ru: "Физическое состояние портов",
    en: "Physical port status",
    zh: "端口物理状态"
  },
  "Нажмите на порт для смены его статуса": {
    ru: "Нажмите на порт для смены его статуса",
    en: "Click on a port to change its status",
    zh: "点击端口以更改其状态"
  },
  "Внутренняя модель сопряжения: BASE-T RJ45": {
    ru: "Внутренняя модель сопряжения: BASE-T RJ45",
    en: "Internal interface model: BASE-T RJ45",
    zh: "内部接口型号：BASE-T RJ45"
  },
  "Управление остатками на складе": {
    ru: "Управление остатками на складе",
    en: "Warehouse stock management",
    zh: "仓库库存管理"
  },
  "Вы можете оперативно списывать или приходовать товарно-материальные ценности. Изменения склада мгновенно зафиксируются в системном журнале.": {
    ru: "Вы можете оперативно списывать или приходовать товарно-материальные ценности. Изменения склада мгновенно зафиксируются в системном журнале.",
    en: "You can quickly write off or receive inventory items. All warehouse changes are instantly recorded in the system log.",
    zh: "您可以快速出库或入库物品。所有仓库变动将即时记录在系统日志中。"
  },
  "Основные данные сотрудника": {
    ru: "Основные данные сотрудника",
    en: "Employee basic data",
    zh: "员工基本信息"
  },
  "Полное ФИО:": {
    ru: "Полное ФИО:",
    en: "Full name:",
    zh: "全名："
  },
  "Должность:": {
    ru: "Должность:",
    en: "Position:",
    zh: "职位："
  },
  "Эл. почта:": {
    ru: "Эл. почта:",
    en: "Email:",
    zh: "电子邮件："
  },
  "Учетный статус рабочего места:": {
    ru: "Учетный статус рабочего места:",
    en: "Workstation accounting status:",
    zh: "工作站账户状态："
  },
  "🟢 Проверен (Активирован)": {
    ru: "🟢 Проверен (Активирован)",
    en: "🟢 Verified (Activated)",
    zh: "🟢 已验证（已激活）"
  },
  "ШИФРОВАНИЕ": {
    ru: "ШИФРОВАНИЕ",
    en: "ENCRYPTION",
    zh: "加密"
  },
  "Статус ЭЦП подписи": {
    ru: "Статус ЭЦП подписи",
    en: "Digital signature status",
    zh: "数字签名状态"
  },
  "ПОДПИСАН И ПРОВЕРЕН • ОК": {
    ru: "ПОДПИСАН И ПРОВЕРЕН • ОК",
    en: "SIGNED AND VERIFIED • OK",
    zh: "已签名并验证 • 确定"
  },
  "Цифровая подпись организации действительна. Документ защищен от изменений во внутреннем хранилище СУБД LocalStorage.": {
    ru: "Цифровая подпись организации действительна. Документ защищен от изменений во внутреннем хранилище СУБД LocalStorage.",
    en: "The organization's digital signature is valid. The document is protected from changes in the internal LocalStorage database.",
    zh: "组织数字签名有效。该文件受保护，防止LocalStorage内部数据库中的更改。"
  },
  "Официальный бланк акта передачи оборудования (Интерактивный редактор)": {
    ru: "Официальный бланк акта передачи оборудования (Интерактивный редактор)",
    en: "Official equipment transfer act form (Interactive editor)",
    zh: "设备移交正式文件（交互式编辑器）"
  },
  "Редактировать параметры акта": {
    ru: "Редактировать параметры акта",
    en: "Edit act parameters",
    zh: "编辑文件参数"
  },
  "Номер Акта": {
    ru: "Номер Акта",
    en: "Act Number",
    zh: "文件编号"
  },
  "Дата выдачи": {
    ru: "Дата выдачи",
    en: "Issue date",
    zh: "签发日期"
  },
  "Организация (Заголовок)": {
    ru: "Организация (Заголовок)",
    en: "Organization (Header)",
    zh: "机构（标题）"
  },
  "Подзаголовок Шапки": {
    ru: "Подзаголовок Шапки",
    en: "Header subtitle",
    zh: "标题副标题"
  },
  "Передающая Сторона": {
    ru: "Передающая Сторона",
    en: "Transferring Party",
    zh: "移交方"
  },
  "Кем отпущено": {
    ru: "Кем отпущено",
    en: "Released by",
    zh: "发放人"
  },
  "Режим ведомости:": {
    ru: "Режим ведомости:",
    en: "Statement mode:",
    zh: "报表模式："
  },
  "В режиме паспорта система автоматически выгружает и форматирует список всех закрепленных за сотрудниками устройств, а также общую ИТ-инфраструктуру объекта": {
    ru: "В режиме паспорта система автоматически выгружает и форматирует список всех закрепленных за сотрудниками устройств, а также общую ИТ-инфраструктуру объекта",
    en: "In passport mode, the system automatically exports and formats a list of all devices assigned to employees, as well as the general IT infrastructure of the facility.",
    zh: "在证书模式下，系统自动导出并格式化分配给员工的所有设备列表以及设施的整体IT基础设施。"
  },
  "Получатель (Сотрудник)": {
    ru: "Получатель (Сотрудник)",
    en: "Recipient (Employee)",
    zh: "接收人（员工）"
  },
  "Должность и отдел": {
    ru: "Должность и отдел",
    en: "Position and department",
    zh: "职位和部门"
  },
  "Условия ответственности сотрудников": {
    ru: "Условия ответственности сотрудников",
    en: "Employee liability terms",
    zh: "员工责任条款"
  },
  "Пункт 1": {
    ru: "Пункт 1",
    en: "Item 1",
    zh: "第1项"
  },
  "Пункт 2": {
    ru: "Пункт 2",
    en: "Item 2",
    zh: "第2项"
  },
  "Пункт 3": {
    ru: "Пункт 3",
    en: "Item 3",
    zh: "第3项"
  },
  "Паспорт ИТ-Инвентаря и Учета Объезда": {
    ru: "Паспорт ИТ-Инвентаря и Учета Объезда",
    en: "IT Inventory and Site Audit Passport",
    zh: "IT库存与现场审计档案"
  },
  "Сводная ведомость по сотрудникам и прикрепленному оборудованию филиала:": {
    ru: "Сводная ведомость по сотрудникам и прикрепленному оборудованию филиала:",
    en: "Summary report on employees and assigned equipment for the branch:",
    zh: "分支机构员工及所属设备汇总报告："
  },
  "Объект / Филиал": {
    ru: "Объект / Филиал",
    en: "Facility / Branch",
    zh: "设施/分支机构"
  },
  "Всего устройств": {
    ru: "Всего устройств",
    en: "Total devices",
    zh: "设备总数"
  },
  "1. Выписка по сотрудникам и закрепленному оборудованию": {
    ru: "1. Выписка по сотрудникам и закрепленному оборудованию",
    en: "1. Statement on employees and assigned equipment",
    zh: "1. 员工及其所属设备清单"
  },
  "На данном объекте нет сотрудников с персонально закрепленным оборудованием.": {
    ru: "На данном объекте нет сотрудников с персонально закрепленным оборудованием.",
    en: "No employees with personally assigned equipment at this facility.",
    zh: "该设施没有配备个人设备的员工。"
  },
  "Модель / Сецификация": {
    ru: "Модель / Сецификация",
    en: "Model / Specification",
    zh: "型号/规格"
  },
  "2. Полный перечень ИТ-оборудования и инфраструктуры объекта": {
    ru: "2. Полный перечень ИТ-оборудования и инфраструктуры объекта",
    en: "2. Complete list of IT equipment and facility infrastructure",
    zh: "2. 设施IT设备和基础设施完整列表"
  },
  "Зарегистрированное оборудование отсутствует на данном объекте.": {
    ru: "Зарегистрированное оборудование отсутствует на данном объекте.",
    en: "No registered equipment at this facility.",
    zh: "该设施没有已登记的设备。"
  },
  "Категория / Тип": {
    ru: "Категория / Тип",
    en: "Category / Type",
    zh: "类别/类型"
  },
  "Модель / Описание": {
    ru: "Модель / Описание",
    en: "Model / Description",
    zh: "型号/描述"
  },
  "Инв. № / IP адрес": {
    ru: "Инв. № / IP адрес",
    en: "Inv. # / IP address",
    zh: "资产编号/IP地址"
  },
  "Спецификация": {
    ru: "Спецификация",
    en: "Specification",
    zh: "规格"
  },
  "Сотрудник / Статус": {
    ru: "Сотрудник / Статус",
    en: "Employee / Status",
    zh: "员工/状态"
  },
  "Инфраструктура объекта": {
    ru: "Инфраструктура объекта",
    en: "Facility infrastructure",
    zh: "设施基础设施"
  },
  "* Данная ведомость является официальным внутренним документом ИТ-инвентаризации. Все прикрепленные устройства находятся в зоне ответственности закрепленных за ними сотрудников, либо под общим контролем материально-ответственного лица данного подразделения. Любые перемещения техники должны быть согласованы с администрацией.": {
    ru: "* Данная ведомость является официальным внутренним документом ИТ-инвентаризации. Все прикрепленные устройства находятся в зоне ответственности закрепленных за ними сотрудников, либо под общим контролем материально-ответственного лица данного подразделения. Любые перемещения техники должны быть согласованы с администрацией.",
    en: "* This statement is an official internal IT inventory document. All assigned devices are the responsibility of the employees they are assigned to, or under the general supervision of the materially responsible person of this department. Any movement of equipment must be approved by the administration.",
    zh: "* 本清单为官方内部IT资产盘点文件。所有分配的设备由其责任人负责管理，或由本部门物资责任人统一监管。任何设备调拨须经管理层批准。"
  },
  "Выгрузку произвел Администратор:": {
    ru: "Выгрузку произвел Администратор:",
    en: "Exported by Administrator:",
    zh: "导出人：管理员："
  },
  "подпись": {
    ru: "подпись",
    en: "signature",
    zh: "签名"
  },
  "Согласовано Руководитель объекта:": {
    ru: "Согласовано Руководитель объекта:",
    en: "Approved by Facility Manager:",
    zh: "批准人：设施负责人："
  },
  "Паспорт Закрепления ИТ-Оборудования": {
    ru: "Паспорт Закрепления ИТ-Оборудования",
    en: "IT Equipment Assignment Passport",
    zh: "IT设备分配档案"
  },
  "Карточка учета ТМЦ и акты приема-передачи во временное служебное пользование": {
    ru: "Карточка учета ТМЦ и акты приема-передачи во временное служебное пользование",
    en: "Inventory card and transfer acts for temporary official use",
    zh: "物资账目卡及临时公务使用移交文件"
  },
  "Сотрудник (Получатель)": {
    ru: "Сотрудник (Получатель)",
    en: "Employee (Recipient)",
    zh: "员工（接收人）"
  },
  "Всего числится": {
    ru: "Всего числится",
    en: "Total on record",
    zh: "记录总数"
  },
  "1. Спецификация закрепленных технических средств (ТМЦ)": {
    ru: "1. Спецификация закрепленных технических средств (ТМЦ)",
    en: "1. Specification of assigned technical assets",
    zh: "1. 已分配技术资产规格"
  },
  "За данным сотрудником в системе не зарегистрировано персональное ИТ-оборудование.": {
    ru: "За данным сотрудником в системе не зарегистрировано персональное ИТ-оборудование.",
    en: "No personal IT equipment registered to this employee in the system.",
    zh: "系统中未登记该员工的个人IT设备。"
  },
  "* Модернизировано (память, SSD)": {
    ru: "* Модернизировано (память, SSD)",
    en: "* Upgraded (RAM, SSD)",
    zh: "* 已升级（内存、SSD）"
  },
  "Отпустил (Сдал) Администратор:": {
    ru: "Отпустил (Сдал) Администратор:",
    en: "Released (Handed over) by Administrator:",
    zh: "管理员移交："
  },
  "Принял на баланс Получатель:": {
    ru: "Принял на баланс Получатель:",
    en: "Accepted by Recipient:",
    zh: "接收人签收："
  },
  "Акт Приема-Передачи ИТ-Оборудования": {
    ru: "Акт Приема-Передачи ИТ-Оборудования",
    en: "IT Equipment Transfer Act",
    zh: "IT设备移交文件"
  },
  "во временное служебное пользование сотруднику компании": {
    ru: "во временное служебное пользование сотруднику компании",
    en: "for temporary official use by a company employee",
    zh: "供公司员工临时公务使用"
  },
  "Получающая Сторона (Сотрудник)": {
    ru: "Получающая Сторона (Сотрудник)",
    en: "Receiving Party (Employee)",
    zh: "接收方（员工）"
  },
  "1. Сведения о передаваемом оборудовании": {
    ru: "1. Сведения о передаваемом оборудовании",
    en: "1. Information on transferred equipment",
    zh: "1. 移交设备信息"
  },
  "Наименование / Модель:": {
    ru: "Наименование / Модель:",
    en: "Name / Model:",
    zh: "名称/型号："
  },
  "Инвентарный номер ТМЦ:": {
    ru: "Инвентарный номер ТМЦ:",
    en: "Asset inventory number:",
    zh: "资产库存编号："
  },
  "Серийный номер:": {
    ru: "Серийный номер:",
    en: "Serial number:",
    zh: "序列号："
  },
  "Размещение / Объект:": {
    ru: "Размещение / Объект:",
    en: "Location / Facility:",
    zh: "位置/设施："
  },
  "Действующая конфигурация:": {
    ru: "Действующая конфигурация:",
    en: "Current configuration:",
    zh: "当前配置："
  },
  "2. История замен комплектующих и модернизаций": {
    ru: "2. История замен комплектующих и модернизаций",
    en: "2. Parts replacement and upgrade history",
    zh: "2. 零件更换与升级历史"
  },
  "Название замены": {
    ru: "Название замены",
    en: "Replacement name",
    zh: "更换名称"
  },
  "Предыдущая деталь": {
    ru: "Предыдущая деталь",
    en: "Previous part",
    zh: "原零件"
  },
  "Действующая деталь": {
    ru: "Действующая деталь",
    en: "Current part",
    zh: "现用零件"
  },
  "ТЕХОТДЕЛ": {
    ru: "ТЕХОТДЕЛ",
    en: "IT DEPARTMENT",
    zh: "技术部门"
  },
  "ДЛЯ ДОКУМЕНТОВ": {
    ru: "ДЛЯ ДОКУМЕНТОВ",
    en: "FOR DOCUMENTS",
    zh: "文档用途"
  },
  "Запустить Печать": {
    ru: "Запустить Печать",
    en: "Print",
    zh: "打印"
  },
  "Сгенерировать акт приема-передачи оборудования": {
    ru: "Сгенерировать акт приема-передачи оборудования",
    en: "Generate equipment transfer act",
    zh: "生成设备移交文件"
  },
  "Просмотреть": {
    ru: "Просмотреть",
    en: "View",
    zh: "查看"
  },
  "Скачать на ПК": {
    ru: "Скачать на ПК",
    en: "Download to PC",
    zh: "下载到电脑"
  },
  "Редактировать замену": {
    ru: "Редактировать замену",
    en: "Edit replacement",
    zh: "编辑更换记录"
  },
  "Удалить замену": {
    ru: "Удалить замену",
    en: "Delete replacement",
    zh: "删除更换记录"
  },
  "Например: SSD диск": {
    ru: "Например: SSD диск",
    en: "E.g.: SSD drive",
    zh: "例如：SSD硬盘"
  },
  "Было: Kingmax 120GB": {
    ru: "Было: Kingmax 120GB",
    en: "Was: Kingmax 120GB",
    zh: "原来：Kingmax 120GB"
  },
  "Стало: Kingston 480GB": {
    ru: "Стало: Kingston 480GB",
    en: "Now: Kingston 480GB",
    zh: "现在：Kingston 480GB"
  },
  "Причина замены (например, Износ или Апгрейд)": {
    ru: "Причина замены (например, Износ или Апгрейд)",
    en: "Replacement reason (e.g., Wear or Upgrade)",
    zh: "更换原因（例如：磨损或升级）"
  },
  "не указана": {
    ru: "не указана",
    en: "not specified",
    zh: "未指定"
  },
  "не указан": {
    ru: "не указан",
    en: "not specified",
    zh: "未指定"
  },
  "Закрепленный объект:": {
    ru: "Закрепленный объект:",
    en: "Assigned facility:",
    zh: "关联设施："
  },
  "Не привязан": {
    ru: "Не привязан",
    en: "Not assigned",
    zh: "未分配"
  },
  "Передать всё": {
    ru: "Передать всё",
    en: "Transfer all",
    zh: "全部移交"
  },
  "Оборудование не закреплено": {
    ru: "Оборудование не закреплено",
    en: "Equipment not assigned",
    zh: "设备未分配"
  },
  "ФИО Сотрудника": {
    ru: "ФИО Сотрудника",
    en: "Employee's Full Name",
    zh: "员工姓名"
  },
  "Департамент / Отдел": {
    ru: "Департамент / Отдел",
    en: "Department/Division",
    zh: "部门"
  },
  "Новый отдел": {
    ru: "Новый отдел",
    en: "New division",
    zh: "新部门"
  },
  "Статус сотрудника": {
    ru: "Статус сотрудника",
    en: "Employee status",
    zh: "员工状态"
  },
  "Привязать к объекту / подразделению": {
    ru: "Привязать к объекту / подразделению",
    en: "Assign to a department",
    zh: "分配到部门/地点"
  },
  "Создание нового отдела": {
    ru: "Создание нового отдела",
    en: "Creating a new department",
    zh: "创建新部门"
  },
  "Название отдела / департамента": {
    ru: "Название отдела / департамента",
    en: "Name Division",
    zh: "部门名称"
  },
  "Создать": {
    ru: "Создать",
    en: "Create",
    zh: "创建"
  },
  "Передача оборудования": {
    ru: "Передача оборудования",
    en: "Equipment transfer",
    zh: "设备移交"
  },
  "будут перенесены на": {
    ru: "будут перенесены на",
    en: "will be transferred to",
    zh: "将移交给"
  },
  ", а статус устройств изменится на": {
    ru: ", а статус устройств изменится на",
    en: ", and the device status will change to",
    zh: "，设备状态将更改为"
  },
  "будут перемещены на выбранного сотрудника.": {
    ru: "будут перемещены на выбранного сотрудника.",
    en: "will be moved to the selected employee.",
    zh: "将移交给所选员工。"
  },
  "Выберите получателя оборудования": {
    ru: "Выберите получателя оборудования",
    en: "Select equipment recipient",
    zh: "选择设备接收人"
  },
  "-- Выберите получателя / Склад --": {
    ru: "-- Выберите получателя / Склад --",
    en: "-- Select recipient / Warehouse --",
    zh: "-- 选择接收人/仓库 --"
  },
  "📦 Сдать ВСЕ на Склад ИТ (в запас)": {
    ru: "📦 Сдать ВСЕ на Склад ИТ (в запас)",
    en: "📦 Return ALL to IT Warehouse (stock)",
    zh: "📦 全部归还IT仓库（库存）"
  },
  "Подтвердить перенос": {
    ru: "Подтвердить перенос",
    en: "Confirm transfer",
    zh: "确认移交"
  },
  "Удалить сотрудника": {
    ru: "Удалить сотрудника",
    en: "Delete employee",
    zh: "删除员工"
  },
  "Переместить все закрепленное оборудование на другого сотрудника": {
    ru: "Переместить все закрепленное оборудование на другого сотрудника",
    en: "Transfer all assigned equipment to another employee",
    zh: "将所有已分配设备移交给其他员工"
  },
  "Например, Смирнов А.Д.": {
    ru: "Например, Смирнов А.Д.",
    en: "E.g., Smith J.D.",
    zh: "例如：张三"
  },
  "Например, Ведущий разработчик": {
    ru: "Например, Ведущий разработчик",
    en: "E.g., Lead Developer",
    zh: "例如：高级开发工程师"
  },
  "Например, Отдел логистики, HR-служба": {
    ru: "Например, Отдел логистики, HR-служба",
    en: "E.g., Logistics Dept., HR Department",
    zh: "例如：物流部、人力资源部"
  },
  "Система учета оборудования": {
    ru: "Система учета оборудования",
    en: "Equipment accounting system",
    zh: "设备管理系统"
  },
  "Для управления кликайте по объектам, технике, сотрудникам. Все данные сохраняются в локальное хранилище.": {
    ru: "Для управления кликайте по объектам, технике, сотрудникам. Все данные сохраняются в локальное хранилище.",
    en: "Click on facilities, equipment, and employees to manage them. All data is saved to local storage.",
    zh: "点击设施、设备和员工进行管理。所有数据保存在本地存储中。"
  },
  "Уведомления": {
    ru: "Уведомления",
    en: "Push notification",
    zh: "推送通知"
  },
  "Прочитать всё": {
    ru: "Прочитать всё",
    en: "Read all",
    zh: "全部标记为已读"
  },
  "Очистить всё": {
    ru: "Очистить всё",
    en: "Clear all",
    zh: "清除全部"
  },
  "Нет новых уведомлений": {
    ru: "Нет новых уведомлений",
    en: "No new notifications",
    zh: "暂无新通知"
  },
  "Текущая учетная запись": {
    ru: "Текущая учетная запись",
    en: "Active Account",
    zh: "当前账户"
  },
  "Сменить пользователя": {
    ru: "Сменить пользователя",
    en: "Switch account",
    zh: "切换账户"
  },
  "Нет других администраторов": {
    ru: "Нет других администраторов",
    en: "There are no other admins",
    zh: "没有其他管理员"
  },
  "Управление правами в Настройках": {
    ru: "Управление правами в Настройках",
    en: "Settings",
    zh: "设置"
  },
  "Введите пароль для": {
    ru: "Введите пароль для",
    en: "Enter password for",
    zh: "输入密码以访问"
  },
  "О системе": {
    ru: "О системе",
    en: "About the system",
    zh: "关于系统"
  },
  "Вход в ИТ-Инвентарь": {
    ru: "Вход в ИТ-Инвентарь",
    en: "Sign in to IT Inventory",
    zh: "登录 IT 资产系统"
  },
  "Единая корпоративная система учета оборудования и инвентаризации филиалов": {
    ru: "Единая корпоративная система учета оборудования и инвентаризации филиалов",
    en: "Unified corporate IT asset and branch inventory platform",
    zh: "企业级 IT 资产与分支机构盘点平台"
  },
  "Инвентаризация оборудования": {
    ru: "Инвентаризация оборудования",
    en: "Equipment Inventory",
    zh: "设备盘点管理"
  },
  "Логин или Email": {
    ru: "Логин или Email",
    en: "Login or Email",
    zh: "登录名或邮箱"
  },
  "Логин или email": {
    ru: "Логин или email",
    en: "Login or email",
    zh: "登录名或邮箱"
  },
  "Введите логин или email": {
    ru: "Введите логин или email",
    en: "Enter login or email",
    zh: "请输入登录名或邮箱"
  },
  "Запомнить меня": {
    ru: "Запомнить меня",
    en: "Remember me",
    zh: "记住我"
  },
  "Забыли пароль?": {
    ru: "Забыли пароль?",
    en: "Forgot password?",
    zh: "忘记密码？"
  },
  "Показать пароль": {
    ru: "Показать пароль",
    en: "Show password",
    zh: "显示密码"
  },
  "Скрыть пароль": {
    ru: "Скрыть пароль",
    en: "Hide password",
    zh: "隐藏密码"
  },
  "Политика конфиденциальности": {
    ru: "Политика конфиденциальности",
    en: "Privacy Policy",
    zh: "隐私政策"
  },
  "Поддержка": {
    ru: "Поддержка",
    en: "Support",
    zh: "支持"
  },
  "Авторизация пройдена успешно. Вход...": {
    ru: "Авторизация пройдена успешно. Вход...",
    en: "Authorization successful. Signing in...",
    zh: "认证成功，正在登录..."
  },
  "Войти в систему": {
    ru: "Войти в систему",
    en: "Sign in",
    zh: "登录系统"
  },
  "© 2026 Уткин Владислав Вячеславович. Все права защищены.": {
    ru: "© 2026 Уткин Владислав Вячеславович. Все права защищены.",
    en: "© 2026 Utkin Vladislav Vyacheslavovich. All rights reserved.",
    zh: "© 2026 乌金·弗拉迪斯拉夫·维亚切斯拉维奇。保留所有权利。"
  },
  "Программный код Vicariustab защищён авторским правом. Запрещено копирование и модификация без согласия автора.": {
    ru: "Программный код Vicariustab защищён авторским правом. Запрещено копирование и модификация без согласия автора.",
    en: "Vicariustab source code is protected by copyright. Copying or modification without the author's consent is prohibited.",
    zh: "Vicariustab 源代码受版权保护。未经作者同意，禁止复制或修改。"
  },
  "Связаться с правообладателем для покупки лицензии": {
    ru: "Связаться с правообладателем для покупки лицензии",
    en: "Contact the rights holder to purchase a license",
    zh: "联系版权所有者购买许可证"
  },
  "Для приобретения коммерческой лицензии Vicariustab отправьте запрос правообладателю по электронной почте или в Telegram. Укажите код запроса лицензии и данные организации.": {
    ru: "Для приобретения коммерческой лицензии Vicariustab отправьте запрос правообладателю по электронной почте или в Telegram. Укажите код запроса лицензии и данные организации.",
    en: "To purchase a commercial Vicariustab license, contact the rights holder by email or Telegram. Include your license request code and organization details.",
    zh: "如需购买 Vicariustab 商业许可证，请通过电子邮件或 Telegram 联系版权所有者，并提供许可证请求码及组织信息。"
  },
  "Авторское право и правообладатель": {
    ru: "Авторское право и правообладатель",
    en: "Copyright and rights holder",
    zh: "版权与权利人"
  },
  "© 2026 Уткин В.В. Все права защищены": {
    ru: "© 2026 Уткин Владислав Вячеславович. Все права защищены.",
    en: "© 2026 Utkin Vladislav Vyacheslavovich. All rights reserved.",
    zh: "© 2026 乌金·弗拉迪斯拉夫·维亚切斯拉维奇。保留所有权利。"
  },
  "Отправить письмо разработчику": {
    ru: "Отправить письмо разработчику",
    en: "Send email to developer",
    zh: "发送邮件给开发者"
  },
  "Введите логин": {
    ru: "Введите логин",
    en: "Enter login",
    zh: "请输入登录名"
  },
  "Масштаб аналитики:": {
    ru: "Масштаб аналитики:",
    en: "Analytics scope:",
    zh: "分析范围："
  },
  "Выберите объект:": {
    ru: "Выберите объект:",
    en: "Select facility:",
    zh: "选择设施："
  },
  "Балансовая стоимость склада": {
    ru: "Балансовая стоимость склада",
    en: "Book value",
    zh: "库存账面价值"
  },
  "(Позиции размещены на Центр. Складе)": {
    ru: "(Позиции размещены на Центр. Складе)",
    en: "(Items located at Central Warehouse)",
    zh: "（物品位于中央仓库）"
  },
  "Компьютеров на руках": {
    ru: "Компьютеров на руках",
    en: "Computers issued to employees",
    zh: "已发放的电脑"
  },
  "Оборудования в ремонте": {
    ru: "Оборудования в ремонте",
    en: "Equipment under repair",
    zh: "维修中的设备"
  },
  "Роутеров / Коммутаторов": {
    ru: "Роутеров / Коммутаторов",
    en: "Routers and switches",
    zh: "路由器和交换机"
  },
  "ОТЧЕТ ПО УЧЕТУ ИТ-ИНВЕНТАРЯ": {
    ru: "ОТЧЕТ ПО УЧЕТУ ИТ-ИНВЕНТАРЯ",
    en: "IT INVENTORY ACCOUNTING REPORT",
    zh: "IT库存核算报告"
  },
  "Область аналитики:": {
    ru: "Область аналитики:",
    en: "Analytics area:",
    zh: "分析区域："
  },
  "Экземпляр №1": {
    ru: "Экземпляр №1",
    en: "Copy #1",
    zh: "副本第1份"
  },
  "1. Сводные показатели": {
    ru: "1. Сводные показатели",
    en: "1. Summary metrics",
    zh: "1. 汇总指标"
  },
  "Показатель": {
    ru: "Показатель",
    en: "Metric",
    zh: "指标"
  },
  "Текущий параметр": {
    ru: "Текущий параметр",
    en: "Current value",
    zh: "当前值"
  },
  "Общее число рабочих станций / ПК": {
    ru: "Общее число рабочих станций / ПК",
    en: "Total workstations / PCs",
    zh: "工作站/PC总数"
  },
  "Активно у сотрудников в работе": {
    ru: "Активно у сотрудников в работе",
    en: "Active in use by employees",
    zh: "员工在用设备数"
  },
  "Роутеры и коммутаторы на сетях": {
    ru: "Роутеры и коммутаторы на сетях",
    en: "Routers and switches on networks",
    zh: "网络路由器和交换机"
  },
  "Действующий баланс оцениваемого склада": {
    ru: "Действующий баланс оцениваемого склада",
    en: "Current balance of evaluated warehouse",
    zh: "待评估仓库的当前余额"
  },
  "2. Список локаций и филиалов": {
    ru: "2. Список локаций и филиалов",
    en: "2. Locations and branches list",
    zh: "2. 地点和分支机构列表"
  },
  "Подпись администратора аналитики: _______________________": {
    ru: "Подпись администратора аналитики: _______________________",
    en: "Analytics administrator signature: _______________________",
    zh: "分析管理员签名：_______________________"
  },
  "Дата и время сверки: _______________________": {
    ru: "Дата и время сверки: _______________________",
    en: "Reconciliation date and time: _______________________",
    zh: "核对日期和时间：_______________________"
  },
  "© 2026 Уткин В.В. | Cyber Security Shield": {
    ru: "© 2026 Уткин Владислав Вячеславович | Cyber Security Shield",
    en: "© 2026 Utkin Vladislav Vyacheslavovich | Cyber Security Shield",
    zh: "© 2026 乌金·弗拉迪斯拉夫·维亚切斯拉维奇 | Cyber Security Shield"
  },
  "Центр Безопасности и Тестирования ИТ-Инфраструктуры": {
    ru: "Центр Безопасности и Тестирования ИТ-Инфраструктуры",
    en: "IT Infrastructure Security & Testing Center",
    zh: "IT基础设施安全与测试中心"
  },
  "Интерактивный центр симуляции киберугроз, автоматической оценки защищенности и управления уязвимостями материальной базы.": {
    ru: "Интерактивный центр симуляции киберугроз, автоматической оценки защищенности и управления уязвимостями материальной базы.",
    en: "Interactive cyber threat simulation center for automated security assessment and vulnerability management of IT assets.",
    zh: "交互式网络威胁模拟中心，用于IT资产的自动安全评估和漏洞管理。"
  },
  "Запущена глубокая инспекция файлов, конфигураций портов, MAC-адресов и паролей администраторов...": {
    ru: "Запущена глубокая инспекция файлов, конфигураций портов, MAC-адресов и паролей администраторов...",
    en: "Deep inspection of files, port configurations, MAC addresses, and administrator passwords launched...",
    zh: "已启动文件、端口配置、MAC地址和管理员密码的深度检查..."
  },
  "Индекс защищенности": {
    ru: "Индекс защищенности",
    en: "Security index",
    zh: "安全指数"
  },
  "Всего активов под защитой": {
    ru: "Всего активов под защитой",
    en: "Total assets under protection",
    zh: "受保护资产总数"
  },
  "узлов": {
    ru: "узлов",
    en: "nodes",
    zh: "节点"
  },
  "Выявлено угроз безопасности": {
    ru: "Выявлено угроз безопасности",
    en: "Security threats detected",
    zh: "检测到安全威胁"
  },
  "уязвимостей": {
    ru: "уязвимостей",
    en: "vulnerabilities",
    zh: "漏洞"
  },
  "Сетевой экран (IDS/IPS)": {
    ru: "Сетевой экран (IDS/IPS)",
    en: "Firewall (IDS/IPS)",
    zh: "防火墙（IDS/IPS）"
  },
  "Активен / Мониторинг": {
    ru: "Активен / Мониторинг",
    en: "Active / Monitoring",
    zh: "活跃/监控中"
  },
  "Результаты Последней Проверки": {
    ru: "Результаты Последней Проверки",
    en: "Last Scan Results",
    zh: "最近扫描结果"
  },
  "Системный периметр полностью чист, либо вы еще не запускали стресс-тест защищенности. Нажмите кнопку сверху для глубокой инспекции!": {
    ru: "Системный периметр полностью чист, либо вы еще не запускали стресс-тест защищенности. Нажмите кнопку сверху для глубокой инспекции!",
    en: "The system perimeter is completely clean, or you have not yet run a security stress test. Click the button above for deep inspection!",
    zh: "系统边界完全干净，或您尚未运行安全压力测试。请点击上方按钮进行深度检查！"
  },
  "Решить в 1 клик": {
    ru: "Решить в 1 клик",
    en: "Fix in 1 click",
    zh: "一键修复"
  },
  "Все эксплоиты и риски вычисляются динамически по состоянию вашей БД (Computer, LAN & User collections).": {
    ru: "Все эксплоиты и риски вычисляются динамически по состоянию вашей БД (Computer, LAN & User collections).",
    en: "All exploits and risks are calculated dynamically based on your database state (Computer, LAN & User collections).",
    zh: "所有漏洞利用和风险均根据您的数据库状态（Computer、LAN和User集合）动态计算。"
  },
  "Полигон Кибер-Пентестов и Стресс-Тестирования": {
    ru: "Полигон Кибер-Пентестов и Стресс-Тестирования",
    en: "Cyber Pentest and Stress Testing Range",
    zh: "网络渗透测试与压力测试平台"
  },
  "Запустите авторизованные утилиты симуляции внешней хакерской активности, чтобы наглядно проверить уязвимости и надежность системных логов.": {
    ru: "Запустите авторизованные утилиты симуляции внешней хакерской активности, чтобы наглядно проверить уязвимости и надежность системных логов.",
    en: "Run authorized external hacking activity simulation utilities to visually check vulnerabilities and system log reliability.",
    zh: "运行授权的外部黑客活动模拟工具，直观检查漏洞和系统日志的可靠性。"
  },
  "Настройка DDoS Flood:": {
    ru: "Настройка DDoS Flood:",
    en: "DDoS Flood configuration:",
    zh: "DDoS洪泛配置："
  },
  "Частота SYN-пакетов": {
    ru: "Частота SYN-пакетов",
    en: "SYN packet frequency",
    zh: "SYN数据包频率"
  },
  "Целевое устройство (Ассет):": {
    ru: "Целевое устройство (Ассет):",
    en: "Target device (Asset):",
    zh: "目标设备（资产）："
  },
  "Полная подсеть (Широковещательный шторм)": {
    ru: "Полная подсеть (Широковещательный шторм)",
    en: "Full subnet (Broadcast storm)",
    zh: "整个子网（广播风暴）"
  },
  "Терминальный Контроль Инцидентов": {
    ru: "Терминальный Контроль Инцидентов",
    en: "Terminal Incident Control",
    zh: "终端事件控制"
  },
  "Ожидание запуска теста или инцидента безопасности... Выберите тип пентеста выше.": {
    ru: "Ожидание запуска теста или инцидента безопасности... Выберите тип пентеста выше.",
    en: "Waiting for test or security incident to start... Select pentest type above.",
    zh: "等待测试或安全事件启动...请在上方选择渗透测试类型。"
  },
  "Стандарты ИБ-Комплаенса и Рекомендации разработчика Уткина В.В.": {
    ru: "Стандарты ИБ-Комплаенса и Рекомендации разработчика Уткина В.В.",
    en: "Information Security Compliance Standards and Developer Utkin V.V. Recommendations",
    zh: "信息安全合规标准及开发者乌特金V.V.建议"
  },
  "Официальные методические регламенты для защиты интеллектуальной собственности, аппаратных слепков устройств компании.": {
    ru: "Официальные методические регламенты для защиты интеллектуальной собственности, аппаратных слепков устройств компании.",
    en: "Official methodological regulations for protecting intellectual property and hardware fingerprints of company devices.",
    zh: "保护公司设备知识产权和硬件指纹的官方方法法规。"
  },
  "Концепция MAC-слепка": {
    ru: "Концепция MAC-слепка",
    en: "MAC fingerprint concept",
    zh: "MAC指纹概念"
  },
  "Лицензионные компоненты жестко привязаны к физическому MAC-адресу сетевого интерфейса. Это гарантирует блокировку работы ИТ-панели при копировании файлов на сторонние неавторизованные сервера.": {
    ru: "Лицензионные компоненты жестко привязаны к физическому MAC-адресу сетевого интерфейса. Это гарантирует блокировку работы ИТ-панели при копировании файлов на сторонние неавторизованные сервера.",
    en: "License components are strictly bound to the physical MAC address of the network interface. This ensures the IT panel is blocked if files are copied to unauthorized third-party servers.",
    zh: "许可证组件严格绑定到网络接口的物理MAC地址。这确保了在将文件复制到未授权的第三方服务器时IT面板被锁定。"
  },
  "Инвентаризация и Аудит": {
    ru: "Инвентаризация и Аудит",
    en: "Inventory and Audit",
    zh: "库存与审计"
  },
  "Резервные копии баз": {
    ru: "Резервные копии баз",
    en: "Database backups",
    zh: "数据库备份"
  },
  "Всегда выгружайте бэкапы инвентарных реестров в формате JSON (раздел Настройки или Терминал ИБ) и отправляйте их на защищенный почтовый адрес администратора:": {
    ru: "Всегда выгружайте бэкапы инвентарных реестров в формате JSON (раздел Настройки или Терминал ИБ) и отправляйте их на защищенный почтовый адрес администратора:",
    en: "Always export backups of inventory registers in JSON format (Settings section or IS Terminal) and send them to the administrator's secure email address:",
    zh: "务必以JSON格式导出库存记录备份（设置部分或IS终端），并发送至管理员安全电子邮件地址："
  },
  "* Резервная копия полностью автономна и сохраняется на Вашем устройстве в формате JSON.": {
    ru: "* Резервная копия полностью автономна и сохраняется на Вашем устройстве в формате JSON.",
    en: "* The backup is fully autonomous and is saved to your device in JSON format.",
    zh: "* 备份完全自主运行，以JSON格式保存到您的设备。"
  },
  "Русский (RU)": {
    ru: "Русский (RU)",
    en: "Russian (RU)",
    zh: "俄语（RU）"
  },
  "© 2026 Уткин В.В. | Все права защищены.": {
    ru: "© 2026 Уткин Владислав Вячеславович | Все права защищены.",
    en: "© 2026 Utkin Vladislav Vyacheslavovich | All rights reserved.",
    zh: "© 2026 乌金·弗拉迪斯拉夫·维亚切斯拉维奇 | 保留所有权利。"
  },
  "✔ Успешная активация! Ключ принят. Система полностью разблокирована.": {
    ru: "✔ Успешная активация! Ключ принят. Система полностью разблокирована.",
    en: "✔ Activation successful! Key accepted. System fully unlocked.",
    zh: "✔ 激活成功！密钥已接受。系统完全解锁。"
  },
  "Анна Ковалева": {
    ru: "Анна Ковалева",
    en: "Anna Kovaleva",
    zh: "安娜·科瓦列娃"
  },
  "© Уткин В.В. Все права защищены.": {
    ru: "© Уткин Владислав Вячеславович. Все права защищены.",
    en: "© Utkin Vladislav Vyacheslavovich. All rights reserved.",
    zh: "© 乌金·弗拉迪斯拉夫·维亚切斯拉维奇。保留所有权利。"
  },
  "Лицензия и Авторские Права: Уткин В.В.": {
    ru: "Лицензия и авторские права: Уткин Владислав Вячеславович",
    en: "License and copyright: Utkin Vladislav Vyacheslavovich",
    zh: "许可证与版权：乌金·弗拉迪斯拉夫·维亚切斯拉维奇"
  },
  "Всего программ": {
    ru: "Всего программ",
    en: "All apps",
    zh: "总应用数"
  },
  "Мониторинг ПО": {
    ru: "Мониторинг ПО",
    en: "Software monitoring",
    zh: "软件监控"
  },
  "Не задействовано": {
    ru: "Не задействовано",
    en: "Unassigned",
    zh: "未使用"
  },
  "Всего мест": {
    ru: "Всего мест",
    en: "Total seats",
    zh: "总席位"
  },
  "Программа": {
    ru: "Программа",
    en: "Application",
    zh: "程序"
  },
  "Перейти к реестру ПО": {
    ru: "Перейти к реестру ПО",
    en: "Open software registry",
    zh: "打开软件登记"
  },
  "Активных лицензий": {
    ru: "Активных лицензий",
    en: "Active software licenses",
    zh: "有效许可证"
  },
  "Срок истек": {
    ru: "Срок истек",
    en: "Your license has expired",
    zh: "许可证已过期"
  },
  "Всего мест (копий)": {
    ru: "Всего мест (копий)",
    en: "Total seats",
    zh: "总席位 (副本)"
  },
  "Добавить ПО": {
    ru: "Добавить ПО",
    en: "Add Software",
    zh: "添加软件"
  },
  "ФИЛЬТР КАТЕГОРИИ": {
    ru: "ФИЛЬТР КАТЕГОРИИ",
    en: "Category Filter",
    zh: "类别过滤器"
  },
  "Все категории ПО": {
    ru: "Все категории ПО",
    en: "All Software Categories",
    zh: "所有软件类别"
  },
  "СТАТУС ПОДПИСКИ": {
    ru: "СТАТУС ПОДПИСКИ",
    en: "subscription status",
    zh: "订阅状态"
  },
  "Название программы *": {
    ru: "Название программы *",
    en: "Software name *",
    zh: "软件名称 *"
  },
  "Категория ПО *": {
    ru: "Категория ПО *",
    en: "Software classification *",
    zh: "软件分类 *"
  },
  "Разработчик": {
    ru: "Разработчик",
    en: "Software Developer",
    zh: "软件开发商"
  },
  "Версия ПО": {
    ru: "Версия ПО",
    en: "Software version",
    zh: "软件版本"
  },
  "Количество лицензий (копий)": {
    ru: "Количество лицензий (копий)",
    en: "Number of licenses",
    zh: "许可证数量 (副本)"
  },
  "Сгенерировать": {
    ru: "Сгенерировать",
    en: "Generate key",
    zh: "生成密钥"
  },
  "Без ключа": {
    ru: "Без ключа",
    en: "License-free",
    zh: "无许可证"
  },
  "Закрепленный сотрудник": {
    ru: "Закрепленный сотрудник",
    en: "Assigned",
    zh: "已分配员工"
  },
  "Все сотрудники (корпоративная)": {
    ru: "Все сотрудники (корпоративная)",
    en: "All employees",
    zh: "所有员工 （企业）"
  },
  "Свободная лицензия (в запасе)": {
    ru: "Свободная лицензия (в запасе)",
    en: "Free software license",
    zh: "免费软件许可证"
  },
  "Адресный объект установки": {
    ru: "Адресный объект установки",
    en: "Installation target",
    zh: "安装目标"
  },
  "Статус действия": {
    ru: "Статус действия",
    en: "Subscription status",
    zh: "订阅状态"
  },
  "Дата истечения лицензии": {
    ru: "Дата истечения лицензии",
    en: "License Validity",
    zh: "许可证有效期"
  },
  "Оставьте пустым для бессрочной лицензии": {
    ru: "Оставьте пустым для бессрочной лицензии",
    en: "Leave empty for perpetual",
    zh: "永久许可证请留空"
  },
  "Дополнительные комментарии": {
    ru: "Дополнительные комментарии",
    en: "Further comments",
    zh: "其他评论"
  },
  "Поиск по названию, ключу, разработчику...": {
    ru: "Поиск по названию, ключу, разработчику...",
    en: "Search by name, key, developer...",
    zh: "按名称、密钥、开发者搜索..."
  },
  "Например: Microsoft Office, Adobe Photoshop": {
    ru: "Например: Microsoft Office, Adobe Photoshop",
    en: "E.g.: Microsoft Office, Adobe Photoshop",
    zh: "例如：Microsoft Office、Adobe Photoshop"
  },
  "Например: Microsoft, JetBrains, 1С": {
    ru: "Например: Microsoft, JetBrains, 1С",
    en: "E.g.: Microsoft, JetBrains, 1C",
    zh: "例如：Microsoft、JetBrains、1C"
  },
  "Например: 2024, LTSC, 8.3": {
    ru: "Например: 2024, LTSC, 8.3",
    en: "E.g.: 2024, LTSC, 8.3",
    zh: "例如：2024、LTSC、8.3"
  },
  "Введите ключ активации вручную или воспользуйтесь подбором кнопками выше": {
    ru: "Введите ключ активации вручную или воспользуйтесь подбором кнопками выше",
    en: "Enter the activation key manually or use the selection buttons above",
    zh: "手动输入激活码或使用上方选择按钮"
  },
  "Например: закупка по тендеру 2026 года...": {
    ru: "Например: закупка по тендеру 2026 года...",
    en: "E.g.: purchased via 2026 tender...",
    zh: "例如：通过2026年招标采购..."
  },
  "ОБЩАЯ СТОИМОСТЬ СКЛАДА": {
    ru: "ОБЩАЯ СТОИМОСТЬ СКЛАДА",
    en: "TOTAL WAREHOUSE VALUE",
    zh: "总仓库价值"
  },
  "Экспорт в CSV / Excel": {
    ru: "Экспорт в CSV / Excel",
    en: "Export to CSV / Excel",
    zh: "导出为 CSV / Excel"
  },
  "Экспорт Excel": {
    ru: "Экспорт Excel",
    en: "Export Excel",
    zh: "导出 Excel"
  },
  "Импорт Excel": {
    ru: "Импорт Excel",
    en: "Import Excel",
    zh: "导入 Excel"
  },
  "Импорт и экспорт Excel доступны только после активации лицензии. Откройте Настройки и введите ключ.": {
    ru: "Импорт и экспорт Excel доступны только после активации лицензии. Откройте Настройки и введите ключ.",
    en: "Excel import and export are available only after license activation. Open Settings and enter your key.",
    zh: "Excel 导入和导出仅在许可证激活后可用。请打开设置并输入密钥。"
  },
  "Резервное копирование доступно только после активации лицензии. Откройте Настройки и введите ключ.": {
    ru: "Резервное копирование доступно только после активации лицензии. Откройте Настройки и введите ключ.",
    en: "Backup is available only after license activation. Open Settings and enter your key.",
    zh: "备份功能仅在许可证激活后可用。请打开设置并输入密钥。"
  },
  "Установка обновлений доступна только после активации лицензии. Откройте Настройки и введите ключ.": {
    ru: "Установка обновлений доступна только после активации лицензии. Откройте Настройки и введите ключ.",
    en: "System updates are available only after license activation. Open Settings and enter your key.",
    zh: "系统更新仅在许可证激活后可用。请打开设置并输入密钥。"
  },
  "Невозможно удалить склад «{name}»: на нём есть оборудование. Переместите или спишите позиции, затем повторите удаление.": {
    ru: "Невозможно удалить склад «{name}»: на нём есть оборудование. Переместите или спишите позиции, затем повторите удаление.",
    en: "Cannot delete warehouse «{name}»: it still has equipment. Move or write off items first.",
    zh: "无法删除仓库「{name}」：仍有设备。请先转移或核销。"
  },
  "Вы действительно хотите безвозвратно удалить подразделение склада «{name}»?": {
    ru: "Вы действительно хотите безвозвратно удалить подразделение склада «{name}»?",
    en: "Permanently delete warehouse «{name}»?",
    zh: "确定永久删除仓库「{name}」？"
  },
  "Доступно после активации лицензии": {
    ru: "Доступно после активации лицензии",
    en: "Available after license activation",
    zh: "激活许可证后可用"
  },
  "Импорт из Excel": {
    ru: "Импорт из Excel",
    en: "Import from Excel",
    zh: "从 Excel 导入"
  },
  "Нет позиций склада для экспорта по текущим фильтрам.": {
    ru: "Нет позиций склада для экспорта по текущим фильтрам.",
    en: "No warehouse lines match the current filters for export.",
    zh: "当前筛选条件下没有可导出的仓库项目。"
  },
  "Импортировать {n} поз. из Excel? Существующие строки с тем же ID или инв. номером будут обновлены.": {
    ru: "Импортировать {n} поз. из Excel? Существующие строки с тем же ID или инв. номером будут обновлены.",
    en: "Import {n} row(s) from Excel? Existing lines with the same ID or inventory number will be updated.",
    zh: "从 Excel 导入 {n} 行？相同 ID 或库存号的行将被更新。"
  },
  "Выбранный файл пуст. Выберите сохранённый .xlsx со склада Vicariustab.": {
    ru: "Выбранный файл пуст. Выберите сохранённый .xlsx со склада Vicariustab.",
    en: "The selected file is empty. Choose a saved .xlsx exported from Vicariustab warehouse.",
    zh: "所选文件为空。请选择从 Vicariustab 仓库导出的 .xlsx 文件。"
  },
  "В файле не найдены строки склада. Используйте файл, экспортированный из Vicariustab (лист Warehouse / Склад).": {
    ru: "В файле не найдены строки склада. Используйте файл, экспортированный из Vicariustab (лист Warehouse / Склад).",
    en: "No warehouse rows found. Use a file exported from Vicariustab (Warehouse / Склад sheet).",
    zh: "未找到仓库行。请使用从 Vicariustab 导出的文件（Warehouse / Склад 工作表）。"
  },
  "Не удалось прочитать файл. Сохраните книгу в Excel как .xlsx и выберите файл с диска (не открытую вкладку).": {
    ru: "Не удалось прочитать файл. Сохраните книгу в Excel как .xlsx и выберите файл с диска (не открытую вкладку).",
    en: "Could not read the file. Save the workbook as .xlsx on disk and select that file (not an unsaved tab).",
    zh: "无法读取文件。请先将工作簿另存为 .xlsx，再从磁盘选择该文件（不要选未保存的选项卡）。"
  },
  "В файле не найдены строки склада для импорта.": {
    ru: "В файле не найдены строки склада для импорта.",
    en: "No warehouse rows found in the file.",
    zh: "文件中未找到仓库行。"
  },
  "Не удалось прочитать файл Excel. Проверьте формат .xlsx": {
    ru: "Не удалось прочитать файл Excel. Проверьте формат .xlsx",
    en: "Could not read the Excel file. Check the .xlsx format.",
    zh: "无法读取 Excel 文件，请检查 .xlsx 格式。"
  },
  "Результат импорта Excel": {
    ru: "Результат импорта Excel",
    en: "Excel import result",
    zh: "Excel 导入结果"
  },
  "Создано": {
    ru: "Создано",
    en: "Created",
    zh: "已创建"
  },
  "Обновлено": {
    ru: "Обновлено",
    en: "Updated",
    zh: "已更新"
  },
  "Пропущено": {
    ru: "Пропущено",
    en: "Skipped",
    zh: "已跳过"
  },
  "Товар / Описание": {
    ru: "Товар / Описание",
    en: "Item / Description",
    zh: "项目/描述"
  },
  "Инв. номер / Штрихкод": {
    ru: "Инв. номер / Штрихкод",
    en: "Inv. no / Barcode",
    zh: "库存号/条形码"
  },
  "Кол-во": {
    ru: "Кол-во",
    en: "Qty",
    zh: "数量"
  },
  "Цена за ед.": {
    ru: "Цена за ед.",
    en: "Unit Price",
    zh: "单价"
  },
  "Поступление ТМЦ на Склад ИТ": {
    ru: "Поступление ТМЦ на Склад ИТ",
    en: "Receipt of IT Assets to Warehouse",
    zh: "接收 IT 资产到仓库"
  },
  "Группа ТМЦ": {
    ru: "Группа ТМЦ",
    en: "Asset Group",
    zh: "资产组"
  },
  "Код / Штрихкод": {
    ru: "Код / Штрихкод",
    en: "Code / Barcode",
    zh: "代码/条形码"
  },
  "Наименование ТМЦ": {
    ru: "Наименование ТМЦ",
    en: "Asset Name",
    zh: "资产名称"
  },
  "Модель / Марка / Бренд": {
    ru: "Модель / Марка / Бренд",
    en: "Model / Brand",
    zh: "型号/品牌"
  },
  "Стоимость (шт.)": {
    ru: "Стоимость (шт.)",
    en: "Cost (per unit)",
    zh: "费用（每单位）"
  },
  "Принять на склад": {
    ru: "Принять на склад",
    en: "Accept to warehouse",
    zh: "入库"
  },
  "Списание ТМЦ со склада": {
    ru: "Списание ТМЦ со склада",
    en: "Write-off IT Assets from Warehouse",
    zh: "从仓库注销 IT 资产"
  },
  "Выберите товар для списания": {
    ru: "Выберите товар для списания",
    en: "Select item for write-off",
    zh: "选择要注销的项目"
  },
  "Количество для списания": {
    ru: "Количество для списания",
    en: "Quantity to write-off",
    zh: "注销数量"
  },
  "Провести списание": {
    ru: "Провести списание",
    en: "Execute write-off",
    zh: "执行注销"
  },
  "Списать": {
    ru: "Списать",
    en: "Write-off",
    zh: "注销"
  },
  "Удалить карточку": {
    ru: "Удалить карточку",
    en: "Delete card",
    zh: "删除卡片"
  },
  "Быстрый поиск по названию или штрих-коду...": {
    ru: "Быстрый поиск по названию или штрих-коду...",
    en: "Quick search by name or barcode...",
    zh: "按名称或条形码快速搜索..."
  },
  "Например, Ноутбук Dell Professional": {
    ru: "Например, Ноутбук Dell Professional",
    en: "e.g., Dell Professional Laptop",
    zh: "例如，戴尔专业笔记本电脑"
  },
  "Например, Latitude 5420": {
    ru: "Например, Latitude 5420",
    en: "e.g., Latitude 5420",
    zh: "例如，Latitude 5420"
  },
  "Срок истекает (&lt;60 дней)": {
    ru: "Срок истекает (&lt;60 дней)",
    en: "Expiring soon (&lt;60 days)",
    zh: "即将到期（&lt;60天）"
  },
  "Редактировать параметры устройства": {
    ru: "Редактировать параметры устройства",
    en: "Edit Device Parameters",
    zh: "编辑设备参数"
  }
,
  "МФУ": {
    ru: "МФУ",
    en: "MFP",
    zh: "多功能打印机"
  },
  "Периферия": {
    ru: "Периферия",
    en: "Peripherals",
    zh: "外围设备"
  },
  "Клавиатура + Мышь": {
    ru: "Клавиатура + Мышь",
    en: "Input devices",
    zh: "输入设备"
  },
  "Оргтехника": {
    ru: "Оргтехника",
    en: "Office equipment",
    zh: "办公硬件"
  },
  "Расходные материалы для МФУ": {
    ru: "Расходные материалы для МФУ",
    en: "MFP Consumables",
    zh: "多功能一体机耗材"
  }

,
  "Добавить Периферию": {
    ru: "Добавить Периферию",
    en: "Add Peripheral",
    zh: "添加外围设备"
  },
  "Добавить Оргтехнику": {
    ru: "Добавить Оргтехнику",
    en: "Add Office Equipment",
    zh: "添加办公设备"
  },
  "Добавить Видеооборудование": {
    ru: "Добавить Видеооборудование",
    en: "Add Video Equipment",
    zh: "添加视频设备"
  },
  "Добавить расходники": {
    ru: "Добавить расходники",
    en: "Add Consumables",
    zh: "添加耗材"
  },
  "Добавить другое оборудование": {
    ru: "Добавить другое оборудование",
    en: "Add Other Equipment",
    zh: "添加其他设备"
  },
  "Все отделы": {
    ru: "Все отделы",
    en: "All company departments",
    zh: "所有公司部门"
  }
,
  "Создать запись": {
    ru: "Создать запись",
    en: "Create a record",
    zh: "创建记录"
  }
,
  "Статус техники на: ": {
    ru: "Статус техники на: ",
    en: "Equipment status: at ",
    zh: "设备状态：在 "
  }
,
  "Головной офис": {
    ru: "Головной офис",
    en: "Head Office",
    zh: "总部"
  }
,
  "Пробный период:": {
    ru: "Пробный период:",
    en: "Trial period:",
    zh: "试用期："
  }
,
  "Разработчик (Опционально)": {
    ru: "Разработчик (Опционально)",
    en: "Software Developer (Optional)",
    zh: "软件开发商（选填）"
  }
,
  "Разработчик / Издатель": {
    ru: "Разработчик / Издатель",
    en: "Software Developer / Publisher",
    zh: "软件开发商 / 发行商"
  }
,
  "Количество лицензий": {
    ru: "Количество лицензий",
    en: "Number of licenses",
    zh: "许可证数量"
  }
,
  "Адресный объект": {
    ru: "Адресный объект",
    en: "Installation target",
    zh: "安装目标"
  }
,
  "сгенерировать": {
    ru: "сгенерировать",
    en: "Generate key",
    zh: "生成密钥"
  }
,
  "Для активации коммерческого ПО используйте стандартный буквенно-цифровой формат либо нажмите \"Сгенерировать\" для создания уникального кода в демо-среде.": {
    ru: "Для активации коммерческого ПО используйте стандартный буквенно-цифровой формат либо нажмите \"Сгенерировать\" для создания уникального кода в демо-среде.",
    en: "Use a standard alphanumeric code to activate the commercial software, or click \"Generate\" for a unique demo code",
    zh: "使用标准字母数字代码激活商业软件，或点击“生成”以获取唯一的演示代码"
  }
,
  "Системное ПО": {
    ru: "Системное ПО",
    en: "Operating software",
    zh: "操作系统软件"
  }
,
  "Операционные системы (ОС)": {
    ru: "Операционные системы (ОС)",
    en: "Operating system",
    zh: "操作系统 (OS)"
  }
,
  "Утилиты и антивирусы": {
    ru: "Утилиты и антивирусы",
    en: "Anti-malware",
    zh: "实用程序和防病毒软件"
  }
,
  "Офисные приложения": {
    ru: "Офисные приложения",
    en: "Office applications",
    zh: "办公应用程序"
  }
,
  "Графические редакторы": {
    ru: "Графические редакторы",
    en: "Graphics software",
    zh: "图形编辑器"
  }
,
  "Корпоративные системы": {
    ru: "Корпоративные системы",
    en: "Enterprise software",
    zh: "企业系统"
  }
,
  "Иное ПО": {
    ru: "Иное ПО",
    en: "Other software",
    zh: "其他软件"
  }
,
  "Название программы": {
    ru: "Название программы",
    en: "Software name",
    zh: "软件名称"
  }
,
  "Категория ПО": {
    ru: "Категория ПО",
    en: "Software classification",
    zh: "软件分类"
  }
,
  "свободная лицензия ( запасе)": {
    ru: "свободная лицензия ( запасе)",
    en: "Free software license",
    zh: "免费软件许可证"
  }

,
  "Утилиты антивирусы": {
    ru: "Утилиты антивирусы",
    en: "Anti-malware",
    zh: "实用程序和防病毒软件"
  }
,
  "Принтеры, Сканеры и т.д.": {
    ru: "Принтеры, Сканеры и т.д.",
    en: "Office equipment",
    zh: "办公硬件"
  }
,
  "Камеры СКУД": {
    ru: "Камеры СКУД",
    en: "CCTV / ACS cameras",
    zh: "监控 / 门禁摄像机"
  }
,
  "Прочее обор.": {
    ru: "Прочее обор.",
    en: "Other IT assets",
    zh: "其他 IT 资产"
  }
,
  "Добавить Гарантию": {
    ru: "Добавить Гарантию",
    en: "Add Warranty",
    zh: "添加保修"
  }
,
  "Например, Dell Latitude 5420": {
    ru: "Например, Dell Latitude 5420",
    en: "e.g., Dell Latitude 5420",
    zh: "例如，戴尔 Latitude 5420"
  }
,
  "Принтеры": {
    ru: "Принтеры",
    en: "Printers",
    zh: "打印机"
  }
,
  "Видеокамеры": {
    ru: "Видеокамеры",
    en: "Video Cameras",
    zh: "摄像机"
  }
,
  "Видеорегистраторы": {
    ru: "Видеорегистраторы",
    en: "DVR/NVR",
    zh: "录像机"
  }
,
  "Привязать к устройству с баланса": {
    ru: "Привязать к устройству с баланса",
    en: "Link to device from balance",
    zh: "链接到余额中的设备"
  }
,
  "Ввести вручную (без привязки)": {
    ru: "Ввести вручную (без привязки)",
    en: "Enter manually (unlinked)",
    zh: "手动输入（未链接）"
  },
  "Привязать к ПК / Ноутбуку": {
    ru: "Привязать к ПК / Ноутбуку",
    en: "Register software on a PC/laptop",
    zh: "在电脑/笔记本电脑上注册软件"
  },
  "Зарегистрировать новое ПО": {
    ru: "Зарегистрировать новое ПО",
    en: "Register new software",
    zh: "注册新软件"
  },
  "Без привязки к устройству": {
    ru: "Без привязки к устройству",
    en: "Without assigning to a device",
    zh: "未分配给设备"
  },
  "Неизвестное устройство": {
    ru: "Неизвестное устройство",
    en: "Unknown device",
    zh: "未知设备"
  },
  "Редактировать ПО": {
    ru: "Редактировать ПО",
    en: "Edit software",
    zh: "编辑软件"
  },
  "Привязан к ПК/Ноутбуку": {
    ru: "Привязан к ПК/Ноутбуку",
    en: "Assigned to PC/Laptop",
    zh: "关联至电脑/笔记本"
  },
  "Привязать к Видеорегистратору": {
    ru: "Привязать к Видеорегистратору",
    en: "Bind to Video Recorder",
    zh: "绑定至视频录像机"
  },
  "Привязан к Видеорегистратору": {
    ru: "Привязан к Видеорегистратору",
    en: "Assigned to Video Recorder",
    zh: "关联至视频录像机"
  },
  "Привязать к Принтеру": {
    ru: "Привязать к Принтеру",
    en: "Bind to Printer",
    zh: "关联至打印机"
  },
  "Привязан к Принтеру": {
    ru: "Привязан к Принтеру",
    en: "Assigned to Printer",
    zh: "已关联至打印机"
  },
  "Привязать к МФУ": {
    ru: "Привязать к МФУ",
    en: "Bind to MFP/Printer",
    zh: "关联至多功能一体机/打印机"
  },
  "Привязан к МФУ": {
    ru: "Привязан к МФУ",
    en: "Assigned to MFP/Printer",
    zh: "已关联至多功能一体机/打印机"
  },
  "СТОИМОСТЬ (ВСЕ СКЛАДЫ)": {
    ru: "СТОИМОСТЬ (ВСЕ СКЛАДЫ)",
    en: "ALL WAREHOUSES",
    zh: "所有仓库"
  },
  "Наличие в выбранном разрезе складов:": {
    ru: "Наличие в выбранном разрезе складов:",
    en: "Availability by selected warehouse breakdown:",
    zh: "所选仓库明细可用库存："
  },
  "ОБЩАЯ СТОИМОСТЬ ПО КОМПАНИИ:": {
    ru: "ОБЩАЯ СТОИМОСТЬ ПО КОМПАНИИ:",
    en: "TOTAL CORPORATE COST:",
    zh: "集团总资产："
  },
  "ТМЦ в наличии": {
    ru: "ТМЦ в наличии",
    en: "Inventory in stock",
    zh: "现货库存"
  },
  "Склад:": {
    ru: "Склад:",
    en: "Storeroom:",
    zh: "库房："
  },
  "Все склады": {
    ru: "Все склады",
    en: "all warehouses",
    zh: "所有仓库"
  },
  "История списаний складов": {
    ru: "История списаний складов",
    en: "Inventory Write-off History",
    zh: "库存报废历史"
  },
  "История списания складов": {
    ru: "История списания складов",
    en: "Inventory Write-off History",
    zh: "库存报废历史"
  },
  "СПИСАНО С ПРЕДПРИЯТИЯ": {
    ru: "СПИСАНО С ПРЕДПРИЯТИЯ",
    en: "Written off from the company's IT assets",
    zh: "已自公司IT资产中报废"
  },
  "Общая история:": {
    ru: "Общая история:",
    en: "Overall history:",
    zh: "合计记录："
  },
  "актов списания": {
    ru: "актов списания",
    en: "IT write-off records",
    zh: "报废单"
  },
  "История списаний и утилизации материальных ценностей": {
    ru: "История списаний и утилизации материальных ценностей",
    en: "Asset Retirement and Disposal History",
    zh: "资产退役与处置历史"
  },
  "Здесь отображаются все оформленные акты списания с указанием технического обоснования от сервисного центра и причин.": {
    ru: "Здесь отображаются все оформленные акты списания с указанием технического обоснования от сервисного центра и причин.",
    en: "All executed write-off certificates are displayed here, indicating the technical justification from the service center and the reasons.",
    zh: "这里显示所有已执行的报废证书，指示来自服务中心的分析和原因。"
  },
  "Здесь отображаются все оформленные акты списания с указанием технического обоснования от сервисного центра и причин": {
    ru: "Здесь отображаются все оформленные акты списания с указанием технического обоснования от сервисного центра и причин",
    en: "All executed write-off certificates are displayed here, indicating the technical justification from the service center and the reasons",
    zh: "这里显示所有已执行的报废证书，指示来自服务中心的分析和原因"
  },
  "Дата списания": {
    ru: "Дата списания",
    en: "Write-off date",
    zh: "报废日期"
  },
  "Наименование / Модель": {
    ru: "Наименование / Модель",
    en: "Name / Model",
    zh: "名称/型号"
  },
  "Инвентарный": {
    ru: "Инвентарный",
    en: "Inventory",
    zh: "库存"
  },
  "Стоимость": {
    ru: "Стоимость",
    en: "Equipment write-off cost",
    zh: "设备报废成本"
  },
  "Причина утилизации и технический акт": {
    ru: "Причина утилизации и технический акт",
    en: "Technical report",
    zh: "技术报告"
  },
  "Управление складами": {
    ru: "Управление складами",
    en: "Warehouse Management",
    zh: "仓库管理"
  },
  "Управление складами (1)": {
    ru: "Управление складами (1)",
    en: "Warehouse Management (1)",
    zh: "仓库管理 (1)"
  },
  "Построить / Добавить склад": {
    ru: "Построить / Добавить склад",
    en: "Add warehouse",
    zh: "添加仓库"
  },
  "Вы можете создать дополнительный филиальный склад и жестко привязать его к физическому объекту из списка недвижимости.": {
    ru: "Вы можете создать дополнительный филиальный склад и жестко привязать его к физическому объекту из списка недвижимости.",
    en: "You can create an additional branch warehouse and rigidly link it to a physical object from the real estate list.",
    zh: "您可以创建额外的分支仓库，并将其牢固地链接到不动产列表中的物理对象。"
  },
  "Название склада": {
    ru: "Название склада",
    en: "Warehouse Name",
    zh: "仓库名称"
  },
  "Привязка к объекту": {
    ru: "Привязка к объекту",
    en: "Equipment assignment to a facility or employee",
    zh: "物理对象绑定"
  },
  "Описание склада (опц.)": {
    ru: "Описание склада (опц.)",
    en: "Storage Facility Description",
    zh: "仓库描述 (选填)"
  },
  "Зарегистрированные структуры складов ТМЦ": {
    ru: "Зарегистрированные структуры складов ТМЦ",
    en: "Registered structures",
    zh: "已注册的项目库存结构"
  },
  "ГЛАВНЫЙ": {
    ru: "ГЛАВНЫЙ",
    en: "Main",
    zh: "主要"
  },
  "Основной склад ИТ": {
    ru: "Основной склад ИТ",
    en: "Main IT Warehouse",
    zh: "IT主仓库"
  },
  "Главный распределительный архивный склад для закупки техники": {
    ru: "Главный распределительный архивный склад для закупки техники",
    en: "Main Distribution and Archive Warehouse for Tech Procurement",
    zh: "用于技术采购的主要分发和归档仓库"
  },
  "Главный распределительный архивный склад для закупки техники.": {
    ru: "Главный распределительный архивный склад для закупки техники.",
    en: "Main Distribution and Archive Warehouse for Tech Procurement.",
    zh: "用于技术采购的主要分发และ归档仓库。"
  },
  "Связанный объект: Главный офис": {
    ru: "Связанный объект: Главный офис",
    en: "Linked Object: Main Office",
    zh: "关联对象：主办公室"
  },
  "Инициализация проверки обновлений Vicariustab...": {
    ru: "Инициализация проверки обновлений Vicariustab...",
    en: "Initializing Vicariustab update check...",
    zh: "正在初始化 Vicariustab 更新检查..."
  },
  "Проверка GitHub": {
    ru: "Проверка GitHub",
    en: "GitHub check",
    zh: "GitHub 检查"
  },
  "Режим ручного архива: автоматическая установка из браузера недоступна.": {
    ru: "Режим ручного архива: автоматическая установка из браузера недоступна.",
    en: "Manual archive mode: browser-side auto-install is disabled.",
    zh: "手动归档模式：浏览器内无法自动安装。"
  },
  "Выбран файл:": {
    ru: "Выбран файл:",
    en: "Selected file:",
    zh: "已选文件："
  },
  "Распакуйте архив на сервере и выполните: npm install && npm run build && pm2 restart vicariustab-system": {
    ru: "Распакуйте архив на сервере и выполните: npm install && npm run build && pm2 restart vicariustab-system",
    en: "Extract the archive on the server and run: npm install && npm run build && pm2 restart vicariustab-system",
    zh: "在服务器解压归档并执行：npm install && npm run build && pm2 restart vicariustab-system"
  },
  "Не удалось проверить обновления на GitHub": {
    ru: "Не удалось проверить обновления на GitHub",
    en: "Failed to check GitHub updates",
    zh: "无法检查 GitHub 更新"
  },
  "Проверка через браузер (сервер устарел или недоступен GitHub API). Для автоустановки обновите сервер вручную.": {
    ru: "Проверка через браузер (сервер устарел или недоступен GitHub API). Для автоустановки обновите сервер вручную.",
    en: "Checking via browser (legacy server or GitHub API blocked on server). Update the server manually for one-click install.",
    zh: "通过浏览器检查（服务器过旧或无法访问 GitHub API）。一键安装需先手动更新服务器。"
  },
  "Репозиторий:": {
    ru: "Репозиторий:",
    en: "Repository:",
    zh: "仓库："
  },
  "Последний релиз:": {
    ru: "Последний релиз:",
    en: "Latest release:",
    zh: "最新版本："
  },
  "не найден": {
    ru: "не найден",
    en: "not found",
    zh: "未找到"
  },
  "Страница релиза:": {
    ru: "Страница релиза:",
    en: "Release page:",
    zh: "发布页："
  },
  "Доступна новая версия. Автоустановка из интерфейса отключена по соображениям безопасности.": {
    ru: "Доступна новая версия. Автоустановка из интерфейса отключена по соображениям безопасности.",
    en: "A new version is available. In-app auto-install is disabled for security reasons.",
    zh: "有新版本可用。出于安全考虑，界面内自动安装已禁用。"
  },
  "На сервере выполните: git pull && npm install && npm run build && pm2 restart vicariustab-system": {
    ru: "На сервере выполните: git pull && npm install && npm run build && pm2 restart vicariustab-system",
    en: "On the server run: git pull && npm install && npm run build && pm2 restart vicariustab-system",
    zh: "在服务器执行：git pull && npm install && npm run build && pm2 restart vicariustab-system"
  },
  "Установлена актуальная или более новая версия ядра.": {
    ru: "Установлена актуальная или более новая версия ядра.",
    en: "Core version is up to date or newer.",
    zh: "核心版本已是最新或更高。"
  },
  "Проверка обновлений Vicariustab": {
    ru: "Проверка обновлений Vicariustab",
    en: "Vicariustab update check",
    zh: "Vicariustab 更新检查"
  },
  "Проверка GitHub завершена. Релиз:": {
    ru: "Проверка GitHub завершена. Релиз:",
    en: "GitHub check completed. Release:",
    zh: "GitHub 检查完成。版本："
  },
  "Ошибка проверки обновлений": {
    ru: "Ошибка проверки обновлений",
    en: "Update check error",
    zh: "更新检查错误"
  },
  "Проверка завершена. Следуйте инструкциям в журнале для ручного обновления на сервере.": {
    ru: "Проверка завершена. Следуйте инструкциям в журнале для ручного обновления на сервере.",
    en: "Check completed. Follow log instructions for manual server update.",
    zh: "检查完成。请按日志说明在服务器手动更新。"
  },
  "Проверка обновлений на GitHub...": {
    ru: "Проверка обновлений на GitHub...",
    en: "Checking GitHub updates...",
    zh: "正在检查 GitHub 更新..."
  },
  "Проверить обновления на GitHub": {
    ru: "Проверить обновления на GitHub",
    en: "Check GitHub updates",
    zh: "检查 GitHub 更新"
  },
  "Установить обновление": {
    ru: "Установить обновление",
    en: "Install update",
    zh: "安装更新"
  },
  "Установка обновления...": {
    ru: "Установка обновления...",
    en: "Installing update...",
    zh: "正在安装更新..."
  },
  "Доступна версия": {
    ru: "Доступна версия",
    en: "Available version",
    zh: "可用版本"
  },
  "установлена": {
    ru: "установлена",
    en: "installed",
    zh: "已安装"
  },
  "Платформа актуальна — обновление не требуется.": {
    ru: "Платформа актуальна — обновление не требуется.",
    en: "Platform is up to date — no update required.",
    zh: "平台已是最新版本，无需更新。"
  },
  "Доступна новая версия. Нажмите «Установить обновление» для автоматической установки.": {
    ru: "Доступна новая версия. Нажмите «Установить обновление» для автоматической установки.",
    en: "A new version is available. Click Install update for automatic installation.",
    zh: "有新版本可用。点击“安装更新”即可自动安装。"
  },
  "Запуск автоматической установки обновления...": {
    ru: "Запуск автоматической установки обновления...",
    en: "Starting automatic update installation...",
    zh: "正在启动自动更新安装..."
  },
  "Резервное копирование": {
    ru: "Резервное копирование",
    en: "Backup",
    zh: "备份"
  },
  "Обновление запущено на сервере. Скачивание, сборка и перезапуск выполняются автоматически.": {
    ru: "Обновление запущено на сервере. Скачивание, сборка и перезапуск выполняются автоматически.",
    en: "Update started on server. Download, build, and restart run automatically.",
    zh: "服务器已开始更新。下载、构建和重启将自动进行。"
  },
  "Ошибка установки обновления": {
    ru: "Ошибка установки обновления",
    en: "Update installation failed",
    zh: "更新安装失败"
  },
  "Обновление Vicariustab": {
    ru: "Обновление Vicariustab",
    en: "Vicariustab update",
    zh: "Vicariustab 更新"
  },
  "Применение обновления и перезапуск сервера...": {
    ru: "Применение обновления и перезапуск сервера...",
    en: "Applying update and restarting server...",
    zh: "正在应用更新并重启服务器..."
  },
  "Текущая версия:": {
    ru: "Текущая версия:",
    en: "Current version:",
    zh: "当前版本："
  },
  "Версия на GitHub:": {
    ru: "Версия на GitHub:",
    en: "GitHub version:",
    zh: "GitHub 版本："
  },
  "Платформа автоматически проверяет GitHub раз в сутки. Установка выполняется только по кнопке «Установить обновление»: резервная копия данных, загрузка, сборка и перезапуск без SSH.": {
    ru: "Платформа автоматически проверяет GitHub раз в сутки. Установка выполняется только по кнопке «Установить обновление»: резервная копия данных, загрузка, сборка и перезапуск без SSH.",
    en: "The platform checks GitHub once per day. Installation runs only when you click Install update: data backup, download, build, and restart without SSH.",
    zh: "平台每天自动检查 GitHub 一次。仅当您点击“安装更新”时才会安装：备份数据、下载、构建并重启，无需 SSH。"
  },
  "Последний коммит ветки main:": {
    ru: "Последний коммит ветки main:",
    en: "Latest commit on main:",
    zh: "main 分支最新提交："
  },
  "Дата коммита:": {
    ru: "Дата коммита:",
    en: "Commit date:",
    zh: "提交日期："
  },
  "Страница на GitHub:": {
    ru: "Страница на GitHub:",
    en: "GitHub page:",
    zh: "GitHub 页面："
  },
  "На GitHub доступна более новая версия. Автоустановка из браузера отключена.": {
    ru: "На GitHub доступна более новая версия. Автоустановка из браузера отключена.",
    en: "A newer version is on GitHub. In-browser auto-install is disabled.",
    zh: "GitHub 上有较新版本。浏览器内自动安装已禁用。"
  },
  "На сервере выполните:": {
    ru: "На сервере выполните:",
    en: "On the server run:",
    zh: "在服务器执行："
  },
  "Локальная версия соответствует актуальному состоянию репозитория на GitHub.": {
    ru: "Локальная версия соответствует актуальному состоянию репозитория на GitHub.",
    en: "Local version matches the current GitHub repository state.",
    zh: "本地版本与 GitHub 仓库当前状态一致。"
  },
  // Warehouse view — additional keys (ru / en / zh)
  "Списание оборудования": {
    ru: "Списание оборудования",
    en: "Equipment write-off",
    zh: "设备报废"
  },
  "СТОИМОСТЬ": {
    ru: "СТОИМОСТЬ",
    en: "VALUE",
    zh: "价值"
  },
  "активов и ТМЦ": {
    ru: "активов и ТМЦ",
    en: "assets and inventory items",
    zh: "项资产与库存"
  },
  "Экспорт ТМЦ в CSV": {
    ru: "Экспорт ТМЦ в CSV",
    en: "Export inventory to CSV",
    zh: "导出库存为 CSV"
  },
  "Поступление": {
    ru: "Поступление",
    en: "Receipt",
    zh: "入库"
  },
  "Все ТМЦ и активы": {
    ru: "Все ТМЦ и активы",
    en: "All inventory and assets",
    zh: "全部库存与资产"
  },
  "Товар / Склад хранения": {
    ru: "Товар / Склад хранения",
    en: "Item / Storage warehouse",
    zh: "物品 / 存放仓库"
  },
  "Инвентарный номер": {
    ru: "Инвентарный номер",
    en: "Inventory number",
    zh: "资产编号"
  },
  "Остаток": {
    ru: "Остаток",
    en: "Balance",
    zh: "结余"
  },
  "Ед.": {
    ru: "Ед.",
    en: "Unit",
    zh: "单位"
  },
  "Общая сумма": {
    ru: "Общая сумма",
    en: "Total amount",
    zh: "合计金额"
  },
  "В работе:": {
    ru: "В работе:",
    en: "In use:",
    zh: "使用中："
  },
  "Привязано к объекту:": {
    ru: "Привязано к объекту:",
    en: "Assigned to location:",
    zh: "已关联至地点："
  },
  "Прикрепить / Выдать ТМЦ на объект": {
    ru: "Прикрепить / Выдать ТМЦ на объект",
    en: "Assign / Issue inventory to location",
    zh: "分配 / 发放库存至地点"
  },
  "Выдать": {
    ru: "Выдать",
    en: "Issue",
    zh: "发放"
  },
  "Переместить на другой склад": {
    ru: "Переместить на другой склад",
    en: "Move to another warehouse",
    zh: "转移至其他仓库"
  },
  "На списание": {
    ru: "На списание",
    en: "Pending write-off",
    zh: "待报废"
  },
  "Отправка на списание": {
    ru: "Отправка на списание",
    en: "Send for write-off",
    zh: "提交报废"
  },
  "Укажите количество единиц для перевода в очередь «Ожидает списания».": {
    ru: "Укажите количество единиц для перевода в очередь «Ожидает списания».",
    en: "Specify how many units to move to the pending write-off queue.",
    zh: "请指定转入待报废队列的数量。"
  },
  "Количество для отправки на списание": {
    ru: "Количество для отправки на списание",
    en: "Quantity to send for write-off",
    zh: "提交报废数量"
  },
  "Отправить на списание": {
    ru: "Отправить на списание",
    en: "Send for write-off",
    zh: "提交报废"
  },
  "Не удалось отправить оборудование на списание.": {
    ru: "Не удалось отправить оборудование на списание.",
    en: "Could not send equipment for write-off.",
    zh: "无法将设备提交报废。"
  },
  "Выдан коллеге": {
    ru: "Выдан коллеге",
    en: "Issued to employee",
    zh: "已发放给员工"
  },
  "Вернуть на склад или переместить": {
    ru: "Вернуть на склад или переместить",
    en: "Return to warehouse or relocate",
    zh: "退回仓库或转移"
  },
  "На балансе склада нет позиций по заданным критериям фильтрации.": {
    ru: "На балансе склада нет позиций по заданным критериям фильтрации.",
    en: "No warehouse items match the current filters.",
    zh: "没有符合当前筛选条件的仓库物品。"
  },
  "Без технического заключения": {
    ru: "Без технического заключения",
    en: "No technical report attached",
    zh: "未附技术报告"
  },
  "Удалить акт (без восстановления оборудования)": {
    ru: "Удалить акт (без восстановления оборудования)",
    en: "Delete certificate (equipment will not be restored)",
    zh: "删除单据（设备不会恢复）"
  },
  "Ни одного оборудования еще не было списано по акту.": {
    ru: "Ни одного оборудования еще не было списано по акту.",
    en: "No equipment has been written off by certificate yet.",
    zh: "尚无按单据报废的设备。"
  },
  "Создать склад": {
    ru: "Создать склад",
    en: "Create warehouse",
    zh: "创建仓库"
  },
  "Связанный объект:": {
    ru: "Связанный объект:",
    en: "Linked location:",
    zh: "关联地点："
  },
  "Новое поступление на Склад": {
    ru: "Новое поступление на Склад",
    en: "New warehouse receipt",
    zh: "新入库登记"
  },
  "Автоматически распределяется в ИТ-отдел со статусом 'На складе'.": {
    ru: "Автоматически распределяется в ИТ-отдел со статусом 'На складе'.",
    en: "Automatically routed to IT with status “In warehouse”.",
    zh: "自动归入 IT 部门，状态为“在库”。"
  },
  "Лицензии ПО": {
    ru: "Лицензии ПО",
    en: "Software licenses",
    zh: "软件许可证"
  },
  "Тип оборудования": {
    ru: "Тип оборудования",
    en: "Equipment type",
    zh: "设备类型"
  },
  "Склад хранения": {
    ru: "Склад хранения",
    en: "Storage warehouse",
    zh: "存放仓库"
  },
  "Наименование товара": {
    ru: "Наименование товара",
    en: "Item name",
    zh: "物品名称"
  },
  "Серийный номер": {
    ru: "Серийный номер",
    en: "Serial number",
    zh: "序列号"
  },
  "Фото оборудования": {
    ru: "Фото оборудования",
    en: "Equipment photo",
    zh: "设备照片"
  },
  "Загрузить изображение": {
    ru: "Загрузить изображение",
    en: "Upload image",
    zh: "上传图片"
  },
  "Загрузка…": { ru: "Загрузка…", en: "Uploading…", zh: "上传中…" },
  "Удалить фото": { ru: "Удалить фото", en: "Remove photo", zh: "删除照片" },
  "Диагональ монитора (дюймы)": {
    ru: "Диагональ монитора (дюймы)",
    en: "Monitor diagonal (inches)",
    zh: "显示器对角线（英寸）"
  },
  "Диагональ": { ru: "Диагональ", en: "Diagonal", zh: "对角线" },
  "Мониторы:": { ru: "Мониторы:", en: "Monitors:", zh: "显示器：" },
  "Сортировка: по умолчанию": {
    ru: "Сортировка: по умолчанию",
    en: "Sort: default",
    zh: "排序：默认"
  },
  "Диагональ ↑": { ru: "Диагональ ↑", en: "Diagonal ↑", zh: "对角线 ↑" },
  "Диагональ ↓": { ru: "Диагональ ↓", en: "Diagonal ↓", zh: "对角线 ↓" },
  "Выбор единиц по серийному номеру": {
    ru: "Выбор единиц по серийному номеру",
    en: "Select units by serial number",
    zh: "按序列号选择单位"
  },
  "Отметьте конкретные единицы или укажите только количество выше.": {
    ru: "Отметьте конкретные единицы или укажите только количество выше.",
    en: "Check specific units or enter quantity only above.",
    zh: "勾选具体单位或仅在上方填写数量。"
  },
  "Серийный номер не указан": {
    ru: "Серийный номер не указан",
    en: "Serial number not set",
    zh: "未填写序列号"
  },
  "Сбросить выбор единиц": {
    ru: "Сбросить выбор единиц",
    en: "Clear unit selection",
    zh: "清除单位选择"
  },
  "Выбрано больше единиц, чем доступно на складе": {
    ru: "Выбрано больше единиц, чем доступно на складе",
    en: "More units selected than available in stock",
    zh: "所选单位数超过库存"
  },
  "Восстановить на склад": {
    ru: "Восстановить на склад",
    en: "Restore to warehouse",
    zh: "恢复到仓库"
  },
  "Восстановлено": {
    ru: "Восстановлено",
    en: "Restored",
    zh: "已恢复"
  },
  "Восстановление со списания": {
    ru: "Восстановление со списания",
    en: "Restored from write-off",
    zh: "从报废恢复"
  },
  "Восстановить оборудование на склад по этому акту списания?": {
    ru: "Восстановить оборудование на склад по этому акту списания?",
    en: "Restore equipment to warehouse from this write-off act?",
    zh: "根据此报废单将设备恢复到仓库？"
  },
  "Удалить акт списания из истории? Оборудование не будет восстановлено.": {
    ru: "Удалить акт списания из истории? Оборудование не будет восстановлено.",
    en: "Delete write-off act from history? Equipment will not be restored.",
    zh: "从历史中删除报废单？设备不会恢复。"
  },
  "Удалить акт (без восстановления)": {
    ru: "Удалить акт (без восстановления)",
    en: "Delete act (no restore)",
    zh: "删除单据（不恢复）"
  },
  "Оборудование по этому акту уже восстановлено.": {
    ru: "Оборудование по этому акту уже восстановлено.",
    en: "Equipment from this act is already restored.",
    zh: "此单据的设备已恢复。"
  },
  "Оборудование с таким инвентарным номером уже есть в системе.": {
    ru: "Оборудование с таким инвентарным номером уже есть в системе.",
    en: "Equipment with this inventory number already exists.",
    zh: "系统中已存在该资产号的设备。"
  },
  "В акте списания не указан инвентарный номер.": {
    ru: "В акте списания не указан инвентарный номер.",
    en: "Write-off act has no inventory number.",
    zh: "报废单未填写资产号。"
  },
  "Не удалось определить тип списанного оборудования.": {
    ru: "Не удалось определить тип списанного оборудования.",
    en: "Could not determine written-off equipment type.",
    zh: "无法确定报废设备类型。"
  },
  "Не удалось восстановить оборудование.": {
    ru: "Не удалось восстановить оборудование.",
    en: "Failed to restore equipment.",
    zh: "无法恢复设备。"
  },
  "Дата поступления": {
    ru: "Дата поступления",
    en: "Receipt date",
    zh: "入库日期"
  },
  "Выберите товар": {
    ru: "Выберите товар",
    en: "Select item",
    zh: "选择商品"
  },
  "Серийные номера по единицам": {
    ru: "Серийные номера по единицам",
    en: "Serial numbers per unit",
    zh: "各单位序列号"
  },
  "Серийные номера по единицам:": {
    ru: "Серийные номера по единицам:",
    en: "Serial numbers per unit:",
    zh: "各单位序列号："
  },
  "Укажите S/N для каждой единицы партии. Пустые поля можно заполнить позже при редактировании.": {
    ru: "Укажите S/N для каждой единицы партии. Пустые поля можно заполнить позже при редактировании.",
    en: "Enter S/N for each unit in the batch. Empty fields can be filled later when editing.",
    zh: "为批次中每个单位填写序列号。空白字段可在编辑时补填。"
  },
  "Единица {n}": {
    ru: "Единица {n}",
    en: "Unit {n}",
    zh: "单位 {n}"
  },
  "Единица": {
    ru: "Единица",
    en: "Unit",
    zh: "单位"
  },
  "При количестве более 1 шт. укажите серийный номер каждой единицы в блоке выше. Характеристики комплектующих ниже применяются ко всем единицам; их S/N получат суффикс -1, -2 и т.д., если не заданы отдельно.": {
    ru: "При количестве более 1 шт. укажите серийный номер каждой единицы в блоке выше. Характеристики комплектующих ниже применяются ко всем единицам; их S/N получат суффикс -1, -2 и т.д., если не заданы отдельно.",
    en: "When quantity is greater than 1, enter each unit serial in the block above. Component specs below apply to all units; their S/N will get suffixes -1, -2, etc. unless set separately.",
    zh: "数量大于 1 时，请在上方块中为每个单位填写序列号。下方组件规格适用于所有单位；其序列号将自动加 -1、-2 等后缀，除非单独指定。"
  },
  "Матрица КТ / Характеристики компьютера": {
    ru: "Матрица КТ / Характеристики компьютера",
    en: "IT matrix / Computer specifications",
    zh: "IT 矩阵 / 计算机规格"
  },
  "Скрыть спецификации": {
    ru: "Скрыть спецификации",
    en: "Hide specifications",
    zh: "隐藏规格"
  },
  "Заполнить спецификации": {
    ru: "Заполнить спецификации",
    en: "Fill in specifications",
    zh: "填写规格"
  },
  "При количестве более 1 шт. указанные характеристики будут применены к каждой единице в реестре. Серийный номер, если указан, получит суффикс -1, -2 и т.д.": {
    ru: "При количестве более 1 шт. указанные характеристики будут применены к каждой единице в реестре. Серийный номер, если указан, получит суффикс -1, -2 и т.д.",
    en: "When quantity is greater than 1, the same specs apply to each registry unit. Serial numbers get suffixes -1, -2, etc.",
    zh: "数量大于 1 时，相同规格将应用于每个登记单元。序列号将添加 -1、-2 等后缀。"
  },
  "Добавить характеристику": {
    ru: "Добавить характеристику",
    en: "Add specification",
    zh: "添加规格"
  },
  "Выберите характеристику…": {
    ru: "Выберите характеристику…",
    en: "Select specification…",
    zh: "选择规格…"
  },
  "Своё поле (произвольное)": {
    ru: "Своё поле (произвольное)",
    en: "Custom field",
    zh: "自定义字段"
  },
  "Добавьте нужные характеристики кнопкой ниже — отображаются только выбранные поля.": {
    ru: "Добавьте нужные характеристики кнопкой ниже — отображаются только выбранные поля.",
    en: "Add the specifications you need with the button below — only selected fields are shown.",
    zh: "使用下方按钮添加所需规格 — 仅显示已选字段。"
  },
  "Разделить партию": {
    ru: "Разделить партию",
    en: "Split batch",
    zh: "拆分批次"
  },
  "Разделить партию…": {
    ru: "Разделить партию…",
    en: "Split batch…",
    zh: "拆分批次…"
  },
  "Разделение партии": {
    ru: "Разделение партии",
    en: "Batch split",
    zh: "批次拆分"
  },
  "Доступно для разделения": {
    ru: "Доступно для разделения",
    en: "Available to split",
    zh: "可拆分数量"
  },
  "Отделите часть количества в отдельную складскую позицию с новым инвентарным номером. Каждую позицию можно выдавать, возвращать и списывать отдельно.": {
    ru: "Отделите часть количества в отдельную складскую позицию с новым инвентарным номером. Каждую позицию можно выдавать, возвращать и списывать отдельно.",
    en: "Move part of the quantity into a separate stock line with a new inventory number. Each line can be issued, returned, and written off independently.",
    zh: "将部分数量拆分为带新库存编号的独立仓位。每条可单独发放、退回和核销。"
  },
  "Отделите часть количества в отдельную складскую позицию с пометкой «разд.» и тем же базовым инвентарным номером. Каждую позицию можно выдавать, возвращать и списывать отдельно.": {
    ru: "Отделите часть количества в отдельную складскую позицию с пометкой «разд.» и тем же базовым инвентарным номером. Каждую позицию можно выдавать, возвращать и списывать отдельно.",
    en: "Move part of the quantity into a separate stock line marked as split, keeping the same base inventory number. Each line can be issued, returned, and written off independently.",
    zh: "将部分数量拆分为带“拆分”标记的独立仓位，保留相同基础库存编号。每条可单独发放、退回和核销。"
  },
  "Сколько единиц отделить": {
    ru: "Сколько единиц отделить",
    en: "Units to split off",
    zh: "拆分数量"
  },
  "Отдельная складская позиция на каждую единицу (по 1 шт.)": {
    ru: "Отдельная складская позиция на каждую единицу (по 1 шт.)",
    en: "Separate stock line per unit (qty 1 each)",
    zh: "每单位单独仓位（各 1 件）"
  },
  "Инвентарный № новой позиции": {
    ru: "Инвентарный № новой позиции",
    en: "New line inventory number",
    zh: "新仓位库存编号"
  },
  "Единицы в реестре получат суффиксы -1, -2 при количестве более 1 в новой партии.": {
    ru: "Единицы в реестре получат суффиксы -1, -2 при количестве более 1 в новой партии.",
    en: "Registry units get -1, -2 suffixes when the new batch quantity is greater than 1.",
    zh: "新批次数量大于 1 时，登记单元将添加 -1、-2 后缀。"
  },
  "Новая позиция появится в списке склада. Её можно выдавать, возвращать на склад и списывать независимо от исходной партии.": {
    ru: "Новая позиция появится в списке склада. Её можно выдавать, возвращать на склад и списывать независимо от исходной партии.",
    en: "The new line appears in the stock list. It can be issued, returned, and written off independently of the original batch.",
    zh: "新仓位将出现在库存列表中，可独立于原批次发放、退回和核销。"
  },
  "Максимум для разделения: {max} шт.": {
    ru: "Максимум для разделения: {max} шт.",
    en: "Maximum to split: {max} units",
    zh: "最多可拆分：{max} 件"
  },
  "Часть единиц уже выдана — можно разделить только остаток, который ещё на складе.": {
    ru: "Часть единиц уже выдана — можно разделить только остаток, который ещё на складе.",
    en: "Some units are already issued — only the remaining stock on hand can be split.",
    zh: "部分单位已发放 — 只能拆分仍在库的剩余数量。"
  },
  "Оставьте хотя бы 1 шт. в исходной позиции или включите «Отдельная позиция на каждую единицу».": {
    ru: "Оставьте хотя бы 1 шт. в исходной позиции или включите «Отдельная позиция на каждую единицу».",
    en: "Leave at least 1 unit in the original line, or enable “Separate stock line per unit”.",
    zh: "请在原仓位至少保留 1 件，或启用“每单位单独仓位”。"
  },
  "Не удалось разделить партию. Проверьте инвентарный номер и остаток на складе.": {
    ru: "Не удалось разделить партию. Проверьте инвентарный номер и остаток на складе.",
    en: "Could not split the batch. Check the inventory number and stock on hand.",
    zh: "无法拆分批次。请检查库存编号和在库数量。"
  },
  "Не удалось разделить партию. Проверьте остаток на складе.": {
    ru: "Не удалось разделить партию. Проверьте остаток на складе.",
    en: "Could not split the batch. Check stock on hand.",
    zh: "无法拆分批次。请检查在库数量。"
  },
  "разд. от {root}": {
    ru: "разд. от {root}",
    en: "split from {root}",
    zh: "拆分自 {root}"
  },
  "Собрать с партией": {
    ru: "Собрать с партией",
    en: "Merge into batch",
    zh: "合并回批次"
  },
  "Собрать позицию {inv} обратно в партию {root}?": {
    ru: "Собрать позицию {inv} обратно в партию {root}?",
    en: "Merge line {inv} back into batch {root}?",
    zh: "将 {inv} 合并回批次 {root}？"
  },
  "Сборка партии": {
    ru: "Сборка партии",
    en: "Batch merge",
    zh: "批次合并"
  },
  "Собрать обратно в партию {root}": {
    ru: "Собрать обратно в партию {root}",
    en: "Merge back into batch {root}",
    zh: "合并回批次 {root}"
  },
  "Серийный номер добавляется автоматически вместе с характеристиками": {
    ru: "Серийный номер добавляется автоматически вместе с характеристиками",
    en: "Serial number is added automatically with specifications",
    zh: "序列号会随规格自动添加"
  },
  "Например: Монитор": {
    ru: "Например: Монитор",
    en: "e.g. Monitor",
    zh: "例如：显示器"
  },
  "Дополнительные характеристики": {
    ru: "Дополнительные характеристики",
    en: "Additional specifications",
    zh: "附加规格"
  },
  "Нажмите «+», чтобы добавить своё поле (например, монитор, ОС, комментарий).": {
    ru: "Нажмите «+», чтобы добавить своё поле (например, монитор, ОС, комментарий).",
    en: "Click + to add a custom field (e.g. monitor, OS, comment).",
    zh: "点击 + 添加自定义字段（如显示器、操作系统、备注）。"
  },
  "Уменьшить можно только на единицы, которые ещё на складе (не выданы).": {
    ru: "Уменьшить можно только на единицы, которые ещё на складе (не выданы).",
    en: "You can only reduce quantity for units still in stock (not issued).",
    zh: "只能减少仍在库（未发放）的数量。"
  },
  "Нельзя уменьшить количество: часть единиц уже выдана. Сначала верните оборудование на склад или уменьшите только свободный остаток.": {
    ru: "Нельзя уменьшить количество: часть единиц уже выдана. Сначала верните оборудование на склад или уменьшите только свободный остаток.",
    en: "Cannot reduce quantity: some units are already issued. Return them to stock first or reduce only the free balance.",
    zh: "无法减少数量：部分设备已发放。请先退回仓库或仅减少可用库存。"
  },
  "Процессор (CPU)": {
    ru: "Процессор (CPU)",
    en: "Processor (CPU)",
    zh: "处理器 (CPU)"
  },
  "Оперативная память (RAM)": {
    ru: "Оперативная память (RAM)",
    en: "Memory (RAM)",
    zh: "内存 (RAM)"
  },
  "Накопитель (SSD/HDD)": {
    ru: "Накопитель (SSD/HDD)",
    en: "Storage (SSD/HDD)",
    zh: "存储 (SSD/HDD)"
  },
  "Видеокарта (GPU)": {
    ru: "Видеокарта (GPU)",
    en: "Graphics card (GPU)",
    zh: "显卡 (GPU)"
  },
  "Материнская плата": {
    ru: "Материнская плата",
    en: "Motherboard",
    zh: "主板"
  },
  "Корпус": {
    ru: "Корпус",
    en: "Case",
    zh: "机箱"
  },
  "Укажите техническое заключение и причину списания устройства с баланса.": {
    ru: "Укажите техническое заключение и причину списания устройства с баланса.",
    en: "Provide the technical report and reason for removing the device from inventory.",
    zh: "请填写技术报告及从账上注销该设备的原因。"
  },
  "Выбранный товар для списания": {
    ru: "Выбранный товар для списания",
    en: "Selected item for write-off",
    zh: "待报废所选物品"
  },
  "Статус утилизации": {
    ru: "Статус утилизации",
    en: "Disposal status",
    zh: "处置状态"
  },
  "Списано по акту": {
    ru: "Списано по акту",
    en: "Written off by certificate",
    zh: "已按单据报废"
  },
  "Причина утилизации / списания": {
    ru: "Причина утилизации / списания",
    en: "Disposal / write-off reason",
    zh: "处置 / 报废原因"
  },
  "Вышла из строя материнская плата ноутбука. Цена ремонта превышает остаточную стоимость покупки нового.": {
    ru: "Вышла из строя материнская плата ноутбука. Цена ремонта превышает остаточную стоимость покупки нового.",
    en: "Laptop motherboard failed. Repair cost exceeds residual value of a new purchase.",
    zh: "笔记本电脑主板故障。维修费用超过购置新设备的残值。"
  },
  "Техническое заключение СЦ о списании": {
    ru: "Техническое заключение СЦ о списании",
    en: "Service center write-off report",
    zh: "服务中心报废报告"
  },
  "Выберите PDF заключение СЦ": {
    ru: "Выберите PDF заключение СЦ",
    en: "Select service center PDF report",
    zh: "选择服务中心 PDF 报告"
  },
  "Выдать ТМЦ со склада": {
    ru: "Выдать ТМЦ со склада",
    en: "Issue inventory from warehouse",
    zh: "从仓库发放库存"
  },
  "Артикул:": {
    ru: "Артикул:",
    en: "SKU:",
    zh: "货号："
  },
  "Модель:": {
    ru: "Модель:",
    en: "Model:",
    zh: "型号："
  },
  "Доступно на складе:": {
    ru: "Доступно на складе:",
    en: "Available in warehouse:",
    zh: "仓库可用："
  },
  "Прикрепить к объекту (филиал)": {
    ru: "Прикрепить к объекту (филиал)",
    en: "Assign to location (branch)",
    zh: "关联至地点（分支）"
  },
  "Закрепить за сотрудником": {
    ru: "Закрепить за сотрудником",
    en: "Assign to employee",
    zh: "指定员工"
  },
  "Общего пользования": {
    ru: "Общего пользования",
    en: "Shared use",
    zh: "共用"
  },
  "Количество для выдачи": {
    ru: "Количество для выдачи",
    en: "Quantity to issue",
    zh: "发放数量"
  },
  "Подтвердить выдачу": {
    ru: "Подтвердить выдачу",
    en: "Confirm issue",
    zh: "确认发放"
  },
  "Управление выданным оборудованием": {
    ru: "Управление выданным оборудованием",
    en: "Manage issued equipment",
    zh: "管理已发放设备"
  },
  "Текущее расположение:": {
    ru: "Текущее расположение:",
    en: "Current location:",
    zh: "当前位置："
  },
  "Вернуть на склад": {
    ru: "Вернуть на склад",
    en: "Return to warehouse",
    zh: "退回仓库"
  },
  "Переместить на объект": {
    ru: "Переместить на объект",
    en: "Move to location",
    zh: "转移至地点"
  },
  "Целевой склад для возврата": {
    ru: "Целевой склад для возврата",
    en: "Target warehouse for return",
    zh: "退回目标仓库"
  },
  "Оборудование исчезнет из группы активного оборудования и будет возвращено как свободный остаток на выбранный склад.": {
    ru: "Оборудование исчезнет из группы активного оборудования и будет возвращено как свободный остаток на выбранный склад.",
    en: "The item will leave active equipment and return as free stock to the selected warehouse.",
    zh: "该设备将从在用设备中移除，并作为可用库存退回所选仓库。"
  },
  "Новый объект (Филиал)": {
    ru: "Новый объект (Филиал)",
    en: "New location (branch)",
    zh: "新地点（分支）"
  },
  "Оставить текущего сотрудника": {
    ru: "Оставить текущего сотрудника",
    en: "Keep current employee",
    zh: "保留当前员工"
  },
  "Оборудование будет виртуально перемещено и закреплено за новой локацией.": {
    ru: "Оборудование будет виртуально перемещено и закреплено за новой локацией.",
    en: "Equipment will be virtually moved and assigned to the new location.",
    zh: "设备将虚拟转移并关联至新地点。"
  },
  "Подтвердить": {
    ru: "Подтвердить",
    en: "Confirm",
    zh: "确认"
  },
  "Переместить ТМЦ на другой склад": {
    ru: "Переместить ТМЦ на другой склад",
    en: "Move inventory to another warehouse",
    zh: "将库存转移至其他仓库"
  },
  "ТМЦ:": {
    ru: "ТМЦ:",
    en: "Inventory:",
    zh: "库存："
  },
  "Текущий склад:": {
    ru: "Текущий склад:",
    en: "Current warehouse:",
    zh: "当前仓库："
  },
  "Доступно:": {
    ru: "Доступно:",
    en: "Available:",
    zh: "可用："
  },
  "Склад-получатель": {
    ru: "Склад-получатель",
    en: "Destination warehouse",
    zh: "目标仓库"
  },
  "Количество для перемещения": {
    ru: "Количество для перемещения",
    en: "Quantity to transfer",
    zh: "转移数量"
  },
  "Подтвердить перемещение": {
    ru: "Подтвердить перемещение",
    en: "Confirm transfer",
    zh: "确认转移"
  },
  "Ожидает списания": {
    ru: "Ожидает списания",
    en: "Pending write-off",
    zh: "待报废"
  },
  "История актов списания": {
    ru: "История актов списания",
    en: "Write-off certificate history",
    zh: "报废单据历史"
  },
  "Оборудование, ожидающее списания": {
    ru: "Оборудование, ожидающее списания",
    en: "Equipment pending write-off",
    zh: "待报废设备"
  },
  "Вернуть оборудование на склад и снять с очереди списания?": {
    ru: "Вернуть оборудование на склад и снять с очереди списания?",
    en: "Return equipment to warehouse and remove from write-off queue?",
    zh: "将设备退回仓库并从待报废队列中移除？"
  },
  "Вернуть оборудование на склад по этому акту списания?": {
    ru: "Вернуть оборудование на склад по этому акту списания?",
    en: "Return equipment to warehouse from this write-off act?",
    zh: "根据此报废单将设备退回仓库？"
  },
  "Не удалось вернуть оборудование на склад. Позиция не найдена в очереди списания.": {
    ru: "Не удалось вернуть оборудование на склад. Позиция не найдена в очереди списания.",
    en: "Could not return equipment to warehouse. Item not found in write-off queue.",
    zh: "无法将设备退回仓库。在待报废队列中未找到该条目。"
  },
  "Оборудование возвращено на склад с очереди списания": {
    ru: "Оборудование возвращено на склад с очереди списания",
    en: "Equipment returned to warehouse from write-off queue",
    zh: "设备已从待报废队列退回仓库"
  },
  "Возврат со списания": {
    ru: "Возврат со списания",
    en: "Returned from write-off queue",
    zh: "从待报废队列退回"
  },
  "Открыть очередь списания": {
    ru: "Открыть очередь списания",
    en: "Open write-off queue",
    zh: "打开待报废队列"
  },
  "Ожидает списания: {n} поз.": {
    ru: "Ожидает списания: {n} поз.",
    en: "Pending write-off: {n} item(s)",
    zh: "待报废：{n} 项"
  },
  "Выберите оборудование и нажмите «Оформить акт», чтобы окончательно списать его и перенести в историю.": {
    ru: "Выберите оборудование и нажмите «Оформить акт», чтобы окончательно списать его и перенести в историю.",
    en: "Select equipment and click “Issue certificate” to finalize write-off and move it to history.",
    zh: "选择设备并点击“出具单据”以完成报废并移入历史记录。"
  },
  "Оформить акт": {
    ru: "Оформить акт",
    en: "Issue certificate",
    zh: "出具单据"
  },
  "Нет оборудования, ожидающего списания": {
    ru: "Нет оборудования, ожидающего списания",
    en: "No equipment pending write-off",
    zh: "暂无待报废设备"
  },
  "Инициатор": {
    ru: "Инициатор",
    en: "Initiator",
    zh: "发起人"
  },
  "Утвердил": {
    ru: "Утвердил",
    en: "Approver",
    zh: "审批人"
  },
  "Док:": {
    ru: "Док:",
    en: "Doc:",
    zh: "单据："
  },
  "Комментарий:": {
    ru: "Комментарий:",
    en: "Comment:",
    zh: "备注："
  },
  "Инициатор списания (ФИО)": {
    ru: "Инициатор списания (ФИО)",
    en: "Write-off initiator (full name)",
    zh: "报废发起人（姓名）"
  },
  "Согласующий (ФИО)": {
    ru: "Согласующий (ФИО)",
    en: "Approver (full name)",
    zh: "审批人（姓名）"
  },
  "Документ / Номер акта": {
    ru: "Документ / Номер акта",
    en: "Document / certificate number",
    zh: "文件 / 单据编号"
  },
  "Доп. Комментарий": {
    ru: "Доп. Комментарий",
    en: "Additional comment",
    zh: "补充备注"
  },
  "Подразделение (Откуда)": {
    ru: "Подразделение (Откуда)",
    en: "Department (from)",
    zh: "部门（来源）"
  },
  "Объект / Локация": {
    ru: "Объект / Локация",
    en: "Location / site",
    zh: "地点 / 位置"
  },
  "Склад с таким названием уже существует!": {
    ru: "Склад с таким названием уже существует!",
    en: "A warehouse with this name already exists!",
    zh: "已存在同名仓库！"
  },
  "Количество должно быть не менее 1": {
    ru: "Количество должно быть не менее 1",
    en: "Quantity must be at least 1",
    zh: "数量至少为 1"
  },
  "Склад-источник и склад-получатель должны отличаться": {
    ru: "Склад-источник и склад-получатель должны отличаться",
    en: "Source and destination warehouses must differ",
    zh: "来源仓库与目标仓库必须不同"
  },
  "Не удалось выдать товар со склада. Возможно, устройство не найдено или возникла непредвиденная ошибка.": {
    ru: "Не удалось выдать товар со склада. Возможно, устройство не найдено или возникла непредвиденная ошибка.",
    en: "Failed to issue item from warehouse. The device may not exist or an unexpected error occurred.",
    zh: "无法从仓库发放物品。设备可能不存在或发生意外错误。"
  },
  "Не выбран элемент для списания.": {
    ru: "Не выбран элемент для списания.",
    en: "No item selected for write-off.",
    zh: "未选择待报废项目。"
  },
  "Укажите ФИО инициатора и согласующего.": {
    ru: "Укажите ФИО инициатора и согласующего.",
    en: "Enter initiator and approver full names.",
    zh: "请填写发起人与审批人姓名。"
  },
  "Произошла ошибка при списании товара.": {
    ru: "Произошла ошибка при списании товара.",
    en: "An error occurred while writing off the item.",
    zh: "报废物品时发生错误。"
  },
  "Каждое выданное устройство будет автоматически переведено в статус \"В работе\" и закреплено за объектом.": {
    ru: "Каждое выданное устройство будет автоматически переведено в статус \"В работе\" и закреплено за объектом.",
    en: "Each issued device is automatically set to “In use” and assigned to the location.",
    zh: "每件发放的设备将自动设为“使用中”并关联至地点。"
  },
  "Главный офис": {
    ru: "Главный офис",
    en: "Main office",
    zh: "总部"
  },
  "Основной": {
    ru: "Основной",
    en: "Default",
    zh: "默认"
  },
  "Без инв. №": {
    ru: "Без инв. №",
    en: "No inv. No.",
    zh: "无资产编号"
  },
  "Не выбран": {
    ru: "Не выбран",
    en: "Not selected",
    zh: "未选择"
  },
  "Привязано": {
    ru: "Привязано",
    en: "Assigned",
    zh: "已关联"
  },
  "лиц.": {
    ru: "лиц.",
    en: "lic.",
    zh: "许可"
  },
  "Филиальный склад IT оборудования": {
    ru: "Филиальный склад IT оборудования",
    en: "Branch IT equipment warehouse",
    zh: "分支 IT 设备仓库"
  },
  "Модель / Детали": {
    ru: "Модель / Детали",
    en: "Model / Details",
    zh: "型号 / 详情"
  },
  "Недостаточное количество.": {
    ru: "Недостаточное количество.",
    en: "Insufficient quantity.",
    zh: "数量不足。"
  },
  "Доступно для списания всего": {
    ru: "Доступно для списания всего",
    en: "Available for write-off:",
    zh: "可报废数量："
  },
  "Доступно": {
    ru: "Доступно",
    en: "Available",
    zh: "可用"
  },
  "Например: Утилизация через эко-сервис": {
    ru: "Например: Утилизация через эко-сервис",
    en: "e.g. Disposal via eco-service",
    zh: "例如：通过环保服务处置"
  },
  "Например: Бухгалтерия": {
    ru: "Например: Бухгалтерия",
    en: "e.g. Accounting",
    zh: "例如：财务部"
  },
  "Например: Главный офис": {
    ru: "Например: Главный офис",
    en: "e.g. Main office",
    zh: "例如：总部"
  },
  "CSV: Наименование": {
    ru: "Наименование",
    en: "Name",
    zh: "名称"
  },
  "CSV: Тип": {
    ru: "Тип",
    en: "Type",
    zh: "类型"
  },
  "CSV: Модель": {
    ru: "Модель",
    en: "Model",
    zh: "型号"
  },
  "CSV: Инвентарный номер": {
    ru: "Инвентарный номер",
    en: "Inventory number",
    zh: "资产编号"
  },
  "CSV: Количество": {
    ru: "Количество",
    en: "Quantity",
    zh: "数量"
  },
  "CSV: Ед. изм.": {
    ru: "Ед. изм.",
    en: "Unit",
    zh: "单位"
  },
  "CSV: Стоимость за ед.": {
    ru: "Стоимость за ед.",
    en: "Unit cost",
    zh: "单价"
  },
  "CSV: Общая стоимость": {
    ru: "Общая стоимость",
    en: "Total cost",
    zh: "总价"
  },
  "CSV: Статус": {
    ru: "Статус",
    en: "Status",
    zh: "状态"
  },
  "На складе:": {
    ru: "На складе:",
    en: "In warehouse:",
    zh: "在库："
  },
  "Выдано:": {
    ru: "Выдано:",
    en: "Issued:",
    zh: "已发放："
  },
  "Открыть раздел": {
    ru: "Открыть раздел",
    en: "Open section",
    zh: "打开栏目"
  },
  "Прочее оборудование": {
    ru: "Прочее оборудование",
    en: "Other equipment",
    zh: "其他设备"
  },
  "Группы оборудования": {
    ru: "Группы оборудования",
    en: "Equipment groups",
    zh: "设备分组"
  },
  "Печатный документ:": {
    ru: "Печатный документ:",
    en: "Printable document:",
    zh: "打印文档："
  },
  "Приказ о начале инвентаризации": {
    ru: "Приказ о начале инвентаризации",
    en: "Inventory start order",
    zh: "盘点开始令"
  },
  "Акт заключения инвентаризации": {
    ru: "Акт заключения инвентаризации",
    en: "Inventory conclusion act",
    zh: "盘点结论书"
  },
  "Объект проведения:": {
    ru: "Объект проведения:",
    en: "Location:",
    zh: "检查地点："
  },
  "Комиссия УК": {
    ru: "Комиссия УК",
    en: "Management commission",
    zh: "管理委员会"
  },
  "Плановая инвентаризация ТМЦ": {
    ru: "Плановая инвентаризация ТМЦ",
    en: "Scheduled asset inventory",
    zh: "计划资产盘点"
  },
  "Провести плановую сверку компьютерной техники, оргтехники и расходных материалов на объекте.": {
    ru: "Провести плановую сверку компьютерной техники, оргтехники и расходных материалов на объекте.",
    en: "Perform scheduled verification of computers, office equipment and consumables at the location.",
    zh: "在该地点进行计算机、办公设备及耗材的计划核对。"
  },
  "Не закреплено": {
    ru: "Не закреплено",
    en: "Unassigned",
    zh: "未分配"
  },
  "Компьютер": {
    ru: "Компьютер",
    en: "Computer",
    zh: "计算机"
  },
  "Служба ИТ / Админ": {
    ru: "Служба ИТ / Админ",
    en: "IT department / Admin",
    zh: "IT 部门 / 管理员"
  },
  "В ходе инвентаризации несоответствий не обнаружено (или оперативно исправлено). Все единицы ТМЦ совпадают.": {
    ru: "В ходе инвентаризации несоответствий не обнаружено (или оперативно исправлено). Все единицы ТМЦ совпадают.",
    en: "No discrepancies found during inventory (or promptly corrected). All assets match records.",
    zh: "盘点期间未发现差异（或已及时纠正）。所有资产与记录一致。"
  },
  "Собственный акт во вложении:": {
    ru: "Собственный акт во вложении:",
    en: "Custom act attached:",
    zh: "已附自定义报告："
  },
  "Автоматическая привязка:": {
    ru: "Автоматическая привязка:",
    en: "Auto-generated attachment:",
    zh: "自动生成附件："
  },
  "Ваш подписанный PDF-документ будет сохранен в качестве официального отчета о завершении инвентаризации.": {
    ru: "Ваш подписанный PDF-документ будет сохранен в качестве официального отчета о завершении инвентаризации.",
    en: "Your signed PDF will be saved as the official inventory completion report.",
    zh: "您签署的 PDF 将保存为正式的盘点完成报告。"
  },
  "К карточке инвентаризации будет привязан официальный документ Акт инвентаризационного заключения с подписями председателя комиссии и исполнителей.": {
    ru: "К карточке инвентаризации будет привязан официальный документ Акт инвентаризационного заключения с подписями председателя комиссии и исполнителей.",
    en: "An official inventory conclusion act with commission signatures will be attached to the audit card.",
    zh: "正式的盘点结论书（含委员会签名）将附加到盘点记录。"
  },
  "ШТАМП ОРГАНИЗАЦИИ": {
    ru: "ШТАМП ОРГАНИЗАЦИИ",
    en: "ORGANIZATION STAMP",
    zh: "单位印章"
  },
  "И СИСТЕМНАЯ СВЕРКА:": {
    ru: "И СИСТЕМНАЯ СВЕРКА:",
    en: "AND SYSTEM VERIFICATION:",
    zh: "及系统核对："
  },
  "Документ зарегистрирован в журнале аудита": {
    ru: "Документ зарегистрирован в журнале аудита",
    en: "Document registered in audit log",
    zh: "文档已登记在盘点日志"
  },
  "Удаление инвентаризации": {
    ru: "Удаление инвентаризации",
    en: "Delete inventory audit",
    zh: "删除盘点记录"
  },
  "Запись об инвентаризации будет удалена. Это действие необратимо.": {
    ru: "Запись об инвентаризации будет удалена. Это действие необратимо.",
    en: "The inventory audit record will be deleted. This action cannot be undone.",
    zh: "盘点记录将被删除，此操作不可撤销。"
  },
  "Сверить фактическое наличие с записями в базе данных ИТ-учета.": {
    ru: "Сверить фактическое наличие с записями в базе данных ИТ-учета.",
    en: "Verify physical stock against IT asset database records.",
    zh: "核对实物与 IT 资产数据库记录。"
  },
  "Инвентаризация успешно завершена. Все обнаруженные ТМЦ соответствуют инвентарным номерам, расхождения устранены.": {
    ru: "Инвентаризация успешно завершена. Все обнаруженные ТМЦ соответствуют инвентарным номерам, расхождения устранены.",
    en: "Inventory completed. All assets match inventory numbers; discrepancies resolved.",
    zh: "盘点已完成。所有资产与编号一致，差异已处理。"
  },
  "Проверка позиций": {
    ru: "Проверка позиций",
    en: "Item verification",
    zh: "逐项核对"
  },
  "На данном объекте нет зарегистрированного оборудования": {
    ru: "На данном объекте нет зарегистрированного оборудования",
    en: "No registered equipment at this location",
    zh: "该地点无登记设备"
  },
  "Открыть на весь экран": {
    ru: "Открыть на весь экран",
    en: "Open full screen",
    zh: "全屏打开"
  },
  "Нет позиций по выбранному фильтру": {
    ru: "Нет позиций по выбранному фильтру",
    en: "No items match the selected filter",
    zh: "没有符合筛选条件的项目"
  },
  "Поиск по наименованию или инв. номеру": {
    ru: "Поиск по наименованию или инв. номеру",
    en: "Search by name or inventory number",
    zh: "按名称或资产编号搜索"
  },
  "Ход инвентаризации": {
    ru: "Ход инвентаризации",
    en: "Inventory progress",
    zh: "盘点进度"
  },
  "Есть": {
    ru: "Есть",
    en: "Present",
    zh: "在库"
  },
  "Первоначальная настройка": {
    ru: "Первоначальная настройка",
    en: "Initial setup",
    zh: "初始设置"
  },
  "Первый запуск": {
    ru: "Первый запуск",
    en: "First launch",
    zh: "首次启动"
  },
  "Создайте учетную запись администратора для начала работы с системой. Платформа будет заблокирована до завершения этого шага.": {
    ru: "Создайте учетную запись администратора для начала работы с системой. Платформа будет заблокирована до завершения этого шага.",
    en: "Create an administrator account to start using the system. The platform will be locked until this step is completed.",
    zh: "创建管理员账户以开始使用系统。完成此步骤前平台将保持锁定。"
  },
  "Логин (Username)": {
    ru: "Логин",
    en: "Login (Username)",
    zh: "登录名 (Username)"
  },
  "Имейл": {
    ru: "Имейл",
    en: "Email",
    zh: "电子邮箱"
  },
  "Пароль (Security Password)": {
    ru: "Пароль",
    en: "Security Password",
    zh: "安全密码"
  },
  "Подтвердите пароль (Confirm Password)": {
    ru: "Подтвердите пароль",
    en: "Confirm Password",
    zh: "确认密码"
  },
  "ваш логин": {
    ru: "ваш логин",
    en: "your login",
    zh: "您的登录名"
  },
  "ваша почта": {
    ru: "ваша почта",
    en: "your email",
    zh: "您的邮箱"
  },
  "Создайте учётную запись администратора для начала работы с системой. До этого шага доступ к платформе закрыт.": {
    ru: "Создайте учётную запись администратора для начала работы с системой. До этого шага доступ к платформе закрыт.",
    en: "Create an administrator account to start using the system. The platform is locked until this step is completed.",
    zh: "创建管理员账户以开始使用系统。完成此步骤前无法访问平台。"
  },
  "Логин администратора": {
    ru: "Логин администратора",
    en: "Administrator login",
    zh: "管理员登录名"
  },
  "Не менее 8 символов": {
    ru: "Не менее 8 символов",
    en: "At least 8 characters",
    zh: "至少 8 个字符"
  },
  "Подтверждение пароля": {
    ru: "Подтверждение пароля",
    en: "Confirm password",
    zh: "确认密码"
  },
  "Создать администратора": {
    ru: "Создать администратора",
    en: "Create administrator",
    zh: "创建管理员"
  },
  "Создание...": {
    ru: "Создание...",
    en: "Creating...",
    zh: "创建中..."
  },
  "Администратор создан. Переход к входу...": {
    ru: "Администратор создан. Переход к входу...",
    en: "Administrator created. Redirecting to sign in...",
    zh: "管理员已创建，正在跳转到登录..."
  },
  "Заполните все обязательные поля.": {
    ru: "Заполните все обязательные поля.",
    en: "Please fill in all required fields.",
    zh: "请填写所有必填项。"
  },
  "Пароли не совпадают.": {
    ru: "Пароли не совпадают.",
    en: "Passwords do not match.",
    zh: "两次输入的密码不一致。"
  },
  "Не удалось создать учётную запись администратора.": {
    ru: "Не удалось создать учётную запись администратора.",
    en: "Failed to create the administrator account.",
    zh: "无法创建管理员账户。"
  },
  "Учётная запись администратора создана. Войдите в систему.": {
    ru: "Учётная запись администратора создана. Войдите в систему.",
    en: "Administrator account created. Please sign in.",
    zh: "管理员账户已创建，请登录系统。"
  },
  "Загрузка...": {
    ru: "Загрузка...",
    en: "Loading...",
    zh: "加载中..."
  },
  "Пожалуйста, заполните все поля для авторизации.": {
    ru: "Пожалуйста, заполните все поля для авторизации.",
    en: "Please fill in all fields to sign in.",
    zh: "请填写所有登录字段。"
  },
  "Неверный логин или пароль. Проверьте учётные данные.": {
    ru: "Неверный логин или пароль. Проверьте учётные данные.",
    en: "Invalid login or password. Check your credentials.",
    zh: "登录名或密码错误，请检查凭据。"
  },
  "Ошибка сети. Проверьте подключение к серверу.": {
    ru: "Ошибка сети. Проверьте подключение к серверу.",
    en: "Network error. Check your connection to the server.",
    zh: "网络错误，请检查与服务器的连接。"
  },
  "Первоначальная настройка уже выполнена.": {
    ru: "Первоначальная настройка уже выполнена.",
    en: "Initial setup has already been completed.",
    zh: "初始设置已完成。"
  },
  "Не удалось проверить статус настройки.": {
    ru: "Не удалось проверить статус настройки.",
    en: "Failed to read setup status.",
    zh: "无法读取设置状态。"
  },
  "Логин должен содержать не менее 3 символов": {
    ru: "Логин должен содержать не менее 3 символов",
    en: "Login must be at least 3 characters.",
    zh: "登录名至少需要 3 个字符。"
  },
  "Логин слишком длинный": {
    ru: "Логин слишком длинный",
    en: "Login is too long.",
    zh: "登录名过长。"
  },
  "Логин может содержать только буквы, цифры, точку, дефис и подчёркивание": {
    ru: "Логин может содержать только буквы, цифры, точку, дефис и подчёркивание",
    en: "Login may only contain letters, digits, dot, hyphen and underscore.",
    zh: "登录名只能包含字母、数字、点、连字符和下划线。"
  },
  "Пароль должен содержать не менее 8 символов": {
    ru: "Пароль должен содержать не менее 8 символов",
    en: "Password must be at least 8 characters.",
    zh: "密码至少需要 8 个字符。"
  },
  "Пароль слишком длинный": {
    ru: "Пароль слишком длинный",
    en: "Password is too long.",
    zh: "密码过长。"
  },
  "Укажите электронную почту": {
    ru: "Укажите электронную почту",
    en: "Email is required.",
    zh: "请填写电子邮箱。"
  },
  "Некорректный формат email": {
    ru: "Некорректный формат email",
    en: "Invalid email format.",
    zh: "电子邮箱格式不正确。"
  },
  "Email слишком длинный": {
    ru: "Email слишком длинный",
    en: "Email is too long.",
    zh: "电子邮箱过长。"
  },
  "Не удалось найти запись для удаления.": {
    ru: "Не удалось найти запись для удаления.",
    en: "Could not find the record to delete.",
    zh: "找不到要删除的记录。"
  },
  "Не удалось найти активную запись для возврата на склад.": {
    ru: "Не удалось найти активную запись для возврата на склад.",
    en: "Could not find an active record to return to warehouse.",
    zh: "找不到可退回仓库的有效记录。"
  },
  "Это оборудование уже на складе или в статусе списания.": {
    ru: "Это оборудование уже на складе или в статусе списания.",
    en: "This equipment is already in stock or marked for write-off.",
    zh: "该设备已在库或处于核销/待核销状态。"
  },
  "Оборудование с инвентарным номером {inv} уже существует!": {
    ru: "Оборудование с инвентарным номером {inv} уже существует!",
    en: "Equipment with inventory number {inv} already exists!",
    zh: "资产编号 {inv} 的设备已存在！"
  },
  "ПО с ключом/инвентарным номером {key} уже существует!": {
    ru: "ПО с ключом/инвентарным номером {key} уже существует!",
    en: "Software with license/inventory key {key} already exists!",
    zh: "密钥/资产编号 {key} 的软件已存在！"
  },
  "ОШИБКА: Инвентарный номер {inv} уже занят другим оборудованием (\"{name}\"). Пожалуйста, используйте уникальный номер.": {
    ru: "ОШИБКА: Инвентарный номер {inv} уже занят другим оборудованием (\"{name}\"). Пожалуйста, используйте уникальный номер.",
    en: "ERROR: Inventory number {inv} is already used by \"{name}\". Please use a unique number.",
    zh: "错误：资产编号 {inv} 已被“{name}”占用。请使用唯一编号。"
  },
  "Оборудование с инвентарным номером {inv} уже существует в системе!": {
    ru: "Оборудование с инвентарным номером {inv} уже существует в системе!",
    en: "Equipment with inventory number {inv} already exists in the system!",
    zh: "系统中已存在资产编号 {inv} 的设备！"
  },
  "Склад ИТ — {n} поз.": {
    ru: "Склад ИТ — {n} поз.",
    en: "IT warehouse — {n} item(s)",
    zh: "IT仓库 — {n} 项"
  },
  "Сетевое оборудование — {n} карточ.": {
    ru: "Сетевое оборудование — {n} карточ.",
    en: "Network equipment — {n} card(s)",
    zh: "网络设备 — {n} 张卡片"
  },
  "Оборудование / компьютеры — {n} карточ.": {
    ru: "Оборудование / компьютеры — {n} карточ.",
    en: "Equipment / computers — {n} card(s)",
    zh: "设备/计算机 — {n} 张卡片"
  },
  "Программное обеспечение — {n} лиценз.": {
    ru: "Программное обеспечение — {n} лиценз.",
    en: "Software — {n} license(s)",
    zh: "软件 — {n} 个许可证"
  },
  "Срок гарантии оборудования {device} ({inv}) истекает через {n} дней": {
    ru: "Срок гарантии оборудования {device} ({inv}) истекает через {n} дней",
    en: "Warranty for {device} ({inv}) expires in {n} days",
    zh: "设备 {device}（{inv}）的保修将在 {n} 天后到期"
  },
  "Лицензия на ПО \"{name}\" истекает через {n} дней": {
    ru: "Лицензия на ПО \"{name}\" истекает через {n} дней",
    en: "License for \"{name}\" expires in {n} days",
    zh: "软件“{name}”的许可证将在 {n} 天后到期"
  },
  "Проведена инвентаризация: \"{title}\" ({n} расхождений)": {
    ru: "Проведена инвентаризация: \"{title}\" ({n} расхождений)",
    en: "Inventory completed: \"{title}\" ({n} discrepancies)",
    zh: "已完成盘点：“{title}”（{n} 处差异）"
  },
  "Доступно обновление Vicariustab. Откройте Настройки → Центр обновлений.": {
    ru: "Доступно обновление Vicariustab. Откройте Настройки → Центр обновлений.",
    en: "Vicariustab update available. Open Settings → Update Center.",
    zh: "Vicariustab 有可用更新。请打开设置 → 更新中心。"
  },
  "Обновление Vicariustab установлено. Платформа перезапускается.": {
    ru: "Обновление Vicariustab установлено. Платформа перезапускается.",
    en: "Vicariustab update installed. Platform is restarting.",
    zh: "Vicariustab 更新已安装。平台正在重启。"
  },
  "Идет сканирование...": {
    ru: "Идет сканирование...",
    en: "Scanning...",
    zh: "正在扫描..."
  },
  "Запустить Тест Защищенности": {
    ru: "Запустить Тест Защищенности",
    en: "Run Security Test",
    zh: "运行安全测试"
  },
  "Анализ еще не запускался": {
    ru: "Анализ еще не запускался",
    en: "Analysis has not been run yet",
    zh: "尚未运行分析"
  },
  "Исправлено ✓": {
    ru: "Исправлено ✓",
    en: "Fixed ✓",
    zh: "已修复 ✓"
  },
  "Критическая угр.": {
    ru: "Критическая угр.",
    en: "Critical threat",
    zh: "严重威胁"
  },
  "Риск ИБ": {
    ru: "Риск ИБ",
    en: "InfoSec risk",
    zh: "信息安全风险"
  },
  "Инфо": {
    ru: "Инфо",
    en: "Info",
    zh: "信息"
  },
  "Скан от: {time}": {
    ru: "Скан от: {time}",
    en: "Scan at: {time}",
    zh: "扫描时间：{time}"
  },
  "ВЕДОМОСТЬ НАЧАЛА ИНВЕНТАРИЗАЦИИ № ИНВ-СТ-{id}": {
    ru: "ВЕДОМОСТЬ НАЧАЛА ИНВЕНТАРИЗАЦИИ № ИНВ-СТ-{id}",
    en: "INVENTORY START SHEET No. INV-ST-{id}",
    zh: "盘点开始清单 № 盘点-开始-{id}"
  },
  "Организация": {
    ru: "Организация",
    en: "Organization",
    zh: "单位"
  },
  "Дата начала инвентаризации": {
    ru: "Дата начала инвентаризации",
    en: "Inventory start date",
    zh: "盘点开始日期"
  },
  "Проводит инвентаризацию:": {
    ru: "Проводит инвентаризацию:",
    en: "Conducts inventory:",
    zh: "盘点执行人："
  },
  "Принимает инвентаризацию:": {
    ru: "Принимает инвентаризацию:",
    en: "Accepts inventory:",
    zh: "盘点验收人："
  },
  "Ответственный за базу учёта:": {
    ru: "Ответственный за базу учёта:",
    en: "Database responsible:",
    zh: "系统责任人："
  },
  "Перечень оборудования к проверке (отметить «Есть» или «Нет» напротив каждой позиции):": {
    ru: "Перечень оборудования к проверке (отметить «Есть» или «Нет» напротив каждой позиции):",
    en: "Equipment to verify (mark Yes / No for each line):",
    zh: "待核对设备（请在每行勾选 在库/缺失）："
  },
  "Основание / распоряжение:": {
    ru: "Основание / распоряжение:",
    en: "Basis / order:",
    zh: "依据/说明："
  },
  "При физической сверке отметьте в графах «Есть» или «Нет» фактическое наличие каждой единицы.": {
    ru: "При физической сверке отметьте в графах «Есть» или «Нет» фактическое наличие каждой единицы.",
    en: "When physically verifying, mark Yes or No for each item.",
    zh: "实物核对时请在“在库/缺失”栏勾选。"
  },
  "Ответственный за учёт:": {
    ru: "Ответственный за учёт:",
    en: "Accounting responsible:",
    zh: "账务责任人："
  },
  "create": {
    ru: "создание",
    en: "Creation",
    zh: "创建"
  },
  "update": {
    ru: "изменение",
    en: "Update",
    zh: "更新"
  },
  "delete": {
    ru: "удаление",
    en: "Deletion",
    zh: "删除"
  },
  "system": {
    ru: "система",
    en: "System",
    zh: "系统"
  },
  "auth": {
    ru: "вход",
    en: "Sign-in",
    zh: "认证"
  },
  "Активация лицензии": { ru: "Активация лицензии", en: "License activated", zh: "许可证已激活" },
  "Деактивация лицензии": { ru: "Деактивация лицензии", en: "License deactivated", zh: "许可证已停用" },
  "Смена аватара": { ru: "Смена аватара", en: "Avatar changed", zh: "头像已更改" },
  "Добавлен пользователь": { ru: "Добавлен пользователь", en: "User added", zh: "已添加用户" },
  "Отозван доступ": { ru: "Отозван доступ", en: "Access revoked", zh: "访问已撤销" },
  "Изменение параметров доступа": { ru: "Изменение параметров доступа", en: "Access settings changed", zh: "访问参数已更改" },
  "Выход из системы": { ru: "Выход из системы", en: "Signed out", zh: "已退出系统" },
  "Изменен элемент": { ru: "Изменен элемент", en: "Item updated", zh: "项目已更新" },
  "Добавлен объект": { ru: "Добавлен объект", en: "Location added", zh: "已添加地点" },
  "Изменен объект": { ru: "Изменен объект", en: "Location updated", zh: "地点已更新" },
  "Управление Объектами": { ru: "Управление Объектами", en: "Location management", zh: "地点管理" },
  "Удален объект": { ru: "Удален объект", en: "Location deleted", zh: "地点已删除" },
  "Добавлено сетевое оборудование": { ru: "Добавлено сетевое оборудование", en: "Network device added", zh: "已添加网络设备" },
  "Изменено сетевое оборудование": { ru: "Изменено сетевое оборудование", en: "Network device updated", zh: "网络设备已更新" },
  "Управление Персоналом": { ru: "Управление Персоналом", en: "Staff management", zh: "人员管理" },
  "Изменен статус ПК": { ru: "Изменен статус ПК", en: "PC status changed", zh: "PC 状态已更改" },
  "Добавлено ПО": { ru: "Добавлено ПО", en: "Software added", zh: "已添加软件" },
  "Изменено ПО": { ru: "Изменено ПО", en: "Software updated", zh: "软件已更新" },
  "Добавлен сотрудник": { ru: "Добавлен сотрудник", en: "Employee added", zh: "已添加员工" },
  "Изменен профиль сотрудника": { ru: "Изменен профиль сотрудника", en: "Employee profile updated", zh: "员工资料已更新" },
  "Удален сотрудник": { ru: "Удален сотрудник", en: "Employee removed", zh: "员工已删除" },
  "Помечено на списание": { ru: "Помечено на списание", en: "Marked for write-off", zh: "已标记待报废" },
  "Поступление ТМЦ": { ru: "Поступление ТМЦ", en: "Stock received", zh: "库存入库" },
  "Авто-распределение ТМЦ": { ru: "Авто-распределение ТМЦ", en: "Auto stock allocation", zh: "库存自动分配" },
  "Списание ТМЦ": { ru: "Списание ТМЦ", en: "Stock write-off", zh: "库存报废" },
  "Удалено списание ТМЦ": { ru: "Удалено списание ТМЦ", en: "Write-off record deleted", zh: "已删除报废记录" },
  "Успешно активирован новый лицензионный ключ продукта": { ru: "Успешно активирован новый лицензионный ключ продукта", en: "New product license key activated successfully", zh: "新产品许可证密钥已成功激活" },
  "Сброшен активный лицензионный ключ системы": { ru: "Сброшен активный лицензионный ключ системы", en: "Active system license key reset", zh: "已重置活动系统许可证密钥" },
  "Пользователь обновил личный аватар профиля": { ru: "Пользователь обновил личный аватар профиля", en: "User updated profile avatar", zh: "用户更新了个人头像" },
  "Добавлен представитель \"{name}\" с правами \"{role}\"": { ru: "Добавлен представитель \"{name}\" с правами \"{role}\"", en: "Added user \"{name}\" with role \"{role}\"", zh: "已添加用户“{name}”，角色“{role}”" },
  "Отозван доступ к панели у сотрудника \"{name}\"": { ru: "Отозван доступ к панели у сотрудника \"{name}\"", en: "Revoked panel access for \"{name}\"", zh: "已撤销“{name}”的面板访问权限" },
  "Обновлены данные учетной записи \"{name}\"": { ru: "Обновлены данные учетной записи \"{name}\"", en: "Updated account data for \"{name}\"", zh: "已更新账户“{name}”的数据" },
  "Завершена сессия пользователя \"{name}\"": { ru: "Завершена сессия пользователя \"{name}\"", en: "Session ended for user \"{name}\"", zh: "已结束用户“{name}”的会话" },
  "Изменены параметры ({label}, ID: {id})": { ru: "Изменены параметры ({label}, ID: {id})", en: "Parameters changed ({label}, ID: {id})", zh: "参数已更改（{label}，ID：{id}）" },
  "Добавлен объект \"{name}\" по адресу \"{address}\"": { ru: "Добавлен объект \"{name}\" по адресу \"{address}\"", en: "Added location \"{name}\" at \"{address}\"", zh: "已添加地点“{name}”，地址“{address}”" },
  "Параметры объекта \"{name}\" изменены": { ru: "Параметры объекта \"{name}\" изменены", en: "Location \"{name}\" parameters updated", zh: "地点“{name}”参数已更新" },
  "Объект \"{name}\" {action}": { ru: "Объект \"{name}\" {action}", en: "Location \"{name}\" {action}", zh: "地点“{name}”{action}" },
  "архивирован": { ru: "архивирован", en: "archived", zh: "已归档" },
  "восстановлен из архива": { ru: "восстановлен из архива", en: "restored from archive", zh: "已从归档恢复" },
  "Удален объект \"{name}\"": { ru: "Удален объект \"{name}\"", en: "Deleted location \"{name}\"", zh: "已删除地点“{name}”" },
  "Добавлено устройство \"{name}\"": { ru: "Добавлено устройство \"{name}\"", en: "Added device \"{name}\"", zh: "已添加设备“{name}”" },
  "Параметры оборудования \"{name}\" изменены": { ru: "Параметры оборудования \"{name}\" изменены", en: "Equipment \"{name}\" parameters updated", zh: "设备“{name}”参数已更新" },
  "Сотрудник \"{name}\" {action}": { ru: "Сотрудник \"{name}\" {action}", en: "Employee \"{name}\" {action}", zh: "员工“{name}”{action}" },
  "Параметры \"{item}\" изменены (Статус: {status})": { ru: "Параметры \"{item}\" изменены (Статус: {status})", en: "\"{item}\" parameters updated (Status: {status})", zh: "“{item}”参数已更新（状态：{status}）" },
  "Добавлена программа \"{name}\"": { ru: "Добавлена программа \"{name}\"", en: "Added program \"{name}\"", zh: "已添加程序“{name}”" },
  "Параметры ПО \"{name}\" обновлены": { ru: "Параметры ПО \"{name}\" обновлены", en: "Software \"{name}\" parameters updated", zh: "软件“{name}”参数已更新" },
  "Добавлен новый профиль сотрудника \"{name}\" ({position}) на объект \"{object}\"": { ru: "Добавлен новый профиль сотрудника \"{name}\" ({position}) на объект \"{object}\"", en: "Added employee \"{name}\" ({position}) at location \"{object}\"", zh: "已添加员工“{name}”（{position}），地点“{object}”" },
  "Добавлен новый профиль сотрудника \"{name}\" ({position})": { ru: "Добавлен новый профиль сотрудника \"{name}\" ({position})", en: "Added employee \"{name}\" ({position})", zh: "已添加员工“{name}”（{position}）" },
  "Обновлены данные о сотруднике \"{name}\"": { ru: "Обновлены данные о сотруднике \"{name}\"", en: "Updated employee data for \"{name}\"", zh: "已更新员工“{name}”的数据" },
  "Удален сотрудник \"{name}\" из штата. Выданное оборудование возвращено на склад.": { ru: "Удален сотрудник \"{name}\" из штата. Выданное оборудование возвращено на склад.", en: "Removed employee \"{name}\". Issued equipment returned to warehouse.", zh: "已删除员工“{name}”。已发放设备退回仓库。" },
  "Принят на баланс склада товар \"{name}\" в количестве {qty} {unit}": { ru: "Принят на баланс склада товар \"{name}\" в количестве {qty} {unit}", en: "Received \"{name}\" x{qty} {unit} to warehouse", zh: "仓库入库“{name}” {qty} {unit}" },
  "Устройство \"{name}\" автоматически распределено в Сетевое оборудование": { ru: "Устройство \"{name}\" автоматически распределено в Сетевое оборудование", en: "Device \"{name}\" auto-allocated to network equipment", zh: "设备“{name}”已自动分配到网络设备" },
  "Списано {qty} {unit} для устройства \"{name}\" (Инв. № {inv})": { ru: "Списано {qty} {unit} для устройства \"{name}\" (Инв. № {inv})", en: "Written off {qty} {unit} for \"{name}\" (Inv. {inv})", zh: "已为“{name}”报废 {qty} {unit}（资产号 {inv}）" },
  "Из истории списаний удалено списание товара \"{name}\" (Инв. номер: {inv})": { ru: "Из истории списаний удалено списание товара \"{name}\" (Инв. номер: {inv})", en: "Removed write-off for \"{name}\" from history (Inv. {inv})", zh: "已从历史中删除“{name}”的报废记录（资产号 {inv}）" },
  "Слабый пароль пользователя \"{name}\"": { ru: "Слабый пароль пользователя \"{name}\"", en: "Weak password for user \"{name}\"", zh: "用户“{name}”的密码较弱" },
  "Отсутствует зарегистрированное сетевое оборудование": { ru: "Отсутствует зарегистрированное сетевое оборудование", en: "No registered network equipment", zh: "未登记网络设备" },
  "В реестре инвентаризации отсутствуют сетевые коммутаторы или шлюзы, сетевой периметр не может быть гарантирован.": { ru: "В реестре инвентаризации отсутствуют сетевые коммутаторы или шлюзы, сетевой периметр не может быть гарантирован.", en: "No switches or gateways in inventory; network perimeter cannot be guaranteed.", zh: "库存中无交换机或网关，无法保证网络边界。" },
  "Текущий пароль содержит только цифры или короче 6 символов, что делает его уязвимым для Brute-force атак за пару секунд.": { ru: "Текущий пароль содержит только цифры или короче 6 символов, что делает его уязвимым для Brute-force атак за пару секунд.", en: "Password is digits-only or shorter than 6 characters, vulnerable to brute-force in seconds.", zh: "密码仅为数字或少于 6 位，可在数秒内被暴力破解。" },
  "ПО и лицензии": { ru: "ПО и лицензии", en: "Software & Licenses", zh: "软件与许可证" },
  "Гарантия и обслуживание": { ru: "Гарантия и обслуживание", en: "Warranty & Service", zh: "保修与维护" },
  "Другое оборудование": { ru: "Другое оборудование", en: "Other Equipment", zh: "其他设备" },
  "Склад IT": { ru: "Склад IT", en: "IT Warehouse", zh: "IT 仓库" },
  "Пробный период": { ru: "Пробный период", en: "Trial period", zh: "试用期" },
  "Выйти": { ru: "Выйти", en: "Log out", zh: "退出登录" },
  "Показать архив": { ru: "Показать архив", en: "Show archive", zh: "显示归档" },
  "Свернуть меню": { ru: "Свернуть меню", en: "Collapse menu", zh: "收起菜单" },
  "Управление": { ru: "Управление", en: "Management", zh: "管理" },
  "Сервис": { ru: "Сервис", en: "Service", zh: "服务" },
  "Активы": { ru: "Активы", en: "Assets", zh: "资产" },
  "Система учета активов": { ru: "Система учета активов", en: "Asset management system", zh: "资产管理系统" },
  "Каналы уведомлений о входе": { ru: "Каналы уведомлений о входе", en: "Login notification channels", zh: "登录通知渠道" },
  "При входе с нового устройства уведомления отправляются в центр уведомлений, на email и в Telegram (если настроено).": {
    ru: "При входе с нового устройства уведомления отправляются в центр уведомлений, на email и в Telegram (если настроено).",
    en: "When signing in from a new device, notifications are sent to the notification center, email, and Telegram (if configured).",
    zh: "从新设备登录时，通知将发送至通知中心、电子邮件和 Telegram（如已配置）。"
  },
  "Email подтверждён": { ru: "Email подтверждён", en: "Email confirmed", zh: "电子邮件已确认" },
  "Уведомления на email": { ru: "Уведомления на email", en: "Email notifications", zh: "电子邮件通知" },
  "Уведомления в Telegram": { ru: "Уведомления в Telegram", en: "Telegram notifications", zh: "Telegram 通知" },
  "Например: 123456789": { ru: "Например: 123456789", en: "For example: 123456789", zh: "例如：123456789" },
  "Активные сессии": { ru: "Активные сессии", en: "Active sessions", zh: "活跃会话" },
  "Устройства и браузеры, с которых выполнен вход в вашу учётную запись.": {
    ru: "Устройства и браузеры, с которых выполнен вход в вашу учётную запись.",
    en: "Devices and browsers used to sign in to your account.",
    zh: "已登录您账户的设备和浏览器。"
  },
  "Обновить": { ru: "Обновить", en: "Refresh", zh: "刷新" },
  "Текущая": { ru: "Текущая", en: "Current", zh: "当前" },
  "Вход": { ru: "Вход", en: "Sign-in", zh: "登录" },
  "Активность": { ru: "Активность", en: "Activity", zh: "活动" },
  "Оставьте пустым, чтобы не менять": { ru: "Оставьте пустым, чтобы не менять", en: "Leave blank to keep unchanged", zh: "留空表示不更改" },
  "Резервное копирование (AES-256-CBC)": { ru: "Резервное копирование (AES-256-CBC)", en: "Backup (AES-256-CBC)", zh: "备份 (AES-256-CBC)" },
  "База данных хранится на сервере в полностью заверенном зашифрованном виде. Вы можете скачать зашифрованную резервную копию здесь и восстановить ее на любом другом сервере.": {
    ru: "База данных хранится на сервере в полностью заверенном зашифрованном виде. Вы можете скачать зашифрованную резервную копию здесь и восстановить ее на любом другом сервере.",
    en: "The database is stored on the server in fully encrypted form. You can download an encrypted backup here and restore it on any other server.",
    zh: "数据库以完全加密形式存储在服务器上。您可以在此下载加密备份，并在任何其他服务器上恢复。"
  },
  "Скачать копию": { ru: "Скачать копию", en: "Download backup", zh: "下载备份" },
  "Восстановить": { ru: "Восстановить", en: "Restore", zh: "恢复" },
  "Параметры СУБД (MySQL / PostgreSQL)": { ru: "Параметры СУБД (MySQL / PostgreSQL)", en: "DBMS settings (MySQL / PostgreSQL)", zh: "数据库参数 (MySQL / PostgreSQL)" },
  "Настройте подключение к СУБД для хранения данных на Linux-сервере. Все конфиденциальные записи ТМЦ хранятся в зашифрованном по стандарту AES-256-CBC виде на стороне СУБД.": {
    ru: "Настройте подключение к СУБД для хранения данных на Linux-сервере. Все конфиденциальные записи ТМЦ хранятся в зашифрованном по стандарту AES-256-CBC виде на стороне СУБД.",
    en: "Configure the DBMS connection to store data on a Linux server. All sensitive inventory records are stored encrypted with AES-256-CBC on the DBMS side.",
    zh: "配置数据库连接以在 Linux 服务器上存储数据。所有敏感资产记录在数据库端以 AES-256-CBC 标准加密存储。"
  },
  "Индикатор связи:": { ru: "Индикатор связи:", en: "Connection indicator:", zh: "连接指示器：" },
  "Файл JSON": { ru: "Файл JSON", en: "JSON file", zh: "JSON 文件" },
  "Система исправно сохраняет всю информацию локально в зашифрованном кэше.": {
    ru: "Система исправно сохраняет всю информацию локально в зашифрованном кэше.",
    en: "The system is saving all information locally in an encrypted cache.",
    zh: "系统正在将信息本地保存到加密缓存中。"
  },
  "Контроль:": { ru: "Контроль:", en: "Checked:", zh: "检查：" },
  "Тип Базы Данных": { ru: "Тип Базы Данных", en: "Database type", zh: "数据库类型" },
  "Локальный шифрованный файл (JSON)": { ru: "Локальный шифрованный файл (JSON)", en: "Local encrypted file (JSON)", zh: "本地加密文件 (JSON)" },
  "Применить СУБД и мигрировать": { ru: "Применить СУБД и мигрировать", en: "Apply DBMS and migrate", zh: "应用数据库并迁移" },
  "В ремонте": { ru: "В ремонте", en: "In Repair", zh: "维修中" },
  "К списанию": { ru: "К списанию", en: "For Write-off", zh: "待报废" },
  "Состояние оборудования": { ru: "Состояние оборудования", en: "Equipment Status", zh: "设备状态" },
  "Средний возраст оборудования": { ru: "Средний возраст оборудования", en: "Average equipment age", zh: "设备平均年龄" },
  "Старше 3 лет": { ru: "Старше 3 лет", en: "Older than 3 years", zh: "超过3年" },
  "Старше 5 лет": { ru: "Старше 5 лет", en: "Older than 5 years", zh: "超过5年" },
  "Старше 7 лет": { ru: "Старше 7 лет", en: "Older than 7 years", zh: "超过7年" },
  "лет": { ru: "лет", en: "years", zh: "年" },
  "Категории Оборудования (По цене)": { ru: "Категории Оборудования (По цене)", en: "Equipment Categories (By Price)", zh: "设备类别（按价格）" },
  "Нет оборудования для отображения": { ru: "Нет оборудования для отображения", en: "No equipment to display", zh: "暂无可显示的设备" },
  "Суммарная стоимость всего учтённого оборудования: компьютеры, сеть и склад.": {
    ru: "Суммарная стоимость всего учтённого оборудования: компьютеры, сеть и склад.",
    en: "Total cost of all registered equipment: computers, network and warehouse.",
    zh: "已登记设备总成本：计算机、网络与仓库。"
  },
  "Возраст техники": { ru: "Возраст техники", en: "Equipment Age", zh: "设备年限" },
  "до 1 года": { ru: "до 1 года", en: "Up to 1 year", zh: "1年以内" },
  "1–3 года": { ru: "1–3 года", en: "1–3 years", zh: "1–3年" },
  "3–5 лет": { ru: "3–5 лет", en: "3–5 years", zh: "3–5年" },
  "более 5 лет": { ru: "более 5 лет", en: "Over 5 years", zh: "5年以上" },
  "Диаграмма: до 1 года · 1–3 года · 3–5 лет · более 5 лет": {
    ru: "Диаграмма: до 1 года · 1–3 года · 3–5 лет · более 5 лет",
    en: "Chart: up to 1 year · 1–3 years · 3–5 years · over 5 years",
    zh: "图表：1年以内 · 1–3年 · 3–5年 · 5年以上"
  },
  "Техника по подразделениям": { ru: "Техника по подразделениям", en: "Equipment by Department", zh: "按部门统计设备" },
  "Нет данных по подразделениям": { ru: "Нет данных по подразделениям", en: "No department data", zh: "暂无部门数据" },
  "История ремонтов и замен комплектующих": {
    ru: "История ремонтов и замен комплектующих",
    en: "Repair and Component Replacement History",
    zh: "维修与部件更换记录"
  },
  "Подразделение": { ru: "Подразделение", en: "Department", zh: "部门" },
  "Ответственный": { ru: "Ответственный", en: "Responsible", zh: "负责人" },
  "Комплектующая": { ru: "Комплектующая", en: "Component", zh: "部件" },
  "Было": { ru: "Было", en: "Before", zh: "更换前" },
  "Стало": { ru: "Стало", en: "After", zh: "更换后" },
  "Причина": { ru: "Причина", en: "Reason", zh: "原因" },
  "Записей о ремонтах и заменах пока нет": {
    ru: "Записей о ремонтах и заменах пока нет",
    en: "No repair or replacement records yet",
    zh: "暂无维修与更换记录"
  },
  "Редактирование позиции на складе": {
    ru: "Редактирование позиции на складе",
    en: "Edit warehouse item",
    zh: "编辑仓库条目"
  },
  "Изменения синхронизируются с карточками оборудования на складе. Количество меняется через поступление или списание.": {
    ru: "Изменения синхронизируются с карточками оборудования на складе. Количество меняется через поступление или списание.",
    en: "Changes sync to on-stock equipment cards. Use receipt or write-off to change quantity.",
    zh: "更改将同步到在库设备卡片。数量请通过入库或报废调整。"
  },
  "Редактирование ТМЦ": {
    ru: "Редактирование ТМЦ",
    en: "Warehouse item updated",
    zh: "仓库条目已更新"
  },
  "Управление отделами": {
    ru: "Управление отделами",
    en: "Department management",
    zh: "部门管理"
  },
  "Отделы": {
    ru: "Отделы",
    en: "Departments",
    zh: "部门"
  },
  "Список отделов": {
    ru: "Список отделов",
    en: "Department list",
    zh: "部门列表"
  },
  "Отделы не созданы": {
    ru: "Отделы не созданы",
    en: "No departments created",
    zh: "尚未创建部门"
  },
  "Сотрудников: {count}": {
    ru: "Сотрудников: {count}",
    en: "Employees: {count}",
    zh: "员工：{count}"
  },
  "Удалить отдел": {
    ru: "Удалить отдел",
    en: "Delete department",
    zh: "删除部门"
  },
  "Нельзя удалить: привязано сотрудников — {count}": {
    ru: "Нельзя удалить: привязано сотрудников — {count}",
    en: "Cannot delete: {count} employee(s) assigned",
    zh: "无法删除：已关联 {count} 名员工"
  },
  "Нельзя удалить отдел «{name}»: к нему привязано сотрудников: {count}.": {
    ru: "Нельзя удалить отдел «{name}»: к нему привязано сотрудников: {count}.",
    en: "Cannot delete department «{name}»: {count} employee(s) are assigned to it.",
    zh: "无法删除部门「{name}」：仍有 {count} 名员工归属该部门。"
  },
  "Закрыть меню": { ru: "Закрыть меню", en: "Close menu", zh: "关闭菜单" }
};

export const useTranslation = () => React.useContext(LanguageContext);

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  applyLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = React.createContext<LanguageContextProps>({
  language: 'ru',
  setLanguage: () => {},
  applyLanguage: () => {},
  t: (k) => k,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = React.useState<Language>(() => {
    const saved = localStorage.getItem('orbit_lang');
    return (saved as Language) || 'ru';
  });

  const applyLanguage = React.useCallback((lang: Language) => {
    try {
      localStorage.setItem('orbit_lang', lang);
    } catch {
      /* ignore */
    }
    setLanguageState(lang);
  }, []);

  const setLanguage = React.useCallback((lang: Language) => {
    applyLanguage(lang);
  }, [applyLanguage]);

  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Translate with automated dictionary lookup and translation keys mapping
  const t = (key: string): string => {
    const entry = dictionary[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    
    // Fuzzy matching for slightly longer texts, or fallback to the key itself
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, applyLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const LanguagePersistProvider: React.FC<{
  onPersist: (lang: Language) => void;
  children: React.ReactNode;
}> = ({ onPersist, children }) => {
  const parent = React.useContext(LanguageContext);
  const onPersistRef = React.useRef(onPersist);
  onPersistRef.current = onPersist;

  const setLanguage = React.useCallback(
    (lang: Language) => {
      parent.applyLanguage(lang);
      onPersistRef.current(lang);
    },
    [parent]
  );

  const value = React.useMemo(
    () => ({ ...parent, setLanguage }),
    [parent, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

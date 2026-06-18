/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 */
import { ObjectItem, NetworkDevice, ComputerItem, EmployeeItem, WarehouseItem, Activity, InventoryAudit, SoftwareItem } from './types';

export const initialObjects: ObjectItem[] = [
  { id: 'obj-1', name: 'Головной офис', address: 'г. Москва, ул. Ленина, 1' },
  { id: 'obj-2', name: 'Офис на Мира', address: 'г. Москва, пр. Мира, 10' },
  { id: 'obj-3', name: 'Склад №1', address: 'г. Москва, ул. Складская, 5' },
  { id: 'obj-4', name: 'ЦОД', address: 'г. Москва, ул. Серверная, 3' },
  { id: 'obj-5', name: 'Офис в Санкт-Петербурге', address: 'г. Санкт-Петербург, Невский пр., 20' },
  { id: 'obj-6', name: 'Офис в Казани', address: 'г. Казань, ул. Баумана, 15' },
  { id: 'obj-7', name: 'Филиал Новосибирске', address: 'г. Новосибирск, ул. Ленина, 25' },
  { id: 'obj-8', name: 'Удаленный офис', address: 'г. Ростов-на-Дону, ул. Советская, 12' },
];

export const initialNetworkDevices: NetworkDevice[] = [
  { id: 'net-1', deviceName: 'Cisco Catalyst 2960', type: 'Коммутатор', objectName: 'Головной офис', ipAddress: '10.0.1.1', quantity: 2, cost: 25000 },
  { id: 'net-2', deviceName: 'MikroTik CRS328', type: 'Коммутатор', objectName: 'Головной офис', ipAddress: '10.0.1.2', quantity: 1, cost: 18000 },
  { id: 'net-3', deviceName: 'Cisco ISR 4331', type: 'Маршрутизатор', objectName: 'Головной офис', ipAddress: '10.0.1.254', quantity: 1, cost: 55000 },
  { id: 'net-4', deviceName: 'HPE Aruba 2930F', type: 'Коммутатор', objectName: 'Офис на Мира', ipAddress: '10.0.2.1', quantity: 2, cost: 35000 },
  { id: 'net-5', deviceName: 'Ubiquiti UniFi AP AC', type: 'Точка доступа', objectName: 'Офис на Мира', ipAddress: '10.0.2.10', quantity: 4, cost: 7500 },
  { id: 'net-6', deviceName: 'MikroTik hEX', type: 'Маршрутизатор', objectName: 'Склад №1', ipAddress: '10.0.3.1', quantity: 1, cost: 6000 },
  { id: 'net-7', deviceName: 'D-Link DGS-1100', type: 'Коммутатор', objectName: 'Склад №1', ipAddress: '10.0.3.2', quantity: 1, cost: 8000 },
  { id: 'net-8', deviceName: 'Cisco Catalyst 2960', type: 'Коммутатор', objectName: 'ЦОД', ipAddress: '10.0.4.1', quantity: 2, cost: 25000 },
];

export const initialComputers: ComputerItem[] = [
  { id: 'comp-1', category: 'Ноутбук', deviceType: 'Ноутбук', model: 'Dell Latitude 5420', inventoryNumber: 'PC-0001', employeeName: 'Иванов И.И.', status: 'В работе', objectName: 'Головной офис', cost: 65000 },
  { id: 'comp-2', category: 'Ноутбук', deviceType: 'Ноутбук', model: 'HP ProBook 450 G8', inventoryNumber: 'PC-0002', employeeName: 'Петров П.П.', status: 'В работе', objectName: 'Головной офис', cost: 55000 },
  { id: 'comp-3', category: 'ПК', deviceType: 'ПК', model: 'Lenovo ThinkCentre M720', inventoryNumber: 'PC-0003', employeeName: 'Сидоров С.С.', status: 'В работе', objectName: 'Офис на Мира', cost: 45000 },
  { id: 'comp-4', category: 'Монитор', deviceType: 'Монитор', model: 'Dell P2419H', inventoryNumber: 'MON-0001', employeeName: 'Иванов И.И.', status: 'В работе', objectName: 'Головной офис', cost: 12000 },
  { id: 'comp-5', category: 'Ноутбук', deviceType: 'Ноутбук', model: 'Apple MacBook Air M1', inventoryNumber: 'PC-0004', employeeName: 'Кузнецова А.А.', status: 'В работе', objectName: 'Офис в Санкт-Петербурге', cost: 95000 },
  { id: 'comp-6', category: 'ПК', deviceType: 'ПК', model: 'ASUS ExpertCenter D5', inventoryNumber: 'PC-0005', employeeName: 'Смирнов Д.Д.', status: 'В работе', objectName: 'Офис в Казани', cost: 40000 },
  { id: 'comp-7', category: 'Ноутбук', deviceType: 'Ноутбук', model: 'Dell Latitude 5430', inventoryNumber: 'PC-0006', employeeName: 'Волкова Е.Е.', status: 'На ремонте', objectName: 'Филиал Новосибирске', cost: 70000 },
  { id: 'comp-8', category: 'ПК', deviceType: 'ПК', model: 'Lenovo ThinkCentre M720', inventoryNumber: 'PC-0007', employeeName: 'Попов М.М.', status: 'На складе', objectName: 'Склад №1', cost: 45000 },
  { id: 'comp-9', category: 'Оргтехника', deviceType: 'Принтер', model: 'МФУ HP LaserJet Pro M428dw', inventoryNumber: 'PRN-0001', employeeName: 'Кузнецова А.А.', status: 'В работе', objectName: 'Головной офис', cost: 32000, cartridges: [
    { id: 'cart-12', model: 'HP CF259A (Черный)', status: 'Заправлен', color: 'Черный', lastServiceDate: '2026-05-10' }
  ] },
  { id: 'comp-10', category: 'Оргтехника', deviceType: 'Принтер', model: 'Цветной принтер Epson L805', inventoryNumber: 'PRN-0002', employeeName: 'Волкова Е.Е.', status: 'В работе', objectName: 'Филиал Новосибирске', cost: 24000, cartridges: [
    { id: 'cart-13', model: 'Epson T6731 Black', status: 'Заправлен', color: 'Черный', lastServiceDate: '2026-06-05' },
    { id: 'cart-14', model: 'Epson T6732 Cyan', status: 'Заправлен', color: 'Cyan', lastServiceDate: '2026-06-05' },
    { id: 'cart-15', model: 'Epson T6733 Magenta', status: 'Заправлен', color: 'Magenta', lastServiceDate: '2026-06-05' },
    { id: 'cart-16', model: 'Epson T6734 Yellow', status: 'Пустой', color: 'Yellow', lastServiceDate: '2026-06-05' }
  ] },
];

export const initialEmployees: EmployeeItem[] = [
  { id: 'emp-1', name: 'Иванов И.И.', position: 'Системный администратор', department: 'IT', status: 'Работает', email: 'ivanov@it-dep.ru', phone: '+7 (905) 123-45-01' },
  { id: 'emp-2', name: 'Петров П.П.', position: 'Менеджер по продажам', department: 'Продажи', status: 'Работает', email: 'petrov@it-dep.ru', phone: '+7 (905) 123-45-02' },
  { id: 'emp-3', name: 'Сидоров С.С.', position: 'Разработчик', department: 'Разработка', status: 'Работает', email: 'sidorov@it-dep.ru', phone: '+7 (905) 123-45-03' },
  { id: 'emp-4', name: 'Кузнецова А.А.', position: 'Бухгалтер', department: 'Бухгалтерия', status: 'Работает', email: 'kuznetsova@it-dep.ru', phone: '+7 (905) 123-45-04' },
  { id: 'emp-5', name: 'Смирнов Д.Д.', position: 'Маркетолог', department: 'Маркетинг', status: 'Работает', email: 'smirnov@it-dep.ru', phone: '+7 (905) 123-45-05' },
  { id: 'emp-6', name: 'Волкова Е.Е.', position: 'Дизайнер', department: 'Дизайн', status: 'Работает', email: 'volkova@it-dep.ru', phone: '+7 (905) 123-45-06' },
  { id: 'emp-7', name: 'Попов М.М.', position: 'Тестировщик', department: 'Тестирование', status: 'Работает', email: 'popov@it-dep.ru', phone: '+7 (905) 123-45-07' },
  { id: 'emp-8', name: 'Лебедев Н.Н.', position: 'Руководитель отдела', department: 'Руководство', status: 'Работает', email: 'lebedev@it-dep.ru', phone: '+7 (905) 123-45-08' },
];

export const initialWarehouseItems: WarehouseItem[] = [
  { id: 'wh-1', name: 'Ноутбук Dell Latitude 5420', type: 'Компьютеры', model: 'Dell Latitude 5420', inventoryNumber: 'ST-0001', quantity: 5, unit: 'шт.', costPerUnit: 65000, status: 'В наличии' },
  { id: 'wh-2', name: 'Системный блок Lenovo M720', type: 'Компьютеры', model: 'Lenovo ThinkCentre M720', inventoryNumber: 'ST-0002', quantity: 3, unit: 'шт.', costPerUnit: 45000, status: 'В наличии' },
  { id: 'wh-3', name: 'Монитор Dell P2419H', type: 'Периферия', model: 'Dell P2419H', inventoryNumber: 'ST-0003', quantity: 6, unit: 'шт.', costPerUnit: 12000, status: 'В наличии' },
  { id: 'wh-4', name: 'Коммутатор Cisco 2960', type: 'Сетевое оборудование', model: 'Cisco Catalyst 2960', inventoryNumber: 'ST-0004', quantity: 2, unit: 'шт.', costPerUnit: 25000, status: 'В наличии' },
  { id: 'wh-5', name: 'Точка доступа Ubiquiti AP', type: 'Сетевое оборудование', model: 'Ubiquiti UniFi AP AC', inventoryNumber: 'ST-0005', quantity: 5, unit: 'шт.', costPerUnit: 7500, status: 'В наличии' },
  { id: 'wh-6', name: 'ИБП APC Back-UPS 1500', type: 'Другое', model: 'APC Back-UPS 1500', inventoryNumber: 'ST-0006', quantity: 2, unit: 'шт.', costPerUnit: 15000, status: 'В наличии' },
  { id: 'wh-7', name: 'Мышь Logitech M170', type: 'Периферия', model: 'Logitech M170', inventoryNumber: 'ST-0007', quantity: 10, unit: 'шт.', costPerUnit: 800, status: 'В наличии' },
  { id: 'wh-8', name: 'Клавиатура Logitech K120', type: 'Периферия', model: 'Logitech K120', inventoryNumber: 'ST-0008', quantity: 10, unit: 'шт.', costPerUnit: 900, status: 'В наличии' },
  { id: 'wh-9', name: 'Кабель патч-корд Cat.6', type: 'Расходные материалы', model: 'Cat.6, 1m', inventoryNumber: 'ST-0009', quantity: 50, unit: 'шт.', costPerUnit: 150, status: 'В наличии' },
];

export const initialActivities: Activity[] = [
  { id: 'act-1', timestamp: '2026-06-09T12:30:00Z', user: 'Администратор (Vladyxa)', action: 'Добавлен объект', detail: 'Филиал в г. Владивосток', type: 'create' },
  { id: 'act-2', timestamp: '2026-06-09T10:15:00Z', user: 'Администратор (Vladyxa)', action: 'Выдано оборудование', detail: 'Ноутбук Dell Latitude 5420 выдан сотруднику Петров П.П.', type: 'update' },
  { id: 'act-3', timestamp: '2026-06-08T16:45:00Z', user: 'Администратор (Vladyxa)', action: 'Списание со склада', detail: 'Списано 5шт Кабель патч-корд Cat.6 по причине износа', type: 'delete' },
  { id: 'act-4', timestamp: '2026-06-08T09:00:00Z', user: 'Система', action: 'Резервное копирование', detail: 'Автоматический бэкап данных успешно сохранен в облако', type: 'system' },
];

export const initialAudits: InventoryAudit[] = [
  { id: 'aud-1', date: '2026-06-01', title: 'Полугодовая инвентаризация ЦОД', status: 'Завершена', responsibleUser: 'Иванов И.И.', itemsAudited: 45, mismatchesFound: 0 },
  { id: 'aud-2', date: '2026-06-08', title: 'Плановый аудит ИТ-склада', status: 'В процессе', responsibleUser: 'Иванов И.И.', itemsAudited: 120, mismatchesFound: 2 },
  { id: 'aud-3', date: '2026-06-25', title: 'Инвентаризация офиса на Мира', status: 'Запланирована', responsibleUser: 'Петров П.П.', itemsAudited: 0, mismatchesFound: 0 },
];

export const initialSoftwareItems: SoftwareItem[] = [
  {
    id: 'soft-1',
    name: 'Windows 11 Professional',
    category: 'Операционные системы (ОС)',
    licenseKey: 'W269N-WFGWX-YVC9B-4J6C9-T83GX',
    version: '23H2',
    developer: 'Microsoft',
    quantity: 15,
    assignedEmployeeName: 'Сидоров С.С.',
    objectName: 'Головной офис',
    status: 'Активна',
    purchaseDate: '2026-01-15',
    expirationDate: '2028-12-31',
    notes: 'OEM лицензия для ноутбуков разработчиков'
  },
  {
    id: 'soft-2',
    name: 'Kaspersky Endpoint Security',
    category: 'Утилиты и антивирусы',
    licenseKey: 'KAS-7732-XNZZ-991A',
    version: '12.4',
    developer: 'Kaspersky Lab',
    quantity: 50,
    assignedEmployeeName: 'Все сотрудники',
    objectName: 'Головной офис',
    status: 'Активна',
    purchaseDate: '2026-03-10',
    expirationDate: '2027-03-10',
    notes: 'Корпоративная подписка на 50 рабочих станций'
  },
  {
    id: 'soft-3',
    name: 'Microsoft Office 2021 LTSC',
    category: 'Офисные приложения',
    licenseKey: 'NJHVR-FK69F-48WPD-2XWTF-F9F76',
    version: '16.0',
    developer: 'Microsoft',
    quantity: 20,
    assignedEmployeeName: 'Кузнецова А.А.',
    objectName: 'Офис на Мира',
    status: 'Активна',
    purchaseDate: '2025-11-20',
    expirationDate: '2029-11-20',
    notes: 'Для бухгалтерии и отдела продаж'
  },
  {
    id: 'soft-4',
    name: 'Adobe Photoshop CC',
    category: 'Графические редакторы',
    licenseKey: 'AP-8843-1192-9020-OPP7',
    version: '2024 (25.1)',
    developer: 'Adobe',
    quantity: 2,
    assignedEmployeeName: 'Волкова Е.Е.',
    objectName: 'Филиал Новосибирске',
    status: 'Активна',
    purchaseDate: '2026-02-01',
    expirationDate: '2027-02-01',
    notes: 'Подписка на отдел дизайна'
  },
  {
    id: 'soft-5',
    name: '1С:Предприятие 8.3 Корп',
    category: 'Корпоративные системы',
    licenseKey: '1C-ORG-8349281-XYZ',
    version: '8.3.24',
    developer: '1С',
    quantity: 10,
    assignedEmployeeName: 'Кузнецова А.А.',
    objectName: 'Головной офис',
    status: 'Активна',
    purchaseDate: '2024-05-18',
    expirationDate: '',
    notes: 'Бессрочная серверная лицензия'
  }
];


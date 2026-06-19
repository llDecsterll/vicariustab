/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import { ObjectItem, NetworkDevice, ComputerItem, EmployeeItem, WarehouseItem, Activity, InventoryAudit, SoftwareItem } from './types';
import workspaceSeed from '../server/workspaceSeed.json';

export const initialObjects = workspaceSeed.objects as ObjectItem[];
export const initialNetworkDevices = workspaceSeed.networkDevices as NetworkDevice[];
export const initialComputers = workspaceSeed.computers as ComputerItem[];
export const initialEmployees = workspaceSeed.employees as EmployeeItem[];
export const initialWarehouseItems = workspaceSeed.warehouseItems as WarehouseItem[];
export const initialActivities = workspaceSeed.activities as Activity[];
export const initialAudits = workspaceSeed.audits as InventoryAudit[];
export const initialSoftwareItems = workspaceSeed.softwareItems as SoftwareItem[];

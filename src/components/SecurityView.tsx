/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  Activity, 
  Terminal, 
  Zap, 
  Play, 
  Fingerprint, 
  FileText, 
  Cpu, 
  Wifi, 
  Users, 
  Check, 
  X,
  Skull,
  HelpCircle,
  Clock,
  Copy,
  Mail
} from 'lucide-react';
import { ObjectItem, NetworkDevice, ComputerItem, EmployeeItem, WarehouseItem, Activity as ActivityLogItem, SystemUser } from '../types';
import { useTranslation } from '../utils/i18n';

interface SecurityViewProps {
  objects: ObjectItem[];
  networkDevices: NetworkDevice[];
  computers: ComputerItem[];
  employees: EmployeeItem[];
  warehouseItems: WarehouseItem[];
  activities: ActivityLogItem[];
  users: SystemUser[];
  currentUser: SystemUser;
  onUpdateUser: (id: string, fields: Partial<SystemUser>) => void;
  onLogActivity: (action: string, detail: string, type: 'create' | 'update' | 'delete' | 'system') => void;
  onUpdateComputer: (id: string, fields: Partial<ComputerItem>) => void;
}

interface ScanVulnerability {
  id: string;
  category: 'passwords' | 'network' | 'endpoints' | 'audit_backup';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  assetName: string;
  status: 'vulnerable' | 'patched';
  patchActionLabel?: string;
  patchId?: string; // used for identifying dynamic patching
}

export default function SecurityView({
  objects,
  networkDevices,
  computers,
  employees,
  warehouseItems,
  activities,
  users,
  currentUser,
  onUpdateUser,
  onLogActivity,
  onUpdateComputer
}: SecurityViewProps) {
  const { t } = useTranslation();

  // Simulator states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(() => localStorage.getItem('sec_last_scan'));
  const [emailCopiedSec, setEmailCopiedSec] = useState(false);

  const copyEmailToClipboardSec = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText("assetorbit@icloud.com");
    setEmailCopiedSec(true);
    setTimeout(() => {
      setEmailCopiedSec(false);
    }, 2000);
  };
  
  // Custom Dynamic vulnerabilities generated from active data state
  const [vulns, setVulns] = useState<ScanVulnerability[]>([]);
  
  // Sandbox attack tools states
  const [attackRunning, setAttackRunning] = useState<string | null>(null);
  const [attackLogs, setAttackLogs] = useState<string[]>([]);
  const [ddosIntensity, setDdosIntensity] = useState<number>(100);
  const [selectedAttackAsset, setSelectedAttackAsset] = useState<string>('all');

  // Security stats
  const [securityScore, setSecurityScore] = useState<number>(100);
  const [scannedAssetsCount, setScannedAssetsCount] = useState<number>(0);

  // Load and evaluate current data on mount / trigger scan
  const executeScanEvaluation = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanCompleted(false);
    
    // Simulate interactive loading
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          finalizeScan();
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
  };

  const finalizeScan = () => {
    setIsScanning(false);
    setScanCompleted(true);
    const nowStr = new Date().toLocaleString('ru-RU');
    setLastScanTime(nowStr);
    localStorage.setItem('sec_last_scan', nowStr);

    // Dynamic generation based on actual user database and item assets
    const list: ScanVulnerability[] = [];

    // 1. Password Checks (Dynamic)
    users.forEach(u => {
      const isWeak = u.password && (u.password.length < 6 || /^\d+$/.test(u.password) || u.password === '123' || u.password === '456' || u.password === '789');
      if (isWeak) {
        list.push({
          id: `weak-pwd-${u.id}`,
          category: 'passwords',
          severity: 'critical',
          title: `Слабый пароль пользователя "${u.name}"`,
          description: `Текущий пароль содержит только цифры или короче 6 символов, что делает его уязвимым для Brute-force атак за пару секунд.`,
          assetName: `Учетная запись: @${u.login}`,
          status: 'vulnerable',
          patchActionLabel: 'Предустановить надежный случайный пароль',
          patchId: u.id
        });
      }
    });

    // 2. Network Checks (Dynamic/IP uniqueness or default subnets)
    if (networkDevices.length === 0) {
      list.push({
        id: 'no-network-devices',
        category: 'network',
        severity: 'warning',
        title: 'Отсутствует зарегистрированное сетевое оборудование',
        description: 'В реестре инвентаризации отсутствуют сетевые коммутаторы или шлюзы, сетевой периметр не может быть гарантирован.',
        assetName: 'Инфраструктура LAN',
        status: 'vulnerable'
      });
    } else {
      // Check for empty IP addresses or default IPs
      networkDevices.forEach(net => {
        if (!net.ipAddress || net.ipAddress === '-') {
          list.push({
            id: `net-no-ip-${net.id}`,
            category: 'network',
            severity: 'warning',
            title: `Отсутствует системный IP у устройства "${net.deviceName}"`,
            description: 'Конфигурация сетевого администрирования требует назначения статического IPv4 адреса для мониторинга уязвимостей.',
            assetName: `${net.type}: ${net.deviceName}`,
            status: 'vulnerable'
          });
        }
        if (net.ipAddress?.startsWith('192.168.1.') || net.ipAddress?.startsWith('10.0.')) {
          list.push({
            id: `net-default-subnet-${net.id}`,
            category: 'network',
            severity: 'info',
            title: `Устройство на дефолтном IP диапазоне (${net.ipAddress})`,
            description: 'Устройство использует стандартный локальный адрес. Рекомендуется изолировать в защищенный сегмент Management VLAN.',
            assetName: net.deviceName,
            status: 'vulnerable'
          });
        }
      });
    }

    // 3. Endpoint Computer Compliance (expired or unmonitored)
    const onRepairCount = computers.filter(c => c.status === 'На ремонте').length;
    if (onRepairCount > 0) {
      list.push({
        id: 'repair-assets-exposure',
        category: 'endpoints',
        severity: 'warning',
        title: `Устройства (${onRepairCount} шт.) находятся "На ремонте"`,
        description: 'При передаче устройств в сторонние сервисные центры существует риск несанкционированного извлечения накопителей SSD/HDD с корпоративными данными.',
        assetName: 'IT Оборудование сотрудников',
        status: 'vulnerable',
        patchActionLabel: 'Проверить конфиденциальность накопителей'
      });
    }

    // Check if any computers lack inventory number
    computers.forEach(c => {
      if (!c.inventoryNumber || c.inventoryNumber.length < 3) {
        list.push({
          id: `untracked-serial-${c.id}`,
          category: 'endpoints',
          severity: 'warning',
          title: `Слабая маркировка устройства "${c.model}"`,
          description: 'Инвентарный номер отсутствует или введен некорректно, что затрудняет физическое сопоставление устройства при инвентаризационном аудите.',
          assetName: `${c.category}: ${c.model}`,
          status: 'vulnerable',
          patchActionLabel: 'Авто-назначить инвентарный номер',
          patchId: c.id
        });
      }
    });

    // 4. Audit & Backup Health checks
    const hasRecentBackup = activities.some(act => act.action.toLowerCase().includes('бэкап') || act.detail.toLowerCase().includes('бэкап') || act.action.toLowerCase().includes('резервн'));
    if (!hasRecentBackup) {
      list.push({
        id: 'no-recent-backup',
        category: 'audit_backup',
        severity: 'critical',
        title: 'Резервная копия базы инвентаризации давно не обновлялась',
        description: 'В логах активности не найдено записей о резервных файлах конфигураций за последнее время. База данных уязвима к сбоям операционной платформы.',
        assetName: 'Хранилище LocalStorage / DB Registry',
        status: 'vulnerable',
        patchActionLabel: 'Создать экстренную резервную копию сейчас'
      });
    }

    // Ensure audit exists
    const inProcessAudit = activities.filter(act => act.action.toLowerCase().includes('аудит') || act.action.toLowerCase().includes('инвентар'));
    if (inProcessAudit.length === 0) {
      list.push({
        id: 'no-audit-performed',
        category: 'audit_backup',
        severity: 'info',
        title: 'Профилактическая проверка безопасности объектов не проводилась',
        description: 'Инвентаризация и аудит физических комнат не инициировались системным администратором.',
        assetName: 'Реестр верификации ИТ-активов',
        status: 'vulnerable'
      });
    }

    setVulns(list);
    onLogActivity('Безопасность', 'Запущен полный аудит уязвимостей и инспекция ИТ-периметра системы', 'system');
  };

  // Recalculate security index score of overall health status
  useEffect(() => {
    if (vulns.length === 0) {
      if (scanCompleted) {
        setSecurityScore(100);
      } else {
        setSecurityScore(85); // placeholder default
      }
      return;
    }

    // scoring deduction mechanism
    let score = 100;
    vulns.forEach(v => {
      if (v.status === 'vulnerable') {
        if (v.severity === 'critical') score -= 15;
        if (v.severity === 'warning') score -= 8;
        if (v.severity === 'info') score -= 3;
      }
    });

    setSecurityScore(Math.max(10, score));
  }, [vulns, scanCompleted]);

  // Recalculate assets check count
  useEffect(() => {
    setScannedAssetsCount(objects.length + computers.length + networkDevices.length + users.length + warehouseItems.length);
  }, [objects, computers, networkDevices, users, warehouseItems]);

  // Initialize scan list if blank
  useEffect(() => {
    if (vulns.length === 0 && lastScanTime) {
      // populate list standard without animated scan loading
      finalizeScan();
    }
  }, []);

  // Vulnerability Quick Patch Event Trigger
  const handleApplyPatch = (vulnId: string, patchId?: string, category?: string) => {
    if (category === 'passwords' && patchId) {
      // Update target user with strong password
      const generatedStrong = Math.floor(Math.random() * 89999 + 10000) + 'Secured#2026';
      onUpdateUser(patchId, { password: generatedStrong });
      
      // Update state local
      setVulns(prev => prev.map(v => v.id === vulnId ? { ...v, status: 'patched', description: `Пароль изменен на зашифрованный (${generatedStrong}).` } : v));
      onLogActivity('Безопасность', `Исправлена уязвимость: Заменен слабый пароль учетной записи пользователя с ID "${patchId}"`, 'system');
    } else if (vulnId === 'no-recent-backup') {
      // Simulate download backup file JSON
      const fullPayload = {
        meta: { timestamp: new Date().toISOString(), exportedBy: currentUser.name, app: "AssetOrbit - IT Security Audit Portal" },
        objects,
        networkDevices,
        computers,
        employees,
        warehouseItems
      };
      
      const fileData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullPayload, null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute("href", fileData);
      anchor.setAttribute("download", `assetorbit_secured_backup_${new Date().toISOString().slice(0, 10)}.json`);
      anchor.click();

      setVulns(prev => prev.map(v => v.id === vulnId ? { ...v, status: 'patched' } : v));
      onLogActivity('Резервное копирование', 'Успешно сформирован и выгружен зазенкованный файл целостности структуры в рамках ИТ-аудита', 'system');
    } else if (patchId && vulnId.startsWith('untracked-serial-')) {
      const generatedInv = 'PC-SEC-' + Math.floor(Math.random() * 8999 + 1000);
      onUpdateComputer(patchId, { inventoryNumber: generatedInv });
      setVulns(prev => prev.map(v => v.id === vulnId ? { ...v, status: 'patched', description: `Устройству выдан защищенный инвентарный криптономер: ${generatedInv}` } : v));
      onLogActivity('Маркировка оборудования', `Автоматический патч уязвимости ID ${patchId}. Присвоен инвентарный номер устройства: ${generatedInv}`, 'update');
    } else {
      // Generic state resolver
      setVulns(prev => prev.map(v => v.id === vulnId ? { ...v, status: 'patched' } : v));
      onLogActivity('Патч Безопасности', `Администратор применил компенсирующую защитную меру по элементу "${vulnId}"`, 'system');
    }
  };

  // Run cyber sandbox incidents simulator
  const startIncidentSimulation = (type: 'bruteforce' | 'ddos' | 'mac_spoof') => {
    if (attackRunning) return;
    setAttackRunning(type);
    setAttackLogs([]);

    let step = 0;
    const logsList: string[] = [];

    const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString('ru-RU');
      logsList.unshift(`[${time}] ${msg}`);
      setAttackLogs([...logsList]);
    };

    if (type === 'bruteforce') {
      addLog('⚔️ Инициализация атаки Brute-force на интерфейс входа REST OAuth API...');
      
      const targetUser = users[Math.floor(Math.random() * users.length)] || currentUser;
      
      const timer = setInterval(() => {
        step++;
        if (step === 1) {
          addLog(`🔍 Обнаружен активный порт авторизации. Таргет: сотрудник @${targetUser.login} (${targetUser.name})`);
        } else if (step === 2) {
          addLog('⚡ Запуск словаря перебора (rockyou.txt - TOP 10 000 стандартных паролей)...');
        } else if (step === 3) {
          addLog(`💣 Попытка #140: подбор "admin"... Ошибка доступа HTTP 401`);
          addLog(`💣 Попытка #412: подбор "qwerty"... Ошибка доступа HTTP 401`);
        } else if (step === 4) {
          // Check if password of this user is simple
          const passwordIsSimple = targetUser.password === '123' || targetUser.password === '456' || targetUser.password === '789' || targetUser.password?.length < 5;
          
          if (passwordIsSimple) {
            addLog(`🚨 SUCCESS! Пароль подобран за 1.4 секунды: "${targetUser.password}"!`);
            addLog(`⚠️ Злоумышленник получил полный доступ к панели управления под именем ${targetUser.name}.`);
            onLogActivity('Инцидент ИБ', `Обнаружена успешная Brute-force атака на аккаунт @${targetUser.login}! Пароль скомпрометирован`, 'delete');
          } else {
            addLog(`🛡️ Попытка #2041: подбор не дал совпадений. Все варианты словарного перебора исчерпаны.`);
            addLog('🔒 Система шифрования хэша SHA-256 Уткина В.В. выдержала внешнее воздействие.');
            addLog('✅ Инцидент заблокирован защитным сетевым экраном.');
            onLogActivity('Защита ИБ', `Локальный IDS успешно предотвратил атаку перебора паролей для аккаунта @${targetUser.login}`, 'system');
          }
          clearInterval(timer);
          setAttackRunning(null);
        }
      }, 1000);
    } 
    
    else if (type === 'ddos') {
      addLog(`⚔️ Подготовка синхронного SYN-Flood DDoS штурма на сетевой стек...`);
      addLog(`📡 Объем тестового трафика настроен на: ${ddosIntensity} тыс. пакетов в секунду.`);
      
      let targetDevName = 'Основной сервер / Маршрутизатор';
      if (selectedAttackAsset !== 'all') {
        const found = networkDevices.find(n => n.id === selectedAttackAsset);
        if (found) targetDevName = `${found.type} ${found.deviceName}`;
      }

      const timer = setInterval(() => {
        step++;
        if (step === 1) {
          addLog(`🔥 Атака пошла! 120 ботнет-нод стучат по порту 80/443 к "${targetDevName}"`);
        } else if (step === 2) {
          addLog(`🎚️ Загрузка сетевого буфера возросла до 91%. Время отклика сетевого оборудования выросло до 1800ms.`);
        } else if (step === 3) {
          if (ddosIntensity > 150) {
            addLog(`💥 ВНИМАНИЕ: Устройство "${targetDevName}" не справляется с нагрузкой!`);
            addLog(`🛑 Сетевой интерфейс переведен в состояние полу-офлайн (высокий packet loss 90%).`);
            onLogActivity('Инцидент Сети', `Оборудование "${targetDevName}" отключено под угрозой критической нагрузки (DDoS)`, 'delete');
          } else {
            addLog(`🛡️ Активирован локальный ограничитель трафика Rate-Limiting шлюза.`);
            addLog(`📦 Пакеты злоумышленников успешно сброшены. Качество обслуживания LAN сохранено.`);
            onLogActivity('Защита Сети', `DDoS атака на "${targetDevName}" успешно отражена благодаря встроенной фильтрации`, 'system');
          }
          clearInterval(timer);
          setAttackRunning(null);
        }
      }, 1200);
    }

    else if (type === 'mac_spoof') {
      addLog('⚔️ Симуляция атаки ARP-Spoofing / Подмена MAC-адреса для прослушки трафика...');
      
      const timer = setInterval(() => {
        step++;
        if (step === 1) {
          addLog('🌐 Прослушивание широковещательного эфира офисной сети Wi-Fi/Ethernet...');
        } else if (step === 2) {
          addLog('🤫 Перехват фрейма шлюза по умолчанию.');
          addLog('⚠️ Злоумышленник отправил ложный ARP-ответ: "Мой MAC-адрес (DE:AD:BE:EF:00:11) ассоциирован с IP роутера"');
        } else if (step === 3) {
          addLog('🚨 Трафик всех соседних компьютеров начал пересылаться через хакерскую точку перехвата!');
          addLog('📋 Обнаружены незашифрованные системные MAC-запросы.');
          addLog('🛡️ Защитные компоненты: Для пресечения атаки принудительно задайте IP-MAC привязки Static ARP в настройках роутера.');
          onLogActivity('ИБ Оповещение', 'Обнаружено подозрительное поведение ARP-таблиц в локальной подсети', 'delete');
          clearInterval(timer);
          setAttackRunning(null);
        }
      }, 1100);
    }
  };

  return (
    <div id="security-audit-container" className="space-y-6">
      {/* Visual Ambient Decor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-mono tracking-wide">{t("© 2026 Уткин В.В. | Cyber Security Shield")}</div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="text-blue-500 shrink-0" size={24} />{t("Центр Безопасности и Тестирования ИТ-Инфраструктуры")}</h1>
          <p className="text-xs text-slate-400">{t("Интерактивный центр симуляции киберугроз, автоматической оценки защищенности и управления уязвимостями материальной базы.")}</p>
        </div>

        <button
          onClick={executeScanEvaluation}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer text-center whitespace-nowrap"
        >
          <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
          {isScanning ? 'Идет сканирование...' : 'Запустить Тест Защищенности'}
        </button>
      </div>

      {/* Progress scanner UI */}
      {isScanning && (
        <div className="bg-slate-900/60 border border-blue-500/30 p-5 rounded-2xl space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>{t("Запущена глубокая инспекция файлов, конфигураций портов, MAC-адресов и паролей администраторов...")}</span>
            <span className="font-bold font-mono text-blue-300">{scanProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              style={{ width: `${scanProgress}%` }}
              className="bg-blue-500 h-full transition-all duration-300 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Primary Score Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score Board */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0 select-none">
            {securityScore >= 90 ? (
              <ShieldCheck size={28} className="text-emerald-500" />
            ) : securityScore >= 70 ? (
              <ShieldAlert size={28} className="text-amber-500" />
            ) : (
              <ShieldAlert size={28} className="text-red-500 animate-bounce" />
            )}
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("Индекс защищенности")}</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${
                securityScore >= 90 ? 'text-emerald-400' : securityScore >= 70 ? 'text-amber-400' : 'text-red-400'
              }`}>{securityScore}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
        </div>

        {/* Scanned Assets */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <Cpu size={24} className="text-blue-400" />
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("Всего активов под защитой")}</span>
            <div className="text-2xl font-black text-white">{scannedAssetsCount} <span className="text-xs font-normal text-slate-400">{t("узлов")}</span></div>
          </div>
        </div>

        {/* Total Vulns Detected */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("Выявлено угроз безопасности")}</span>
            <div className="text-2xl font-black text-white">
              {vulns.filter(v => v.status === 'vulnerable').length} 
              <span className="text-xs font-normal text-slate-400">{t("уязвимостей")}</span>
            </div>
          </div>
        </div>

        {/* Cyber Defence State */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <Activity size={24} className="text-indigo-400" />
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("Сетевой экран (IDS/IPS)")}</span>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>{t("Активен / Мониторинг")}</div>
          </div>
        </div>
      </div>

      {/* Main Panel Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Real-time scan results registry & instant patch tools */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
                <span>🔍</span>{t("Результаты Последней Проверки")}</h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {lastScanTime ? `Скан от: ${lastScanTime}` : 'Анализ еще не запускался'}
              </span>
            </div>

            {vulns.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <ShieldCheck size={40} className="text-slate-700 mx-auto" />
                <p className="text-xs italic leading-relaxed max-w-sm mx-auto">{t("Системный периметр полностью чист, либо вы еще не запускали стресс-тест защищенности. Нажмите кнопку сверху для глубокой инспекции!")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {vulns.map((v) => {
                  const isCritical = v.severity === 'critical';
                  const isWarning = v.severity === 'warning';
                  const isPatched = v.status === 'patched';

                  return (
                    <div 
                      key={v.id} 
                      className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        isPatched 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : isCritical 
                            ? 'bg-red-500/5 border-red-500/20' 
                            : isWarning 
                              ? 'bg-amber-500/5 border-amber-500/20' 
                              : 'bg-blue-500/5 border-blue-500/20'
                      }`}
                    >
                      <div className="space-y-1 bg-transparent border-0 p-0 m-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider ${
                            isPatched 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : isCritical 
                                ? 'bg-red-500/25 text-red-400' 
                                : isWarning 
                                  ? 'bg-amber-500/25 text-amber-400' 
                                  : 'bg-blue-500/25 text-blue-400'
                          }`}>
                            {isPatched ? 'Исправлено ✓' : isCritical ? 'Критическая угр.' : isWarning ? 'Риск ИБ' : 'Инфо'}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-mono">Объект: {v.assetName}</span>
                        </div>
                        <h4 className={`font-bold text-sm ${isPatched ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{v.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{v.description}</p>
                      </div>

                      {v.patchActionLabel && !isPatched && (
                        <button
                          onClick={() => handleApplyPatch(v.id, v.patchId, v.category)}
                          className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 align-middle"
                        >{t("Решить в 1 клик")}</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-900 text-[11px] text-slate-500 leading-relaxed flex items-center gap-2 font-mono">
              <span className="text-blue-500">ℹ️</span>{t("Все эксплоиты и риски вычисляются динамически по состоянию вашей БД (Computer, LAN & User collections).")}</div>
          </div>
        </div>

        {/* Right Side: Attack & Defense Incident Sandbox Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-3xl space-y-5">
            <h3 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2 border-b border-slate-800 pb-3">
              <Skull className="text-red-500 shrink-0" size={16} />{t("Полигон Кибер-Пентестов и Стресс-Тестирования")}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t("Запустите авторизованные утилиты симуляции внешней хакерской активности, чтобы наглядно проверить уязвимости и надежность системных логов.")}</p>

            {/* Simulated actions panel buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                disabled={attackRunning !== null}
                onClick={() => startIncidentSimulation('bruteforce')}
                className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Key className="text-blue-400" size={16} />
                <span>Brute-force</span>
              </button>

              <button
                disabled={attackRunning !== null}
                onClick={() => startIncidentSimulation('ddos')}
                className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Zap className="text-red-400" size={16} />
                <span>SYN Flood</span>
              </button>

              <button
                disabled={attackRunning !== null}
                onClick={() => startIncidentSimulation('mac_spoof')}
                className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Fingerprint className="text-indigo-400" size={16} />
                <span>ARP Spoof</span>
              </button>
            </div>

            {/* DDoS Settings panel */}
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 space-y-3">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("Настройка DDoS Flood:")}</span>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px]">
                  <span className="text-slate-400">{t("Частота SYN-пакетов")}</span>
                  <span className="font-mono text-blue-400 font-semibold">{ddosIntensity} k pps</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="300"
                  value={ddosIntensity}
                  onChange={(e) => setDdosIntensity(parseInt(e.target.value))}
                  disabled={attackRunning !== null}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-[10px] text-slate-400">{t("Целевое устройство (Ассет):")}</span>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-[11px] text-slate-300 focus:outline-none font-sans"
                  value={selectedAttackAsset}
                  onChange={(e) => setSelectedAttackAsset(e.target.value)}
                  disabled={attackRunning !== null}
                >
                  <option value="all">{t("Полная подсеть (Широковещательный шторм)")}</option>
                  {networkDevices.map(net => (
                    <option key={net.id} value={net.id}>{net.type} {net.deviceName} ({net.ipAddress})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Terminal log interface */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={11} />{t("Терминальный Контроль Инцидентов")}</span>
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
              </div>

              <div className="w-full h-48 bg-slate-950 border border-slate-850 p-3 rounded-2xl text-[10px] font-mono-custom text-emerald-400 leading-relaxed overflow-y-auto space-y-1.5 select-text normal-case scrollbar-thin">
                {attackLogs.length === 0 ? (
                  <span className="text-slate-600 block italic">{t("Ожидание запуска теста или инцидента безопасности... Выберите тип пентеста выше.")}</span>
                ) : (
                  attackLogs.map((log, i) => (
                    <div key={i} className="break-all border-l-2 pl-1.5 border-slate-800">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Cyber Compliance audit questions panel */}
      <div className="bg-[#0f172a]/40 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div>
          <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-500">📜</span>{t("Стандарты ИБ-Комплаенса и Рекомендации разработчика Уткина В.В.")}</h3>
          <p className="text-xs text-slate-400">{t("Официальные методические регламенты для защиты интеллектуальной собственности, аппаратных слепков устройств компании.")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-2xl space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{t("Концепция MAC-слепка")}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">{t("Лицензионные компоненты жестко привязаны к физическому MAC-адресу сетевого интерфейса. Это гарантирует блокировку работы ИТ-панели при копировании файлов на сторонние неавторизованные сервера.")}</p>
          </div>

          <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-2xl space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{t("Инвентаризация и Аудит")}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Проводите циклическую сверку физического расположения оборудования на объектах раз в квартал. Это исключает "серые" корпоративные схемы и несанкционированное списание исправной техники сотрудниками.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-2xl space-y-2.5">
            <h4 className="font-bold text-slate-200 text-xs uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{t("Резервные копии баз")}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">{t("Всегда выгружайте бэкапы инвентарных реестров в формате JSON (раздел Настройки или Терминал ИБ) и отправляйте их на защищенный почтовый адрес администратора:")}</p>
            <div className="flex flex-col gap-1.5 pt-1">
              <a 
                href="mailto:assetorbit@icloud.com" 
                className="text-[13px] text-blue-400 hover:text-blue-300 transition-colors font-bold font-mono hover:underline flex items-center gap-1.5"
                title={t("Отправить письмо (assetorbit@icloud.com)")}
              >
                <Mail size={13} className="text-blue-400" />
                <span>assetorbit@icloud.com</span>
              </a>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

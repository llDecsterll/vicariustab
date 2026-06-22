/* Apply EN and ZH translations for all untranslated keys in i18n.tsx */
const fs = require('fs');
const path = require('path');

// Map of Russian key -> { en: "English", zh: "中文" }
const translations = {
  "Департамент": { en: "Department", zh: "部门" },
  "Название филиала": { en: "Branch name", zh: "分支机构名称" },
  "Адрес расположения": { en: "Location address", zh: "所在地址" },
  "Стоимость единицы": { en: "Unit cost", zh: "单价" },
  "Капитализация запаса": { en: "Inventory value", zh: "库存资产价值" },
  "Обзор": { en: "Overview", zh: "概览" },
  "Нет прикрепленных файлов.": { en: "No attached files.", zh: "没有附件。" },
  "Открыть": { en: "Open", zh: "打开" },
  "Вы уверены?": { en: "Are you sure?", zh: "您确定吗？" },
  "Разные документы": { en: "Various documents", zh: "各类文档" },
  "Для расходных материалов замена запчастей и ремонт не предусмотрены. Вы можете": {
    en: "Parts replacement and repair are not applicable for consumables. You can",
    zh: "耗材不适用零件更换和维修。您可以"
  },
  "привязать (закрепить)": { en: "assign (link)", zh: "绑定（分配）" },
  "Привязать к оргтехнике": { en: "Assign to office equipment", zh: "绑定到办公设备" },
  "В системе еще не создано принтеров или МФУ (устройств класса «Оргтехника») для привязки. Сначала добавьте оргтехнику в каталог.": {
    en: "No printers or MFPs (Office Equipment class) have been added yet. Please add office equipment to the catalog first.",
    zh: "系统中尚未添加打印机或多功能一体机（办公设备类）。请先将办公设备添加到目录中。"
  },
  "Выберите принтер / МФУ": { en: "Select printer / MFP", zh: "选择打印机/多功能一体机" },
  "-- Выберите печатное устройство --": { en: "-- Select printing device --", zh: "-- 选择打印设备 --" },
  "Цвет картриджа": { en: "Cartridge color", zh: "墨盒颜色" },
  "Черный (Black)": { en: "Black", zh: "黑色（Black）" },
  "Cyan (Голубой)": { en: "Cyan", zh: "青色（Cyan）" },
  "Magenta (Пурпурный)": { en: "Magenta", zh: "品红（Magenta）" },
  "Yellow (Желтый)": { en: "Yellow", zh: "黄色（Yellow）" },
  "Разноцветный": { en: "Multicolor", zh: "多色" },
  "Состояние": { en: "Condition", zh: "状态" },
  "Дата установки": { en: "Installation date", zh: "安装日期" },
  "Статус расходного мат.": { en: "Consumable status", zh: "耗材状态" },
  "Оставить без изменений": { en: "Leave unchanged", zh: "保持不变" },
  "Выполнить привязку": { en: "Confirm assignment", zh: "确认绑定" },
  "Этот расходный материал в настоящий момент не числится установленным ни на одном печатном оборудовании.": {
    en: "This consumable is not currently registered as installed on any printing device.",
    zh: "该耗材当前未登记为安装在任何打印设备上。"
  },
  "Данный расходник обнаружен в конфигурации следующих устройств оргтехники:": {
    en: "This consumable was found in the configuration of the following office devices:",
    zh: "该耗材在以下办公设备配置中被发现："
  },
  "Перейти": { en: "Go to", zh: "前往" },
  "Замена комплектующих и ремонт": { en: "Parts replacement and repairs", zh: "零件更换与维修" },
  "Ремонты или замены запчастей не зафиксированы. Устройство находится в исходной заводской комплектации.": {
    en: "No repairs or part replacements recorded. Device is in original factory configuration.",
    zh: "无维修或零件更换记录。设备处于原始出厂配置。"
  },
  "Было:": { en: "Was:", zh: "原来：" },
  "Новое:": { en: "New:", zh: "新的：" },
  "Физическое состояние портов": { en: "Physical port status", zh: "端口物理状态" },
  "Нажмите на порт для смены его статуса": { en: "Click on a port to change its status", zh: "点击端口以更改其状态" },
  "Внутренняя модель сопряжения: BASE-T RJ45": { en: "Internal interface model: BASE-T RJ45", zh: "内部接口型号：BASE-T RJ45" },
  "Управление остатками на складе": { en: "Warehouse stock management", zh: "仓库库存管理" },
  "Вы можете оперативно списывать или приходовать товарно-материальные ценности. Изменения склада мгновенно зафиксируются в системном журнале.": {
    en: "You can quickly write off or receive inventory items. All warehouse changes are instantly recorded in the system log.",
    zh: "您可以快速出库或入库物品。所有仓库变动将即时记录在系统日志中。"
  },
  "Основные данные сотрудника": { en: "Employee basic data", zh: "员工基本信息" },
  "Полное ФИО:": { en: "Full name:", zh: "全名：" },
  "Должность:": { en: "Position:", zh: "职位：" },
  "Эл. почта:": { en: "Email:", zh: "电子邮件：" },
  "Учетный статус рабочего места:": { en: "Workstation accounting status:", zh: "工作站账户状态：" },
  "🟢 Проверен (Активирован)": { en: "🟢 Verified (Activated)", zh: "🟢 已验证（已激活）" },
  "ШИФРОВАНИЕ": { en: "ENCRYPTION", zh: "加密" },
  "Статус ЭЦП подписи": { en: "Digital signature status", zh: "数字签名状态" },
  "ПОДПИСАН И ПРОВЕРЕН • ОК": { en: "SIGNED AND VERIFIED • OK", zh: "已签名并验证 • 确定" },
  "Цифровая подпись организации действительна. Документ защищен от изменений во внутреннем хранилище СУБД LocalStorage.": {
    en: "The organization's digital signature is valid. The document is protected from changes in the internal LocalStorage database.",
    zh: "组织数字签名有效。该文件受保护，防止LocalStorage内部数据库中的更改。"
  },
  "Официальный бланк акта передачи оборудования (Интерактивный редактор)": {
    en: "Official equipment transfer act form (Interactive editor)",
    zh: "设备移交正式文件（交互式编辑器）"
  },
  "Редактировать параметры акта": { en: "Edit act parameters", zh: "编辑文件参数" },
  "Номер Акта": { en: "Act Number", zh: "文件编号" },
  "Дата выдачи": { en: "Issue date", zh: "签发日期" },
  "Организация (Заголовок)": { en: "Organization (Header)", zh: "机构（标题）" },
  "Подзаголовок Шапки": { en: "Header subtitle", zh: "标题副标题" },
  "Передающая Сторона": { en: "Transferring Party", zh: "移交方" },
  "Кем отпущено": { en: "Released by", zh: "发放人" },
  "Режим ведомости:": { en: "Statement mode:", zh: "报表模式：" },
  "В режиме паспорта система автоматически выгружает и форматирует список всех закрепленных за сотрудниками устройств, а также общую ИТ-инфраструктуру объекта": {
    en: "In passport mode, the system automatically exports and formats a list of all devices assigned to employees, as well as the general IT infrastructure of the facility.",
    zh: "在证书模式下，系统自动导出并格式化分配给员工的所有设备列表以及设施的整体IT基础设施。"
  },
  "Получатель (Сотрудник)": { en: "Recipient (Employee)", zh: "接收人（员工）" },
  "Должность и отдел": { en: "Position and department", zh: "职位和部门" },
  "Условия ответственности сотрудников": { en: "Employee liability terms", zh: "员工责任条款" },
  "Пункт 1": { en: "Item 1", zh: "第1项" },
  "Пункт 2": { en: "Item 2", zh: "第2项" },
  "Пункт 3": { en: "Item 3", zh: "第3项" },
  "Паспорт ИТ-Инвентаря и Учета Объезда": { en: "IT Inventory and Site Audit Passport", zh: "IT库存与现场审计档案" },
  "Сводная ведомость по сотрудникам и прикрепленному оборудованию филиала:": {
    en: "Summary report on employees and assigned equipment for the branch:",
    zh: "分支机构员工及所属设备汇总报告："
  },
  "Объект / Филиал": { en: "Facility / Branch", zh: "设施/分支机构" },
  "Всего устройств": { en: "Total devices", zh: "设备总数" },
  "1. Выписка по сотрудникам и закрепленному оборудованию": {
    en: "1. Statement on employees and assigned equipment",
    zh: "1. 员工及其所属设备清单"
  },
  "На данном объекте нет сотрудников с персонально закрепленным оборудованием.": {
    en: "No employees with personally assigned equipment at this facility.",
    zh: "该设施没有配备个人设备的员工。"
  },
  "Модель / Сецификация": { en: "Model / Specification", zh: "型号/规格" },
  "2. Полный перечень ИТ-оборудования и инфраструктуры объекта": {
    en: "2. Complete list of IT equipment and facility infrastructure",
    zh: "2. 设施IT设备和基础设施完整列表"
  },
  "Зарегистрированное оборудование отсутствует на данном объекте.": {
    en: "No registered equipment at this facility.",
    zh: "该设施没有已登记的设备。"
  },
  "Категория / Тип": { en: "Category / Type", zh: "类别/类型" },
  "Модель / Описание": { en: "Model / Description", zh: "型号/描述" },
  "Инв. № / IP адрес": { en: "Inv. # / IP address", zh: "资产编号/IP地址" },
  "Спецификация": { en: "Specification", zh: "规格" },
  "Сотрудник / Статус": { en: "Employee / Status", zh: "员工/状态" },
  "Инфраструктура объекта": { en: "Facility infrastructure", zh: "设施基础设施" },
  "* Данная ведомость является официальным внутренним документом ИТ-инвентаризации. Все прикрепленные устройства находятся в зоне ответственности закрепленных за ними сотрудников, либо под общим контролем материально-ответственного лица данного подразделения. Любые перемещения техники должны быть согласованы с администрацией.": {
    en: "* This statement is an official internal IT inventory document. All assigned devices are the responsibility of the employees they are assigned to, or under the general supervision of the materially responsible person of this department. Any movement of equipment must be approved by the administration.",
    zh: "* 本清单为官方内部IT资产盘点文件。所有分配的设备由其责任人负责管理，或由本部门物资责任人统一监管。任何设备调拨须经管理层批准。"
  },
  "Выгрузку произвел Администратор:": { en: "Exported by Administrator:", zh: "导出人：管理员：" },
  "подпись": { en: "signature", zh: "签名" },
  "Согласовано Руководитель объекта:": { en: "Approved by Facility Manager:", zh: "批准人：设施负责人：" },
  "Паспорт Закрепления ИТ-Оборудования": { en: "IT Equipment Assignment Passport", zh: "IT设备分配档案" },
  "Карточка учета ТМЦ и акты приема-передачи во временное служебное пользование": {
    en: "Inventory card and transfer acts for temporary official use",
    zh: "物资账目卡及临时公务使用移交文件"
  },
  "Сотрудник (Получатель)": { en: "Employee (Recipient)", zh: "员工（接收人）" },
  "Всего числится": { en: "Total on record", zh: "记录总数" },
  "1. Спецификация закрепленных технических средств (ТМЦ)": {
    en: "1. Specification of assigned technical assets",
    zh: "1. 已分配技术资产规格"
  },
  "За данным сотрудником в системе не зарегистрировано персональное ИТ-оборудование.": {
    en: "No personal IT equipment registered to this employee in the system.",
    zh: "系统中未登记该员工的个人IT设备。"
  },
  "* Модернизировано (память, SSD)": { en: "* Upgraded (RAM, SSD)", zh: "* 已升级（内存、SSD）" },
  "Отпустил (Сдал) Администратор:": { en: "Released (Handed over) by Administrator:", zh: "管理员移交：" },
  "Принял на баланс Получатель:": { en: "Accepted by Recipient:", zh: "接收人签收：" },
  "Акт Приема-Передачи ИТ-Оборудования": { en: "IT Equipment Transfer Act", zh: "IT设备移交文件" },
  "во временное служебное пользование сотруднику компании": {
    en: "for temporary official use by a company employee",
    zh: "供公司员工临时公务使用"
  },
  "Получающая Сторона (Сотрудник)": { en: "Receiving Party (Employee)", zh: "接收方（员工）" },
  "1. Сведения о передаваемом оборудовании": { en: "1. Information on transferred equipment", zh: "1. 移交设备信息" },
  "Наименование / Модель:": { en: "Name / Model:", zh: "名称/型号：" },
  "Инвентарный номер ТМЦ:": { en: "Asset inventory number:", zh: "资产库存编号：" },
  "Серийный номер:": { en: "Serial number:", zh: "序列号：" },
  "Размещение / Объект:": { en: "Location / Facility:", zh: "位置/设施：" },
  "Действующая конфигурация:": { en: "Current configuration:", zh: "当前配置：" },
  "2. История замен комплектующих и модернизаций": {
    en: "2. Parts replacement and upgrade history",
    zh: "2. 零件更换与升级历史"
  },
  "Название замены": { en: "Replacement name", zh: "更换名称" },
  "Предыдущая деталь": { en: "Previous part", zh: "原零件" },
  "Действующая деталь": { en: "Current part", zh: "现用零件" },
  "ТЕХОТДЕЛ": { en: "IT DEPARTMENT", zh: "技术部门" },
  "ДЛЯ ДОКУМЕНТОВ": { en: "FOR DOCUMENTS", zh: "文档用途" },
  "Запустить Печать": { en: "Print", zh: "打印" },
  "Сгенерировать акт приема-передачи оборудования": {
    en: "Generate equipment transfer act",
    zh: "生成设备移交文件"
  },
  "Просмотреть": { en: "View", zh: "查看" },
  "Скачать на ПК": { en: "Download to PC", zh: "下载到电脑" },
  "Редактировать замену": { en: "Edit replacement", zh: "编辑更换记录" },
  "Удалить замену": { en: "Delete replacement", zh: "删除更换记录" },
  "Например: SSD диск": { en: "E.g.: SSD drive", zh: "例如：SSD硬盘" },
  "Было: Kingmax 120GB": { en: "Was: Kingmax 120GB", zh: "原来：Kingmax 120GB" },
  "Стало: Kingston 480GB": { en: "Now: Kingston 480GB", zh: "现在：Kingston 480GB" },
  "Причина замены (например, Износ или Апгрейд)": {
    en: "Replacement reason (e.g., Wear or Upgrade)",
    zh: "更换原因（例如：磨损或升级）"
  },
  "не указана": { en: "not specified", zh: "未指定" },
  "не указан": { en: "not specified", zh: "未指定" },
  "Закрепленный объект:": { en: "Assigned facility:", zh: "关联设施：" },
  "Не привязан": { en: "Not assigned", zh: "未分配" },
  "Передать всё": { en: "Transfer all", zh: "全部移交" },
  "Оборудование не закреплено": { en: "Equipment not assigned", zh: "设备未分配" },
  "Передача оборудования": { en: "Equipment transfer", zh: "设备移交" },
  "будут перенесены на": { en: "will be transferred to", zh: "将移交给" },
  ", а статус устройств изменится на": { en: ", and the device status will change to", zh: "，设备状态将更改为" },
  "будут перемещены на выбранного сотрудника.": {
    en: "will be moved to the selected employee.",
    zh: "将移交给所选员工。"
  },
  "Выберите получателя оборудования": { en: "Select equipment recipient", zh: "选择设备接收人" },
  "-- Выберите получателя / Склад --": { en: "-- Select recipient / Warehouse --", zh: "-- 选择接收人/仓库 --" },
  "📦 Сдать ВСЕ на Склад ИТ (в запас)": { en: "📦 Return ALL to IT Warehouse (stock)", zh: "📦 全部归还IT仓库（库存）" },
  "Подтвердить перенос": { en: "Confirm transfer", zh: "确认移交" },
  "Удалить сотрудника": { en: "Delete employee", zh: "删除员工" },
  "Переместить все закрепленное оборудование на другого сотрудника": {
    en: "Transfer all assigned equipment to another employee",
    zh: "将所有已分配设备移交给其他员工"
  },
  "Например, Смирнов А.Д.": { en: "E.g., Smith J.D.", zh: "例如：张三" },
  "Например, Ведущий разработчик": { en: "E.g., Lead Developer", zh: "例如：高级开发工程师" },
  "Например, Отдел логистики, HR-служба": { en: "E.g., Logistics Dept., HR Department", zh: "例如：物流部、人力资源部" },
  "Система учета оборудования": { en: "Equipment accounting system", zh: "设备管理系统" },
  "Для управления кликайте по объектам, технике, сотрудникам. Все данные сохраняются в локальное хранилище.": {
    en: "Click on facilities, equipment, and employees to manage them. All data is saved to local storage.",
    zh: "点击设施、设备和员工进行管理。所有数据保存在本地存储中。"
  },
  "Введите пароль для": { en: "Enter password for", zh: "输入密码以访问" },
  "О системе": { en: "About the system", zh: "关于系统" },
  "Отправить письмо разработчику": { en: "Send email to developer", zh: "发送邮件给开发者" },
  "Масштаб аналитики:": { en: "Analytics scope:", zh: "分析范围：" },
  "Выберите объект:": { en: "Select facility:", zh: "选择设施：" },
  "(Позиции размещены на Центр. Складе)": { en: "(Items located at Central Warehouse)", zh: "（物品位于中央仓库）" },
  "ОТЧЕТ ПО УЧЕТУ ИТ-ИНВЕНТАРЯ": { en: "IT INVENTORY ACCOUNTING REPORT", zh: "IT库存核算报告" },
  "Область аналитики:": { en: "Analytics area:", zh: "分析区域：" },
  "Экземпляр №1": { en: "Copy #1", zh: "副本第1份" },
  "1. Сводные показатели": { en: "1. Summary metrics", zh: "1. 汇总指标" },
  "Показатель": { en: "Metric", zh: "指标" },
  "Текущий параметр": { en: "Current value", zh: "当前值" },
  "Общее число рабочих станций / ПК": { en: "Total workstations / PCs", zh: "工作站/PC总数" },
  "Активно у сотрудников в работе": { en: "Active in use by employees", zh: "员工在用设备数" },
  "Роутеры и коммутаторы на сетях": { en: "Routers and switches on networks", zh: "网络路由器和交换机" },
  "Действующий баланс оцениваемого склада": { en: "Current balance of evaluated warehouse", zh: "待评估仓库的当前余额" },
  "2. Список локаций и филиалов": { en: "2. Locations and branches list", zh: "2. 地点和分支机构列表" },
  "Подпись администратора аналитики: _______________________": {
    en: "Analytics administrator signature: _______________________",
    zh: "分析管理员签名：_______________________"
  },
  "Дата и время сверки: _______________________": {
    en: "Reconciliation date and time: _______________________",
    zh: "核对日期和时间：_______________________"
  },
  "Интерактивный центр симуляции киберугроз, автоматической оценки защищенности и управления уязвимостями материальной базы.": {
    en: "Interactive cyber threat simulation center for automated security assessment and vulnerability management of IT assets.",
    zh: "交互式网络威胁模拟中心，用于IT资产的自动安全评估和漏洞管理。"
  },
  "Запущена глубокая инспекция файлов, конфигураций портов, MAC-адресов и паролей администраторов...": {
    en: "Deep inspection of files, port configurations, MAC addresses, and administrator passwords launched...",
    zh: "已启动文件、端口配置、MAC地址和管理员密码的深度检查..."
  },
  "Индекс защищенности": { en: "Security index", zh: "安全指数" },
  "Всего активов под защитой": { en: "Total assets under protection", zh: "受保护资产总数" },
  "узлов": { en: "nodes", zh: "节点" },
  "Выявлено угроз безопасности": { en: "Security threats detected", zh: "检测到安全威胁" },
  "уязвимостей": { en: "vulnerabilities", zh: "漏洞" },
  "Сетевой экран (IDS/IPS)": { en: "Firewall (IDS/IPS)", zh: "防火墙（IDS/IPS）" },
  "Активен / Мониторинг": { en: "Active / Monitoring", zh: "活跃/监控中" },
  "Результаты Последней Проверки": { en: "Last Scan Results", zh: "最近扫描结果" },
  "Системный периметр полностью чист, либо вы еще не запускали стресс-тест защищенности. Нажмите кнопку сверху для глубокой инспекции!": {
    en: "The system perimeter is completely clean, or you have not yet run a security stress test. Click the button above for deep inspection!",
    zh: "系统边界完全干净，或您尚未运行安全压力测试。请点击上方按钮进行深度检查！"
  },
  "Решить в 1 клик": { en: "Fix in 1 click", zh: "一键修复" },
  "Все эксплоиты и риски вычисляются динамически по состоянию вашей БД (Computer, LAN & User collections).": {
    en: "All exploits and risks are calculated dynamically based on your database state (Computer, LAN & User collections).",
    zh: "所有漏洞利用和风险均根据您的数据库状态（Computer、LAN和User集合）动态计算。"
  },
  "Полигон Кибер-Пентестов и Стресс-Тестирования": { en: "Cyber Pentest and Stress Testing Range", zh: "网络渗透测试与压力测试平台" },
  "Запустите авторизованные утилиты симуляции внешней хакерской активности, чтобы наглядно проверить уязвимости и надежность системных логов.": {
    en: "Run authorized external hacking activity simulation utilities to visually check vulnerabilities and system log reliability.",
    zh: "运行授权的外部黑客活动模拟工具，直观检查漏洞和系统日志的可靠性。"
  },
  "Настройка DDoS Flood:": { en: "DDoS Flood configuration:", zh: "DDoS洪泛配置：" },
  "Частота SYN-пакетов": { en: "SYN packet frequency", zh: "SYN数据包频率" },
  "Целевое устройство (Ассет):": { en: "Target device (Asset):", zh: "目标设备（资产）：" },
  "Полная подсеть (Широковещательный шторм)": { en: "Full subnet (Broadcast storm)", zh: "整个子网（广播风暴）" },
  "Терминальный Контроль Инцидентов": { en: "Terminal Incident Control", zh: "终端事件控制" },
  "Ожидание запуска теста или инцидента безопасности... Выберите тип пентеста выше.": {
    en: "Waiting for test or security incident to start... Select pentest type above.",
    zh: "等待测试或安全事件启动...请在上方选择渗透测试类型。"
  },
  "Стандарты ИБ-Комплаенса и Рекомендации разработчика Уткина В.В.": {
    en: "Information Security Compliance Standards and Developer Utkin V.V. Recommendations",
    zh: "信息安全合规标准及开发者乌特金V.V.建议"
  },
  "Официальные методические регламенты для защиты интеллектуальной собственности, аппаратных слепков устройств компании.": {
    en: "Official methodological regulations for protecting intellectual property and hardware fingerprints of company devices.",
    zh: "保护公司设备知识产权和硬件指纹的官方方法法规。"
  },
  "Концепция MAC-слепка": { en: "MAC fingerprint concept", zh: "MAC指纹概念" },
  "Лицензионные компоненты жестко привязаны к физическому MAC-адресу сетевого интерфейса. Это гарантирует блокировку работы ИТ-панели при копировании файлов на сторонние неавторизованные сервера.": {
    en: "License components are strictly bound to the physical MAC address of the network interface. This ensures the IT panel is blocked if files are copied to unauthorized third-party servers.",
    zh: "许可证组件严格绑定到网络接口的物理MAC地址。这确保了在将文件复制到未授权的第三方服务器时IT面板被锁定。"
  },
  "Инвентаризация и Аудит": { en: "Inventory and Audit", zh: "库存与审计" },
  "Резервные копии баз": { en: "Database backups", zh: "数据库备份" },
  "Всегда выгружайте бэкапы инвентарных реестров в формате JSON (раздел Настройки или Терминал ИБ) и отправляйте их на защищенный почтовый адрес администратора:": {
    en: "Always export backups of inventory registers in JSON format (Settings section or IS Terminal) and send them to the administrator's secure email address:",
    zh: "务必以JSON格式导出库存记录备份（设置部分或IS终端），并发送至管理员安全电子邮件地址："
  },
  "* Резервная копия полностью автономна и сохраняется на Вашем устройстве в формате JSON.": {
    en: "* The backup is fully autonomous and is saved to your device in JSON format.",
    zh: "* 备份完全自主运行，以JSON格式保存到您的设备。"
  },
  "Русский (RU)": { en: "Russian (RU)", zh: "俄语（RU）" },
  "✔ Успешная активация! Ключ принят. Система полностью разблокирована.": {
    en: "✔ Activation successful! Key accepted. System fully unlocked.",
    zh: "✔ 激活成功！密钥已接受。系统完全解锁。"
  },
  "Анна Ковалева": { en: "Anna Kovaleva", zh: "安娜·科瓦列娃" },
  "Поиск по названию, ключу, разработчику...": {
    en: "Search by name, key, developer...",
    zh: "按名称、密钥、开发者搜索..."
  },
  "Например: Microsoft Office, Adobe Photoshop": {
    en: "E.g.: Microsoft Office, Adobe Photoshop",
    zh: "例如：Microsoft Office、Adobe Photoshop"
  },
  "Например: Microsoft, JetBrains, 1С": { en: "E.g.: Microsoft, JetBrains, 1C", zh: "例如：Microsoft、JetBrains、1C" },
  "Например: 2024, LTSC, 8.3": { en: "E.g.: 2024, LTSC, 8.3", zh: "例如：2024、LTSC、8.3" },
  "Введите ключ активации вручную или воспользуйтесь подбором кнопками выше": {
    en: "Enter the activation key manually or use the selection buttons above",
    zh: "手动输入激活码或使用上方选择按钮"
  },
  "Например: закупка по тендеру 2026 года...": {
    en: "E.g.: purchased via 2026 tender...",
    zh: "例如：通过2026年招标采购..."
  },
  "Срок истекает (<60 дней)": { en: "Expiring (<60 days)", zh: "即将到期（<60天）" },
};

const file = path.join(process.cwd(), 'src/utils/i18n.tsx');
let src = fs.readFileSync(file, 'utf8');
let patchCount = 0;
let notFoundCount = 0;
const notFound = [];

for (const [ruKey, trans] of Object.entries(translations)) {
  // Escape for use in regex
  const escapedKey = ruKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"');
  
  // Build pattern to find: key: { ru: "...", en: "CYRILLIC", zh: "CYRILLIC" }
  // We need to fix en and zh values that currently contain Russian text
  const enCyrillicPattern = new RegExp(
    '("' + escapedKey + '"\\s*:\\s*\\{[^}]*?en:\\s*")([^"]*[а-яА-ЯёЁ][^"]*)(")',
    'g'
  );
  const zhCyrillicPattern = new RegExp(
    '("' + escapedKey + '"\\s*:\\s*\\{[^}]*?zh:\\s*")([^"]*[а-яА-ЯёЁ][^"]*)(")',
    'g'
  );
  
  let enPatched = false;
  let zhPatched = false;
  
  if (trans.en) {
    const newSrc = src.replace(enCyrillicPattern, (match, pre, val, post) => {
      enPatched = true;
      return pre + trans.en.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + post;
    });
    if (newSrc !== src) { src = newSrc; patchCount++; }
  }
  
  if (trans.zh) {
    const newSrc = src.replace(zhCyrillicPattern, (match, pre, val, post) => {
      zhPatched = true;
      return pre + trans.zh.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + post;
    });
    if (newSrc !== src) { src = newSrc; patchCount++; }
  }
  
  if (!enPatched && !zhPatched) {
    notFoundCount++;
    notFound.push(ruKey);
  }
}

fs.writeFileSync(file, src, 'utf8');
console.log(`Patches applied: ${patchCount}`);
console.log(`Keys not found in file (may already be translated): ${notFoundCount}`);
if (notFound.length > 0) {
  console.log('Not found:');
  notFound.slice(0, 20).forEach(k => console.log(' -', k.slice(0, 80)));
}
console.log('Done!');

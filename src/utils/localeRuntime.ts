import type { Language } from './i18n';
import type { DashboardAlert } from './dashboardAnalytics';

export type TFunc = (key: string) => string;

export function interpolate(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
}

const localeForLanguage = (language: Language): string => {
  if (language === 'en') return 'en-US';
  if (language === 'zh') return 'zh-CN';
  return 'ru-RU';
};

export function formatLocalizedDateTime(ts: string, language: Language, t: TFunc): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  const locale = localeForLanguage(language);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `${t('Вчера')}, ${time}`;
  return date.toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function translateActivityAction(action: string, t: TFunc): string {
  const translated = t(action);
  return translated !== action ? translated : action;
}

type DetailRule = {
  re: RegExp;
  key: string;
  map: (m: RegExpMatchArray) => Record<string, string | number>;
};

const ACTIVITY_DETAIL_RULES: DetailRule[] = [
  {
    re: /^Успешно завершена инвентаризация ID: ([^.]+)\. Выявлено (\d+) расхождений\.$/,
    key: 'Успешно завершена инвентаризация ID: {id}. Выявлено {n} расхождений.',
    map: (m) => ({ id: m[1], n: m[2] }),
  },
  {
    re: /^Из базы удалена инвентаризационная проверка "(.+)" \(ID: (.+)\)$/,
    key: 'Из базы удалена инвентаризационная проверка "{title}" (ID: {id})',
    map: (m) => ({ title: m[1], id: m[2] }),
  },
  {
    re: /^Начата инвентаризационная проверка "(.+)" \(Объект: (.+)\)$/,
    key: 'Начата инвентаризационная проверка "{title}" (Объект: {obj})',
    map: (m) => ({ title: m[1], obj: m[2] }),
  },
  {
    re: /^Добавлен представитель "(.+)" с правами "(.+)"$/,
    key: 'Добавлен представитель "{name}" с правами "{role}"',
    map: (m) => ({ name: m[1], role: m[2] }),
  },
  {
    re: /^Отозван доступ к панели у сотрудника "(.+)"$/,
    key: 'Отозван доступ к панели у сотрудника "{name}"',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Обновлены данные учетной записи "(.+)"$/,
    key: 'Обновлены данные учетной записи "{name}"',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Завершена сессия пользователя "(.+)"$/,
    key: 'Завершена сессия пользователя "{name}"',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Изменены параметры \((.+), ID: (.+)\)$/,
    key: 'Изменены параметры ({label}, ID: {id})',
    map: (m) => ({ label: m[1], id: m[2] }),
  },
  {
    re: /^Добавлен объект "(.+)" по адресу "(.+)"$/,
    key: 'Добавлен объект "{name}" по адресу "{address}"',
    map: (m) => ({ name: m[1], address: m[2] }),
  },
  {
    re: /^Параметры объекта "(.+)" изменены$/,
    key: 'Параметры объекта "{name}" изменены',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Объект "(.+)" (архивирован|восстановлен из архива)$/,
    key: 'Объект "{name}" {action}',
    map: (m) => ({ name: m[1], action: m[2] }),
  },
  {
    re: /^Удален объект "(.+)"$/,
    key: 'Удален объект "{name}"',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Добавлено устройство "(.+)"$/,
    key: 'Добавлено устройство "{name}"',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Параметры оборудования "(.+)" изменены$/,
    key: 'Параметры оборудования "{name}" изменены',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Сотрудник "(.+)" (архивирован|восстановлен из архива)$/,
    key: 'Сотрудник "{name}" {action}',
    map: (m) => ({ name: m[1], action: m[2] }),
  },
  {
    re: /^Параметры "(.+)" изменены \(Статус: (.+)\)$/,
    key: 'Параметры "{item}" изменены (Статус: {status})',
    map: (m) => ({ item: m[1], status: m[2] }),
  },
  {
    re: /^Добавлена программа "(.+)"$/,
    key: 'Добавлена программа "{name}"',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Параметры ПО "(.+)" обновлены$/,
    key: 'Параметры ПО "{name}" обновлены',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Добавлен новый профиль сотрудника "(.+)" \((.+)\) на объект "(.+)"$/,
    key: 'Добавлен новый профиль сотрудника "{name}" ({position}) на объект "{object}"',
    map: (m) => ({ name: m[1], position: m[2], object: m[3] }),
  },
  {
    re: /^Добавлен новый профиль сотрудника "(.+)" \((.+)\)$/,
    key: 'Добавлен новый профиль сотрудника "{name}" ({position})',
    map: (m) => ({ name: m[1], position: m[2] }),
  },
  {
    re: /^Обновлены данные о сотруднике "(.+)"$/,
    key: 'Обновлены данные о сотруднике "{name}"',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Удален сотрудник "(.+)" из штата\. Выданное оборудование возвращено на склад\.$/,
    key: 'Удален сотрудник "{name}" из штата. Выданное оборудование возвращено на склад.',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Принят на баланс склада товар "(.+)" в количестве (\d+) (.+)$/,
    key: 'Принят на баланс склада товар "{name}" в количестве {qty} {unit}',
    map: (m) => ({ name: m[1], qty: m[2], unit: m[3] }),
  },
  {
    re: /^Устройство "(.+)" автоматически распределено в Сетевое оборудование$/,
    key: 'Устройство "{name}" автоматически распределено в Сетевое оборудование',
    map: (m) => ({ name: m[1] }),
  },
  {
    re: /^Списано (\d+) (.+) для устройства "(.+)" \(Инв\. № (.+)\)$/,
    key: 'Списано {qty} {unit} для устройства "{name}" (Инв. № {inv})',
    map: (m) => ({ qty: m[1], unit: m[2], name: m[3], inv: m[4] }),
  },
  {
    re: /^Из истории списаний удалено списание товара "(.+)" \(Инв\. номер: (.+)\)$/,
    key: 'Из истории списаний удалено списание товара "{name}" (Инв. номер: {inv})',
    map: (m) => ({ name: m[1], inv: m[2] }),
  },
];

export function translateActivityDetail(detail: string | undefined, t: TFunc): string {
  if (!detail) return '';

  for (const rule of ACTIVITY_DETAIL_RULES) {
    const m = detail.match(rule.re);
    if (m) {
      const params = rule.map(m);
      if (rule.key === 'Объект "{name}" {action}') {
        const actionKey = params.action === 'архивирован' ? 'архивирован' : 'восстановлен из архива';
        return interpolate(t('Объект "{name}" {action}'), {
          name: String(params.name),
          action: t(actionKey),
        });
      }
      if (rule.key === 'Сотрудник "{name}" {action}') {
        const actionKey = params.action === 'архивирован' ? 'архивирован' : 'восстановлен из архива';
        return interpolate(t('Сотрудник "{name}" {action}'), {
          name: String(params.name),
          action: t(actionKey),
        });
      }
      return interpolate(t(rule.key), params);
    }
  }

  const translated = t(detail);
  return translated !== detail ? translated : detail;
}

export function translateCascadeLine(line: string, t: TFunc): string {
  let m = line.match(/^Склад ИТ — (\d+) поз\.$/);
  if (m) return interpolate(t('Склад ИТ — {n} поз.'), { n: m[1] });
  m = line.match(/^Сетевое оборудование — (\d+) карточ\.$/);
  if (m) return interpolate(t('Сетевое оборудование — {n} карточ.'), { n: m[1] });
  m = line.match(/^Оборудование \/ компьютеры — (\d+) карточ\.$/);
  if (m) return interpolate(t('Оборудование / компьютеры — {n} карточ.'), { n: m[1] });
  m = line.match(/^Программное обеспечение — (\d+) лиценз\.$/);
  if (m) return interpolate(t('Программное обеспечение — {n} лиценз.'), { n: m[1] });
  const tr = t(line);
  return tr !== line ? tr : line;
}

export function translateNotificationText(text: string, t: TFunc): string {
  let m = text.match(/^Срок гарантии оборудования (.+) \((.+)\) истекает через (\d+) дней$/);
  if (m) {
    return interpolate(t('Срок гарантии оборудования {device} ({inv}) истекает через {n} дней'), {
      device: m[1],
      inv: m[2],
      n: m[3],
    });
  }
  m = text.match(/^Лицензия на ПО "(.+)" истекает через (\d+) дней$/);
  if (m) {
    return interpolate(t('Лицензия на ПО "{name}" истекает через {n} дней'), { name: m[1], n: m[2] });
  }
  m = text.match(/^Проведена инвентаризация: "(.+)" \((\d+) расхождений\)$/);
  if (m) {
    return interpolate(t('Проведена инвентаризация: "{title}" ({n} расхождений)'), { title: m[1], n: m[2] });
  }
  const tr = t(text);
  return tr !== text ? tr : text;
}

export function translateSecurityText(text: string, t: TFunc): string {
  const rules: DetailRule[] = [
    {
      re: /^Слабый пароль пользователя "(.+)"$/,
      key: 'Слабый пароль пользователя "{name}"',
      map: (m) => ({ name: m[1] }),
    },
    {
      re: /^Учетная запись: @(.+)$/,
      key: 'Учетная запись: @{login}',
      map: (m) => ({ login: m[1] }),
    },
    {
      re: /^Отсутствует системный IP у устройства "(.+)"$/,
      key: 'Отсутствует системный IP у устройства "{name}"',
      map: (m) => ({ name: m[1] }),
    },
    {
      re: /^Устройство на дефолтном IP диапазоне \((.+)\)$/,
      key: 'Устройство на дефолтном IP диапазоне ({ip})',
      map: (m) => ({ ip: m[1] }),
    },
    {
      re: /^Устройства \((\d+) шт\.\) находятся "На ремонте"$/,
      key: 'Устройства ({n} шт.) находятся "На ремонте"',
      map: (m) => ({ n: m[1] }),
    },
    {
      re: /^Слабая маркировка устройства "(.+)"$/,
      key: 'Слабая маркировка устройства "{name}"',
      map: (m) => ({ name: m[1] }),
    },
    {
      re: /^Скан от: (.+)$/,
      key: 'Скан от: {time}',
      map: (m) => ({ time: m[1] }),
    },
  ];

  for (const rule of rules) {
    const m = text.match(rule.re);
    if (m) return interpolate(t(rule.key), rule.map(m));
  }

  const tr = t(text);
  return tr !== text ? tr : text;
}

export function translateDashboardAlert(alert: DashboardAlert, t: TFunc): DashboardAlert {
  let title = alert.title;

  const discrepancy = title.match(/^Расхождения: (.+)$/);
  if (discrepancy) {
    title = `${t('Расхождения')}: ${discrepancy[1]}`;
  } else {
    const warrantyDays = title.match(/^Гарантия истекает через (\d+) дней$/);
    if (warrantyDays) {
      title = interpolate(t('Гарантия истекает через {n} дней'), { n: warrantyDays[1] });
    } else {
      const warrantyModel = title.match(/^Истекает гарантия: (.+)$/);
      if (warrantyModel) {
        title = `${t('Истекает гарантия')}: ${warrantyModel[1]}`;
      } else {
        const translated = t(title);
        title = translated !== title ? translated : title;
      }
    }
  }

  let subtitle = alert.subtitle;
  if (subtitle.startsWith('Объект: ')) {
    subtitle = `${t('Объект')}: ${subtitle.slice(8)}`;
  } else {
    const translatedSubtitle = t(subtitle);
    subtitle = translatedSubtitle !== subtitle ? translatedSubtitle : subtitle;
  }

  let detail = alert.detail;
  if (detail) {
    const remaining = detail.match(/^Осталось проверить: (\d+) позиций$/);
    if (remaining) {
      detail = `${t('Осталось проверить')}: ${remaining[1]} ${t('позиций')}`;
    } else if (detail.startsWith('Инв. №: ')) {
      detail = `${t('Инв. №')}: ${detail.slice(7)}`;
    } else {
      const translatedDetail = t(detail);
      detail = translatedDetail !== detail ? translatedDetail : detail;
    }
  }

  const badge = alert.badge ? t(alert.badge) : alert.badge;

  return { ...alert, title, subtitle, detail, badge };
}

// Backward-compatible alias
export const formatDashboardActivityTime = formatLocalizedDateTime;

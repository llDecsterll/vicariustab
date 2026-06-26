export type WarehouseCurrency = 'RUB' | 'USD' | 'CNY';

/** Base amounts in the system are stored in RUB. */
const RUB_PER_USD = 90;
const RUB_PER_CNY = 12;

export function convertRubAmount(amountRub: number, currency: WarehouseCurrency): number {
  if (currency === 'USD') return amountRub / RUB_PER_USD;
  if (currency === 'CNY') return amountRub / RUB_PER_CNY;
  return amountRub;
}

export function formatWarehouseCurrency(amountRub: number, currency: WarehouseCurrency): string {
  return formatCurrencyAmount(convertRubAmount(amountRub, currency), currency);
}

export function formatCurrencyAmount(amount: number, currency: WarehouseCurrency): string {
  const locale = currency === 'USD' ? 'en-US' : currency === 'CNY' ? 'zh-CN' : 'ru-RU';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const WAREHOUSE_CURRENCY_OPTIONS: { value: WarehouseCurrency; label: string }[] = [
  { value: 'RUB', label: 'RUB ₽' },
  { value: 'USD', label: 'USD $' },
  { value: 'CNY', label: 'CNY ¥' },
];

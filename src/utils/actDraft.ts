/*
 * Session draft storage for interactive act editor (in-memory; synced via server on save).
 */
import { memStorage } from './memoryStorage';
import type { SystemUser } from '../types';
import { formatPersonShortName } from './personName';

export interface ActFormState {
  actNumber: string;
  actDate: string;
  actCompany: string;
  actSub: string;
  actSender: string;
  actSenderSub: string;
  releasedBy: string;
  actReceiver: string;
  actReceiverSub: string;
  clauses: string[];
}

export interface ActDraftRecord extends ActFormState {
  savedAt: string;
}

export const ACT_DRAFT_STORAGE_PREFIX = 'vicariustab_act_draft_';

export const DEFAULT_ACT_CLAUSES: string[] = [
  'Работник принимает на себя полную материальную и техническую ответственность за сохранность вышеуказанного ИТ-имущества, компьютерных узлов и прилегающих периферийных приспособлений, переданных для исполнения его прямых трудовых обязательств.',
  'Работнику строго воспрещается производить самостоятельно несанкционированное вскрытие корпусов оборудования, переустановку операционных систем, замену комплектующих, а также извлечение или передачу деталей третьим лицам без личного согласования с техническим отделом.',
  'Оборудование возвращается Сторонами в исходном технически исправном состоянии с учетом естественного износа ИТ-комплектующих.',
];

export function actDraftKey(itemType: string, itemId: string): string {
  return `${ACT_DRAFT_STORAGE_PREFIX}${itemType}_${itemId}`;
}

export function loadActDraft(key: string): ActDraftRecord | null {
  try {
    const raw = memStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActDraftRecord;
    if (!parsed || typeof parsed.actNumber !== 'string' || !Array.isArray(parsed.clauses)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveActDraft(key: string, state: ActFormState): ActDraftRecord {
  const record: ActDraftRecord = { ...state, savedAt: new Date().toISOString() };
  memStorage.setItem(key, JSON.stringify(record));
  return record;
}

export function clearActDraft(key: string): void {
  memStorage.removeItem(key);
}

/** Strip leading "N. " and prefix with new index for display. */
export function formatClauseNumber(text: string, index: number): string {
  const body = text.replace(/^\d+\.\s*/, '').trim();
  return `${index}. ${body}`;
}

export function clearActDraftLocalStorage(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < memStorage.length; i++) {
    const key = memStorage.key(i);
    if (key?.startsWith(ACT_DRAFT_STORAGE_PREFIX)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) {
    memStorage.removeItem(key);
  }
}

export function buildDefaultActForm(
  item: Record<string, unknown>,
  _itemType: string,
  _workspaceName: string | undefined,
  currentUser?: Pick<SystemUser, 'name' | 'login'> | null
): ActFormState {
  const inv = item.inventoryNumber as string | undefined;
  const id = item.id as string | undefined;
  const actNumber = inv ? `ЭО-${inv}` : `ЭО-${id?.toString().slice(0, 5).toUpperCase() || 'NEW'}`;
  const receiverName = (item.employeeName as string) || (item.name as string) || 'Материальное ответственное лицо';
  const position = (item.position as string) || 'Штатный сотрудник';
  const department = item.department as string | undefined;

  return {
    actNumber,
    actDate: new Date().toISOString().split('T')[0],
    actCompany: '',
    actSub: '',
    actSender: '',
    actSenderSub: '',
    releasedBy: formatPersonShortName(currentUser?.name || 'Администратор ИТ'),
    actReceiver: formatPersonShortName(receiverName),
    actReceiverSub: `${position}${department ? ` • Отдел: ${department}` : ''}`,
    clauses: [...DEFAULT_ACT_CLAUSES],
  };
}

/** Map stored value (login or full name) to short display name. */
export function resolveReleasedByDisplayName(value: string, users: SystemUser[]): string {
  const trimmed = value.trim();
  if (!trimmed) return formatPersonShortName('Администратор ИТ');

  const byLogin = users.find(u => u.login && u.login === trimmed);
  if (byLogin?.name) return formatPersonShortName(byLogin.name);

  const byShort = users.find(u => formatPersonShortName(u.name) === trimmed);
  if (byShort) return trimmed;

  const byFull = users.find(u => u.name.trim() === trimmed);
  if (byFull?.name) return formatPersonShortName(byFull.name);

  return formatPersonShortName(trimmed);
}

export function releasedByOptionsFromUsers(users: SystemUser[], current?: string): string[] {
  const opts = new Set<string>();
  users
    .filter(u => !u.isBlocked && u.name?.trim())
    .forEach(u => opts.add(formatPersonShortName(u.name)));
  if (current?.trim()) opts.add(resolveReleasedByDisplayName(current, users));
  return Array.from(opts);
}

export function actFormsEqual(a: ActFormState, b: ActFormState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

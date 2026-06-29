import type { SoftwareItem, SoftwareLicenseSeat } from '../types';

export const NO_KEY_PLACEHOLDER = 'Без ключа';
export const FREE_LICENSE_EMPLOYEE = 'Свободная лицензия';
export const CORPORATE_LICENSE_EMPLOYEE = 'Все сотрудники';

/** Все ключи записи: licenseKeys или один licenseKey. */
export function getSoftwareItemLicenseKeys(item: SoftwareItem): string[] {
  if (item.licenseKeys?.length) {
    return item.licenseKeys.map((k) => k.trim()).filter(Boolean);
  }
  const single = item.licenseKey?.trim();
  return single ? [single] : [];
}

export function softwareItemMatchesKeySearch(item: SoftwareItem, query: string): boolean {
  const q = query.toLowerCase();
  const seatKeys = (item.licenseSeats ?? []).map((s) => s.licenseKey?.toLowerCase() ?? '');
  return (
    getSoftwareItemLicenseKeys(item).some((k) => k.toLowerCase().includes(q)) ||
    seatKeys.some((k) => k.includes(q))
  );
}

export function isLicenseSeatAssigned(seat: SoftwareLicenseSeat): boolean {
  const name = seat.assignedEmployeeName?.trim();
  return !!name && name !== FREE_LICENSE_EMPLOYEE;
}

export function countAssignedLicenseSeats(seats: SoftwareLicenseSeat[]): number {
  return seats.filter(isLicenseSeatAssigned).length;
}

export function countFreeLicenseSeats(seats: SoftwareLicenseSeat[]): number {
  return seats.length - countAssignedLicenseSeats(seats);
}

function isLegacyWholeBatchAssigned(item: SoftwareItem): boolean {
  const name = item.assignedEmployeeName?.trim();
  return !!name && name !== FREE_LICENSE_EMPLOYEE;
}

/** Собрать/мигрировать места под текущее quantity и ключи. */
export function ensureLicenseSeats(item: SoftwareItem): SoftwareLicenseSeat[] {
  const qty = Math.max(1, item.quantity || 1);
  const keys = getSoftwareItemLicenseKeys(item);
  const keyFor = (i: number) => keys[i] || keys[0] || item.licenseKey || '';

  if (item.licenseSeats?.length) {
    return Array.from({ length: qty }, (_, i) => {
      const prev = item.licenseSeats!.find((s) => s.seatIndex === i) ?? item.licenseSeats![i];
      if (prev) {
        return {
          ...prev,
          seatIndex: i,
          licenseKey: keyFor(i),
          objectName: prev.objectName || item.objectName,
        };
      }
      return {
        seatIndex: i,
        licenseKey: keyFor(i),
        assignedEmployeeName: FREE_LICENSE_EMPLOYEE,
        assignedDeviceId: undefined,
        objectName: item.objectName,
      };
    });
  }

  if (isLegacyWholeBatchAssigned(item)) {
    return Array.from({ length: qty }, (_, i) => ({
      seatIndex: i,
      licenseKey: keyFor(i),
      assignedEmployeeName: i === 0 ? item.assignedEmployeeName : FREE_LICENSE_EMPLOYEE,
      assignedDeviceId: i === 0 ? item.assignedDeviceId : undefined,
      objectName: item.objectName,
    }));
  }

  return Array.from({ length: qty }, (_, i) => ({
    seatIndex: i,
    licenseKey: keyFor(i),
    assignedEmployeeName: FREE_LICENSE_EMPLOYEE,
    assignedDeviceId: undefined,
    objectName: item.objectName,
  }));
}

export function buildLicenseSeatsFromForm(
  keys: string[],
  quantity: number,
  seats: SoftwareLicenseSeat[],
  defaultObjectName: string,
  noKeyLabel = NO_KEY_PLACEHOLDER
): SoftwareLicenseSeat[] {
  const qty = Math.max(1, quantity);
  return Array.from({ length: qty }, (_, i) => {
    const prev = seats.find((s) => s.seatIndex === i) ?? seats[i];
    const rawKey = keys[i]?.trim();
    return {
      seatIndex: i,
      licenseKey: rawKey || noKeyLabel,
      assignedEmployeeName: prev?.assignedEmployeeName?.trim() || FREE_LICENSE_EMPLOYEE,
      assignedDeviceId:
        isLicenseSeatAssigned(prev ?? { seatIndex: i, assignedEmployeeName: FREE_LICENSE_EMPLOYEE })
          ? prev?.assignedDeviceId
          : undefined,
      objectName: prev?.objectName || defaultObjectName,
    };
  });
}

export function deriveSoftwareAssignmentSummary(
  seats: SoftwareLicenseSeat[],
  currentStatus: SoftwareItem['status']
): Pick<SoftwareItem, 'assignedEmployeeName' | 'assignedDeviceId' | 'status'> {
  const assigned = seats.filter(isLicenseSeatAssigned);
  const total = seats.length;

  let assignedEmployeeName: string;
  if (assigned.length === 0) {
    assignedEmployeeName = FREE_LICENSE_EMPLOYEE;
  } else if (
    assigned.length === total &&
    assigned.every((s) => s.assignedEmployeeName === CORPORATE_LICENSE_EMPLOYEE)
  ) {
    assignedEmployeeName = CORPORATE_LICENSE_EMPLOYEE;
  } else {
    assignedEmployeeName = `${assigned.length} из ${total} выдано`;
  }

  const assignedDeviceId =
    assigned.length === 1 && assigned[0].assignedDeviceId ? assigned[0].assignedDeviceId : undefined;

  let status: SoftwareItem['status'] = currentStatus;
  if (currentStatus !== 'Истекла' && currentStatus !== 'На списание' && currentStatus !== 'Списано') {
    status = assigned.length > 0 ? 'Активна' : 'Не активирована';
  }

  return { assignedEmployeeName, assignedDeviceId, status };
}

export function applySoftwareSeatPatch(
  item: SoftwareItem,
  seats: SoftwareLicenseSeat[]
): SoftwareItem {
  const summary = deriveSoftwareAssignmentSummary(seats, item.status);
  const keys = seats.map((s) => s.licenseKey?.trim() || NO_KEY_PLACEHOLDER);
  const qty = seats.length;
  return {
    ...item,
    ...summary,
    quantity: qty,
    licenseSeats: seats,
    licenseKeys: qty > 1 ? keys : undefined,
    licenseKey: keys[0] || item.licenseKey || NO_KEY_PLACEHOLDER,
  };
}

export function unassignLicenseSeat(
  seats: SoftwareLicenseSeat[],
  seatIndex: number
): SoftwareLicenseSeat[] {
  return seats.map((s) =>
    s.seatIndex === seatIndex
      ? {
          ...s,
          assignedEmployeeName: FREE_LICENSE_EMPLOYEE,
          assignedDeviceId: undefined,
        }
      : s
  );
}

export function findFirstAssignedSeatIndex(seats: SoftwareLicenseSeat[]): number | null {
  const found = seats.find(isLicenseSeatAssigned);
  return found != null ? found.seatIndex : null;
}

export function normalizeSoftwareLicenseKeys(
  keys: string[],
  quantity: number,
  noKeyLabel = NO_KEY_PLACEHOLDER
): { licenseKeys: string[]; licenseKey: string } {
  const qty = Math.max(1, quantity);
  const normalized = Array.from({ length: qty }, (_, i) => {
    const raw = keys[i]?.trim();
    return raw || noKeyLabel;
  });
  return {
    licenseKeys: qty > 1 ? normalized : normalized.slice(0, 1),
    licenseKey: normalized[0] || noKeyLabel,
  };
}

export function resizeLicenseKeyInputs(current: string[], quantity: number): string[] {
  const qty = Math.max(1, quantity);
  if (current.length === qty) return current;
  if (current.length < qty) {
    return [...current, ...Array.from({ length: qty - current.length }, () => '')];
  }
  return current.slice(0, qty);
}

export function formatLicenseSeatAssignmentLabel(
  item: SoftwareItem,
  t: (key: string) => string
): string {
  const seats = ensureLicenseSeats(item);
  const assigned = countAssignedLicenseSeats(seats);
  const total = seats.length;
  if (total <= 1) {
    const seat = seats[0];
    if (!isLicenseSeatAssigned(seat)) return t(FREE_LICENSE_EMPLOYEE);
    return seat.assignedEmployeeName || t(FREE_LICENSE_EMPLOYEE);
  }
  const free = total - assigned;
  if (assigned === 0) return `${free} ${t('свободно')} / ${total}`;
  if (free === 0) return `${assigned} ${t('выдано')} / ${total}`;
  return `${assigned} ${t('выдано')} · ${free} ${t('свободно')}`;
}

/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
// Simple robust hashing helper to avoid dependency bloat in static deployments
export function hashLicenseString(text: string): string {
  // Obfuscated salt reconstruction to prevent static reverse-engineering string searches
  const salt = [
    String.fromCharCode(85, 116, 107, 105, 110), // "Utkin"
    String.fromCharCode(76, 105, 99, 101, 110, 115, 101, 83, 97, 108, 116), // "LicenseSalt"
    "_",
    "assetorbit",
    "@",
    "icloud.com",
    "_",
    "SecuredTokenKey_2026"
  ].join('');
  
  const str = text + salt;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Robust cross-platform UTF-8 Base64 helpers for Cyrillic and spaces
 */
export function utf8ToBase64(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch {
    return btoa(str);
  }
}

export function base64ToUtf8(str: string): string {
  try {
    if (typeof window === 'undefined') {
      return Buffer.from(str, 'base64').toString('utf8');
    }
    const binary = atob(str);
    try {
      return decodeURIComponent(binary.split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch {
      return binary; // Fallback to standard decoded ASCII/binary if not URI-escaped UTF-8
    }
  } catch (e) {
    return '';
  }
}

/**
 * Get or generate hardware fingerprint
 * This captures basic system properties to detect cloning of localStorage database to different equipment/browser setup
 */
export function getHardwareFingerprint(): string {
  if (typeof window === 'undefined') return 'serverside-node-env';
  
  const width = window.screen?.width || 1920;
  const height = window.screen?.height || 1080;
  const userAgent = window.navigator?.userAgent || 'agent';
  const language = window.navigator?.language || 'en';
  const cores = window.navigator?.hardwareConcurrency || 4;
  
  const rawFingerprint = `${width}x${height}_${userAgent}_${language}_${cores}`;
  
  let hash = 0;
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

/**
 * Returns consistent simulated physical MAC address for this installation.
 * Automatically handles reset/reactivation if the database is cloned/copied to different hardware platform.
 */
export function getSystemMac(): string {
  if (typeof window === 'undefined') return '00:00:00:00:00:00';
  
  let storedMac = localStorage.getItem('it_system_mac');
  let storedFingerprint = localStorage.getItem('it_system_fingerprint');
  const currentFingerprint = getHardwareFingerprint();

  // CLONING/COPYING DETECTED: If database was copied to another device, fingerprints differ!
  // This automatically invalidates and clears the activation, forcing new activation.
  if (storedMac && storedFingerprint && storedFingerprint !== currentFingerprint) {
    localStorage.removeItem('it_license_key');
    localStorage.removeItem('it_system_mac');
    localStorage.removeItem('it_system_fingerprint');
    storedMac = null;
  }

  if (!storedMac) {
    // Generate an authentic lookalike virtual MAC address
    const prefix = 'D4:BC:CD'; // Vendor identifier prefix
    const hexChars = '0123456789ABCDEF';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0 && i > 0) suffix += ':';
      suffix += hexChars[Math.floor(Math.random() * 16)];
    }
    const newMac = `${prefix}:${suffix}`;
    localStorage.setItem('it_system_mac', newMac);
    localStorage.setItem('it_system_fingerprint', currentFingerprint);
    return newMac;
  }

  return storedMac;
}

/**
 * Returns beautifully formatted hardware installation Request Code.
 * Format: REQ-D4BC-CDXX-XXXX-CHKS (where CHKS is an Integrity verification checksum)
 */
export function getSystemRequestCode(): string {
  const mac = getSystemMac().replace(/:/g, '').toUpperCase();
  const checksum = hashLicenseString(`REQ_${mac}`).substring(0, 4);
  const m1 = mac.substring(0, 4);
  const m2 = mac.substring(4, 8);
  const m3 = mac.substring(8, 12);
  return `REQ-${m1}-${m2}-${m3}-${checksum}`;
}

/**
 * Decodes a Request Code back into a verified MAC address.
 * Acceptable formats: REQ-D4BC-CDXX-XXXX-CHKS or a simple raw 12-char MAC address.
 */
export function parseMacFromRequestCode(code: string): string | null {
  if (!code) return null;
  const clean = code.replace(/[^A-Z0-9]/ig, '').toUpperCase().trim();
  
  // Handled structured REQ code (REQ [3] + MAC [12] + CHECKSUM [4] = 19 chars)
  if (clean.startsWith('REQ') && clean.length === 19) {
    const macPart = clean.substring(3, 15);
    const checksum = clean.substring(15, 19);
    const expectedChecksum = hashLicenseString(`REQ_${macPart}`).substring(0, 4);
    if (checksum === expectedChecksum) {
      // Reconstitute standard format with colons
      return `${macPart.substring(0, 2)}:${macPart.substring(2, 4)}:${macPart.substring(4, 6)}:${macPart.substring(6, 8)}:${macPart.substring(8, 10)}:${macPart.substring(10, 12)}`;
    }
  }

  // Fallback pattern if raw MAC or raw 12-char hex string is input
  const potentialMac = code.replace(/[^A-F0-9]/ig, '').toUpperCase().trim();
  if (potentialMac.length === 12) {
    return `${potentialMac.substring(0, 2)}:${potentialMac.substring(2, 4)}:${potentialMac.substring(4, 6)}:${potentialMac.substring(6, 8)}:${potentialMac.substring(8, 10)}:${potentialMac.substring(10, 12)}`;
  }

  return null;
}

export interface DecodedKeyDetails {
  type: 'annual' | 'perpetual';
  expiresYear: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
}

/**
 * Validates a given key content against current hardware MAC address boundaries
 * Returns null if invalid, or the expiration/client metadata if successfully validated.
 */
export function validateKey(key: string): DecodedKeyDetails | null {
  if (!key) return null;
  const parts = key.trim().split('-');
  
  if (parts.length < 3 || parts[0].toUpperCase() !== 'UTKIN') {
    // Check if legacy mode key format: UTKIN-[YEAR]-[MAC]-[HASH] (parts length 4)
    if (parts.length === 4 && parts[0].toUpperCase() === 'UTKIN') {
      const expiresYearStr = parts[1];
      const macPart = parts[2].toUpperCase();
      const hash = parts[3].toUpperCase();

      const currentMac = getSystemMac().replace(/:/g, '').toUpperCase();
      const cleanMacPart = macPart.replace(/:/g, '').toUpperCase().trim();
      if (cleanMacPart !== currentMac) return null;

      const correctHash = hashLicenseString(`${expiresYearStr}_${macPart}`);
      if (hash !== correctHash) return null;

      const expiresYear = parseInt(expiresYearStr, 10);
      return {
        type: expiresYear === 9999 ? 'perpetual' : 'annual',
        expiresYear: isNaN(expiresYear) ? 2027 : expiresYear,
        clientName: '',
        clientEmail: '',
        clientPhone: ''
      };
    }
    return null;
  }

  // Extract metadata base64 format: UTKIN-[BASE64_DATA]-[HASH]
  // Join back using "-" in case URL-safe encoded Base64 used hyphens as part of its content
  const base64Part = parts.slice(1, parts.length - 1).join('-');
  const hashPart = parts[parts.length - 1].toUpperCase();

  // Validate integrity of payload
  const expectedHash = hashLicenseString(base64Part);
  if (hashPart !== expectedHash) {
    return null;
  }

  // Re-normalize URL-safe base64 characters back into standard base64 if needed
  const normalizedBase64 = base64Part.replace(/-/g, '+').replace(/_/g, '/');

  // Decode packed parameters
  const decodedPayload = base64ToUtf8(normalizedBase64);
  if (!decodedPayload) return null;

  const fields = decodedPayload.split('|');
  if (fields.length < 2) return null;

  const expiresYearStr = fields[0].trim();
  const macPart = fields[1].trim();
  const clientName = fields[2] || '';
  const clientEmail = fields[3] || '';
  const clientPhone = fields[4] || '';

  const currentMac = getSystemMac().replace(/:/g, '').toUpperCase().trim();
  const cleanMacPart = macPart.replace(/:/g, '').toUpperCase().trim();
  
  // CRITICAL SECURITY BOUNDARY: Verify target hardware MAC address binding
  if (cleanMacPart !== currentMac) {
    return null;
  }

  const expiresYear = parseInt(expiresYearStr, 10);
  if (isNaN(expiresYear)) return null;

  return {
    type: expiresYear === 9999 ? 'perpetual' : 'annual',
    expiresYear,
    clientName,
    clientEmail,
    clientPhone
  };
}

export interface LicenseStatus {
  isActivated: boolean;
  licenseType: 'trial' | 'annual' | 'perpetual';
  licenseKey: string | null;
  expiresYear: number | null;
  trialStartTimestamp: number;
  trialDaysLeft: number;
  trialTimeLeftFormatted?: string; // Ticking detailed timer format
  isExpired: boolean;
  macAddress: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  isTampered: boolean;         // Added to detect local state manipulation
  failedAttempts: number;      // Added to counter brute-force
  lockoutTimeLeft: number;     // Remaining lockout ms
}

const MIN_ATTEMPT_INTERVAL_MS = 2000;
const FAILURE_INTEGRITY_SUFFIX = '_license_failures_integrity';
const LOCKOUT_INTEGRITY_SUFFIX = '_license_lockout_integrity';
const ACTIVATION_INTEGRITY_SUFFIX = '_activated_license_integrity';

function verifySignedValue(value: string | null, sig: string | null, suffix: string): boolean {
  if (!value || !sig) return false;
  return hashLicenseString(value + suffix) === sig;
}

function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
}

function getVerifiedFailureCount(): number {
  const legacy = localStorage.getItem('it_license_failures');
  const legacySig = localStorage.getItem('it_license_failures_sig');
  if (legacy && !legacySig) {
    const legacyCount = parseInt(legacy, 10);
    if (!isNaN(legacyCount) && legacyCount > 0) {
      setFailureCount(legacyCount);
    }
  }

  const candidates = [0];
  const sources = [
    { v: localStorage.getItem('it_license_failures'), s: localStorage.getItem('it_license_failures_sig') },
    { v: localStorage.getItem('_ao_telemetry_lf'), s: localStorage.getItem('_ao_telemetry_lf_sig') },
    { v: getCookie('it_lf'), s: getCookie('it_lf_sig') },
  ];
  for (const { v, s } of sources) {
    if (v && verifySignedValue(v, s, FAILURE_INTEGRITY_SUFFIX)) {
      const n = parseInt(v, 10);
      if (!isNaN(n)) candidates.push(n);
    }
  }
  return Math.max(...candidates);
}

function setFailureCount(count: number): void {
  const str = count.toString();
  const sig = hashLicenseString(str + FAILURE_INTEGRITY_SUFFIX);
  localStorage.setItem('it_license_failures', str);
  localStorage.setItem('it_license_failures_sig', sig);
  localStorage.setItem('_ao_telemetry_lf', str);
  localStorage.setItem('_ao_telemetry_lf_sig', sig);
  setCookie('it_lf', str);
  setCookie('it_lf_sig', sig);
}

function getVerifiedLockoutUntil(): number {
  const legacy = localStorage.getItem('it_license_lockout_until');
  const legacySig = localStorage.getItem('it_license_lockout_sig');
  if (legacy && !legacySig) {
    const legacyUntil = parseInt(legacy, 10);
    if (!isNaN(legacyUntil) && legacyUntil > Date.now()) {
      setLockoutUntil(legacyUntil);
    }
  }

  const candidates = [0];
  const sources = [
    { v: localStorage.getItem('it_license_lockout_until'), s: localStorage.getItem('it_license_lockout_sig') },
    { v: localStorage.getItem('_ao_telemetry_lo'), s: localStorage.getItem('_ao_telemetry_lo_sig') },
    { v: getCookie('it_lo'), s: getCookie('it_lo_sig') },
  ];
  for (const { v, s } of sources) {
    if (v && verifySignedValue(v, s, LOCKOUT_INTEGRITY_SUFFIX)) {
      const n = parseInt(v, 10);
      if (!isNaN(n)) candidates.push(n);
    }
  }
  return Math.max(...candidates);
}

function setLockoutUntil(untilMs: number): void {
  const str = untilMs.toString();
  const sig = hashLicenseString(str + LOCKOUT_INTEGRITY_SUFFIX);
  localStorage.setItem('it_license_lockout_until', str);
  localStorage.setItem('it_license_lockout_sig', sig);
  localStorage.setItem('_ao_telemetry_lo', str);
  localStorage.setItem('_ao_telemetry_lo_sig', sig);
  setCookie('it_lo', str);
  setCookie('it_lo_sig', sig);
}

function clearLockoutState(): void {
  localStorage.removeItem('it_license_lockout_until');
  localStorage.removeItem('it_license_lockout_sig');
  localStorage.removeItem('_ao_telemetry_lo');
  localStorage.removeItem('_ao_telemetry_lo_sig');
  clearCookie('it_lo');
  clearCookie('it_lo_sig');
}

function getMinDelayTimeLeft(): number {
  if (typeof window === 'undefined') return 0;
  const last = parseInt(localStorage.getItem('it_license_last_attempt') || '0', 10);
  if (isNaN(last) || last <= 0) return 0;
  return Math.max(0, MIN_ATTEMPT_INTERVAL_MS - (Date.now() - last));
}

function setActivationSignature(key: string): void {
  const mac = getSystemMac().replace(/:/g, '').toUpperCase();
  const sig = hashLicenseString(key.trim() + mac + ACTIVATION_INTEGRITY_SUFFIX);
  localStorage.setItem('it_license_key_sig', sig);
}

function isActivationSignatureValid(key: string): boolean {
  const storedSig = localStorage.getItem('it_license_key_sig');
  if (!storedSig) return false;
  const mac = getSystemMac().replace(/:/g, '').toUpperCase();
  const expectedSig = hashLicenseString(key.trim() + mac + ACTIVATION_INTEGRITY_SUFFIX);
  return storedSig === expectedSig;
}

function syncSignedTrialField(
  start: unknown,
  sig: unknown,
  lsStart: string,
  lsSig: string
): void {
  if (typeof start !== 'string' || typeof sig !== 'string') return;
  const expected = hashLicenseString(start + '_secured_trial_integrity');
  if (sig === expected) {
    localStorage.setItem(lsStart, start);
    localStorage.setItem(lsSig, sig);
  }
}

/**
 * Safely restore license/trial state from server DB for the same physical installation.
 * Blocks cross-install license cloning when DB is copied to another machine.
 */
export function applyLicenseStateFromServer(data: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const currentFingerprint = getHardwareFingerprint();
  const localMac = localStorage.getItem('it_system_mac');
  const serverMac = typeof data.system_mac === 'string' ? data.system_mac.trim() : null;
  const serverFingerprint =
    typeof data.system_fingerprint === 'string' ? data.system_fingerprint.trim() : null;

  let crossInstall = Boolean(localMac && serverMac && localMac !== serverMac);

  if (!localMac) {
    if (serverMac && serverFingerprint && serverFingerprint === currentFingerprint) {
      localStorage.setItem('it_system_mac', serverMac);
      localStorage.setItem('it_system_fingerprint', currentFingerprint);
    } else {
      getSystemMac();
      crossInstall = true;
    }
  } else if (localStorage.getItem('it_system_fingerprint') !== currentFingerprint) {
    getSystemMac();
    crossInstall = true;
  } else {
    localStorage.setItem('it_system_fingerprint', currentFingerprint);
  }

  if (!crossInstall) {
    syncSignedTrialField(data.trial_start, data.trial_sig, 'it_trial_start', 'it_trial_sig');
    syncSignedTrialField(
      data._ao_telemetry_pt,
      data._ao_telemetry_sig,
      '_ao_telemetry_pt',
      '_ao_telemetry_sig'
    );

    if (typeof data.max_time === 'string' && data.max_time) {
      localStorage.setItem('it_max_time', data.max_time);
      localStorage.setItem('_ao_telemetry_mt', data.max_time);
    }

    if (typeof data.tamper_flag === 'string') {
      localStorage.setItem('it_tamper_flag', data.tamper_flag);
    }

    const serverKey = typeof data.license_key === 'string' ? data.license_key.trim() : '';
    if (serverKey) {
      const validation = validateKey(serverKey);
      if (validation) {
        localStorage.setItem('it_license_key', serverKey);
        if (typeof data.license_key_sig === 'string' && data.license_key_sig) {
          localStorage.setItem('it_license_key_sig', data.license_key_sig);
        }
        if (!isActivationSignatureValid(serverKey)) {
          localStorage.removeItem('it_license_key');
          localStorage.removeItem('it_license_key_sig');
        }
      }
    }
  }

  mergeLicenseSecurityFromServer(data);
}

/** Merge anti-bruteforce counters from server (take strictest / highest values). */
export function mergeLicenseSecurityFromServer(data: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  if (typeof data.license_failures === 'string' || typeof data.license_failures === 'number') {
    const serverCount = parseInt(String(data.license_failures), 10);
    if (!isNaN(serverCount) && serverCount > getVerifiedFailureCount()) {
      setFailureCount(serverCount);
    }
  }

  if (typeof data.license_lockout_until === 'string' || typeof data.license_lockout_until === 'number') {
    const serverLock = parseInt(String(data.license_lockout_until), 10);
    if (!isNaN(serverLock) && serverLock > getVerifiedLockoutUntil()) {
      setLockoutUntil(serverLock);
    }
  }

  if (typeof data.license_key_sig === 'string' && data.license_key_sig) {
    const key = localStorage.getItem('it_license_key');
    if (!key) return;
    const previousSig = localStorage.getItem('it_license_key_sig');
    localStorage.setItem('it_license_key_sig', data.license_key_sig);
    if (!isActivationSignatureValid(key)) {
      if (previousSig) {
        localStorage.setItem('it_license_key_sig', previousSig);
      } else {
        localStorage.removeItem('it_license_key_sig');
      }
    }
  }
}

export function getLicenseSecuritySnapshot(): Record<string, string> {
  return {
    license_failures: localStorage.getItem('it_license_failures') || '0',
    license_failures_sig: localStorage.getItem('it_license_failures_sig') || '',
    license_lockout_until: localStorage.getItem('it_license_lockout_until') || '',
    license_lockout_sig: localStorage.getItem('it_license_lockout_sig') || '',
    license_key_sig: localStorage.getItem('it_license_key_sig') || '',
    license_last_attempt: localStorage.getItem('it_license_last_attempt') || '',
  };
}

export function getLockoutTimeLeft(): number {
  if (typeof window === 'undefined') return 0;
  const lockoutUntil = getVerifiedLockoutUntil();
  if (lockoutUntil <= 0) return 0;
  const timeLeft = lockoutUntil - Date.now();
  if (timeLeft <= 0) {
    clearLockoutState();
    return 0;
  }
  return timeLeft;
}

// Cookie utilities for persistent multi-layered synchronization
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) {
    try {
      return decodeURIComponent(match[2]);
    } catch {
      return match[2];
    }
  }
  return null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const expires = "; expires=Fri, 31 Dec 2077 23:59:59 GMT";
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Strict";
}

export function getLicenseStatus(): LicenseStatus {
  const macAddress = getSystemMac();
  const failedAttempts = getVerifiedFailureCount();
  const lockoutTimeLeft = getLockoutTimeLeft();
  
  // Read all 3 decentralized synchronization nodes
  const storedKey = localStorage.getItem('it_license_key');
  const trialStartStr = localStorage.getItem('it_trial_start');
  const trialSig = localStorage.getItem('it_trial_sig');
  
  const trialStartHidden = localStorage.getItem('_ao_telemetry_pt');
  const trialSigHidden = localStorage.getItem('_ao_telemetry_sig');
  
  const trialStartCookie = getCookie('it_ts');
  const trialSigCookie = getCookie('it_sg');
  
  let isTampered = false;
  const now = Date.now();

  // Helper validation callback
  const isStartValid = (start: string | null, sig: string | null): boolean => {
    if (!start || !sig) return false;
    const expected = hashLicenseString(start + "_secured_trial_integrity");
    return sig === expected;
  };

  let resolvedStart: string | null = null;

  // Gather all valid active records
  const validRecords: string[] = [];
  if (isStartValid(trialStartStr, trialSig)) validRecords.push(trialStartStr!);
  if (isStartValid(trialStartHidden, trialSigHidden)) validRecords.push(trialStartHidden!);
  if (isStartValid(trialStartCookie, trialSigCookie)) validRecords.push(trialStartCookie!);

  if (validRecords.length > 0) {
    // Select earliest valid trial timestamp to prevent users extending trial by changing a single node
    const timestamps = validRecords.map(r => parseInt(r, 10)).filter(ts => !isNaN(ts));
    if (timestamps.length > 0) {
      resolvedStart = Math.min(...timestamps).toString();
    }
  }

  // Active healing: If someone deleted one of the nodes but another valid one exists, restore them!
  if (!resolvedStart) {
    resolvedStart = now.toString();
  }

  const expectedSig = hashLicenseString(resolvedStart + "_secured_trial_integrity");

  // Re-sync all nodes with the computed source-of-truth
  if (localStorage.getItem('it_trial_start') !== resolvedStart || localStorage.getItem('it_trial_sig') !== expectedSig) {
    localStorage.setItem('it_trial_start', resolvedStart);
    localStorage.setItem('it_trial_sig', expectedSig);
  }
  if (localStorage.getItem('_ao_telemetry_pt') !== resolvedStart || localStorage.getItem('_ao_telemetry_sig') !== expectedSig) {
    localStorage.setItem('_ao_telemetry_pt', resolvedStart);
    localStorage.setItem('_ao_telemetry_sig', expectedSig);
  }
  if (getCookie('it_ts') !== resolvedStart || getCookie('it_sg') !== expectedSig) {
    setCookie('it_ts', resolvedStart);
    setCookie('it_sg', expectedSig);
  }

  // -------------------------------------------------------------
  // Anti-Time Rollback Protection (Sticky Block)
  // -------------------------------------------------------------
  let maxTimeStr = localStorage.getItem('it_max_time');
  let maxTime = maxTimeStr ? parseInt(maxTimeStr, 10) : 0;
  if (isNaN(maxTime)) maxTime = 0;

  let maxTimeHiddenStr = localStorage.getItem('_ao_telemetry_mt');
  let maxTimeHidden = maxTimeHiddenStr ? parseInt(maxTimeHiddenStr, 10) : 0;
  if (isNaN(maxTimeHidden)) maxTimeHidden = 0;

  let maxTimeCookieStr = getCookie('it_mt');
  let maxTimeCookie = maxTimeCookieStr ? parseInt(maxTimeCookieStr, 10) : 0;
  if (isNaN(maxTimeCookie)) maxTimeCookie = 0;

  const highestObservedMax = Math.max(maxTime, maxTimeHidden, maxTimeCookie, resolvedStart ? parseInt(resolvedStart, 10) : 0);

  let tamperFlag = localStorage.getItem('it_tamper_flag') === 'true' || 
                    localStorage.getItem('_ao_telemetry_tf') === 'true' ||
                    getCookie('it_tf') === 'true';

  // If clock rolled back > 5 minutes relative to maximum recorded past timestamp, trigger persistent tamper lock!
  if (now < highestObservedMax - 300000) { 
    tamperFlag = true;
    localStorage.setItem('it_tamper_flag', 'true');
    localStorage.setItem('_ao_telemetry_tf', 'true');
    setCookie('it_tf', 'true');
  }

  // Track maximum system clock reached
  if (now > highestObservedMax) {
    const nextMax = now.toString();
    localStorage.setItem('it_max_time', nextMax);
    localStorage.setItem('_ao_telemetry_mt', nextMax);
    setCookie('it_mt', nextMax);
  }

  // Validate active tampering state
  if (trialStartStr && trialSig) {
    const mainSigExpected = hashLicenseString(trialStartStr + "_secured_trial_integrity");
    if (trialSig !== mainSigExpected) {
      tamperFlag = true;
      localStorage.setItem('it_tamper_flag', 'true');
    }
  }

  if (tamperFlag) {
    isTampered = true;
  }
  
  const trialStartTimestamp = parseInt(resolvedStart, 10) || now;
  const trialDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  const elapsedMs = now - trialStartTimestamp;
  const trialDaysLeft = Math.max(0, Math.ceil((trialDurationMs - elapsedMs) / (24 * 60 * 60 * 1000)));
  const trialIsExpired = elapsedMs > trialDurationMs || isTampered;

  const timeLeftMs = Math.max(0, trialDurationMs - elapsedMs);
  const dCount = Math.floor(timeLeftMs / (24 * 60 * 60 * 1000));
  const hCount = Math.floor((timeLeftMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mCount = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
  const sCount = Math.floor((timeLeftMs % (60 * 1000)) / 1000);
  const trialTimeLeftFormatted = `${dCount} д. ${hCount} ч. ${mCount} мин. ${sCount} сек.`;
  
  if (storedKey) {
    const validation = validateKey(storedKey);
    const sigValid = isActivationSignatureValid(storedKey);

    if (validation && sigValid) {
      const currentYear = new Date().getFullYear();
      const isKeyExpired = currentYear > validation.expiresYear;

      return {
        isActivated: !isKeyExpired,
        licenseType: validation.type,
        licenseKey: storedKey,
        expiresYear: validation.expiresYear,
        trialStartTimestamp,
        trialDaysLeft,
        trialTimeLeftFormatted,
        isExpired: isKeyExpired,
        macAddress,
        clientName: validation.clientName,
        clientEmail: validation.clientEmail,
        clientPhone: validation.clientPhone,
        isTampered,
        failedAttempts,
        lockoutTimeLeft
      };
    }

    localStorage.removeItem('it_license_key');
    localStorage.removeItem('it_license_key_sig');
    isTampered = true;
  }

  // Fallback to active 30-day trial status
  return {
    isActivated: false,
    licenseType: 'trial',
    licenseKey: null,
    expiresYear: null,
    trialStartTimestamp,
    trialDaysLeft,
    trialTimeLeftFormatted,
    isExpired: trialIsExpired,
    macAddress,
    isTampered,
    failedAttempts,
    lockoutTimeLeft
  };
}

export function activateSystem(key: string): boolean {
  if (getLockoutTimeLeft() > 0 || getMinDelayTimeLeft() > 0) {
    return false;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('it_license_last_attempt', Date.now().toString());
  }

  const result = validateKey(key);
  if (result) {
    const trimmed = key.trim();
    localStorage.setItem('it_license_key', trimmed);
    setActivationSignature(trimmed);
    setFailureCount(0);
    clearLockoutState();
    localStorage.removeItem('it_tamper_flag');
    localStorage.removeItem('_ao_telemetry_tf');
    setCookie('it_tf', '');
    return true;
  }

  const currentFailures = getVerifiedFailureCount() + 1;
  setFailureCount(currentFailures);

  let lockoutDuration = 0;
  if (currentFailures >= 12) {
    lockoutDuration = 24 * 60 * 60 * 1000;
  } else if (currentFailures >= 8) {
    lockoutDuration = 60 * 60 * 1000;
  } else if (currentFailures >= 5) {
    lockoutDuration = 10 * 60 * 1000;
  } else if (currentFailures >= 3) {
    lockoutDuration = 30 * 1000;
  }

  if (lockoutDuration > 0) {
    setLockoutUntil(Date.now() + lockoutDuration);
  }

  return false;
}

export function deactivateSystem(): void {
  localStorage.removeItem('it_license_key');
  localStorage.removeItem('it_license_key_sig');
}

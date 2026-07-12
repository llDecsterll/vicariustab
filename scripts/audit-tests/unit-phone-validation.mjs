/**
 * Unit tests: employee phone validation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidEmployeePhone,
  normalizeEmployeePhone,
} from '../../src/utils/phoneValidation.ts';

describe('phoneValidation', () => {
  it('accepts formatted international numbers', () => {
    assert.equal(isValidEmployeePhone('+7 (905) 123-45-67'), true);
    assert.equal(isValidEmployeePhone('89051234567'), true);
  });

  it('rejects letters and garbage text', () => {
    assert.equal(isValidEmployeePhone('not-a-phone'), false);
    assert.equal(isValidEmployeePhone('abc123'), false);
  });

  it('allows empty optional phone', () => {
    assert.equal(isValidEmployeePhone(''), true);
    assert.equal(isValidEmployeePhone(undefined), true);
  });

  it('normalizeEmployeePhone trims whitespace', () => {
    assert.equal(normalizeEmployeePhone('  +7 905  ').startsWith('+7'), true);
  });
});

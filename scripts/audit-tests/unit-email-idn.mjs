/**
 * Unit tests: internationalized (IDN) employee email handling
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  displayEmailAddress,
  mailtoHrefForEmail,
  normalizeEmailForStorage,
  validateEmployeeEmailField,
  employeeEmailMatchesSearch,
} from '../../src/utils/emailIdn.ts';

describe('emailIdn', () => {
  it('stores Unicode domain as Punycode and displays Unicode', () => {
    const input = 'adg@пчя.рф';
    const stored = normalizeEmailForStorage(input);
    assert.match(stored, /^adg@xn--/);
    assert.equal(displayEmailAddress(stored), 'adg@пчя.рф');
    assert.equal(displayEmailAddress(input), 'adg@пчя.рф');
  });

  it('leaves ASCII domains unchanged', () => {
    const input = 'user@example.com';
    assert.equal(normalizeEmailForStorage(input), 'user@example.com');
    assert.equal(displayEmailAddress(input), 'user@example.com');
  });

  it('builds mailto with Punycode domain', () => {
    const href = mailtoHrefForEmail('adg@пчя.рф');
    assert.equal(href, 'mailto:adg@xn--o1aqy.xn--p1ai');
  });

  it('does not alter local part casing', () => {
    const input = 'User.Name+tag@пчя.рф';
    const stored = normalizeEmailForStorage(input);
    assert.ok(stored.startsWith('User.Name+tag@'));
    assert.equal(displayEmailAddress(stored), 'User.Name+tag@пчя.рф');
  });

  it('handles invalid values without throwing', () => {
    assert.equal(displayEmailAddress('not-an-email'), 'not-an-email');
    assert.equal(normalizeEmailForStorage('  '), '');
    assert.equal(validateEmployeeEmailField(''), null);
    assert.ok(validateEmployeeEmailField('bad@'));
  });

  it('matches search by Unicode or Punycode form', () => {
    const stored = normalizeEmailForStorage('adg@пчя.рф');
    assert.equal(employeeEmailMatchesSearch(stored, 'пчя'), true);
    assert.equal(employeeEmailMatchesSearch(stored, 'xn--'), true);
    assert.equal(employeeEmailMatchesSearch(stored, 'adg@'), true);
  });
});

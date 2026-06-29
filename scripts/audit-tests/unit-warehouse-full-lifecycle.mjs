/**
 * Full warehouse lifecycle: receipt 100 → split 50 → deploy 50 → split 25 → write-off 25 → stock 25
 * All warehouse groups and every device subtype.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RECEIPT_DEVICE_TYPES,
  runWarehouseBatchScenario,
  runWarehouseExtendedScenario,
} from '../../src/utils/warehouseLifecycleEngine.ts';

const BATCH_QTY = 100;

const scenarios = [];
let typeIndex = 0;
for (const [type, deviceTypes] of Object.entries(RECEIPT_DEVICE_TYPES)) {
  for (const deviceType of deviceTypes) {
    typeIndex += 1;
    scenarios.push({
      type,
      deviceType,
      label: `${type} ${deviceType}`,
      invNumber: `LC-${String(typeIndex).padStart(3, '0')}`,
      batchQty: BATCH_QTY,
    });
  }
}

describe('warehouse full lifecycle (100 units per type)', () => {
  for (const config of scenarios) {
    it(`${config.type} / ${config.deviceType}: receipt → split → deploy → write-off`, () => {
      const result = runWarehouseBatchScenario(config);
      if (!result.ok) {
        assert.fail(
          `[${config.label}] ${result.error ?? 'unknown error'}`
        );
      }
      assert.equal(result.ok, true);
    });
  }

  it(`covers all ${scenarios.length} device subtypes`, () => {
    assert.equal(scenarios.length, 31);
  });
});

const extendedScenarios = scenarios.map((s) => ({
  ...s,
  invNumber: `EX-${s.invNumber.replace(/^LC-/, '')}`,
  batchQty: 8,
}));

describe('warehouse extended lifecycle (merge, return, cancel pending)', () => {
  for (const config of extendedScenarios) {
    it(`${config.type} / ${config.deviceType}: merge → deploy → return → cancel → write-off`, () => {
      const result = runWarehouseExtendedScenario(config);
      if (!result.ok) {
        assert.fail(`[${config.label}] ${result.error ?? 'unknown error'}`);
      }
      assert.equal(result.ok, true);
    });
  }
});

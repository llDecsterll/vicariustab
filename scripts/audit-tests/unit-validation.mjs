/**
 * Unit tests: server workspace validation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWorkspaceInventory,
  validateAdminUsersRemain,
  validateWorkspacePayload,
} from '../../server/workspaceValidation.ts';
import { getSoftwareWarehouseInv } from '../../src/utils/equipmentFields.ts';

describe('workspaceValidation', () => {
  it('rejects exact duplicate inventory numbers within same registry', () => {
    const err = validateWorkspaceInventory({
      warehouseItems: [],
      computers: [
        { id: 'c1', inventoryNumber: 'PC-DUP' },
        { id: 'c2', inventoryNumber: 'PC-DUP' },
      ],
      networkDevices: [],
      softwareItems: [],
    });
    assert.ok(err?.includes('Дублирующ'));
  });

  it('allows warehouse base inv with matching stock computer card (qty=1 receipt)', () => {
    const err = validateWorkspaceInventory({
      warehouseItems: [{ id: 'wh-1', inventoryNumber: 'ST-0070' }],
      computers: [{ id: 'comp-1', inventoryNumber: 'ST-0070' }],
      networkDevices: [],
      softwareItems: [],
    });
    assert.equal(err, null);
  });

  it('allows computer batch suffix when warehouse base exists', () => {
    const err = validateWorkspaceInventory({
      warehouseItems: [{ id: 'w1', inventoryNumber: 'ST-0061' }],
      computers: [{ id: 'c1', inventoryNumber: 'ST-0061-1' }],
      networkDevices: [],
      softwareItems: [],
    });
    assert.equal(err, null);
  });

  it('uses SW- software warehouse inv convention', () => {
    const softId = 'abcdefghijklmnop';
    const whInv = getSoftwareWarehouseInv(softId);
    assert.equal(whInv, 'SW-IJKLMNOP');
    const err = validateWorkspaceInventory({
      warehouseItems: [{ id: 'w1', inventoryNumber: whInv }],
      computers: [],
      networkDevices: [],
      softwareItems: [{ id: softId, licenseKey: '', name: 'Office' }],
    });
    assert.equal(err, null);
  });

  it('requires at least one active admin', () => {
    const err = validateAdminUsersRemain({
      users: [{ id: 'u1', role: 'Viewer', isBlocked: false }],
    });
    assert.ok(err?.includes('администратор'));
  });

  it('validateWorkspacePayload combines checks', () => {
    const err = validateWorkspacePayload({
      users: [{ id: 'u1', role: 'Admin' }],
      warehouseItems: [],
      computers: [],
      networkDevices: [],
      softwareItems: [],
    });
    assert.equal(err, null);
  });
});

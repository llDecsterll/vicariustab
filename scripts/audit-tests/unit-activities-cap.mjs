import assert from 'node:assert/strict';
import {
  ACTIVITIES_MAX,
  capActivitiesList,
  capActivitiesInPayload,
} from '../../src/utils/activitiesCap.ts';

assert.equal(ACTIVITIES_MAX, 500);

const short = [{ id: '1' }, { id: '2' }];
assert.deepEqual(capActivitiesList(short), short);

const long = Array.from({ length: ACTIVITIES_MAX + 50 }, (_, i) => ({ id: String(i) }));
const capped = capActivitiesList(long);
assert.equal(capped.length, ACTIVITIES_MAX);
assert.equal(capped[0].id, '0');
assert.equal(capped[ACTIVITIES_MAX - 1].id, String(ACTIVITIES_MAX - 1));

const payload = capActivitiesInPayload({ activities: long, computers: [] });
assert.equal(payload.activities.length, ACTIVITIES_MAX);
assert.deepEqual(payload.computers, []);

console.log('unit-activities-cap: OK');

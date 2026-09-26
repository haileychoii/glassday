/** Persistence regression checks. Run: npm run test:storage (Node 24+).
 * Uses an isolated in-memory Storage, never the user's browser data.
 * 한국어: 중복 이벤트·일괄 복원·저장 실패·세션 격리를 실제 저장 모듈로 검증한다.
 */
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  patchLocalStorageEvents, GLASSDAY_STORAGE_EVENT, GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY,
  batchGlassdayStorageChanges, applyGlassdayStorageSnapshot, shouldSyncStorageChange,
} from '../src/lib/glassdayStorage.ts';

class MemoryStorage {
  getItem(key) { return Object.hasOwn(this, key) ? this[key] : null; }
  setItem(key, value) {
    if (key === 'glassday.test.quota') throw new Error('QuotaExceededError');
    this[key] = String(value);
  }
  removeItem(key) { delete this[key]; }
  clear() { Object.keys(this).forEach(key => delete this[key]); }
}
globalThis.Storage = MemoryStorage;
globalThis.window = Object.assign(new EventTarget(), {
  localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage(),
});
globalThis.localStorage = window.localStorage;
patchLocalStorageEvents();
const events = [];
window.addEventListener(GLASSDAY_STORAGE_EVENT, event => events.push(event.detail));
beforeEach(() => { localStorage.clear(); events.length = 0; });

test('identical writes and absent deletes do not notify or advance sync timestamp', () => {
  localStorage.setItem('glassday.memo.notes.v2', '[]');
  const stamp = localStorage.getItem(GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY);
  localStorage.setItem('glassday.memo.notes.v2', '[]');
  localStorage.removeItem('glassday.memo.absent');
  assert.equal(events.length, 1);
  assert.equal(localStorage.getItem(GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY), stamp);
});
test('sessionStorage never notifies local widgets or changes the local sync marker', () => {
  window.sessionStorage.setItem('glassday.memo.notes.v2', 'session-only');
  window.sessionStorage.clear();
  assert.equal(events.length, 0);
  assert.equal(localStorage.getItem(GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY), null);
});
test('nested batches publish each changed key once', () => {
  batchGlassdayStorageChanges(() => {
    localStorage.setItem('glassday.memo.notes.v2', '[]');
    batchGlassdayStorageChanges(() => {
      localStorage.setItem('glassday.memo.notes.v2', '[1]');
      localStorage.setItem('glassday.study.tasks.v1', '[]');
    });
  });
  assert.deepEqual(events, [{ type: 'bulk', keys: ['glassday.memo.notes.v2', 'glassday.study.tasks.v1'] }]);
});
test('a failed batch still publishes successful writes and unlocks subsequent events', () => {
  assert.throws(() => batchGlassdayStorageChanges(() => {
    localStorage.setItem('glassday.memo.notes.v2', '[]');
    localStorage.setItem('glassday.test.quota', 'x');
  }), /QuotaExceeded/);
  localStorage.setItem('glassday.study.tasks.v1', '[]');
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'bulk');
  assert.equal(events[1].type, 'set');
});
test('snapshot restores data once while preserving the local layout and theme', () => {
  localStorage.setItem('glassday.theme', 'pixel-desk');
  events.length = 0;
  applyGlassdayStorageSnapshot({ app: 'Glassday', version: 3,
    exportedAt: '2026-09-26T00:00:00Z', data: {
      'glassday.memo.notes.v2': '[1]', 'glassday.study.tasks.v1': '[2]',
      'glassday.theme': 'aurora',
    } });
  assert.equal(localStorage.getItem('glassday.theme'), 'pixel-desk');
  assert.equal(events.length, 1);
  assert.equal(shouldSyncStorageChange(events[0]), true);
});
test('UI and sync-marker events cannot schedule recursive uploads', () => {
  for (const key of ['glassday.theme', 'glassday.dashboard.tabs.v1', GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY]) {
    assert.equal(shouldSyncStorageChange({ type: 'set', key }), false);
  }
  assert.equal(shouldSyncStorageChange({ type: 'bulk', keys: ['glassday.dashboard.tabs.v1'] }), false);
  assert.equal(shouldSyncStorageChange({ type: 'remove', key: 'glassday.memo.notes.v2' }), true);
});

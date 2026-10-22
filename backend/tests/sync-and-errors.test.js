import assert from 'node:assert';
import { externalApi, decodeHtmlEntities, normalizeCoordinate } from '../src/services/externalApi.service.js';
import { SyncService } from '../src/services/sync.service.js';
import { ExternalServiceError, ExternalServiceTimeoutError, MethodNotAllowedError } from '../src/utils/errors.util.js';

async function runUnitTests() {
  console.log('🧪 Starting External Client & Sync Unit/Edge Tests...\n');
  let passed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}:`, err.message);
      process.exit(1);
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}:`, err.message);
      process.exit(1);
    }
  }

  // 1. HTML entity decoding
  test('HTML entity decoding decodes quotes and special characters', () => {
    const raw = 'Madinaty &#8220;All season&#8221; &amp; &#8216;test&#8217;';
    const decoded = decodeHtmlEntities(raw);
    assert.strictEqual(decoded, 'Madinaty “All season” & ‘test’');
  });

  // 2. Coordinate normalization
  test('Coordinate normalization returns floats or null for empty values', () => {
    assert.strictEqual(normalizeCoordinate(''), null);
    assert.strictEqual(normalizeCoordinate(null), null);
    assert.strictEqual(normalizeCoordinate(undefined), null);
    assert.strictEqual(normalizeCoordinate('abc'), null);
    assert.strictEqual(normalizeCoordinate('30.0249275'), 30.0249275);
    assert.strictEqual(normalizeCoordinate(31.482889), 31.482889);
  });

  // 3. Error mapping classes
  test('Error classes set proper HTTP status codes and codes', () => {
    const timeoutErr = new ExternalServiceTimeoutError('Timed out');
    assert.strictEqual(timeoutErr.statusCode, 504);
    assert.strictEqual(timeoutErr.code, 'EXTERNAL_SERVICE_TIMEOUT');

    const serviceErr = new ExternalServiceError('Down');
    assert.strictEqual(serviceErr.statusCode, 502);
    assert.strictEqual(serviceErr.code, 'EXTERNAL_SERVICE_ERROR');

    const methodNotAllowed = new MethodNotAllowedError('Not allowed');
    assert.strictEqual(methodNotAllowed.statusCode, 405);
    assert.strictEqual(methodNotAllowed.code, 'METHOD_NOT_ALLOWED');
  });

  // 4. Overlapping sync lock
  await asyncTest('SyncService in-process lock prevents concurrent runs', async () => {
    // Run two syncs in parallel; one should either succeed or throw ConflictError
    const promise1 = SyncService.syncAreasAndStores();
    let promise2Error = null;
    try {
      await SyncService.syncAreasAndStores();
    } catch (err) {
      promise2Error = err;
    }
    await promise1;
    assert(promise2Error !== null, 'Concurrent sync attempt was blocked by lock');
    assert.strictEqual(promise2Error.statusCode, 409);
  });

  console.log(`\n=======================================`);
  console.log(`🏁 All ${passed} Unit/Edge Tests Passed`);
  console.log(`=======================================\n`);
  process.exit(0);
}


runUnitTests().catch((e) => {
  console.error(e);
  process.exit(1);
});

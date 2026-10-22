/**
 * Verification Test Script for Roxy Store System Backend
 * Tests:
 * 1. Health check
 * 2. Login Super Admin (OPERATION_MANAGER)
 * 3. Profile & Permissions (/auth/me)
 * 4. List Areas & Stores
 * 5. Create Area Manager
 * 6. Create Store Manager
 * 7. Create Store User
 * 8. Permission Matrix Enforcement:
 *    - Area Manager CANNOT create Operation Manager (403)
 *    - Store Manager CANNOT create Store Manager (403)
 * 9. Token Refresh & Rotation
 * 10. User status toggle & Soft delete
 */

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

async function runTests() {
  console.log('🚀 Starting End-to-End API Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('--- 1. Health Check ---');
    const health = await request('/health');
    assert(health.status === 200 && health.data?.data?.status === 'healthy', 'Health check is operational');

    // 2. Login Super Admin
    console.log('\n--- 2. Super Admin Login ---');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@roxy.com',
        password: 'Admin@Password123',
      }),
    });
    assert(adminLogin.status === 200, 'Super admin login status 200');
    assert(adminLogin.data?.data?.user?.role === 'OPERATION_MANAGER', 'User role is OPERATION_MANAGER');
    assert(adminLogin.data?.data?.accessToken, 'Access token returned');
    assert(adminLogin.data?.data?.allowedPages?.length > 0, 'Allowed pages returned');

    const adminToken = adminLogin.data?.data?.accessToken;
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}` };

    // 3. Auth Me
    console.log('\n--- 3. /auth/me Profile ---');
    const me = await request('/auth/me', { headers: adminAuthHeader });
    assert(me.status === 200, 'Profile fetched successfully');
    assert(me.data?.data?.user?.email === 'admin@roxy.com', 'Email matches profile');
    assert(me.data?.data?.permissions?.includes('USER_CREATE'), 'Has USER_CREATE permission');

    // 4. Areas & Stores
    console.log('\n--- 4. List Areas & Stores ---');
    const areas = await request('/areas', { headers: adminAuthHeader });
    assert(areas.status === 200 && areas.data?.data?.length > 0, 'Areas retrieved');

    const stores = await request('/stores', { headers: adminAuthHeader });
    assert(stores.status === 200 && stores.data?.data?.length > 0, 'Stores retrieved');
    const targetStore = stores.data.data[0];
    assert(targetStore.externalId !== undefined, 'Store includes externalId');

    const targetArea = areas.data.data.find((a) => a.id === targetStore.areaId) || areas.data.data[0];
    assert(targetArea.externalId !== undefined, 'Area includes externalId');
    console.log(`     Using Area: "${targetArea.name}" (${targetArea.id}, ext: ${targetArea.externalId})`);
    console.log(`     Using Store: "${targetStore.name}" (${targetStore.id}, ext: ${targetStore.externalId})`);


    // 4.1 Local CRUD Disallowed (405 METHOD_NOT_ALLOWED)
    console.log('\n--- 4.1 Local CRUD Disallowed (405) ---');
    const postArea405 = await request('/areas', {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({ name: 'Test Area' }),
    });
    assert(postArea405.status === 405, 'POST /areas returns 405 METHOD_NOT_ALLOWED');

    const patchArea405 = await request(`/areas/${targetArea.id}`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({ name: 'Updated Area' }),
    });
    assert(patchArea405.status === 405, 'PATCH /areas/:id returns 405 METHOD_NOT_ALLOWED');

    const deleteArea405 = await request(`/areas/${targetArea.id}`, {
      method: 'DELETE',
      headers: adminAuthHeader,
    });
    assert(deleteArea405.status === 405, 'DELETE /areas/:id returns 405 METHOD_NOT_ALLOWED');

    const postStore405 = await request('/stores', {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({ name: 'Test Store', areaId: targetArea.id }),
    });
    assert(postStore405.status === 405, 'POST /stores returns 405 METHOD_NOT_ALLOWED');

    const patchStore405 = await request(`/stores/${targetStore.id}`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({ name: 'Updated Store' }),
    });
    assert(patchStore405.status === 405, 'PATCH /stores/:id returns 405 METHOD_NOT_ALLOWED');

    const deleteStore405 = await request(`/stores/${targetStore.id}`, {
      method: 'DELETE',
      headers: adminAuthHeader,
    });
    assert(deleteStore405.status === 405, 'DELETE /stores/:id returns 405 METHOD_NOT_ALLOWED');


    // 5. Create Area Manager
    console.log('\n--- 5. Create Area Manager ---');
    const areaManagerEmail = `area_mgr_${Date.now()}@roxy.com`;
    const createAreaMgr = await request('/users', {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        name: 'Ahmed Area Manager',
        email: areaManagerEmail,
        password: 'Password@123',
        role: 'AREA_MANAGER',
        areaId: targetArea.id,
      }),
    });
    assert(createAreaMgr.status === 201, 'Area Manager created (status 201)');
    const areaMgrUser = createAreaMgr.data?.data;

    // 6. Login as Area Manager
    console.log('\n--- 6. Login as Area Manager ---');
    const areaMgrLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: areaManagerEmail,
        password: 'Password@123',
      }),
    });
    assert(areaMgrLogin.status === 200, 'Area Manager login status 200');
    const areaMgrToken = areaMgrLogin.data?.data?.accessToken;
    const areaMgrAuthHeader = { Authorization: `Bearer ${areaMgrToken}` };

    // 7. Permission Matrix Tests for Area Manager
    console.log('\n--- 7. Permission Matrix: Area Manager Scoping ---');
    // Try to create an OPERATION_MANAGER (MUST FAIL 403)
    const unauthorizedOpMgr = await request('/users', {
      method: 'POST',
      headers: areaMgrAuthHeader,
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: `hacker_${Date.now()}@roxy.com`,
        password: 'Password@123',
        role: 'OPERATION_MANAGER',
      }),
    });
    assert(unauthorizedOpMgr.status === 403, 'Area Manager CANNOT create OPERATION_MANAGER (403 Forbidden)');

    // Area Manager creates STORE_MANAGER in their own area (MUST SUCCEED)
    const storeMgrEmail = `store_mgr_${Date.now()}@roxy.com`;
    const createStoreMgr = await request('/users', {
      method: 'POST',
      headers: areaMgrAuthHeader,
      body: JSON.stringify({
        name: 'Mohamed Store Manager',
        email: storeMgrEmail,
        password: 'Password@123',
        role: 'STORE_MANAGER',
        storeId: targetStore.id,
      }),
    });
    assert(createStoreMgr.status === 201, 'Area Manager CAN create STORE_MANAGER in own area (201)');
    const storeMgrUser = createStoreMgr.data?.data;

    // 8. Store Manager Login & Tests
    console.log('\n--- 8. Store Manager Scoping & Store User Creation ---');
    const storeMgrLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: storeMgrEmail,
        password: 'Password@123',
      }),
    });
    assert(storeMgrLogin.status === 200, 'Store Manager login status 200');
    const storeMgrToken = storeMgrLogin.data?.data?.accessToken;
    const storeMgrAuthHeader = { Authorization: `Bearer ${storeMgrToken}` };

    // Store Manager tries to create another STORE_MANAGER (MUST FAIL 403)
    const unauthorizedStoreMgr = await request('/users', {
      method: 'POST',
      headers: storeMgrAuthHeader,
      body: JSON.stringify({
        name: 'Another Store Manager',
        email: `sm_dupe_${Date.now()}@roxy.com`,
        password: 'Password@123',
        role: 'STORE_MANAGER',
        storeId: targetStore.id,
      }),
    });
    assert(unauthorizedStoreMgr.status === 403, 'Store Manager CANNOT create another STORE_MANAGER (403)');

    // Store Manager creates STORE_USER in their store (MUST SUCCEED)
    const storeUserEmail = `store_user_${Date.now()}@roxy.com`;
    const createStoreUser = await request('/users', {
      method: 'POST',
      headers: storeMgrAuthHeader,
      body: JSON.stringify({
        name: 'Sayed Store Employee',
        email: storeUserEmail,
        password: 'Password@123',
        role: 'STORE_USER',
        storeId: targetStore.id,
      }),
    });
    assert(createStoreUser.status === 201, 'Store Manager CAN create STORE_USER in own store (201)');
    const storeUser = createStoreUser.data?.data;

    // 9. List Users with Scope Filtering
    console.log('\n--- 9. Scoped User Listing ---');
    // Store Manager lists users -> should ONLY see STORE_USER in their store
    const storeMgrList = await request('/users', { headers: storeMgrAuthHeader });
    assert(storeMgrList.status === 200, 'Store Manager can list users');
    const allAreStoreUsers = storeMgrList.data?.data?.every((u) => u.role === 'STORE_USER' && u.storeId === targetStore.id);
    assert(allAreStoreUsers, 'Store Manager only sees STORE_USER within their store');

    // 10. Status toggle & Invalidation
    console.log('\n--- 10. User Status Toggle & Deactivation ---');
    const deactiveRes = await request(`/users/${storeUser.id}/status`, {
      method: 'PATCH',
      headers: storeMgrAuthHeader,
      body: JSON.stringify({ isActive: false }),
    });
    assert(deactiveRes.status === 200 && deactiveRes.data?.data?.isActive === false, 'Store User deactivated');

    // Attempt login with deactivated user (MUST FAIL 401)
    const deactiveLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: storeUserEmail,
        password: 'Password@123',
      }),
    });
    assert(deactiveLogin.status === 401, 'Deactivated user cannot log in (401)');

    // 11. Soft Delete
    console.log('\n--- 11. Soft Delete User ---');
    const deleteRes = await request(`/users/${storeUser.id}`, {
      method: 'DELETE',
      headers: storeMgrAuthHeader,
    });
    assert(deleteRes.status === 200, 'Store User soft deleted successfully');

    // 12. Brute Force Protection Test
    console.log('\n--- 12. Brute Force Protection (5 bad attempts) ---');
    let locked = false;
    for (let i = 0; i < 5; i++) {
      const failAttempt = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: storeMgrEmail,
          password: 'WrongPassword!',
        }),
      });
      if (failAttempt.status === 423) {
        locked = true;
        break;
      }
    }
    // Attempt 6 should trigger 423 ACCOUNT_LOCKED
    const checkLock = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: storeMgrEmail,
        password: 'WrongPassword!',
      }),
    });
    assert(checkLock.status === 423, 'Account is locked after consecutive failed attempts (423 ACCOUNT_LOCKED)');

    // 13. Profile /auth/me includes area and store with externalId
    console.log('\n--- 13. Profile /auth/me External Linkage ---');
    const areaMgrProfile = await request('/auth/me', { headers: areaMgrAuthHeader });
    assert(areaMgrProfile.status === 200, 'Area Manager profile fetched');
    assert(areaMgrProfile.data?.data?.user?.area?.id === targetArea.id, 'Profile includes area object');
    assert(areaMgrProfile.data?.data?.user?.area?.externalId !== undefined, 'Profile includes area externalId');

    // 14. User Creation Inactive Mirror Validation
    console.log('\n--- 14. Inactive Area/Store User Creation Validation ---');
    // Set a dummy inactive area directly in DB or test non-existent UUID
    const nonExistentAreaRes = await request('/users', {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        name: 'Invalid Area User',
        email: `invalid_area_${Date.now()}@roxy.com`,
        password: 'Password@123',
        role: 'AREA_MANAGER',
        areaId: '00000000-0000-0000-0000-000000000000',
      }),
    });
    assert(nonExistentAreaRes.status === 400, 'Creating user with non-existent area rejected with 400');

    // 15. Areas & Stores Sync (POST /sync/areas-stores)
    console.log('\n--- 15. Manual Areas & Stores Sync ---');
    // Area Manager cannot trigger sync (403 Forbidden)
    const unauthorizedSync = await request('/sync/areas-stores', {
      method: 'POST',
      headers: areaMgrAuthHeader,
    });
    assert(unauthorizedSync.status === 403, 'Area Manager CANNOT trigger sync (403 Forbidden)');

    // Operation Manager triggers sync (200 OK)
    const opMgrSync = await request('/sync/areas-stores', {
      method: 'POST',
      headers: adminAuthHeader,
    });
    assert(opMgrSync.status === 200, 'Operation Manager CAN trigger sync (200 OK)');
    assert(opMgrSync.data?.data?.syncedAt, 'Sync returns syncedAt timestamp');

    console.log('\n=======================================');

    console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('=======================================\n');
  } catch (error) {
    console.error('Fatal error during test execution:', error);
  }
}

runTests();

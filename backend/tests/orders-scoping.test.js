import assert from 'node:assert';
import { externalApi } from '../src/services/externalApi.service.js';
import { OrdersService } from '../src/modules/orders/orders.service.js';
import { Roles } from '../src/config/roles.js';
import { query } from '../src/config/db.js';
import { NotFoundError } from '../src/utils/errors.util.js';

async function runOrdersScopingTests() {
  console.log('🧪 Starting Orders Module Scoping & Fail-Closed Tests...\n');
  let passed = 0;

  function check(name, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      process.exit(1);
    }
  }

  // 1. Fetch real store and area records from DB mirror
  const stores = await query(`
    SELECT s.id, s.name, s.external_id, s.area_id, a.name as area_name, a.external_id as area_external_id
    FROM stores s
    JOIN areas a ON s.area_id = a.id
    WHERE s.is_active = 1 AND a.is_active = 1
  `);

  assert(stores.length >= 2, 'Need at least 2 stores in mirror for testing');

  const storeA = stores[0]; // e.g. branch in Area A
  const storeB = stores.find((s) => s.area_id !== storeA.area_id) || stores[1]; // branch in Area B (or another branch)

  console.log(`Using Store A: "${storeA.name}" (ext: ${storeA.external_id}) in Area "${storeA.area_name}"`);
  console.log(`Using Store B: "${storeB.name}" (ext: ${storeB.external_id}) in Area "${storeB.area_name}"\n`);

  // Define Mock Orders
  const mockOrdersList = [
    {
      id: 101,
      number: 'ORD-101',
      status: 'wc-completed',
      date_created: '2026-10-21T10:00:00Z',
      total: '150.00',
      currency: 'EGP',
      branch_id: storeA.external_id,
      billing: {
        first_name: 'Ahmed',
        last_name: 'Customer',
        email: 'ahmed@customer.com',
        phone: '01012345678',
        address_1: '123 Main St',
        city: 'Cairo',
      },
      line_items: [{ id: 1, name: 'Shawerma Beef', quantity: 2, price: '75.00', total: '150.00' }],
    },
    {
      id: 102,
      number: 'ORD-102',
      status: 'processing',
      date_created: '2026-10-21T11:00:00Z',
      total: '200.00',
      currency: 'EGP',
      branch_id: storeB.external_id,
      billing: {
        first_name: 'Mona',
        last_name: 'Client',
        email: 'mona@customer.com',
        phone: '01087654321',
        address_1: '456 Side St',
        city: 'Cairo',
      },
      line_items: [{ id: 2, name: 'Shawerma Chicken', quantity: 4, price: '50.00', total: '200.00' }],
    },
    {
      id: 103,
      number: 'ORD-103',
      status: 'wc-pending',
      date_created: '2026-10-21T12:00:00Z',
      total: '90.00',
      currency: 'EGP',
      // MISSING branch_id! (Field missing from external system)
      billing: {
        first_name: 'Unmapped',
        last_name: 'Order',
        email: 'ghost@customer.com',
        phone: '01000000000',
      },
      line_items: [{ id: 3, name: 'Fries', quantity: 3, price: '30.00', total: '90.00' }],
    },
    {
      id: 104,
      number: 'ORD-104',
      status: 'on-hold',
      date_created: '2026-10-21T13:00:00Z',
      total: '300.00',
      currency: 'EGP',
      branch_id: storeA.external_id,
      billing: {
        first_name: 'Kareem',
        last_name: 'User',
        email: 'kareem@customer.com',
        phone: '01112223334',
      },
      line_items: [{ id: 4, name: 'Family Combo', quantity: 1, price: '300.00', total: '300.00' }],
    },
  ];

  // Mock externalApi.getAdminOrders and getOrderById
  externalApi.getAdminOrders = async () => {
    return { status: 200, ok: true, data: mockOrdersList };
  };

  externalApi.getOrderById = async (id) => {
    const found = mockOrdersList.find((o) => String(o.id) === String(id));
    if (!found) {
      throw new NotFoundError('Order not found externally');
    }
    return { status: 200, ok: true, data: found };
  };

  // Actors
  const opManager = {
    id: 'op-mgr-uuid',
    role: Roles.OPERATION_MANAGER,
    areaId: null,
    storeId: null,
  };

  const areaManagerA = {
    id: 'area-mgr-a-uuid',
    role: Roles.AREA_MANAGER,
    areaId: storeA.area_id,
    storeId: null,
  };

  const storeManagerA = {
    id: 'store-mgr-a-uuid',
    role: Roles.STORE_MANAGER,
    areaId: storeA.area_id,
    storeId: storeA.id,
  };

  const storeUserA = {
    id: 'store-user-a-uuid',
    role: Roles.STORE_USER,
    areaId: storeA.area_id,
    storeId: storeA.id,
  };

  // --- Test 1: OPERATION_MANAGER sees ALL orders ---
  console.log('--- Test 1: OPERATION_MANAGER Visibility ---');
  const opOrders = await OrdersService.listOrders({ actor: opManager });
  check('Operation Manager sees all 4 orders (including unmapped)', opOrders.data.length === 4);
  check('Status normalized for wc-completed -> completed', opOrders.data[0].status === 'completed');
  check('Status normalized for wc-pending -> pending', opOrders.data[2].status === 'pending');
  check('Unmapped order has externalBranchId: null', opOrders.data[2].externalBranchId === null);

  // --- Test 2: AREA_MANAGER Scoping & Fail-Closed ---
  console.log('\n--- Test 2: AREA_MANAGER Scoping & Fail-Closed ---');
  const areaAOrders = await OrdersService.listOrders({ actor: areaManagerA });
  const allInAreaA = areaAOrders.data.every((o) => o.externalBranchId === storeA.external_id);
  check('Area Manager only sees orders in their area branches', allInAreaA && areaAOrders.data.length === 2);
  check('Missing field fails closed: Unmapped order 103 is excluded', !areaAOrders.data.some((o) => o.id === 103));
  check('Other branch order 102 is excluded', !areaAOrders.data.some((o) => o.id === 102));

  // --- Test 3: STORE_MANAGER Scoping ---
  console.log('\n--- Test 3: STORE_MANAGER Scoping ---');
  const storeAOrders = await OrdersService.listOrders({ actor: storeManagerA });
  check('Store Manager only sees orders of Store A', storeAOrders.data.length === 2);
  check('Store Manager sees full customer email', storeAOrders.data[0].customer.email === 'ahmed@customer.com');

  // --- Test 4: STORE_USER Customer PII Masking ---
  console.log('\n--- Test 4: STORE_USER Customer PII Masking ---');
  const storeUserOrders = await OrdersService.listOrders({ actor: storeUserA });
  check('Store User sees same scoped orders count', storeUserOrders.data.length === 2);
  const sampleUserOrder = storeUserOrders.data[0];
  check('Customer email is masked for STORE_USER', sampleUserOrder.customer.email === '***@***.***');
  check('Customer phone is masked for STORE_USER', sampleUserOrder.customer.phone === '***');
  check('Customer address is masked for STORE_USER', sampleUserOrder.customer.address === '***');

  // --- Test 5: Single Order By ID Scoping & 404 Fail-Closed ---
  console.log('\n--- Test 5: Single Order By ID Scoping ---');
  // Store Manager accessing own store order (101) -> 200 OK
  const order101 = await OrdersService.getOrderById({ actor: storeManagerA, id: 101 });
  check('Store Manager can fetch own store order (101)', order101.id === 101 && order101.status === 'completed');

  // Store Manager accessing foreign store order (102) -> MUST THROW 404
  let err102 = null;
  try {
    await OrdersService.getOrderById({ actor: storeManagerA, id: 102 });
  } catch (err) {
    err102 = err;
  }
  check('Store Manager accessing foreign store order (102) returns 404', err102 && err102.statusCode === 404);

  // Store Manager accessing unmapped order (103) -> MUST FAIL CLOSED with 404
  let err103 = null;
  try {
    await OrdersService.getOrderById({ actor: storeManagerA, id: 103 });
  } catch (err) {
    err103 = err;
  }
  check('Store Manager accessing unmapped order (103) fails closed with 404', err103 && err103.statusCode === 404);

  // Operation Manager accessing unmapped order (103) -> SUCCESS
  const opOrder103 = await OrdersService.getOrderById({ actor: opManager, id: 103 });
  check('Operation Manager can access unmapped order (103)', opOrder103.id === 103);

  // --- Test 6: Pagination Totals ---
  console.log('\n--- Test 6: Scoped Pagination Totals ---');
  const paginatedRes = await OrdersService.listOrders({
    actor: storeManagerA,
    filters: { page: 1, limit: 1 },
  });
  check('Pagination limits items to limit: 1', paginatedRes.data.length === 1);
  check('Pagination total reflects scoped count (2)', paginatedRes.meta.total === 2);
  check('Pagination totalPages calculated correctly (2)', paginatedRes.meta.totalPages === 2);

  console.log(`\n=======================================`);
  console.log(`🏁 All ${passed} Orders Scoping Tests Passed!`);
  console.log(`=======================================\n`);
  process.exit(0);
}

runOrdersScopingTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});

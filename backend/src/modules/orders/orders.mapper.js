import dotenv from 'dotenv';

dotenv.config();

/**
 * Normalizes status string by removing any 'wc-' prefix
 */
export function normalizeStatus(status) {
  if (!status || typeof status !== 'string') return 'pending';
  return status.replace(/^wc-/, '').toLowerCase().trim();
}

/**
 * Helper to safely extract a value from an object via direct key, dotted path,
 * or WooCommerce-style meta_data array.
 */
function getFieldValue(obj, fieldPath) {
  if (!obj || !fieldPath) return null;

  // 1. Direct property match
  if (obj[fieldPath] !== undefined && obj[fieldPath] !== null && obj[fieldPath] !== '') {
    return obj[fieldPath];
  }

  // 2. Nested dotted path (e.g. "meta.branch_id")
  if (fieldPath.includes('.')) {
    const parts = fieldPath.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr && typeof curr === 'object' && curr[part] !== undefined) {
        curr = curr[part];
      } else {
        curr = null;
        break;
      }
    }
    if (curr !== null && curr !== undefined && curr !== '') {
      return curr;
    }
  }

  // 3. WooCommerce meta_data array match (e.g. [{ key: "branch_id", value: 308 }])
  if (Array.isArray(obj.meta_data)) {
    const item = obj.meta_data.find((m) => m && m.key === fieldPath);
    if (item && item.value !== undefined && item.value !== null && item.value !== '') {
      return item.value;
    }
  }

  return null;
}

/**
 * Single mapper function to extract external branch ID and area ID
 * from raw external order payloads in a configurable way.
 */
export function extractBranchAndArea(rawOrder, storeMap = new Map()) {
  const branchField = process.env.ORDER_BRANCH_FIELD || 'branch_id';
  const areaField = process.env.ORDER_AREA_FIELD || 'area_id';

  const rawBranch = getFieldValue(rawOrder, branchField);
  const rawArea = getFieldValue(rawOrder, areaField);

  let externalBranchId = rawBranch !== null && !isNaN(Number(rawBranch)) ? Number(rawBranch) : null;
  let externalAreaId = rawArea !== null && !isNaN(Number(rawArea)) ? Number(rawArea) : null;

  // Fallback: If external system did not supply branch_id on this order yet,
  // deterministically distribute based on order ID among active store external IDs
  if (externalBranchId === null && storeMap && storeMap.size > 0) {
    const branchIds = Array.from(storeMap.keys());
    const orderIdNum = Number(rawOrder.order_id || rawOrder.id || 0);
    if (orderIdNum > 0) {
      externalBranchId = branchIds[orderIdNum % branchIds.length];
      const matched = storeMap.get(externalBranchId);
      if (matched) {
        externalAreaId = matched.areaExternalId;
      }
    }
  }

  return {
    externalBranchId,
    externalAreaId,
  };
}

/**
 * Mask customer PII for STORE_USER
 */
export function maskCustomerPII(customer, mask = false) {
  if (!customer) return null;
  if (!mask) return customer;

  return {
    name: customer.name || null,
    email: customer.email ? '***@***.***' : null,
    phone: customer.phone ? '***' : null,
    address: customer.address ? '***' : null,
  };
}

/**
 * Stable Order DTO mapper
 */
export function mapOrderToDTO(rawOrder, { storeMap = new Map(), maskPII = false } = {}) {
  const { externalBranchId, externalAreaId } = extractBranchAndArea(rawOrder, storeMap);
  const matchedStore = externalBranchId !== null ? storeMap.get(Number(externalBranchId)) : null;

  const rawStatus = rawOrder.status || rawOrder.order_status || rawOrder.post_status;
  const status = normalizeStatus(rawStatus);

  // Extract customer info
  const billing = rawOrder.billing || rawOrder.billing_address || {};
  const shipping = rawOrder.shipping || rawOrder.shipping_address || {};
  const firstName = billing.first_name || shipping.first_name || '';
  const lastName = billing.last_name || shipping.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const customerName = fullName || rawOrder.customer_name || billing.name || null;

  const rawCustomer = {
    name: customerName,
    email: billing.email || rawOrder.customer_email || rawOrder.email || null,
    phone: billing.phone || rawOrder.customer_phone || rawOrder.phone || null,
    address:
      [billing.address_1, billing.address_2, billing.city].filter(Boolean).join(', ') ||
      rawOrder.customer_address ||
      null,
  };

  // Line items
  const rawItems = rawOrder.line_items || rawOrder.items || [];
  const items = Array.isArray(rawItems)
    ? rawItems.map((item) => ({
        id: item.id || null,
        name: item.name || item.title || '',
        quantity: Number(item.quantity) || 1,
        price: parseFloat(item.price || item.subtotal || 0),
        total: parseFloat(item.total || 0),
      }))
    : [];

  const orderId =
    rawOrder.id !== undefined && rawOrder.id !== null ? rawOrder.id : rawOrder.order_id;

  return {
    id: orderId,
    orderNumber: rawOrder.number || rawOrder.order_number || String(orderId),
    status,
    date: rawOrder.date_created || rawOrder.created_at || rawOrder.date || null,
    total: parseFloat(rawOrder.total || 0),
    currency: rawOrder.currency || 'EGP',
    storeId: matchedStore?.id || null,
    externalBranchId: externalBranchId !== null ? Number(externalBranchId) : null,
    storeName: matchedStore?.name || null,
    areaId: matchedStore?.areaId || null,
    externalAreaId:
      externalAreaId !== null ? Number(externalAreaId) : (matchedStore?.areaExternalId || null),
    areaName: matchedStore?.areaName || null,
    customer: maskCustomerPII(rawCustomer, maskPII),
    items,
  };
}

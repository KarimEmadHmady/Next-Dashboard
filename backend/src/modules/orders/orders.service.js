import { query } from '../../config/db.js';
import { Roles } from '../../config/roles.js';
import { externalApi } from '../../services/externalApi.service.js';
import { mapOrderToDTO, normalizeStatus } from './orders.mapper.js';
import { NotFoundError } from '../../utils/errors.util.js';

// In-memory cache for scoped orders
const cache = new Map();

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data, ttlSeconds = 30) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export class OrdersService {
  /**
   * Helper to fetch active store mirror map: externalId -> store object
   */
  static async getActiveStoreMap() {
    const stores = await query(`
      SELECT s.id, s.name, s.external_id, s.area_id, 
             a.name as area_name, a.external_id as area_external_id
      FROM stores s
      JOIN areas a ON s.area_id = a.id
      WHERE s.is_active = 1 AND a.is_active = 1
    `);

    const map = new Map();
    for (const s of stores) {
      if (s.external_id !== null && s.external_id !== undefined) {
        map.set(Number(s.external_id), {
          id: s.id,
          name: s.name,
          externalId: Number(s.external_id),
          areaId: s.area_id,
          areaName: s.area_name,
          areaExternalId: s.area_external_id !== null ? Number(s.area_external_id) : null,
        });
      }
    }
    return map;
  }

  /**
   * Resolve actor's allowed external branch IDs.
   * Returns Set<number> or null (for OPERATION_MANAGER meaning all allowed).
   */
  static async resolveActorScope(actor, storeMap, queryFilters = {}) {
    const { areaId, storeId } = queryFilters;

    if (actor.role === Roles.OPERATION_MANAGER) {
      let allowed = null;
      if (storeId) {
        // Find store by local id
        const targetStore = Array.from(storeMap.values()).find((s) => s.id === storeId);
        allowed = targetStore ? new Set([targetStore.externalId]) : new Set();
      } else if (areaId) {
        const areaStores = Array.from(storeMap.values())
          .filter((s) => s.areaId === areaId)
          .map((s) => s.externalId);
        allowed = new Set(areaStores);
      }
      return allowed;
    }

    if (actor.role === Roles.AREA_MANAGER) {
      // Find all stores in actor's area
      const areaStores = Array.from(storeMap.values())
        .filter((s) => s.areaId === actor.areaId);

      if (storeId) {
        const specificStore = areaStores.find((s) => s.id === storeId);
        if (!specificStore) {
          throw new NotFoundError('Store not found');
        }
        return new Set([specificStore.externalId]);
      }

      return new Set(areaStores.map((s) => s.externalId));
    }

    if (actor.role === Roles.STORE_MANAGER || actor.role === Roles.STORE_USER) {
      if (storeId && storeId !== actor.storeId) {
        throw new NotFoundError('Store not found');
      }

      const userStore = Array.from(storeMap.values()).find((s) => s.id === actor.storeId);
      return userStore ? new Set([userStore.externalId]) : new Set();
    }

    return new Set();
  }

  /**
   * List orders with automatic scoping and fail-closed security
   */
  static async listOrders({ actor, filters = {} }) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      orderby = 'date',
      order = 'DESC',
      storeId,
      areaId,
    } = filters;

    const ttlSeconds = parseInt(process.env.ORDERS_CACHE_TTL_SECONDS || '30', 10);
    const scopeKey = `${actor.role}:${actor.areaId || 'none'}:${actor.storeId || 'none'}:${actor.id}`;
    const cacheKey = `orders:list:${scopeKey}:${JSON.stringify(filters)}`;

    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const storeMap = await this.getActiveStoreMap();
    const allowedBranchIds = await this.resolveActorScope(actor, storeMap, { storeId, areaId });

    // When Super Admin has no local filters (storeId, areaId, search), we can delegate pagination to the external API
    const isDirectExternalPagination = allowedBranchIds === null && !storeId && !areaId && !search;

    // Fetch external orders
    const externalParams = {
      page: isDirectExternalPagination ? page : 1,
      limit: isDirectExternalPagination ? limit : 100, // Fetch broader set if we need to filter server-side
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
      ...(orderby ? { orderby } : {}),
      ...(order ? { order } : {}),
    };

    let rawList = [];
    let externalPagination = null;
    try {
      const res = await externalApi.getAdminOrders(externalParams);
      const resData = res.data;
      if (Array.isArray(resData)) {
        rawList = resData;
      } else if (resData && Array.isArray(resData.data)) {
        rawList = resData.data;
      } else if (resData && Array.isArray(resData.data?.results)) {
        rawList = resData.data.results;
        externalPagination = resData.data.pagination || null;
      } else if (resData && Array.isArray(resData.orders)) {
        rawList = resData.orders;
      } else if (resData && Array.isArray(resData.results)) {
        rawList = resData.results;
      }
    } catch (err) {
      // If external call fails due to unconfigured credentials, rethrow mapped error
      throw err;
    }

    const maskPII = actor.role === Roles.STORE_USER;

    // Map each raw order to DTO
    const dtos = rawList.map((raw) => mapOrderToDTO(raw, { storeMap, maskPII }));

    // FAIL-CLOSED Scoping filter:
    // If actor is not OPERATION_MANAGER, only orders with a valid externalBranchId matching allowedBranchIds are retained.
    // If externalBranchId is null or missing, non-OPERATION_MANAGER sees NOTHING.
    const scopedList = dtos.filter((orderDto) => {
      if (allowedBranchIds === null) {
        return true; // OPERATION_MANAGER sees all
      }
      if (orderDto.externalBranchId === null || orderDto.externalBranchId === undefined) {
        return false; // FAIL-CLOSED
      }
      return allowedBranchIds.has(orderDto.externalBranchId);
    });

    // Optional status filter in case external API did not apply it
    let filteredList = scopedList;
    if (status) {
      const normalizedQueryStatus = normalizeStatus(status);
      filteredList = filteredList.filter((o) => normalizeStatus(o.status) === normalizedQueryStatus);
    }

    // Optional local search filter (in case external API ignores search parameter)
    if (search) {
      const q = String(search).toLowerCase().trim();
      filteredList = filteredList.filter((o) => {
        return (
          String(o.orderNumber || '').toLowerCase().includes(q) ||
          String(o.id || '').toLowerCase().includes(q) ||
          String(o.customer?.name || '').toLowerCase().includes(q) ||
          String(o.customer?.phone || '').toLowerCase().includes(q) ||
          String(o.customer?.email || '').toLowerCase().includes(q)
        );
      });
    }

    let paginatedItems;
    let total;
    let totalPages;

    if (isDirectExternalPagination && externalPagination) {
      paginatedItems = filteredList;
      total = Number(externalPagination.total ?? filteredList.length);
      totalPages = Number(externalPagination.total_pages ?? Math.ceil(total / limit) ?? 1);
    } else {
      total = filteredList.length;
      const startIndex = (page - 1) * limit;
      paginatedItems = filteredList.slice(startIndex, startIndex + limit);
      totalPages = Math.ceil(total / limit) || 1;
    }

    const result = {
      data: paginatedItems,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    };

    setCache(cacheKey, result, ttlSeconds);
    return result;
  }

  /**
   * Get single order by ID with fail-closed scoping (returns 404 if out of scope)
   */
  static async getOrderById({ actor, id }) {
    const ttlSeconds = parseInt(process.env.ORDERS_CACHE_TTL_SECONDS || '30', 10);
    const scopeKey = `${actor.role}:${actor.areaId || 'none'}:${actor.storeId || 'none'}`;
    const cacheKey = `orders:item:${scopeKey}:${id}`;

    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const storeMap = await this.getActiveStoreMap();
    const allowedBranchIds = await this.resolveActorScope(actor, storeMap);

    let rawOrder = null;
    try {
      const res = await externalApi.getOrderById(id);
      if (res && res.ok && res.data) {
        rawOrder = res.data?.data || res.data;
        if (rawOrder && rawOrder.status === 404) {
          rawOrder = null;
        }
      }
    } catch (err) {
      // Ignore and fallback to admin orders search
    }

    // Fallback: search in admin orders list
    if (!rawOrder) {
      try {
        const adminRes = await externalApi.getAdminOrders({ search: id, limit: 100 });
        const list =
          adminRes.data?.data?.results ||
          adminRes.data?.data ||
          adminRes.data?.results ||
          adminRes.data ||
          [];
        if (Array.isArray(list)) {
          rawOrder = list.find((o) => String(o.order_id || o.id) === String(id)) || null;
        }
      } catch (e) {
        // Ignore fallback error
      }
    }

    if (!rawOrder) {
      throw new NotFoundError('Order not found');
    }

    const maskPII = actor.role === Roles.STORE_USER;
    const orderDto = mapOrderToDTO(rawOrder, { storeMap, maskPII });

    // FAIL-CLOSED: if out of scope or branch missing for scoped roles, return 404
    if (allowedBranchIds !== null) {
      if (
        orderDto.externalBranchId === null ||
        orderDto.externalBranchId === undefined ||
        !allowedBranchIds.has(orderDto.externalBranchId)
      ) {
        throw new NotFoundError('Order not found');
      }
    }

    setCache(cacheKey, orderDto, ttlSeconds);
    return orderDto;
  }

  /**
   * Get timeline for order with fail-closed scoping
   */
  static async getOrderTimeline({ actor, id }) {
    // Check access first via getOrderById (throws 404 if out of scope or unmapped)
    await this.getOrderById({ actor, id });

    try {
      const res = await externalApi.getOrderTimeline(id);
      const timelineData = res.data?.data || res.data || [];
      return Array.isArray(timelineData) ? timelineData : [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Get order statuses with normalized slugs
   */
  static async getOrderStatuses() {
    try {
      const res = await externalApi.getOrderStatuses();
      const rawStatuses = res.data?.data || res.data || [];

      if (Array.isArray(rawStatuses)) {
        return rawStatuses.map((s) => {
          if (typeof s === 'string') {
            return {
              slug: normalizeStatus(s),
              name: s.replace(/^wc-/, ''),
            };
          }
          return {
            slug: normalizeStatus(s.slug || s.status || s.key),
            name: s.name || s.label || s.title || normalizeStatus(s.slug),
          };
        });
      }
    } catch (err) {
      // Fallback to standard WooCommerce order statuses normalized
    }

    return [
      { slug: 'pending', name: 'Pending payment' },
      { slug: 'processing', name: 'Processing' },
      { slug: 'on-hold', name: 'On hold' },
      { slug: 'completed', name: 'Completed' },
      { slug: 'cancelled', name: 'Cancelled' },
      { slug: 'refunded', name: 'Refunded' },
      { slug: 'failed', name: 'Failed' },
    ];
  }
}

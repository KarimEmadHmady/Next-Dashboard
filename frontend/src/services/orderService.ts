// src/services/orderService.ts
import { apiClient } from '@/lib/api';
import { OrderItem, OrderFilters, OrdersListResult } from '@/types/order';

export const orderService = {
  /**
   * List orders with automatic backend role-scoping, search, and pagination
   */
  async listOrders(filters: OrderFilters = {}): Promise<OrdersListResult> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.storeId) params.append('storeId', filters.storeId);
    if (filters.areaId) params.append('areaId', filters.areaId);
    if (filters.orderby) params.append('orderby', filters.orderby);
    if (filters.order) params.append('order', filters.order);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<OrderItem[]>(`/orders${queryString}`, {
      method: 'GET',
    });

    return {
      data: res.data || [],
      meta: (res as any).meta || {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: (res.data || []).length,
        totalPages: 1,
      },
    };
  },

  /**
   * Get single order by ID
   */
  async getOrderById(id: string | number): Promise<OrderItem> {
    const res = await apiClient<OrderItem>(`/orders/${id}`, {
      method: 'GET',
    });
    return res.data;
  },

  /**
   * Get timeline for order
   */
  async getOrderTimeline(id: string | number): Promise<any> {
    const res = await apiClient<any>(`/orders/${id}/timeline`, {
      method: 'GET',
    });
    return res.data;
  },

  /**
   * Get order statuses
   */
  async getOrderStatuses(): Promise<string[]> {
    const res = await apiClient<string[]>('/orders/statuses', {
      method: 'GET',
    });
    return res.data || [];
  },
};

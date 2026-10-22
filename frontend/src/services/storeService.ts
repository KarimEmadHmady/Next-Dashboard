// src/services/storeService.ts
import { apiClient } from '@/lib/api';
import { StoreItem, StoreFilters } from '@/types/store';

export const storeService = {
  /**
   * List stores with optional filtering
   */
  async listStores(filters: StoreFilters = {}): Promise<StoreItem[]> {
    const params = new URLSearchParams();
    if (filters.areaId) params.append('areaId', filters.areaId);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<StoreItem[]>(`/stores${queryString}`, {
      method: 'GET',
    });
    return res.data || [];
  },

  /**
   * Get single store by ID
   */
  async getStoreById(id: string): Promise<StoreItem> {
    const res = await apiClient<StoreItem>(`/stores/${id}`, {
      method: 'GET',
    });
    return res.data;
  },
};

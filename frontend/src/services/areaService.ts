// src/services/areaService.ts
import { apiClient } from '@/lib/api';
import { AreaItem } from '@/types/area';
import { StoreItem } from '@/types/store';

export const areaService = {
  /**
   * List all areas accessible by actor
   */
  async listAreas(): Promise<AreaItem[]> {
    const res = await apiClient<AreaItem[]>('/areas', {
      method: 'GET',
    });
    return res.data || [];
  },

  /**
   * Get single area by ID
   */
  async getAreaById(id: string): Promise<AreaItem> {
    const res = await apiClient<AreaItem>(`/areas/${id}`, {
      method: 'GET',
    });
    return res.data;
  },

  /**
   * Get stores belonging to an area
   */
  async getStoresInArea(areaId: string): Promise<StoreItem[]> {
    const res = await apiClient<StoreItem[]>(`/areas/${areaId}/stores`, {
      method: 'GET',
    });
    return res.data || [];
  },
};

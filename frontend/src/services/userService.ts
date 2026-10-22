// src/services/userService.ts
import { apiClient } from '@/lib/api';
import {
  UserItem,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  UsersListResult,
  AreaOption,
  StoreOption,
} from '@/types/user';

export const userService = {
  /**
   * List users with optional filtering & pagination
   */
  async listUsers(filters: UserFilters = {}): Promise<UsersListResult> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.areaId) params.append('areaId', filters.areaId);
    if (filters.storeId) params.append('storeId', filters.storeId);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<UserItem[]>(`/users${queryString}`, {
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
   * Get single user by ID
   */
  async getUserById(id: string): Promise<UserItem> {
    const res = await apiClient<UserItem>(`/users/${id}`, {
      method: 'GET',
    });
    return res.data;
  },

  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<UserItem> {
    const payload: Record<string, any> = {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
    };

    if (input.phone) payload.phone = input.phone.trim();
    if (input.areaId) payload.areaId = input.areaId;
    if (input.storeId) payload.storeId = input.storeId;

    const res = await apiClient<UserItem>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Update existing user
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<UserItem> {
    const payload: Record<string, any> = {};

    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.phone !== undefined) payload.phone = input.phone ? input.phone.trim() : null;
    if (input.password) payload.password = input.password;
    if (input.role) payload.role = input.role;
    if (input.areaId !== undefined) payload.areaId = input.areaId;
    if (input.storeId !== undefined) payload.storeId = input.storeId;

    const res = await apiClient<UserItem>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Toggle user active status
   */
  async updateStatus(id: string, isActive: boolean): Promise<UserItem> {
    const res = await apiClient<UserItem>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return res.data;
  },

  /**
   * Soft delete user
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  /**
   * Fetch areas for dropdown selection
   */
  async getAreas(): Promise<AreaOption[]> {
    try {
      const res = await apiClient<AreaOption[]>('/areas', {
        method: 'GET',
      });
      return res.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch stores for dropdown selection
   */
  async getStores(params: { areaId?: string } = {}): Promise<StoreOption[]> {
    try {
      const qs = params.areaId ? `?areaId=${params.areaId}` : '';
      const res = await apiClient<StoreOption[]>(`/stores${qs}`, {
        method: 'GET',
      });
      return res.data || [];
    } catch {
      return [];
    }
  },
};

export default userService;

// src/types/user.ts
import { Role } from './auth';

export interface AreaOption {
  id: string;
  name: string;
  externalId?: number | null;
  isActive?: boolean;
}

export interface StoreOption {
  id: string;
  name: string;
  externalId?: number | null;
  areaId: string;
  areaName?: string;
  isActive?: boolean;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  areaId?: string | null;
  storeId?: string | null;
  areaName?: string | null;
  storeName?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  avatarUrl?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  role: Role;
  areaId?: string | null;
  storeId?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string | null;
  password?: string;
  role?: Role;
  areaId?: string | null;
  storeId?: string | null;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role | string;
  areaId?: string;
  storeId?: string;
  isActive?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersListResult {
  data: UserItem[];
  meta: PaginationMeta;
}

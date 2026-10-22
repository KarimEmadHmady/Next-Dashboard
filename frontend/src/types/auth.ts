export type Role =
  | 'OPERATION_MANAGER'
  | 'AREA_MANAGER'
  | 'STORE_MANAGER'
  | 'STORE_USER';

export interface UserArea {
  id: string;
  name: string;
  externalId: number | null;
}

export interface UserStore {
  id: string;
  name: string;
  externalId: number | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  areaId?: string | null;
  areaName?: string | null;
  area?: UserArea | null;
  storeId?: string | null;
  storeName?: string | null;
  store?: UserStore | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  avatarUrl?: string;
}

export interface AuthLoginResponse {
  user: User;
  accessToken: string;
  allowedPages: string[];
  permissions: string[];
}

export interface AuthMeResponse {
  user: User;
  allowedPages: string[];
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  allowedPages: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

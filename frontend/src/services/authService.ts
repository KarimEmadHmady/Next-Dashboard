// src/services/authService.ts
import { apiClient, setStoredToken, getStoredToken } from '@/lib/api';
import {
  AuthLoginResponse,
  AuthMeResponse,
  LoginCredentials,
  Role,
} from '@/types/auth';

export const RoleDefaultLandingPages: Record<Role, string> = {
  OPERATION_MANAGER: 'manager',
  AREA_MANAGER: 'area-manager',
  STORE_MANAGER: 'branch-responsible',
  STORE_USER: 'branch-user',
};

export const getDefaultPathForRole = (
  role?: Role | string,
  allowedPages?: string[]
): string => {
  if (allowedPages && allowedPages.length > 0) {
    return `/dashboard/${allowedPages[0]}`;
  }
  if (role && RoleDefaultLandingPages[role as Role]) {
    return `/dashboard/${RoleDefaultLandingPages[role as Role]}`;
  }
  return '/dashboard/orders';
};

export const authService = {
  /**
   * Log in user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthLoginResponse> {
    const res = await apiClient<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });

    if (res.data?.accessToken) {
      setStoredToken(res.data.accessToken);
    }

    return res.data;
  },

  /**
   * Get current authenticated user profile and permissions
   */
  async getMe(): Promise<AuthMeResponse> {
    const res = await apiClient<AuthMeResponse>('/auth/me', {
      method: 'GET',
    });
    return res.data;
  },

  /**
   * Refresh accessToken using refresh token cookie / token
   */
  async refresh(): Promise<{ accessToken: string }> {
    const res = await apiClient<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
      skipRefreshRetry: true,
    });

    if (res.data?.accessToken) {
      setStoredToken(res.data.accessToken);
    }

    return res.data;
  },

  /**
   * Logout from current session
   */
  async logout(): Promise<void> {
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue client cleanup even if request fails
    } finally {
      setStoredToken(null);
    }
  },

  /**
   * Change current user's password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(null);
    return res.data;
  },
};

export default authService;
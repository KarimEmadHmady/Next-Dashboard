// src/redux/features/auth/authSelectors.ts
import { RootState } from '@/redux/store';
import { Role } from '@/types/auth';

export const selectAuth = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUserRole = (state: RootState): Role | undefined => state.auth.user?.role;
export const selectAllowedPages = (state: RootState): string[] => state.auth.allowedPages;
export const selectPermissions = (state: RootState): string[] => state.auth.permissions;
export const selectAuthLoading = (state: RootState): boolean => state.auth.isLoading;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
export const selectIsAuthInitialized = (state: RootState): boolean => state.auth.isInitialized;

export const selectHasPageAccess = (page: string) => (state: RootState): boolean => {
  if (page === 'profile') return state.auth.isAuthenticated;
  return state.auth.allowedPages.includes(page);
};

export const selectHasPermission = (permission: string) => (state: RootState): boolean => {
  return state.auth.permissions.includes(permission);
};
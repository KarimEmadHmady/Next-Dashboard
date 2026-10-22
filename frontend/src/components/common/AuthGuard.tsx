'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAllowedPages,
  selectIsAuthInitialized,
} from '@/redux/features/auth/authSelectors';
import { fetchCurrentUser, initializeFromStorage } from '@/redux/features/auth/authSlice';
import { getDefaultPathForRole } from '@/services/authService';
import { getStoredToken } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const locale =
    (typeof params?.locale === 'string' && (params.locale === 'ar' || params.locale === 'en') && params.locale) ||
    'en';

  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const allowedPages = useAppSelector(selectAllowedPages);
  const isInitialized = useAppSelector(selectIsAuthInitialized);

  // Initialize and verify user on mount
  useEffect(() => {
    dispatch(initializeFromStorage());
    const token = getStoredToken();
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  // Route protection & RBAC check
  useEffect(() => {
    if (!isInitialized) return;

    const token = getStoredToken();
    if (!token && !isAuthenticated) {
      // Not authenticated -> redirect to login
      router.replace(`/${locale}`);
      return;
    }

    if (isAuthenticated && allowedPages && allowedPages.length > 0) {
      // Extract the dashboard sub-route
      // e.g., /en/dashboard/area-manager -> matches area-manager
      const segments = pathname.split('/').filter(Boolean);
      const dashboardIdx = segments.indexOf('dashboard');

      if (dashboardIdx !== -1 && segments.length > dashboardIdx + 1) {
        const currentSubRoute = segments[dashboardIdx + 1];

        // Profile is universally allowed for authenticated users
        if (currentSubRoute === 'profile') {
          return;
        }

        // Check if user has access to this sub-route
        const hasAccess = allowedPages.includes(currentSubRoute);
        if (!hasAccess) {
          // Unauthorized for this sub-route -> Redirect to user's first allowed page
          const defaultSubPath = getDefaultPathForRole(user?.role, allowedPages);
          router.replace(`/${locale}${defaultSubPath}`);
        }
      } else if (dashboardIdx !== -1 && segments.length === dashboardIdx + 1) {
        // Navigated to `/dashboard` directly -> Redirect to default allowed page
        const defaultSubPath = getDefaultPathForRole(user?.role, allowedPages);
        router.replace(`/${locale}${defaultSubPath}`);
      }
    }
  }, [isAuthenticated, isInitialized, allowedPages, pathname, locale, router, user?.role]);

  // While checking auth token on cold boot
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#131e48]" />
          <p className="text-sm font-medium text-gray-500">
            {locale === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Verifying session...'}
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated && !getStoredToken()) {
    return null;
  }

  return <>{children}</>;
}

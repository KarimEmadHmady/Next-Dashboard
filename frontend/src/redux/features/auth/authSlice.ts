// src/redux/features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginCredentials, User, AuthLoginResponse } from '@/types/auth';
import { authService } from '@/services/authService';
import { getStoredToken, setStoredToken } from '@/lib/api';

const SESSION_KEY = 'roxy_user_session';

const getInitialSession = (): {
  user: User | null;
  allowedPages: string[];
  permissions: string[];
  accessToken: string | null;
} => {
  if (typeof window === 'undefined') {
    return { user: null, allowedPages: [], permissions: [], accessToken: null };
  }
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const token = getStoredToken();
    if (raw && token) {
      const parsed = JSON.parse(raw);
      return {
        user: parsed.user || null,
        allowedPages: parsed.allowedPages || [],
        permissions: parsed.permissions || [],
        accessToken: token,
      };
    }
  } catch {
    // Ignore storage parse error
  }
  return { user: null, allowedPages: [], permissions: [], accessToken: null };
};

const initialSession = getInitialSession();

const initialState: AuthState = {
  user: initialSession.user,
  accessToken: initialSession.accessToken,
  allowedPages: initialSession.allowedPages,
  permissions: initialSession.permissions,
  isAuthenticated: !!initialSession.user && !!initialSession.accessToken,
  isLoading: false,
  isInitialized: false,
  error: null,
};

const persistSession = (user: User | null, allowedPages: string[], permissions: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, allowedPages, permissions }));
      // Also store for existing Sidebar consumption
      localStorage.setItem('user', JSON.stringify({
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl || '/avatar.webp',
      }));
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('user');
    }
  } catch {
    // Ignore storage issues
  }
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (err: any) {
      const message =
        err?.message ||
        err?.data?.error?.message ||
        'Invalid email or password';
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getMe();
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to authenticate');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await authService.logout();
  return null;
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    initializeFromStorage: (state) => {
      const session = getInitialSession();
      state.user = session.user;
      state.accessToken = session.accessToken;
      state.allowedPages = session.allowedPages;
      state.permissions = session.permissions;
      state.isAuthenticated = !!session.user && !!session.accessToken;
      state.isInitialized = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.allowedPages = [];
      state.permissions = [];
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      persistSession(null, [], []);
      setStoredToken(null);
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<AuthLoginResponse>) => {
          state.isLoading = false;
          state.isInitialized = true;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.allowedPages = action.payload.allowedPages || [];
          state.permissions = action.payload.permissions || [];
          state.error = null;
          persistSession(
            action.payload.user,
            action.payload.allowedPages || [],
            action.payload.permissions || []
          );
        }
      )
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.allowedPages = action.payload.allowedPages || [];
        state.permissions = action.payload.permissions || [];
        state.error = null;
        persistSession(
          action.payload.user,
          action.payload.allowedPages || [],
          action.payload.permissions || []
        );
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.allowedPages = [];
        state.permissions = [];
        persistSession(null, [], []);
        setStoredToken(null);
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.allowedPages = [];
      state.permissions = [];
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      persistSession(null, [], []);
      setStoredToken(null);
    });
  },
});

export const { clearError, initializeFromStorage, clearAuth } = authSlice.actions;
export default authSlice.reducer;
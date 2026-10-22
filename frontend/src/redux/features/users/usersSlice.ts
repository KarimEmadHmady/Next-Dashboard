// src/redux/features/users/usersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  UserItem,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  PaginationMeta,
} from '@/types/user';
import { userService } from '@/services/userService';

interface UsersState {
  users: UserItem[];
  meta: PaginationMeta;
  isLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  actionError: string | null;
}

const initialState: UsersState = {
  users: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  isLoading: false,
  actionLoading: false,
  error: null,
  actionError: null,
};

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (filters: UserFilters = {}, { rejectWithValue }) => {
    try {
      const res = await userService.listUsers(filters);
      return res;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to fetch users');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (input: CreateUserInput, { rejectWithValue }) => {
    try {
      const res = await userService.createUser(input);
      return res;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, input }: { id: string; input: UpdateUserInput }, { rejectWithValue }) => {
    try {
      const res = await userService.updateUser(id, input);
      return res;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to update user');
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  'users/toggleUserStatus',
  async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
    try {
      const res = await userService.updateStatus(id, isActive);
      return res;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to change user status');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string, { rejectWithValue }) => {
    try {
      await userService.deleteUser(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to delete user');
    }
  }
);

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearActionError: (state) => {
      state.actionError = null;
    },
    clearUsers: (state) => {
      state.users = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchUsers
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data;
        state.meta = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createUser
    builder
      .addCase(createUser.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<UserItem>) => {
        state.actionLoading = false;
        state.users.unshift(action.payload);
        state.meta.total += 1;
        state.actionError = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // updateUser
    builder
      .addCase(updateUser.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<UserItem>) => {
        state.actionLoading = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) {
          state.users[idx] = action.payload;
        }
        state.actionError = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // toggleUserStatus
    builder
      .addCase(toggleUserStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action: PayloadAction<UserItem>) => {
        state.actionLoading = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) {
          state.users[idx].isActive = action.payload.isActive;
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // deleteUser
    builder
      .addCase(deleteUser.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.actionLoading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.meta.total = Math.max(0, state.meta.total - 1);
        state.actionError = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });
  },
});

export const { clearActionError, clearUsers } = usersSlice.actions;
export default usersSlice.reducer;

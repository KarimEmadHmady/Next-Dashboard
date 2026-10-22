import { Roles } from './roles.js';

export const Permissions = Object.freeze({
  // Users
  USER_CREATE: 'USER_CREATE',
  USER_READ: 'USER_READ',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_STATUS: 'USER_STATUS',

  // Areas
  AREA_MANAGE: 'AREA_MANAGE',
  AREA_READ: 'AREA_READ',

  // Stores
  STORE_MANAGE: 'STORE_MANAGE',
  STORE_UPDATE: 'STORE_UPDATE',
  STORE_READ: 'STORE_READ',

  // Orders
  ORDER_READ: 'ORDER_READ',
  ORDER_UPDATE_STATUS: 'ORDER_UPDATE_STATUS',

  // Analytics
  ANALYTICS_ALL: 'ANALYTICS_ALL',
  ANALYTICS_AREA: 'ANALYTICS_AREA',
  ANALYTICS_STORE: 'ANALYTICS_STORE',

  // Out of Coverage
  OUT_OF_COVERAGE_READ: 'OUT_OF_COVERAGE_READ',
});

export const RolePermissions = Object.freeze({
  [Roles.OPERATION_MANAGER]: [
    Permissions.USER_CREATE,
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.USER_DELETE,
    Permissions.USER_STATUS,
    Permissions.AREA_MANAGE,
    Permissions.AREA_READ,
    Permissions.STORE_MANAGE,
    Permissions.STORE_UPDATE,
    Permissions.STORE_READ,
    Permissions.ORDER_READ,
    Permissions.ORDER_UPDATE_STATUS,
    Permissions.ANALYTICS_ALL,
    Permissions.ANALYTICS_AREA,
    Permissions.ANALYTICS_STORE,
    Permissions.OUT_OF_COVERAGE_READ,
  ],
  [Roles.AREA_MANAGER]: [
    Permissions.USER_CREATE,
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.USER_DELETE,
    Permissions.USER_STATUS,
    Permissions.AREA_READ,
    Permissions.STORE_UPDATE,
    Permissions.STORE_READ,
    Permissions.ORDER_READ,
    Permissions.ANALYTICS_AREA,
    Permissions.ANALYTICS_STORE,
    Permissions.OUT_OF_COVERAGE_READ,
  ],
  [Roles.STORE_MANAGER]: [
    Permissions.USER_CREATE,
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.USER_DELETE,
    Permissions.USER_STATUS,
    Permissions.STORE_READ,
    Permissions.ORDER_READ,
    Permissions.ANALYTICS_STORE,
  ],
  [Roles.STORE_USER]: [
    Permissions.STORE_READ,
    Permissions.ORDER_READ,
  ],
});

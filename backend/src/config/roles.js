export const Roles = Object.freeze({
  OPERATION_MANAGER: 'OPERATION_MANAGER',
  AREA_MANAGER: 'AREA_MANAGER',
  STORE_MANAGER: 'STORE_MANAGER',
  STORE_USER: 'STORE_USER',
});

export const RoleHierarchy = Object.freeze({
  [Roles.OPERATION_MANAGER]: 4,
  [Roles.AREA_MANAGER]: 3,
  [Roles.STORE_MANAGER]: 2,
  [Roles.STORE_USER]: 1,
});

export const AllowedPagesByRole = Object.freeze({
  [Roles.OPERATION_MANAGER]: [
    'manager',
    'area-manager',
    'branch-manager',
    'branch-responsible',
    'orders',
    'branch-user',
    'out-of-coverage',
  ],
  [Roles.AREA_MANAGER]: [
    'area-manager',
    'branch-manager',
    'orders',
    'out-of-coverage',
  ],
  [Roles.STORE_MANAGER]: [
    'branch-responsible',
    'orders',
  ],
  [Roles.STORE_USER]: [
    'branch-user',
    'orders',
  ],
});

import { Roles, RoleHierarchy } from '../config/roles.js';

export const canManageUser = (actor, targetUser) => {
  if (!actor || !targetUser) return false;

  // Super Admin can manage anyone
  if (actor.role === Roles.OPERATION_MANAGER) {
    return true;
  }

  // Target role must be strictly lower than actor role
  const actorLevel = RoleHierarchy[actor.role] || 0;
  const targetLevel = RoleHierarchy[targetUser.role] || 0;

  if (targetLevel >= actorLevel) {
    return false;
  }

  // Area Manager can manage users inside their area
  if (actor.role === Roles.AREA_MANAGER) {
    return targetUser.area_id === actor.areaId;
  }

  // Store Manager can only manage STORE_USER in their store
  if (actor.role === Roles.STORE_MANAGER) {
    return (
      targetUser.role === Roles.STORE_USER &&
      targetUser.store_id === actor.storeId
    );
  }

  return false;
};

export const canCreateUser = (actor, { role, areaId, storeId }) => {
  if (!actor) return false;

  // Super Admin can create any role anywhere
  if (actor.role === Roles.OPERATION_MANAGER) {
    return true;
  }

  // Nobody can create an account with a role equal to or higher than their own
  const actorLevel = RoleHierarchy[actor.role] || 0;
  const requestedLevel = RoleHierarchy[role] || 0;
  if (requestedLevel >= actorLevel) {
    return false;
  }

  // Area Manager
  if (actor.role === Roles.AREA_MANAGER) {
    // Can only create STORE_MANAGER or STORE_USER in own area
    if (role !== Roles.STORE_MANAGER && role !== Roles.STORE_USER) {
      return false;
    }
    return areaId === actor.areaId;
  }

  // Store Manager
  if (actor.role === Roles.STORE_MANAGER) {
    // Can only create STORE_USER in own store
    if (role !== Roles.STORE_USER) {
      return false;
    }
    return storeId === actor.storeId;
  }

  return false;
};

import { Roles } from '../config/roles.js';

export const canAccessArea = (actor, areaId) => {
  if (!actor || !areaId) return false;
  if (actor.role === Roles.OPERATION_MANAGER) return true;
  if (actor.role === Roles.AREA_MANAGER) return actor.areaId === areaId;
  return false;
};

export const canAccessStore = (actor, store) => {
  if (!actor || !store) return false;
  if (actor.role === Roles.OPERATION_MANAGER) return true;
  if (actor.role === Roles.AREA_MANAGER) return actor.areaId === store.area_id;
  if (actor.role === Roles.STORE_MANAGER || actor.role === Roles.STORE_USER) {
    return actor.storeId === store.id;
  }
  return false;
};

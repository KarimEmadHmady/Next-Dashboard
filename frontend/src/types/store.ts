export interface StoreItem {
  id: string;
  externalId: number | string | null;
  name: string;
  areaId: string;
  lat: number | string | null;
  lng: number | string | null;
  isActive: boolean;
  areaName: string;
  areaExternalId: number | string | null;
  userCount: number;
  managerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreFilters {
  areaId?: string;
  isActive?: boolean;
  search?: string;
}

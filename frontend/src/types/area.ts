export interface AreaItem {
  id: string;
  externalId: number | string | null;
  name: string;
  slug: string;
  lat: number | string | null;
  lng: number | string | null;
  isActive: boolean;
  storeCount: number;
  createdAt: string;
  updatedAt: string;
}

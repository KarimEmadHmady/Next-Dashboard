export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface OrderCustomer {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface OrderLineItem {
  id: number | null;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderItem {
  id: string | number;
  orderNumber: string;
  status: OrderStatus;
  date: string | null;
  total: number;
  currency: string;
  storeId: string | null;
  storeName: string | null;
  externalBranchId: number | null;
  areaId: string | null;
  areaName: string | null;
  customer: OrderCustomer | null;
  items: OrderLineItem[];
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  storeId?: string;
  areaId?: string;
  orderby?: 'date' | 'total' | 'id';
  order?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface OrdersListResult {
  data: OrderItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

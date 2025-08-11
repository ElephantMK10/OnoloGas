import type { 
  Order as IOrder, 
  OrderItem as IOrderItem, 
  OrderStatus as IOrderStatus,
  CreateOrderRequest as ICreateOrderRequest,
  UpdateOrderRequest as IUpdateOrderRequest,
  OrderFilters as IOrderFilters
} from '../interfaces';

// Re-export interface types for consistency
export type { 
  IOrder as Order, 
  IOrderItem as OrderItem, 
  IOrderStatus as OrderStatus,
  ICreateOrderRequest as CreateOrderRequest,
  IUpdateOrderRequest as UpdateOrderRequest,
  IOrderFilters as OrderFilters
};

// Supabase-specific types
export interface SupabaseOrder {
  id: string;
  customer_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  delivery_address: string;
  delivery_phone: string;
  payment_method: string;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  delivery_date?: string;
  preferred_delivery_window?: string;
  estimated_delivery_start?: string;
  estimated_delivery_end?: string;
  driver_id?: string;
  tracking_notes?: string;
  delivery_zone?: string;
  priority_level?: string;
  payment_confirmation_sent?: boolean;
  receipt_sent?: boolean;
  updated_by?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_cost?: number;
  service_area_validated?: boolean;
  auto_status_enabled?: boolean;
  payment_status?: string;
  assigned_driver_id?: string;
}

export interface SupabaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderWithItems extends SupabaseOrder {
  order_items: SupabaseOrderItem[];
}

export interface OrderError {
  message: string;
  code?: string;
  details?: any;
}

export interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}
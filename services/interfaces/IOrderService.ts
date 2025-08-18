export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: string;
  paymentMethod: string;
  totalAmount: number;
  items: OrderItem[];
  status: OrderStatus;
  date: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  deliveryDate?: string;
  preferredDeliveryWindow?: string;
  estimatedDelivery?: string;
  trackingInfo?: string;
  driverId?: string;
  isGuestOrder?: boolean; // Flag to identify guest orders stored locally
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'pending'
  | 'order_received'
  | 'order_confirmed'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface CreateOrderRequest {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: string;
  totalAmount: number;
  items: OrderItem[];
  notes?: string;
  deliveryDate?: string;
  deliverySchedule?: string;
  preferredDeliveryWindow?: string;
  shippingAddressSnapshot?: any;
}

export interface UpdateOrderRequest {
  orderId: string;
  status?: OrderStatus;
  trackingInfo?: string;
  estimatedDelivery?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface IOrderService {
  /**
   * Create a new order
   */
  createOrder(request: CreateOrderRequest): Promise<Order>;
  
  /**
   * Get all orders for a user
   */
  getOrders(userId: string, filters?: OrderFilters): Promise<Order[]>;
  
  /**
   * Get a specific order by ID
   */
  getOrderById(orderId: string): Promise<Order | null>;
  
  /**
   * Update order status or details
   */
  updateOrder(request: UpdateOrderRequest): Promise<Order>;
  
  /**
   * Cancel an order
   */
  cancelOrder(orderId: string): Promise<boolean>;
  
  /**
   * Get order statistics for user
   */
  getOrderStats(userId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  }>;
}
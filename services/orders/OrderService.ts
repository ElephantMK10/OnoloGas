import { supabase } from '../../lib/supabase';
import type {
  IOrderService,
  Order,
  OrderItem,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilters
} from '../interfaces/IOrderService';
import type { SupabaseOrder, SupabaseOrderItem, OrderWithItems, OrderStats } from './types';
import { guestOrderNotificationService } from '../notifications/GuestOrderNotificationService';

export class OrderService implements IOrderService {
  private static instance: OrderService;
  
  // Singleton pattern to ensure one instance
  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * Create a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      console.log('OrderService: Creating new order:', request);

      // Check if this is a guest user (ID starts with 'guest-')
      const isGuestUser = request.userId.startsWith('guest-');

      // Additional validation: if user has email but is marked as guest, this might be an error
      if (isGuestUser && request.customerEmail && request.customerEmail.trim() !== '') {
        console.warn('OrderService: WARNING - Guest user has email address, this might indicate authentication issue:', {
          userId: request.userId,
          email: request.customerEmail,
          name: request.customerName
        });
      }

      if (isGuestUser) {
        // Create local order for guest users
        console.log('OrderService: Creating guest order (will not be saved to database)');
        return await this.createGuestOrder(request);
      }

      console.log('OrderService: Creating authenticated user order (will be saved to database)');

      // Prepare order record for Supabase (authenticated users only)
      const orderRecord = {
        user_id: request.userId,
        customer_id: request.userId,
        customer_name: request.customerName,
        customer_email: request.customerEmail,
        delivery_address: request.deliveryAddress,
        delivery_phone: request.customerPhone,
        payment_method: request.paymentMethod === 'card_on_delivery' ? 'card' : request.paymentMethod,
        total_amount: request.totalAmount,
        status: 'pending',
        notes: request.notes || '',
        delivery_date: request.deliveryDate || new Date().toISOString().split('T')[0],
        preferred_delivery_window: request.preferredDeliveryWindow || null,
      };

      console.log('OrderService: Creating order in database:', orderRecord);

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderRecord)
        .select()
        .single();

      if (orderError || !newOrder) {
        console.error('OrderService: Order creation failed:', orderError);
        console.error('OrderService: Error details:', {
          code: orderError?.code,
          message: orderError?.message,
          details: orderError?.details,
          hint: orderError?.hint
        });

        // Check if this is an RLS policy issue
        if (orderError?.code === '42501' || orderError?.message?.includes('policy')) {
          throw new Error('Database permission error. Please ensure you are properly logged in and try again.');
        }

        throw new Error(orderError?.message || 'Failed to create order. Please check your internet connection or try again later.');
      }

      console.log('OrderService: Order created successfully in database:', newOrder.id);

      // Create order items
      const orderItems = request.items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      console.log('OrderService: Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('OrderService: Order items creation failed:', itemsError);
        throw new Error(itemsError.message || 'Failed to add items to your order. Please try again.');
      }

      // Return formatted order
      const formattedOrder = this.formatOrder(newOrder, request.items);
      console.log('OrderService: Order created successfully:', formattedOrder.id);

      return formattedOrder;
    } catch (error: any) {
      console.error('OrderService: Error creating order:', error);
      throw new Error(error.message || 'An unexpected error occurred while creating your order. Please try again.');
    }
  }

  /**
   * Create a local order for guest users (not saved to database)
   */
  private async createGuestOrder(request: CreateOrderRequest): Promise<Order> {
    console.log('OrderService: Creating guest order locally:', request);

    // Generate a local order ID
    const orderId = `guest-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create local order object
    const guestOrder: Order = {
      id: orderId,
      userId: request.userId,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      deliveryAddress: request.deliveryAddress,
      paymentMethod: request.paymentMethod,
      totalAmount: request.totalAmount,
      status: 'pending',
      items: request.items,
      notes: request.notes || '',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryDate: request.deliveryDate || new Date().toISOString().split('T')[0],
      preferredDeliveryWindow: request.preferredDeliveryWindow || undefined,
      isGuestOrder: true, // Flag to identify guest orders
    };

    // Notify about the guest order (non-blocking)
    try {
      await guestOrderNotificationService.notifyGuestOrder(guestOrder);
    } catch (error) {
      console.error('OrderService: Failed to notify about guest order, but continuing:', error);
    }

    console.log('OrderService: Guest order created locally:', guestOrder.id);
    return guestOrder;
  }

  /**
   * Get all orders for a user
   */
  async getOrders(userId: string, filters?: OrderFilters): Promise<Order[]> {
    try {
      console.log('OrderService: Fetching orders for user:', userId, filters);

      // Check if this is a guest user
      const isGuestUser = userId.startsWith('guest-');

      if (isGuestUser) {
        // Guest users don't have orders in the database
        // Orders are managed locally by OrdersContext
        console.log('OrderService: Guest user detected, returning empty array (orders managed locally)');
        return [];
      }

      // Check authentication for regular users
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('OrderService: Session error:', sessionError);
        throw new Error('Authentication required to fetch orders');
      }

      if (!session?.user) {
        console.error('OrderService: No authenticated user found');
        throw new Error('User must be logged in to fetch orders');
      }

      console.log('OrderService: Authenticated user:', session.user.id, 'requesting orders for:', userId);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('customer_id', userId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data: ordersData, error } = await query;

      if (error) {
        console.error('OrderService: Error fetching orders:', error);
        console.error('OrderService: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      const formattedOrders = ordersData?.map((orderData: OrderWithItems) =>
        this.formatOrderWithItems(orderData)
      ) || [];

      console.log(`OrderService: Fetched ${formattedOrders.length} orders`);
      return formattedOrders;
    } catch (error: any) {
      console.error('OrderService: Error in getOrders:', error);
      throw error;
    }
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      console.log('OrderService: Fetching order by ID:', orderId);

      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('OrderService: Session error:', sessionError);
        throw new Error('Authentication required to fetch order');
      }

      if (!session?.user) {
        console.error('OrderService: No authenticated user found');
        throw new Error('User must be logged in to fetch order');
      }

      console.log('OrderService: Authenticated user:', session.user.id);

      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.log('OrderService: Order not found:', orderId);
          return null;
        }
        console.error('OrderService: Error fetching order:', error);
        console.error('OrderService: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to fetch order: ${error.message}`);
      }

      if (!orderData) {
        console.log('OrderService: No order data returned for ID:', orderId);
        return null;
      }

      const formattedOrder = this.formatOrderWithItems(orderData);
      console.log('OrderService: Order fetched successfully:', orderId);

      return formattedOrder;
    } catch (error: any) {
      console.error('OrderService: Error in getOrderById:', error);
      throw error;
    }
  }

  /**
   * Update order status or details
   */
  async updateOrder(request: UpdateOrderRequest): Promise<Order> {
    try {
      console.log('OrderService: Updating order:', request.orderId, request);

      const updates: Partial<SupabaseOrder> = {};

      if (request.status) {
        updates.status = request.status;
      }

      if (request.trackingInfo) {
        updates.tracking_notes = request.trackingInfo;
      }

      if (request.estimatedDelivery) {
        updates.estimated_delivery_start = request.estimatedDelivery;
      }

      updates.updated_at = new Date().toISOString();

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', request.orderId)
        .select()
        .single();

      if (error || !updatedOrder) {
        console.error('OrderService: Order update failed:', error);
        throw new Error(error?.message || 'Failed to update order');
      }

      // Fetch updated order with items
      const order = await this.getOrderById(request.orderId);
      if (!order) {
        throw new Error('Failed to fetch updated order');
      }

      console.log('OrderService: Order updated successfully:', request.orderId);
      return order;
    } catch (error: any) {
      console.error('OrderService: Error updating order:', error);
      throw new Error(error.message || 'An unexpected error occurred while updating your order. Please try again.');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      console.log('OrderService: Cancelling order:', orderId);

      // Check if this is a guest order
      const isGuestOrder = orderId.startsWith('guest-order-');

      if (isGuestOrder) {
        // Guest orders are managed locally by OrdersContext
        // Just return true as the actual cancellation is handled there
        console.log('OrderService: Guest order cancellation handled locally');
        return true;
      }

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('OrderService: Order cancellation failed:', error);
        return false;
      }

      console.log('OrderService: Order cancelled successfully:', orderId);
      return true;
    } catch (error: any) {
      console.error('OrderService: Error cancelling order:', error);
      throw new Error(error.message || 'An unexpected error occurred while cancelling your order. Please try again.');
    }
  }

  /**
   * Get order statistics for user
   */
  async getOrderStats(userId: string): Promise<OrderStats> {
    try {
      console.log('OrderService: Fetching order stats for user:', userId);

      // Check if this is a guest user
      const isGuestUser = userId.startsWith('guest-');

      if (isGuestUser) {
        // Guest users don't have orders in the database
        // Stats are calculated locally by OrdersContext
        console.log('OrderService: Guest user detected, returning empty stats (managed locally)');
        return {
          total: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
        };
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('status')
        .eq('customer_id', userId);

      if (error) {
        console.error('OrderService: Error fetching order stats:', error);
        throw new Error(error.message);
      }

      const stats: OrderStats = {
        total: orders?.length || 0,
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        completed: orders?.filter(o => o.status === 'delivered').length || 0,
        cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
      };

      console.log('OrderService: Order stats calculated:', stats);
      return stats;
    } catch (error: any) {
      console.error('OrderService: Error in getOrderStats:', error);
      throw error;
    }
  }

  /**
   * Format Supabase order to interface format
   * @private
   */
  private formatOrder(supabaseOrder: SupabaseOrder, items: OrderItem[]): Order {
    return {
      id: supabaseOrder.id,
      customerName: supabaseOrder.customer_name,
      customerEmail: supabaseOrder.customer_email,
      deliveryAddress: supabaseOrder.delivery_address,
      paymentMethod: supabaseOrder.payment_method,
      totalAmount: supabaseOrder.total_amount,
      status: supabaseOrder.status as any,
      date: supabaseOrder.created_at,
      items,
    };
  }

  /**
   * Format Supabase order with items to interface format
   * @private
   */
  private formatOrderWithItems(orderData: OrderWithItems): Order {
    const items: OrderItem[] = orderData.order_items?.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      price: item.unit_price,
    })) || [];

    return {
      id: orderData.id,
      customerName: orderData.customer_name,
      customerEmail: orderData.customer_email,
      deliveryAddress: orderData.delivery_address,
      paymentMethod: orderData.payment_method,
      totalAmount: orderData.total_amount,
      status: orderData.status as any,
      date: orderData.created_at,
      items,
    };
  }
}

// Export singleton instance
export const orderService = OrderService.getInstance();
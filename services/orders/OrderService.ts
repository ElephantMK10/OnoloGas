import { supabase } from '../../lib/supabase';
import { withSession, isAuthError, log } from '../../lib/supabase';
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
      log.info('OrderService: Creating new order:', request);

      // Check if this is a guest user
      const isGuestUser = request.userId.startsWith('guest-');

      if (isGuestUser && request.customerEmail && request.customerEmail.trim() !== '') {
        log.warn('OrderService: WARNING - Guest user has email address, this might indicate authentication issue:', {
          userId: request.userId,
          email: request.customerEmail
        });
      }

      if (isGuestUser) {
        // Guest users don't have orders in the database
        // Orders are managed locally by OrdersContext
        log.info('OrderService: Creating guest order (will not be saved to database)');
        
        const guestOrder = this.createGuestOrder(request);
        return guestOrder;
      } else {
        // Authenticated users have orders saved to database
        log.info('OrderService: Creating authenticated user order (will be saved to database)');
        
        // Create the order record
        const orderRecord = {
          customer_id: request.userId,
          customer_name: request.customerName,
          customer_email: request.customerEmail,
          delivery_address: request.deliveryAddress,
          payment_method: request.paymentMethod,
          total_amount: request.totalAmount,
          status: 'pending',
          notes: request.notes,
          delivery_date: request.deliveryDate,
          preferred_delivery_window: request.preferredDeliveryWindow,
          shipping_address_snapshot: request.shippingAddressSnapshot || null,
        };

        log.info('OrderService: Creating order in database:', orderRecord);

        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert(orderRecord)
          .select()
          .single();

        if (orderError || !newOrder) {
          log.error('OrderService: Order creation failed:', orderError);
          log.error('OrderService: Error details:', {
            code: orderError?.code,
            message: orderError?.message,
            details: orderError?.details,
            hint: orderError?.hint
          });
          throw new Error(orderError?.message || 'Failed to create order');
        }

        log.info('OrderService: Order created successfully in database:', newOrder.id);

        // Create order items
        const orderItems = request.items.map(item => ({
          order_id: newOrder.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        log.info('OrderService: Creating order items:', orderItems);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          log.error('OrderService: Order items creation failed:', itemsError);
          throw new Error(itemsError.message || 'Failed to create order items');
        }

        const formattedOrder = this.formatOrder(newOrder, request.items);
        log.info('OrderService: Order created successfully:', formattedOrder.id);
        return formattedOrder;
      }
    } catch (error: any) {
      log.error('OrderService: Error creating order:', error);
      throw error;
    }
  }

  /**
   * Create a local order for guest users (not saved to database)
   */
  private async createGuestOrder(request: CreateOrderRequest): Promise<Order> {
    log.info('OrderService: Creating guest order locally:', request);

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
      log.error('OrderService: Failed to notify about guest order, but continuing:', error);
    }

    log.info('OrderService: Guest order created locally:', guestOrder.id);
    return guestOrder;
  }

  /**
   * Get orders for a specific user with optional filtering and pagination
   */
  async getOrders(userId: string, filters?: OrderFilters): Promise<Order[]> {
    return withSession(async (session) => {
      log.info('OrderService: Fetching orders for user:', userId);

      // Get the current session for user verification
      if (!session?.user) {
        throw new Error('User must be logged in to fetch orders');
      }

      log.info('OrderService: Authenticated user:', session.user.id, 'requesting orders for:', userId);

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
        log.error('OrderService: Error fetching orders:', error);
        log.error('OrderService: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Check for auth errors
        if (isAuthError(error)) {
          log.error('OrderService: Authentication error while fetching orders:', error);
          throw new Error('Session expired. Please sign in again.');
        }
        
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      const formattedOrders = ordersData?.map((orderData: OrderWithItems) =>
        this.formatOrderWithItems(orderData)
      ) || [];

      log.info(`OrderService: Fetched ${formattedOrders.length} orders`);
      return formattedOrders;
    });
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    return withSession(async (session) => {
      log.info('OrderService: Fetching order by ID:', orderId);

      // Get the current session for user verification
      if (!session?.user) {
        throw new Error('User must be logged in to fetch order');
      }

      log.info('OrderService: Authenticated user:', session.user.id);

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
          log.info('OrderService: Order not found:', orderId);
          return null;
        }
        
        log.error('OrderService: Error fetching order:', error);
        log.error('OrderService: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Check for auth errors
        if (isAuthError(error)) {
          log.error('OrderService: Authentication error while fetching order:', error);
          throw new Error('Session expired. Please sign in again.');
        }
        
        throw new Error(`Failed to fetch order: ${error.message}`);
      }

      if (!orderData) {
        log.info('OrderService: No order data returned for ID:', orderId);
        return null;
      }

      const formattedOrder = this.formatOrderWithItems(orderData);
      log.info('OrderService: Order fetched successfully:', orderId);

      return formattedOrder;
    });
  }

  /**
   * Update order status or details
   */
  async updateOrder(request: UpdateOrderRequest): Promise<Order> {
    try {
      log.info('OrderService: Updating order:', request.orderId, request);

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
        log.error('OrderService: Order update failed:', error);
        throw new Error(error?.message || 'Failed to update order');
      }

      // Fetch updated order with items
      const order = await this.getOrderById(request.orderId);
      if (!order) {
        throw new Error('Failed to fetch updated order');
      }

      log.info('OrderService: Order updated successfully:', request.orderId);
      return order;
    } catch (error: any) {
      log.error('OrderService: Error updating order:', error);
      throw new Error(error.message || 'An unexpected error occurred while updating your order. Please try again.');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      log.info('OrderService: Cancelling order:', orderId);

      // Check if this is a guest order
      const isGuestOrder = orderId.startsWith('guest-order-');

      if (isGuestOrder) {
        // Guest orders are managed locally by OrdersContext
        // Just return true as the actual cancellation is handled there
        log.info('OrderService: Guest order cancellation handled locally');
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
        log.error('OrderService: Order cancellation failed:', error);
        return false;
      }

      log.info('OrderService: Order cancelled successfully:', orderId);
      return true;
    } catch (error: any) {
      log.error('OrderService: Error cancelling order:', error);
      throw new Error(error.message || 'An unexpected error occurred while cancelling your order. Please try again.');
    }
  }

  /**
   * Get order statistics for user
   */
  async getOrderStats(userId: string): Promise<OrderStats> {
    try {
      log.info('OrderService: Fetching order stats for user:', userId);

      // Check if this is a guest user
      const isGuestUser = userId.startsWith('guest-');

      if (isGuestUser) {
        // Guest users don't have orders in the database
        // Stats are calculated locally by OrdersContext
        log.info('OrderService: Guest user detected, returning empty stats (managed locally)');
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
        log.error('OrderService: Error fetching order stats:', error);
        throw new Error(error.message);
      }

      const stats: OrderStats = {
        total: orders?.length || 0,
        pending: orders?.filter((o: { status: string }) => o.status === 'pending').length || 0,
        completed: orders?.filter((o: { status: string }) => o.status === 'delivered').length || 0,
        cancelled: orders?.filter((o: { status: string }) => o.status === 'cancelled').length || 0,
      };

      log.info('OrderService: Order stats calculated:', stats);
      return stats;
    } catch (error: any) {
      log.error('OrderService: Error in getOrderStats:', error);
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
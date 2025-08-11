import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderService } from '../services/orders/OrderService';
import { useAuth } from './AuthContext';
import { notifyOrderCreated, notifyOrderStatusChanged } from '../utils/dashboard-communication';
import { supabase } from '../lib/supabase';
import type { Order, CreateOrderRequest, OrderFilters } from '../services/interfaces/IOrderService';
import { guestOrderNotificationService } from '../services/notifications/GuestOrderNotificationService';

// Orders Context Types
interface OrdersContextType {
  orders: Order[];
  isLoading: boolean;
  isProcessingOrder: boolean;
  
  // Order methods
  createOrder: (orderData: Omit<CreateOrderRequest, 'userId'>) => Promise<Order>;
  getOrderById: (id: string) => Order | undefined;
  cancelOrder: (orderId: string) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  getOrderStats: () => Promise<{
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  }>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  // Auth context
  const { user, isAuthenticated } = useAuth();
  
  // Refs for cleanup
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Get storage key for user-specific orders
  const getOrdersStorageKey = useCallback((userId: string) => {
    return `@onolo_orders_${userId}`;
  }, []);

  // Load orders from storage (fallback)
  const loadOrdersFromStorage = useCallback(async () => {
    if (!user) return;

    try {
      console.log('OrdersContext: Loading orders from AsyncStorage for user:', user.id);
      const storageKey = getOrdersStorageKey(user.id);
      const storedOrders = await AsyncStorage.getItem(storageKey);
      if (storedOrders && isMountedRef.current) {
        const parsedOrders = JSON.parse(storedOrders);
        setOrders(parsedOrders);
        console.log(`OrdersContext: Loaded ${parsedOrders.length} orders from storage for user ${user.id}`);
      } else {
        // No orders found for this user
        setOrders([]);
      }
    } catch (error) {
      console.error('OrdersContext: Error loading orders from storage:', error);
      setOrders([]);
    }
  }, [user, getOrdersStorageKey]);

  // Load orders from service
  const loadOrders = useCallback(async () => {
    if (!user || user.isGuest) return;

    try {
      setIsLoading(true);
      console.log('OrdersContext: Loading orders for user:', user.id);

      const fetchedOrders = await orderService.getOrders(user.id, {
        limit: 100, // Load recent orders
      });

      if (isMountedRef.current) {
        setOrders(fetchedOrders);

        // Also save to user-specific storage as backup
        const storageKey = getOrdersStorageKey(user.id);
        await AsyncStorage.setItem(storageKey, JSON.stringify(fetchedOrders));

        console.log(`OrdersContext: Loaded ${fetchedOrders.length} orders`);
      }
    } catch (error) {
      console.error('OrdersContext: Error loading orders:', error);
      // Fallback to storage
      await loadOrdersFromStorage();
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, loadOrdersFromStorage, getOrdersStorageKey]);

  // Load orders when user changes
  useEffect(() => {
    if (user) {
      if (isAuthenticated && !user.isGuest) {
        loadOrders();
      } else {
        // Load orders from storage for guest users
        loadOrdersFromStorage();
      }
    } else {
      // Clear orders when logged out
      setOrders([]);
    }
  }, [user, isAuthenticated, loadOrders, loadOrdersFromStorage]);

  // Real-time subscriptions for order updates
  useEffect(() => {
    if (!user || user.isGuest || !isAuthenticated) return;

    console.log('OrdersContext: Setting up real-time subscriptions for user:', user.id);

    // Subscribe to order changes for this user
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('OrdersContext: Real-time order update received:', payload);

          // Refresh orders when any change occurs
          // This ensures we always have the latest status
          loadOrders();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or user change
    return () => {
      console.log('OrdersContext: Cleaning up real-time subscriptions');
      supabase.removeChannel(ordersChannel);
    };
  }, [user, isAuthenticated, loadOrders]);

  // Order methods
  const createOrder = useCallback(async (orderData: Omit<CreateOrderRequest, 'userId'>): Promise<Order> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setIsProcessingOrder(true);
      console.log('OrdersContext: Creating order:', orderData);

      // Add user information to order data
      const orderWithUser: CreateOrderRequest = {
        ...orderData,
        userId: user.id,
        customerName: orderData.customerName || user.name,
        customerEmail: orderData.customerEmail || user.email,
        customerPhone: orderData.customerPhone || user.phone,
      };

      const newOrder = await orderService.createOrder(orderWithUser);

      if (isMountedRef.current) {
        // Add to local state (real-time subscription might also add it, but this ensures immediate UI update)
        setOrders(prev => {
          const existingIndex = prev.findIndex(order => order.id === newOrder.id);
          if (existingIndex === -1) {
            return [newOrder, ...prev];
          }
          return prev;
        });

        // Update user-specific storage
        const updatedOrders = [newOrder, ...orders];
        const storageKey = getOrdersStorageKey(user.id);
        await AsyncStorage.setItem(storageKey, JSON.stringify(updatedOrders));

        // Notify dashboard about new order
        notifyOrderCreated(newOrder);
      }

      console.log('OrdersContext: Order created successfully:', newOrder.id);
      return newOrder;
    } catch (error: any) {
      console.error('OrdersContext: Error creating order:', error);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setIsProcessingOrder(false);
      }
    }
  }, [user, orders, getOrdersStorageKey]);

  const getOrderById = useCallback((id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  }, [orders]);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      console.log('OrdersContext: Cancelling order:', orderId);

      const success = await orderService.cancelOrder(orderId);

      if (success && isMountedRef.current) {
        // Find the order being cancelled for notification purposes
        const orderToCancel = orders.find(order => order.id === orderId);

        // Update local state
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId
              ? { ...order, status: 'cancelled' }
              : order
          )
        );

        // Update user-specific storage
        const updatedOrders = orders.map(order =>
          order.id === orderId
            ? { ...order, status: 'cancelled' }
            : order
        );
        const storageKey = getOrdersStorageKey(user.id);
        await AsyncStorage.setItem(storageKey, JSON.stringify(updatedOrders));

        // Notify about cancellation
        if (orderToCancel?.isGuestOrder) {
          // Notify about guest order cancellation
          try {
            await guestOrderNotificationService.notifyGuestOrderCancellation(
              orderId,
              orderToCancel.customerName
            );
          } catch (error) {
            console.error('OrdersContext: Failed to notify about guest order cancellation:', error);
          }
        } else {
          // Notify dashboard about authenticated user order status change
          notifyOrderStatusChanged(orderId, 'cancelled');
        }

        console.log('OrdersContext: Order cancelled successfully');
      }

      return success;
    } catch (error: any) {
      console.error('OrdersContext: Error cancelling order:', error);
      return false;
    }
  }, [orders, user, getOrdersStorageKey]);

  const refreshOrders = useCallback(async (): Promise<void> => {
    console.log('OrdersContext: Refreshing orders');
    if (user && isAuthenticated && !user.isGuest) {
      await loadOrders();
    } else {
      await loadOrdersFromStorage();
    }
  }, [user, isAuthenticated, loadOrders, loadOrdersFromStorage]);

  const getOrderStats = useCallback(async () => {
    if (!user || user.isGuest) {
      // Calculate stats from local orders for guest users
      return {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
      };
    }

    try {
      console.log('OrdersContext: Getting order stats');
      return await orderService.getOrderStats(user.id);
    } catch (error) {
      console.error('OrdersContext: Error getting order stats:', error);
      // Fallback to local calculation
      return {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
      };
    }
  }, [user, orders]);

  // Memoize methods separately to prevent unnecessary re-renders
  const methods = useMemo(() => ({
    createOrder,
    getOrderById,
    cancelOrder,
    refreshOrders,
    getOrderStats,
  }), [
    createOrder,
    getOrderById,
    cancelOrder,
    refreshOrders,
    getOrderStats,
  ]);

  // Memoize the context value with optimized dependencies
  const value: OrdersContextType = useMemo(() => ({
    orders,
    isLoading,
    isProcessingOrder,
    ...methods,
  }), [
    orders,
    isLoading,
    isProcessingOrder,
    methods,
  ]);

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
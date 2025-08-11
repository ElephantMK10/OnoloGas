import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orders/OrderService';
import { queryKeys, invalidateQueries } from '../../utils/queryClient';
import type { 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderFilters 
} from '../../services/interfaces/IOrderService';

// Orders list query
export const useOrders = (userId: string, filters?: OrderFilters) => {
  return useQuery({
    queryKey: queryKeys.orders.list(userId, filters),
    queryFn: () => orderService.getOrders(userId, filters),
    enabled: !!userId && userId !== 'guest', // Don't fetch for guest users
    staleTime: 2 * 60 * 1000, // 2 minutes - orders change more frequently
  });
};

// Single order query
export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute for individual orders
  });
};

// Order statistics query
export const useOrderStats = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.orders.stats(userId),
    queryFn: () => orderService.getOrderStats(userId),
    enabled: !!userId && userId !== 'guest',
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
  });
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => orderService.createOrder(orderData),
    onSuccess: (newOrder, variables) => {
      console.log('Order created successfully:', newOrder.id);
      
      // Invalidate orders list for this user
      invalidateQueries.orders();
      
      // Add the new order to the cache
      queryClient.setQueryData(
        queryKeys.orders.detail(newOrder.id), 
        newOrder
      );
      
      // Update orders list cache if it exists
      const ordersQueryKey = queryKeys.orders.list(newOrder.customerName, undefined);
      queryClient.setQueryData(ordersQueryKey, (oldData: any) => {
        if (oldData) {
          return [newOrder, ...oldData];
        }
        return oldData;
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.stats(newOrder.customerName) 
      });
    },
    onError: (error) => {
      console.error('Create order mutation error:', error);
    },
  });
};

// Update order mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updateData: UpdateOrderRequest) => orderService.updateOrder(updateData),
    onSuccess: (updatedOrder, variables) => {
      console.log('Order updated successfully:', updatedOrder.id);
      
      // Update the specific order in cache
      queryClient.setQueryData(
        queryKeys.orders.detail(updatedOrder.id), 
        updatedOrder
      );
      
      // Invalidate orders list to refetch with updated data
      invalidateQueries.orders();
      
      // Update orders list cache if it exists
      queryClient.setQueriesData(
        { queryKey: queryKeys.orders.all },
        (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            );
          }
          return oldData;
        }
      );
    },
    onError: (error) => {
      console.error('Update order mutation error:', error);
    },
  });
};

// Cancel order mutation
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => orderService.cancelOrder(orderId),
    onSuccess: (success, orderId) => {
      if (success) {
        console.log('Order cancelled successfully:', orderId);
        
        // Invalidate all order queries to refetch fresh data
        invalidateQueries.orders();
        
        // Optimistically update the order status in cache
        queryClient.setQueryData(
          queryKeys.orders.detail(orderId),
          (oldData: any) => {
            if (oldData) {
              return { ...oldData, status: 'cancelled' };
            }
            return oldData;
          }
        );
        
        // Update orders list cache
        queryClient.setQueriesData(
          { queryKey: queryKeys.orders.all },
          (oldData: any) => {
            if (Array.isArray(oldData)) {
              return oldData.map(order => 
                order.id === orderId ? { ...order, status: 'cancelled' } : order
              );
            }
            return oldData;
          }
        );
      }
    },
    onError: (error) => {
      console.error('Cancel order mutation error:', error);
    },
  });
};

// Combined orders hook for convenience
export const useOrdersData = (userId: string, filters?: OrderFilters) => {
  const ordersQuery = useOrders(userId, filters);
  const statsQuery = useOrderStats(userId);
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const cancelOrderMutation = useCancelOrder();
  
  return {
    // Data
    orders: ordersQuery.data || [],
    stats: statsQuery.data,
    
    // Loading states
    isLoading: ordersQuery.isLoading || statsQuery.isLoading,
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderMutation.isPending,
    isCancelling: cancelOrderMutation.isPending,
    
    // Error states
    ordersError: ordersQuery.error,
    statsError: statsQuery.error,
    createError: createOrderMutation.error,
    updateError: updateOrderMutation.error,
    cancelError: cancelOrderMutation.error,
    
    // Actions
    createOrder: createOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    cancelOrder: cancelOrderMutation.mutateAsync,
    
    // Refetch functions
    refetchOrders: ordersQuery.refetch,
    refetchStats: statsQuery.refetch,
    
    // Utility functions
    getOrderById: (orderId: string) => {
      return ordersQuery.data?.find(order => order.id === orderId);
    },
  };
};
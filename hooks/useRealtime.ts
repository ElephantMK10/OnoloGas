import { useEffect, useRef, useState } from 'react';
import { realtimeManager } from '../services/realtime/RealtimeManager';
import type { ChannelConfig } from '../services/realtime/RealtimeManager';

export interface UseRealtimeOptions {
  enabled?: boolean;
  autoCleanup?: boolean;
}

export const useRealtime = (
  config: ChannelConfig,
  options: UseRealtimeOptions = {}
) => {
  const { enabled = true, autoCleanup = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<any>(null);
  const channelRef = useRef<any>(null);
  const configRef = useRef(config);
  
  // Update config ref when config changes
  configRef.current = config;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log('useRealtime: Setting up realtime subscription for', config.name);

    // Enhanced config with status tracking
    const enhancedConfig: ChannelConfig = {
      ...configRef.current,
      onSubscribed: () => {
        console.log('useRealtime: Channel subscribed successfully');
        setIsSubscribed(true);
        setError(null);
        configRef.current.onSubscribed?.();
      },
      onError: (error) => {
        console.error('useRealtime: Channel error:', error);
        setIsSubscribed(false);
        setError(error);
        configRef.current.onError?.(error);
      },
      onClosed: () => {
        console.log('useRealtime: Channel closed');
        setIsSubscribed(false);
        configRef.current.onClosed?.();
      },
    };

    // Subscribe to channel
    try {
      channelRef.current = realtimeManager.subscribe(enhancedConfig);
    } catch (error) {
      console.error('useRealtime: Error subscribing to channel:', error);
      setError(error);
    }

    // Monitor connection status
    const unsubscribeConnection = realtimeManager.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setIsSubscribed(false);
      }
    });

    // Set initial connection status
    setIsConnected(realtimeManager.isRealtimeConnected());

    // Cleanup function
    return () => {
      console.log('useRealtime: Cleaning up subscription for', config.name);
      
      if (autoCleanup && config.name) {
        realtimeManager.unsubscribe(config.name);
      }
      
      unsubscribeConnection();
      setIsSubscribed(false);
      setIsConnected(false);
    };
  }, [enabled, autoCleanup, config.name]);

  // Manual control functions
  const subscribe = () => {
    if (channelRef.current) {
      realtimeManager.unsubscribe(config.name);
    }
    channelRef.current = realtimeManager.subscribe(configRef.current);
  };

  const unsubscribe = () => {
    if (config.name) {
      realtimeManager.unsubscribe(config.name);
      setIsSubscribed(false);
    }
  };

  const sendMessage = async (eventName: string, payload: any) => {
    if (!isSubscribed || !config.name) {
      throw new Error('Channel not subscribed or no channel name provided');
    }
    
    return realtimeManager.sendMessage(config.name, eventName, payload);
  };

  return {
    isConnected,
    isSubscribed,
    error,
    subscribe,
    unsubscribe,
    sendMessage,
    channel: channelRef.current,
    channelInfo: config.name ? realtimeManager.getChannelInfo(config.name) : undefined,
  };
};

// Hook for monitoring overall realtime connection
export const useRealtimeConnection = () => {
  const [status, setStatus] = useState(realtimeManager.getConnectionStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(realtimeManager.getConnectionStatus());
    };

    // Update status when connection changes
    const unsubscribeConnection = realtimeManager.onConnectionChange(() => {
      updateStatus();
    });

    // Update status on errors
    const unsubscribeError = realtimeManager.onError(() => {
      updateStatus();
    });

    // Set initial status
    updateStatus();

    return () => {
      unsubscribeConnection();
      unsubscribeError();
    };
  }, []);

  const forceReconnect = () => {
    realtimeManager.forceReconnect();
  };

  return {
    ...status,
    forceReconnect,
  };
};
import { supabase } from '../../lib/supabase';
import type { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';

export interface ChannelConfig {
  name: string;
  onSubscribed?: () => void;
  onError?: (error: any) => void;
  onClosed?: () => void;
  events?: {
    [eventName: string]: (payload: any) => void;
  };
  presence?: {
    key: string;
    initialState?: Record<string, any>;
    onJoin?: (key: string, currentPresences: any, newPresence: any) => void;
    onLeave?: (key: string, currentPresences: any, leftPresence: any) => void;
    onSync?: () => void;
  };
}

export interface ChannelInfo {
  name: string;
  channel: RealtimeChannel;
  config: ChannelConfig;
  status: 'subscribing' | 'subscribed' | 'error' | 'closed';
  error?: any;
}

export class RealtimeManager {
  private static instance: RealtimeManager;
  private channels: Map<string, ChannelInfo> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  
  // Event handlers
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private errorHandlers: Set<(error: any) => void> = new Set();

  // Add a simple event emitter for realtime errors
  private static realtimeErrorListeners: ((error: any) => void)[] = [];

  // Singleton pattern
  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  private constructor() {
    this.setupConnectionMonitoring();
  }

  /**
   * Set up connection monitoring
   */
  private setupConnectionMonitoring(): void {
    console.log('RealtimeManager: Setting up connection monitoring');
    // Remove supabase.realtime.onOpen, onClose, onError usage (not available in v2)
    // Use channel events and error handling for connection status instead
    // This function can be left empty or used for custom monitoring if needed
  }

  /**
   * Handle automatic reconnection with exponential backoff
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('RealtimeManager: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`RealtimeManager: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.reconnectAllChannels();
    }, delay);
  }

  /**
   * Reconnect all existing channels
   */
  private reconnectAllChannels(): void {
    console.log('RealtimeManager: Reconnecting all channels');
    
    for (const [channelName, channelInfo] of this.channels) {
      try {
        // Unsubscribe old channel
        channelInfo.channel.unsubscribe();
        
        // Create new subscription
        this.subscribe(channelInfo.config);
      } catch (error) {
        console.error(`RealtimeManager: Error reconnecting channel ${channelName}:`, error);
      }
    }
  }

  /**
   * Subscribe to a realtime channel
   */
  subscribe(config: ChannelConfig): RealtimeChannel {
    console.log('RealtimeManager: Subscribing to channel:', config.name);

    // Remove existing channel if it exists
    this.unsubscribe(config.name);

    // Create new channel
    const channel = supabase.channel(config.name, {
      config: {
        presence: config.presence ? { key: config.presence.key } : undefined,
      },
    });

    // Store channel info
    const channelInfo: ChannelInfo = {
      name: config.name,
      channel,
      config,
      status: 'subscribing',
    };

    this.channels.set(config.name, channelInfo);

    // Set up event listeners
    if (config.events) {
      Object.entries(config.events).forEach(([eventName, handler]) => {
        channel.on(eventName as any, handler);
      });
    }

    // Set up presence if configured
    if (config.presence) {
      const { onJoin, onLeave, onSync, initialState } = config.presence;

      if (onJoin) {
        channel.on('presence', { event: 'join' }, onJoin);
      }

      if (onLeave) {
        channel.on('presence', { event: 'leave' }, onLeave);
      }

      if (onSync) {
        channel.on('presence', { event: 'sync' }, onSync);
      }

      // Track presence if initial state provided
      if (initialState) {
        channel.track(initialState);
      }
    }

    // Subscribe to channel with status callbacks
    channel.subscribe((status, error) => {
      console.log(`RealtimeManager: Channel ${config.name} status:`, status);
      
      channelInfo.status = status as any;
      
      if (error) {
        channelInfo.error = error;
        console.error(`RealtimeManager: Channel ${config.name} error:`, error);
        config.onError?.(error);
        this.notifyErrorHandlers(error);
        // Notify UI listeners
        RealtimeManager.realtimeErrorListeners.forEach(fn => fn(error));
      } else {
        channelInfo.error = undefined;
      }

      switch (status) {
        case 'SUBSCRIBED':
          console.log(`RealtimeManager: Successfully subscribed to ${config.name}`);
          config.onSubscribed?.();
          break;
        case 'CHANNEL_ERROR':
          console.error(`RealtimeManager: Channel error for ${config.name}:`, error);
          config.onError?.(error);
          // Notify UI listeners
          RealtimeManager.realtimeErrorListeners.forEach(fn => fn(error));
          break;
        case 'TIMED_OUT':
          console.error(`RealtimeManager: Channel timeout for ${config.name}`);
          config.onError?.(new Error('Channel subscription timed out'));
          // Notify UI listeners
          RealtimeManager.realtimeErrorListeners.forEach(fn => fn(new Error('Channel subscription timed out')));
          break;
        case 'CLOSED':
          console.log(`RealtimeManager: Channel ${config.name} closed`);
          config.onClosed?.();
          // Notify UI listeners
          RealtimeManager.realtimeErrorListeners.forEach(fn => fn(new Error('Realtime connection closed')));
          break;
      }
    });

    return channel;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channelInfo = this.channels.get(channelName);
    
    if (channelInfo) {
      console.log('RealtimeManager: Unsubscribing from channel:', channelName);
      
      try {
        channelInfo.channel.unsubscribe();
      } catch (error) {
        console.error(`RealtimeManager: Error unsubscribing from ${channelName}:`, error);
      }
      
      this.channels.delete(channelName);
    }
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(
    channelName: string, 
    eventName: string, 
    payload: any
  ): Promise<RealtimeChannelSendResponse> {
    const channelInfo = this.channels.get(channelName);
    
    if (!channelInfo) {
      throw new Error(`Channel ${channelName} not found`);
    }

    if (channelInfo.status !== 'subscribed') {
      throw new Error(`Channel ${channelName} is not subscribed (status: ${channelInfo.status})`);
    }

    console.log(`RealtimeManager: Sending message to ${channelName}:`, eventName, payload);
    
    return channelInfo.channel.send({
      type: 'broadcast',
      event: eventName,
      payload,
    });
  }

  /**
   * Get channel information
   */
  getChannelInfo(channelName: string): ChannelInfo | undefined {
    return this.channels.get(channelName);
  }

  /**
   * Get all channel names
   */
  getChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if connected to realtime
   */
  isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    channelCount: number;
    channels: { name: string; status: string }[];
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      channelCount: this.channels.size,
      channels: Array.from(this.channels.values()).map(info => ({
        name: info.name,
        status: info.status,
      })),
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Event listeners for connection changes
   */
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onError(handler: (error: any) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Notify connection handlers
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('RealtimeManager: Error in connection handler:', error);
      }
    });
  }

  /**
   * Notify error handlers
   */
  private notifyErrorHandlers(error: any): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('RealtimeManager: Error in error handler:', handlerError);
      }
    });
  }

  /**
   * Cleanup all channels and handlers
   */
  cleanup(): void {
    console.log('RealtimeManager: Cleaning up all channels and handlers');
    
    // Unsubscribe from all channels
    for (const channelName of this.channels.keys()) {
      this.unsubscribe(channelName);
    }
    
    // Clear handlers
    this.connectionHandlers.clear();
    this.errorHandlers.clear();
    
    // Reset state
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Force reconnection
   */
  forceReconnect(): void {
    console.log('RealtimeManager: Forcing reconnection');
    this.reconnectAttempts = 0;
    this.reconnectAllChannels();
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance();

// Add a simple event emitter for realtime errors
export function addRealtimeErrorListener(listener: (error: any) => void) {
  RealtimeManager.realtimeErrorListeners.push(listener);
}

export function removeRealtimeErrorListener(listener: (error: any) => void) {
  const idx = RealtimeManager.realtimeErrorListeners.indexOf(listener);
  if (idx !== -1) RealtimeManager.realtimeErrorListeners.splice(idx, 1);
}
import { supabase } from '../../lib/supabase';
import type { 
  IMessageService, 
  Message, 
  CreateMessageRequest, 
  MessageFilters, 
  ConversationSummary 
} from '../interfaces/IMessageService';
import type { 
  SupabaseMessage, 
  MessageEventHandler, 
  MessageUpdateHandler, 
  UnreadCountHandler 
} from './types';

export class MessageService implements IMessageService {
  private static instance: MessageService;

  // Event handlers for real-time updates
  private messageHandlers: Set<MessageEventHandler> = new Set();
  private updateHandlers: Set<MessageUpdateHandler> = new Set();
  private unreadCountHandlers: Set<UnreadCountHandler> = new Set();

  // Real-time subscription management
  private realtimeChannels: Map<string, any> = new Map();

  // Singleton pattern to ensure one instance
  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Send a new message
   */
  async sendMessage(request: CreateMessageRequest): Promise<Message> {
    try {
      console.log('MessageService: Sending message:', request);

      const messageRecord = {
        user_id: request.userId,
        customer_id: request.userId,
        staff_id: request.senderType === 'staff' ? request.userId : null,
        log_type: request.logType || 'user_message',
        subject: request.subject,
        message: request.message,
        sender_type: request.senderType || 'customer',
        is_read: false,
      };

      const { data: newMessage, error } = await supabase
        .from('communication_logs')
        .insert(messageRecord)
        .select()
        .single();

      if (error || !newMessage) {
        console.error('MessageService: Message creation failed:', error);
        throw new Error(error?.message || 'Failed to send message');
      }

      const formattedMessage = this.formatMessage(newMessage);
      console.log('MessageService: Message sent successfully:', formattedMessage.id);
      
      // Emit message event to listeners immediately after sending
      this.emitMessageReceived(formattedMessage);
      
      return formattedMessage;
    } catch (error: any) {
      console.error('MessageService: Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get all messages for a user
   */
  async getMessages(userId: string, filters?: MessageFilters): Promise<Message[]> {
    try {
      console.log('MessageService: Fetching messages for user:', userId, filters);

      let query = supabase
        .from('communication_logs')
        .select('*')
        .eq('customer_id', userId);

      // Apply filters
      if (filters?.logType) {
        query = query.eq('log_type', filters.logType);
      }

      if (filters?.senderType) {
        query = query.eq('sender_type', filters.senderType);
      }

      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
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

      // Order by creation date (oldest first for proper chat flow)
      query = query.order('created_at', { ascending: true });

      const { data: messagesData, error } = await query;

      if (error) {
        console.error('MessageService: Error fetching messages:', error);
        throw new Error(error.message);
      }

      const formattedMessages = messagesData?.map(msg => this.formatMessage(msg)) || [];
      console.log(`MessageService: Fetched ${formattedMessages.length} messages`);
      
      return formattedMessages;
    } catch (error: any) {
      console.error('MessageService: Error in getMessages:', error);
      throw error;
    }
  }

  /**
   * Mark a specific message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      console.log('MessageService: Marking message as read:', messageId);

      const { error } = await supabase
        .from('communication_logs')
        .update({ 
          is_read: true,
        })
        .eq('id', messageId);

      if (error) {
        console.error('MessageService: Error marking message as read:', error);
        throw new Error(error.message);
      }

      console.log('MessageService: Message marked as read successfully:', messageId);
      
      // Emit update event to listeners
      this.emitMessageUpdated(messageId, { isRead: true });
    } catch (error: any) {
      console.error('MessageService: Error in markAsRead:', error);
      throw error;
    }
  }

  /**
   * Mark all messages as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      console.log('MessageService: Marking all messages as read for user:', userId);

      const { data, error } = await supabase
        .from('communication_logs')
        .update({ is_read: true })
        .eq('customer_id', userId)
        .eq('is_read', false)
        .select('id');

      if (error) {
        console.error('MessageService: Error marking all messages as read:', error);
        throw new Error(error.message);
      }

      console.log('MessageService: All messages marked as read successfully');
      
      // Emit events for each updated message
      if (data && data.length > 0) {
        data.forEach(msg => {
          this.emitMessageUpdated(msg.id, { isRead: true });
        });
      }
      
      // Update unread count
      this.emitUnreadCountChanged(0);
    } catch (error: any) {
      console.error('MessageService: Error in markAllAsRead:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      console.log('MessageService: Getting unread count for user:', userId);

      const { count, error } = await supabase
        .from('communication_logs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', userId)
        .eq('is_read', false)
        .eq('sender_type', 'staff');

      if (error) {
        console.error('MessageService: Error getting unread count:', error);
        throw new Error(error.message);
      }

      const unreadCount = count || 0;
      console.log(`MessageService: Unread count: ${unreadCount}`);
      
      return unreadCount;
    } catch (error: any) {
      console.error('MessageService: Error in getUnreadCount:', error);
      throw error;
    }
  }

  /**
   * Get conversation summary for user
   */
  async getConversationSummary(userId: string): Promise<ConversationSummary> {
    try {
      console.log('MessageService: Getting conversation summary for user:', userId);

      // Get total message count
      const { count: totalCount, error: totalError } = await supabase
        .from('communication_logs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', userId);

      if (totalError) {
        throw new Error(totalError.message);
      }

      // Get unread count
      const unreadCount = await this.getUnreadCount(userId);

      // Get last message
      const { data: lastMessage, error: lastError } = await supabase
        .from('communication_logs')
        .select('created_at, sender_type')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastError && lastError.code !== 'PGRST116') {
        throw new Error(lastError.message);
      }

      const summary: ConversationSummary = {
        totalMessages: totalCount || 0,
        unreadCount,
        lastMessageDate: lastMessage?.created_at || new Date().toISOString(),
        lastMessageSender: (lastMessage?.sender_type as any) || 'customer',
      };

      console.log('MessageService: Conversation summary:', summary);
      return summary;
    } catch (error: any) {
      console.error('MessageService: Error in getConversationSummary:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      console.log('MessageService: Deleting message:', messageId);

      const { error } = await supabase
        .from('communication_logs')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('MessageService: Error deleting message:', error);
        return false;
      }

      console.log('MessageService: Message deleted successfully:', messageId);
      return true;
    } catch (error: any) {
      console.error('MessageService: Error in deleteMessage:', error);
      return false;
    }
  }

  /**
   * Get messages by conversation date
   */
  async getMessagesByDate(userId: string, date: string): Promise<Message[]> {
    try {
      console.log('MessageService: Getting messages by date:', userId, date);

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const { data: messagesData, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('customer_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('MessageService: Error getting messages by date:', error);
        throw new Error(error.message);
      }

      const formattedMessages = messagesData?.map(msg => this.formatMessage(msg)) || [];
      console.log(`MessageService: Fetched ${formattedMessages.length} messages for date ${date}`);
      
      return formattedMessages;
    } catch (error: any) {
      console.error('MessageService: Error in getMessagesByDate:', error);
      throw error;
    }
  }

  /**
   * Event subscription methods for real-time updates
   */
  
  /**
   * Subscribe to new message events
   */
  onMessageReceived(handler: MessageEventHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to message update events
   */
  onMessageUpdated(handler: MessageUpdateHandler): () => void {
    this.updateHandlers.add(handler);
    return () => this.updateHandlers.delete(handler);
  }

  /**
   * Subscribe to unread count changes
   */
  onUnreadCountChanged(handler: UnreadCountHandler): () => void {
    this.unreadCountHandlers.add(handler);
    return () => this.unreadCountHandlers.delete(handler);
  }

  /**
   * Set up real-time subscription for a user's messages
   */
  setupRealtimeSubscription(userId: string): () => void {
    if (!userId || userId === 'guest') {
      console.log('MessageService: Skipping realtime setup for guest user');
      return () => {};
    }

    const channelName = `messages-${userId}`;

    // Clean up existing subscription for this user
    this.cleanupRealtimeSubscription(userId);

    console.log('MessageService: Setting up realtime subscription for user:', userId);

    // Create new channel for this user's messages
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'communication_logs',
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => {
          console.log('MessageService: Real-time message update received:', payload);
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    // Store channel for cleanup
    this.realtimeChannels.set(userId, channel);

    // Return cleanup function
    return () => this.cleanupRealtimeSubscription(userId);
  }

  /**
   * Clean up real-time subscription for a user
   */
  private cleanupRealtimeSubscription(userId: string): void {
    const existingChannel = this.realtimeChannels.get(userId);
    if (existingChannel) {
      console.log('MessageService: Cleaning up realtime subscription for user:', userId);
      existingChannel.unsubscribe();
      supabase.removeChannel(existingChannel);
      this.realtimeChannels.delete(userId);
    }
  }

  /**
   * Handle real-time updates from Supabase
   */
  private handleRealtimeUpdate(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    try {
      if (eventType === 'INSERT' && newRecord) {
        // New message received
        const formattedMessage = this.formatMessage(newRecord);
        console.log('MessageService: New message from realtime:', formattedMessage.id);
        this.emitMessageReceived(formattedMessage);

        // Update unread count if it's from staff
        if (formattedMessage.senderType === 'staff' && !formattedMessage.isRead) {
          this.emitUnreadCountChanged();
        }
      } else if (eventType === 'UPDATE' && newRecord) {
        // Message updated
        const formattedMessage = this.formatMessage(newRecord);
        console.log('MessageService: Message updated from realtime:', formattedMessage.id);
        this.emitMessageUpdated(formattedMessage.id, formattedMessage);

        // Update unread count if read status changed
        if (oldRecord && oldRecord.is_read !== newRecord.is_read) {
          this.emitUnreadCountChanged();
        }
      }
    } catch (error) {
      console.error('MessageService: Error handling realtime update:', error);
    }
  }

  /**
   * Emit unread count changed event (triggers count refresh)
   */
  private async emitUnreadCountChanged(): Promise<void> {
    // We don't have the userId here, so we emit a generic event
    // The context will handle refreshing the count
    this.unreadCountHandlers.forEach(handler => {
      try {
        handler(-1); // -1 indicates a refresh is needed
      } catch (error) {
        console.error('MessageService: Error in unread count handler:', error);
      }
    });
  }

  /**
   * Emit new message event to subscribers
   */
  private emitMessageReceived(message: Message): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('MessageService: Error in message handler:', error);
      }
    });
  }

  /**
   * Emit message update event to subscribers
   */
  private emitMessageUpdated(messageId: string, updates: Partial<Message>): void {
    this.updateHandlers.forEach(handler => {
      try {
        handler(messageId, updates);
      } catch (error) {
        console.error('MessageService: Error in update handler:', error);
      }
    });
  }

  /**
   * Emit unread count change event to subscribers
   */
  private emitUnreadCountChanged(count: number): void {
    this.unreadCountHandlers.forEach(handler => {
      try {
        handler(count);
      } catch (error) {
        console.error('MessageService: Error in unread count handler:', error);
      }
    });
  }

  /**
   * Format Supabase message to interface format
   * @private
   */
  private formatMessage(supabaseMessage: SupabaseMessage): Message {
    return {
      id: supabaseMessage.id,
      userId: supabaseMessage.user_id,
      customerId: supabaseMessage.customer_id,
      staffId: supabaseMessage.staff_id,
      logType: supabaseMessage.log_type as any,
      subject: supabaseMessage.subject || supabaseMessage.message,
      message: supabaseMessage.message,
      senderType: supabaseMessage.sender_type as any,
      isRead: supabaseMessage.is_read,
      createdAt: supabaseMessage.created_at,
    };
  }

  /**
   * Clean up all event handlers and real-time subscriptions
   */
  public cleanup(): void {
    console.log('MessageService: Cleaning up event handlers and realtime subscriptions');
    this.messageHandlers.clear();
    this.updateHandlers.clear();
    this.unreadCountHandlers.clear();

    // Clean up all real-time subscriptions
    this.realtimeChannels.forEach((channel, userId) => {
      this.cleanupRealtimeSubscription(userId);
    });
  }
}

// Export singleton instance
export const messageService = MessageService.getInstance();
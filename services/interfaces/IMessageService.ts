export interface Message {
  id: string;
  userId: string;
  customerId: string;
  staffId?: string;
  logType: MessageType;
  subject: string;
  message: string;
  senderType: SenderType;
  isRead: boolean;
  createdAt: string;
  _clientKey?: string; // Optional client-side key for React rendering
}

export type MessageType = 'user_message' | 'staff_message' | 'order_status_update';
export type SenderType = 'customer' | 'staff';

export interface CreateMessageRequest {
  userId: string;
  subject: string;
  message: string;
  logType?: MessageType;
  senderType?: SenderType;
  orderId?: string;
}

export interface MessageFilters {
  logType?: MessageType;
  senderType?: SenderType;
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationSummary {
  totalMessages: number;
  unreadCount: number;
  lastMessageDate: string;
  lastMessageSender: SenderType;
}

export interface IMessageService {
  /**
   * Send a new message
   */
  sendMessage(request: CreateMessageRequest): Promise<Message>;
  
  /**
   * Get all messages for a user
   */
  getMessages(userId: string, filters?: MessageFilters): Promise<Message[]>;
  
  /**
   * Mark a specific message as read
   */
  markAsRead(messageId: string): Promise<void>;
  
  /**
   * Mark all messages as read for a user
   */
  markAllAsRead(userId: string): Promise<void>;
  
  /**
   * Get unread message count for user
   */
  getUnreadCount(userId: string): Promise<number>;
  
  /**
   * Get conversation summary for user
   */
  getConversationSummary(userId: string): Promise<ConversationSummary>;
  
  /**
   * Delete a message
   */
  deleteMessage(messageId: string): Promise<boolean>;
  
  /**
   * Get messages by conversation date
   */
  getMessagesByDate(userId: string, date: string): Promise<Message[]>;
}
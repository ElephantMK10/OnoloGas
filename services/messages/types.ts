import type { 
  Message as IMessage, 
  MessageType as IMessageType,
  SenderType as ISenderType,
  CreateMessageRequest as ICreateMessageRequest,
  MessageFilters as IMessageFilters,
  ConversationSummary as IConversationSummary
} from '../interfaces';

// Re-export interface types for consistency
export type { 
  IMessage as Message, 
  IMessageType as MessageType,
  ISenderType as SenderType,
  ICreateMessageRequest as CreateMessageRequest,
  IMessageFilters as MessageFilters,
  IConversationSummary as ConversationSummary
};

// Supabase-specific types
export interface SupabaseMessage {
  id: string;
  user_id: string;
  customer_id: string;
  staff_id?: string;
  log_type: string;
  subject: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageError {
  message: string;
  code?: string;
  details?: any;
}

export interface RealtimeMessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: SupabaseMessage;
  old?: SupabaseMessage;
}

export type MessageEventHandler = (message: Message) => void;
export type MessageUpdateHandler = (messageId: string, updates: Partial<Message>) => void;
export type UnreadCountHandler = (count: number) => void;
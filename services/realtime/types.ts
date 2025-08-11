export interface RealtimeConfig {
  heartbeatInterval?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enableLogging?: boolean;
}

export interface ChannelEvent {
  type: string;
  event: string;
  payload: any;
  ref?: string;
}

export interface PresenceState {
  [key: string]: any;
}

export interface PresenceEvent {
  event: 'join' | 'leave' | 'sync';
  key: string;
  currentPresences: PresenceState;
  newPresence?: PresenceState;
  leftPresence?: PresenceState;
}

export type ChannelStatus = 
  | 'subscribing' 
  | 'subscribed' 
  | 'error' 
  | 'closed' 
  | 'timed_out';

export interface RealtimeError {
  message: string;
  code?: string;
  details?: any;
}

export type EventHandler = (payload: any) => void;
export type StatusHandler = (status: ChannelStatus, error?: any) => void;
export type PresenceHandler = (event: PresenceEvent) => void;
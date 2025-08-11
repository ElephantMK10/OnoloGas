export interface Message {
  id: string;
  user_id: string;
  customer_id: string;
  staff_id?: string;
  log_type: 'user_message' | 'staff_message' | 'order_status_update';
  subject: string;
  message: string;
  sender_type: 'customer' | 'staff';
  is_read: boolean;
  created_at: string;
}
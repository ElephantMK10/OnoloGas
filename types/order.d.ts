export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  paymentMethod: string;
  totalAmount: number;
  items: Array<{ productId: string; quantity: number }>;
  status: string;
  date: string;
}

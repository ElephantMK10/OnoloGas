import type { Order } from '../interfaces/IOrderService';

/**
 * Service to handle notifications for guest orders
 * Since guest orders are stored locally and not in the database,
 * we need to notify the business about these orders through other means
 */
export class GuestOrderNotificationService {
  private static instance: GuestOrderNotificationService;
  
  // Singleton pattern
  public static getInstance(): GuestOrderNotificationService {
    if (!GuestOrderNotificationService.instance) {
      GuestOrderNotificationService.instance = new GuestOrderNotificationService();
    }
    return GuestOrderNotificationService.instance;
  }

  /**
   * Notify about a new guest order
   * This could be enhanced to send emails, SMS, or push notifications
   */
  async notifyGuestOrder(order: Order): Promise<void> {
    try {
      console.log('GuestOrderNotificationService: Notifying about guest order:', order.id);
      
      // For now, we'll log the order details
      // In a production environment, this could:
      // 1. Send an email to the business
      // 2. Send a webhook to the management system
      // 3. Store in a separate notification queue
      // 4. Send SMS to business phone
      
      const orderSummary = {
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        items: order.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price
        })),
        notes: order.notes,
        deliveryDate: order.deliveryDate,
        preferredDeliveryWindow: order.preferredDeliveryWindow,
        timestamp: new Date().toISOString(),
        isGuestOrder: true
      };

      // Log the order for now (could be replaced with actual notification service)
      console.log('🔔 NEW GUEST ORDER RECEIVED:', JSON.stringify(orderSummary, null, 2));
      
      // TODO: Implement actual notification mechanisms:
      // await this.sendEmailNotification(orderSummary);
      // await this.sendWebhookNotification(orderSummary);
      // await this.sendSMSNotification(orderSummary);
      
    } catch (error) {
      console.error('GuestOrderNotificationService: Error notifying about guest order:', error);
      // Don't throw error to avoid breaking the order creation flow
    }
  }

  /**
   * Notify about a cancelled guest order
   */
  async notifyGuestOrderCancellation(orderId: string, customerName: string): Promise<void> {
    try {
      console.log('GuestOrderNotificationService: Notifying about guest order cancellation:', orderId);
      
      const cancellationSummary = {
        orderId,
        customerName,
        action: 'cancelled',
        timestamp: new Date().toISOString(),
        isGuestOrder: true
      };

      console.log('🔔 GUEST ORDER CANCELLED:', JSON.stringify(cancellationSummary, null, 2));
      
      // TODO: Implement actual notification mechanisms
      
    } catch (error) {
      console.error('GuestOrderNotificationService: Error notifying about guest order cancellation:', error);
    }
  }

  // Future enhancement methods (commented out for now)
  
  /*
  private async sendEmailNotification(orderSummary: any): Promise<void> {
    // Implementation for email notifications
    // Could use services like SendGrid, AWS SES, etc.
  }

  private async sendWebhookNotification(orderSummary: any): Promise<void> {
    // Implementation for webhook notifications to management system
    // Could POST to a webhook endpoint that adds the order to the dashboard
  }

  private async sendSMSNotification(orderSummary: any): Promise<void> {
    // Implementation for SMS notifications
    // Could use services like Twilio, AWS SNS, etc.
  }
  */
}

// Export singleton instance
export const guestOrderNotificationService = GuestOrderNotificationService.getInstance();

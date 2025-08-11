# Dashboard Integration Configuration

## Overview
This document outlines the complete configuration for integrating the Onolo User App with the Dashboard/Management App, including URL configurations, CORS settings, and communication protocols.

## URL Configuration

### User App (Customer-facing)
- **Primary Domain**: `https://orders-onologroup.online`
- **Netlify URL**: `https://orders-onologroup.netlify.app`
- **Purpose**: Customer orders, payments, account management

### Dashboard/Management App (Admin-facing)
- **Primary Domain**: `https://manager-onologroup.online`
- **WWW Domain**: `https://www.manager-onologroup.online`
- **Netlify URL**: `https://manager-onologroup.netlify.app`
- **Purpose**: Order management, customer management, analytics

### Development URLs
- **User App Dev**: `http://localhost:8081` (Expo), `http://localhost:19006` (Web)
- **Dashboard Dev**: `http://localhost:3000`, `http://localhost:5173` (Vite), `http://localhost:3001`

## Supabase CORS Configuration

### Required CORS Origins
Add all these URLs to your Supabase project CORS settings:

```
# Development URLs
http://localhost:8081
http://localhost:19006
http://localhost:3000
http://localhost:3001
http://localhost:5000
http://localhost:5173
http://localhost:8080

# User App Production URLs
https://orders-onologroup.online
https://orders-onologroup.netlify.app

# Dashboard/Management App Production URLs
https://manager-onologroup.online
https://www.manager-onologroup.online
https://manager-onologroup.netlify.app
```

### How to Update CORS Settings
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: "Onolo. Gas" (ID: lnnqoejqgdmwadtzwuix)
3. Navigate to Settings → API → Configuration
4. Under "Web origins (CORS)", add all URLs above
5. Save changes

## Dashboard Communication

### Message Types
The user app can send these message types to the dashboard:

- `ORDER_UPDATE`: New orders, status changes
- `USER_UPDATE`: Profile changes
- `PAYMENT_STATUS`: Payment completions/failures
- `ERROR_REPORT`: Error notifications
- `USER_APP_READY`: App initialization complete

### Dashboard Message Types
The dashboard can send these message types to the user app:

- `DASHBOARD_READY`: Dashboard initialization complete
- `MANAGER_READY`: Manager dashboard ready
- `REQUEST_STATUS`: Request app status
- `REQUEST_ORDERS`: Request orders data
- `REQUEST_USER_INFO`: Request user information
- `NAVIGATE_TO`: Request navigation
- `REFRESH_DATA`: Request data refresh

### Implementation Example

#### Sending Messages from User App
```typescript
import { dashboardComm } from '../utils/dashboard-communication';

// Notify dashboard of new order
dashboardComm.sendOrderUpdate({
  orderId: 'order-123',
  status: 'pending',
  customerEmail: 'customer@example.com',
  totalAmount: 150.00,
});

// Report payment completion
dashboardComm.sendPaymentStatus({
  orderId: 'order-123',
  paymentMethod: 'payfast',
  status: 'completed',
  transactionId: 'pf-123456',
  amount: 150.00,
});
```

#### Receiving Messages in Dashboard
```javascript
// Dashboard code (JavaScript/TypeScript)
window.addEventListener('message', (event) => {
  // Verify origin
  const trustedOrigins = [
    'https://orders-onologroup.online',
    'https://orders-onologroup.netlify.app',
    'http://localhost:8081',
    'http://localhost:19006'
  ];
  
  if (!trustedOrigins.includes(event.origin)) {
    return;
  }
  
  const message = event.data;
  
  switch (message.type) {
    case 'ORDER_UPDATE':
      handleOrderUpdate(message.data);
      break;
    case 'PAYMENT_STATUS':
      handlePaymentStatus(message.data);
      break;
    case 'USER_APP_READY':
      handleUserAppReady(message.data);
      break;
  }
});

// Send message to user app
function sendToUserApp(type, data) {
  const userAppFrame = document.getElementById('user-app-iframe');
  if (userAppFrame && userAppFrame.contentWindow) {
    userAppFrame.contentWindow.postMessage({
      type,
      data,
      timestamp: new Date().toISOString(),
      source: 'onolo-manager-app'
    }, 'https://orders-onologroup.online');
  }
}
```

## Embedding Configuration

### Embedding User App in Dashboard
```html
<!-- Dashboard HTML -->
<iframe 
  id="user-app-iframe"
  src="https://orders-onologroup.online"
  width="100%" 
  height="600px"
  frameborder="0"
  allow="camera; microphone; geolocation">
</iframe>
```

### Security Considerations
- All message origins are validated against trusted domains
- Messages include timestamps and source identification
- Sensitive data should not be passed through postMessage
- Use HTTPS in production for all communications

## Testing

### Development Testing
1. Start user app: `npm run dev` (port 8081)
2. Start dashboard: `npm run dev` (port 3000)
3. Open dashboard and embed user app iframe
4. Test message communication between apps

### Production Testing
1. Deploy both apps to their respective domains
2. Update Supabase CORS settings
3. Test cross-origin communication
4. Verify all message types work correctly

## Troubleshooting

### Common Issues

#### CORS Errors
- **Symptom**: Network requests fail with CORS errors
- **Solution**: Ensure all URLs are added to Supabase CORS settings
- **Check**: Browser console for specific error messages

#### Message Communication Fails
- **Symptom**: Messages not received between apps
- **Solution**: Verify origin validation in message handlers
- **Check**: Console logs for "untrusted origin" warnings

#### iframe Loading Issues
- **Symptom**: User app doesn't load in dashboard iframe
- **Solution**: Check X-Frame-Options headers and CSP policies
- **Check**: Network tab for blocked requests

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('onolo-debug', 'true');
```

This will show detailed communication logs in the browser console.

## Deployment Checklist

### Before Deployment
- [ ] Update Supabase CORS settings with all URLs
- [ ] Test message communication locally
- [ ] Verify iframe embedding works
- [ ] Check all payment URLs are updated

### After Deployment
- [ ] Test user app at production URL
- [ ] Test dashboard at production URL
- [ ] Verify cross-app communication works
- [ ] Test payment integrations
- [ ] Monitor error logs for issues

## Support

For issues with dashboard integration:
1. Check browser console for error messages
2. Verify CORS settings in Supabase
3. Test with different browsers
4. Check network connectivity
5. Review message origin validation

The integration provides robust error handling and detailed logging to help diagnose issues quickly.

# Deployment Configuration Update

## Overview
Updated the app configuration to align with the new deployment URLs and ensure proper communication with the dashboard/management app.

## Changes Made

### 1. Updated Production URLs

#### User App URLs
- **Primary Domain**: `https://orders-onologroup.online`
- **Netlify URL**: `https://orders-onologroup.netlify.app`

#### Dashboard/Management App URLs
- **Primary Domain**: `https://manager-onologroup.online`
- **WWW Domain**: `https://www.manager-onologroup.online`
- **Netlify URL**: `https://manager-onologroup.netlify.app`

### 2. Files Updated

#### Configuration Files
- **`config/deployment.ts`** (NEW): Centralized deployment configuration
- **`app.json`**: Updated expo-router origin
- **`netlify.toml`**: Enhanced with proper redirects and CORS headers
- **`utils/payfast.ts`**: Updated to use new domain

- **`lib/supabase.ts`**: Updated CORS error messages with new URLs
- **`utils/global-error-handler.ts`**: Added new domains to target origins

#### Dashboard Communication
- **`utils/dashboard-communication.ts`** (NEW): Complete dashboard communication system
- **`contexts/OrdersContext.tsx`**: Integrated dashboard notifications

### 3. New Features Added

#### Centralized Configuration
```typescript
// config/deployment.ts
export const DEPLOYMENT_CONFIG = {
  production: {
    domain: 'https://orders-onologroup.online',
    netlify: 'https://orders-onologroup.netlify.app',
  },
  // ... more configuration
}
```

#### Dashboard Communication
- Real-time order updates to dashboard
- Payment status notifications
- Error reporting
- User profile updates
- Automatic message queuing when dashboard not available

#### Enhanced CORS Support
- Added all deployment URLs to CORS origins
- Better error messages for CORS issues
- Automatic origin detection

### 4. Supabase CORS Configuration Required

Add these URLs to your Supabase project CORS settings:
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

**How to update:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: "Onolo. Gas" (ID: lnnqoejqgdmwadtzwuix)
3. Navigate to Settings → API → Configuration
4. Under "Web origins (CORS)", add the URLs above
5. Save changes

### 5. Payment Integration Updates

#### PayFast
- Updated return URLs to use `orders-onologroup.online`
- Centralized URL generation
- Maintained production credentials



### 6. Email Configuration
- Updated email sender: `Onolo Gas <orders@orders-onologroup.online>`
- Configured proper domain for email authentication

### 7. Dashboard Integration Features

#### Message Types
- `ORDER_UPDATE`: New orders, status changes
- `USER_UPDATE`: Profile changes
- `PAYMENT_STATUS`: Payment completions/failures
- `ERROR_REPORT`: Error notifications

#### Communication Methods
```typescript
// Notify dashboard of new order
notifyOrderCreated(order);

// Notify dashboard of status change
notifyOrderStatusChanged(orderId, 'completed');

// Report payment completion
notifyPaymentCompleted(orderId, 'payfast', transactionId, amount);
```

### 8. Testing Checklist

#### Before Deployment
- [ ] Update Supabase CORS settings
- [ ] Test web version at localhost:8081
- [ ] Verify payment URLs are correct
- [ ] Test dashboard communication (if applicable)

#### After Deployment
- [ ] Test app at https://orders-onologroup.online
- [ ] Verify PayFast integration works

- [ ] Check email notifications
- [ ] Verify dashboard communication
- [ ] Test mobile app functionality

### 9. Environment Variables
No changes required to environment variables. The app will automatically use the correct URLs based on the deployment configuration.

### 10. Backward Compatibility
- Old Netlify URL maintained as fallback
- Existing orders and data remain unaffected
- Gradual migration approach ensures no service interruption

## Next Steps

1. **Deploy to Production**: Push changes to your repository
2. **Update Supabase CORS**: Add the new URLs as specified above
3. **Test All Features**: Use the testing checklist
4. **Monitor Dashboard Communication**: Check if messages are being received
5. **Update DNS**: Ensure `orders-onologroup.online` points to the correct deployment

## Support

If you encounter any issues:
1. Check browser console for CORS errors
2. Verify Supabase CORS settings
3. Test with different browsers
4. Check network connectivity
5. Review deployment logs

The app now has robust error handling and will provide helpful messages for common issues like CORS configuration problems.

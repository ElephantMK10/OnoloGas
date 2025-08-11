# Deep Linking Setup for Authentication

## Overview
This document outlines the deep linking implementation for handling authentication redirects in the Onolo Gas app. Deep linking eliminates the redirect-to-root-URL issue and provides a seamless authentication experience.

## Configuration

### App Configuration (`app.json`)
```json
{
  "expo": {
    "scheme": "onolo"
  }
}
```

### Supabase Configuration
- **Site URL**: `onolo://home`
- **Redirect URLs**: 
  - `onolo://home` (primary deep link)
  - `onolo://auth` (auth-specific deep link)
  - `https://orders-onologroup.online/home` (web fallback)
  - `https://orders-onologroup.netlify.app/home` (staging fallback)

## Implementation

### 1. DeepLinkHandler Component
Located at `components/DeepLinkHandler.tsx`

**Features**:
- Automatically processes incoming deep links
- Handles auth tokens from email confirmations
- Manages different auth types (signup, recovery, magic link)
- Provides user feedback via toast messages
- Navigates to appropriate screens

**Supported Deep Link Types**:
- `onolo://home` - Direct navigation to home
- `onolo://auth?type=signup&access_token=...` - Email confirmation
- `onolo://auth?type=recovery&access_token=...` - Password reset
- `onolo://auth?type=magiclink&access_token=...` - Magic link login

### 2. AuthService Updates
Enhanced with deep link support:

**Registration**:
```typescript
await supabase.auth.signUp({
  email: request.email,
  password: request.password,
  options: {
    emailRedirectTo: 'onolo://home'
  }
});
```

**Magic Link**:
```typescript
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: 'onolo://home'
  }
});
```

### 3. Integration
The `DeepLinkHandler` is integrated into the main app layout (`app/_layout.tsx`) and runs automatically.

## Authentication Flow

### Registration Flow
1. User registers with email/password
2. Supabase sends confirmation email with deep link
3. User clicks email link → `onolo://auth?type=signup&access_token=...`
4. DeepLinkHandler processes the link
5. Sets session and navigates to home
6. Shows success toast

### Magic Link Flow
1. User requests magic link
2. Supabase sends email with deep link
3. User clicks email link → `onolo://auth?type=magiclink&access_token=...`
4. DeepLinkHandler processes the link
5. Sets session and navigates to home
6. Shows success toast

### Password Reset Flow
1. User requests password reset
2. Supabase sends email with deep link
3. User clicks email link → `onolo://auth?type=recovery&access_token=...`
4. DeepLinkHandler processes the link
5. Sets session and navigates to reset password form
6. Shows info toast

## Benefits

### ✅ **Solved Issues**
- **No more redirect to root URL** - Direct navigation to intended destination
- **Seamless mobile experience** - No browser switching
- **Proper email confirmation** - Links open directly in app
- **Better user feedback** - Toast messages for all auth events

### ✅ **Enhanced Features**
- **Magic link support** - Passwordless authentication option
- **Universal link compatibility** - Works on both mobile and web
- **Error handling** - Graceful handling of invalid/expired links
- **Multiple auth types** - Supports various authentication scenarios

## Testing

### Development Testing
```bash
# Test deep link navigation
npx uri-scheme open onolo://home --ios
npx uri-scheme open onolo://home --android

# Test auth deep link
npx uri-scheme open "onolo://auth?type=signup&access_token=test" --ios
```

### Production Testing
1. Register a new account
2. Check email for confirmation link
3. Click link on mobile device
4. Verify app opens and navigates to home
5. Check for success toast message

## Supabase Dashboard Configuration

### Required Settings
1. **Go to**: Supabase Dashboard → Authentication → URL Configuration
2. **Set Site URL**: `onolo://home`
3. **Add Redirect URLs**:
   ```
   onolo://home
   onolo://auth
   https://orders-onologroup.online/home
   https://orders-onologroup.netlify.app/home
   ```

### Email Templates
Update email templates to use deep links:
- **Confirmation**: `{{ .SiteURL }}`
- **Recovery**: `{{ .SiteURL }}`
- **Magic Link**: `{{ .SiteURL }}`

## Troubleshooting

### Common Issues
1. **Deep links not working**: Ensure app scheme is properly configured
2. **Email links open browser**: Check Supabase redirect URL configuration
3. **Auth tokens not processed**: Verify DeepLinkHandler is properly integrated
4. **Navigation not working**: Check router implementation in handlers

### Debug Logs
The DeepLinkHandler provides detailed console logs:
- `DeepLinkHandler: Processing deep link: [url]`
- `DeepLinkHandler: Parsed URL: [details]`
- `DeepLinkHandler: Handling [auth_type]`

## Future Enhancements

### Potential Improvements
1. **Universal Links**: iOS/Android universal linking for better UX
2. **Branch Integration**: Advanced attribution and deep linking
3. **Dynamic Links**: Firebase dynamic links for cross-platform support
4. **Analytics**: Track deep link usage and conversion rates

### Additional Auth Methods
- OAuth providers (Google, Apple, Facebook)
- Biometric authentication
- Two-factor authentication
- Social login integration

## Security Considerations

### Best Practices
- Always validate auth tokens before setting sessions
- Implement proper error handling for invalid links
- Use HTTPS for web fallback URLs
- Regularly rotate Supabase keys
- Monitor auth events for suspicious activity

### Token Handling
- Tokens are processed securely through Supabase SDK
- No manual token storage or manipulation
- Automatic session management
- Proper cleanup on auth errors

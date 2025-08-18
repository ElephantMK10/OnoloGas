# Authentication Hardening Implementation

## Overview
This document outlines the comprehensive authentication hardening improvements implemented to ensure a single Supabase client with proper auth persistence and robust error handling.

## ✅ Implemented Features

### 1. Single Supabase Client
- **Location**: `lib/supabase.ts` is the only place that calls `createClient`
- **Configuration**: Properly configured with AsyncStorage, auth persistence, and auto-refresh
- **Global Fetch**: Includes timeout protection to prevent mutations from hanging

### 2. Enhanced Session Management
- **`ensureSession()` Function**: 
  - Checks current session validity
  - Attempts refresh if needed
  - Deduplicates concurrent refresh calls
  - Configurable freshness requirements (`requireFresh`, `minTtlMs`)
  - Clear error messaging: "Session expired. Please sign in again."

- **`withSession()` Helper**: 
  - Uniform pattern for service calls requiring authentication
  - Ensures session validity before executing tasks
  - Makes authentication requirements explicit and testable

### 3. Authentication Error Detection
- **`isAuthError()` Utility**: 
  - Detects 401 status codes
  - Identifies JWT and invalid token errors
  - Enables defensive error handling in mutations

### 4. Unified Logging System
- **Production-Ready Logger**: 
  - `log.info()`, `log.error()`, `log.warn()`, `log.debug()`
  - Development-only logging for non-critical information
  - Easy to swap to Sentry/Crashlytics later
  - Consistent logging format across services

### 5. Service-Level Authentication
- **ProfileService**: Uses `withSession()` wrapper with proper error handling
- **OrderService**: Updated to use `withSession()` and enhanced error handling
- **Consistent Pattern**: All database operations go through authentication checks

### 6. React Native Optimizations
- **Foreground Refresh**: `refreshSessionOnForeground()` utility for app state changes
- **Mobile-Aware**: Handles iOS/Android platform differences

## 🔧 Technical Implementation

### Session Deduplication
```typescript
let inFlightRefresh: Promise<{ data: { session: any } | null; error: any } | null> | null = null;

export async function ensureSession(opts: EnsureOpts = {}) {
  const { requireFresh = false, minTtlMs = 30_000 } = opts;
  
  // Check if refresh is already in progress
  if (!inFlightRefresh) {
    inFlightRefresh = supabase.auth.refreshSession()
      .finally(() => { inFlightRefresh = null; });
  }
  
  const refreshed = await inFlightRefresh;
  // ... handle response
}
```

### Service Wrapper Pattern
```typescript
export async function withSession<T>(
  task: (session: any) => Promise<T>,
  opts?: EnsureOpts
): Promise<T> {
  const session = await ensureSession(opts);
  return task(session);
}

// Usage in services
export async function updateProfileRow(input: Input) {
  return withSession(async (session) => {
    // Service logic here
    const { data, error } = await supabase.from('profiles')...
  });
}
```

### Error Handling
```typescript
export function isAuthError(err: any): boolean {
  const status = err?.status ?? err?.cause?.status;
  const msg = String(err?.message || '');
  return status === 401 || msg.includes('JWT') || msg.includes('invalid token');
}

// In mutation onError
if (isAuthError(error)) {
  log.error('Authentication error detected:', error);
  // Handle gracefully
}
```

## 📱 Usage Examples

### Profile Updates
```typescript
// hooks/queries/useAuthQueries.ts
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (profileData) => {
      await ensureSession(); // Preflight session check
      
      const result = await updateProfileRow(profileData);
      return result;
    },
    onError: (error) => {
      if (isAuthError(error)) {
        // Handle auth errors gracefully
      }
    }
  });
};
```

### Service Calls
```typescript
// services/orders/OrderService.ts
async getOrders(userId: string, filters?: OrderFilters): Promise<Order[]> {
  return withSession(async (session) => {
    // Session is guaranteed to be valid here
    const { data, error } = await supabase.from('orders')...
    
    if (isAuthError(error)) {
      throw new Error('Session expired. Please sign in again.');
    }
    
    return formattedOrders;
  });
}
```

## 🧪 Testing Recommendations

### 1. ensureSession Tests
- Returns session when fresh
- Triggers refresh when near-expiry
- Deduplicates refresh under concurrent calls
- Throws clear error when refresh fails

### 2. Profile Mutation Tests
- Preflight `ensureSession` is called
- Success path updates cache with returned row
- 401 after `ensureSession` shows "Session expired..." message
- Timeout/abort sets error and clears loading state

### 3. Auth Lifecycle Tests
- `SIGNED_IN`: profile is prefetched or invalidated and refetched
- `SIGNED_OUT`: user-scoped caches are cleared
- App resumes from background with nearly expired token → `ensureSession` runs once

## 🚀 Production Benefits

1. **Reliability**: Deduplicated refresh prevents thundering herd
2. **Security**: Consistent authentication checks across all services
3. **User Experience**: Clear error messages and graceful degradation
4. **Maintainability**: Unified patterns and centralized error handling
5. **Performance**: Optimized session management and reduced redundant calls
6. **Monitoring**: Structured logging for production debugging

## 🔄 Migration Notes

- All existing `console.log` calls have been updated to use the new `log` system
- Services now use `withSession()` wrapper for consistent authentication
- Error handling includes `isAuthError()` checks for better user experience
- Session management is centralized and deduplicated

## 📋 Next Steps (Optional Enhancements)

1. **Correlation IDs**: Add request tracing for mutations
2. **Metrics**: Track authentication success/failure rates
3. **Retry Logic**: Implement exponential backoff for failed requests
4. **Offline Support**: Handle authentication during network interruptions
5. **Biometric Auth**: Integrate with device security features

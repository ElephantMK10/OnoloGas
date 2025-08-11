# Code Refactoring PRD - Modular Platform Architecture

## Executive Summary

This PRD outlines the refactoring of the Onolo Gas Delivery app into a modular, maintainable, and scalable platform following DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid) principles.

## Current Issues Identified

### 1. Monolithic Context (Critical)
- **UserContext.tsx** is 800+ lines handling multiple responsibilities
- Violates Single Responsibility Principle
- Causes unnecessary re-renders
- Difficult to test and maintain

### 2. Inconsistent Architecture
- Mixed patterns throughout codebase
- No clear separation of concerns
- Business logic mixed with UI logic
- No proper service layer

### 3. Poor Error Handling
- Inconsistent error handling patterns
- No centralized error management
- Missing error boundaries
- No structured error logging

### 4. Code Duplication
- Multiple chat implementations (web/native/default)
- Repeated validation logic
- Duplicated API calls
- Similar components with slight variations

### 5. Configuration Management
- Hardcoded values throughout codebase
- No centralized configuration
- Environment variables scattered

### 6. Type Safety Issues
- Types scattered across files
- Missing type definitions
- Inconsistent type usage

## Proposed Solution Architecture

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Service Layer Architecture
```typescript
// Core service interfaces
interface IAuthService {
  login(email: string, password: string): Promise<AuthResult>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
}

interface IOrderService {
  createOrder(orderData: CreateOrderRequest): Promise<Order>
  getOrders(userId: string): Promise<Order[]>
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>
}

interface IMessageService {
  sendMessage(message: CreateMessageRequest): Promise<void>
  getMessages(userId: string): Promise<Message[]>
  markAsRead(messageId: string): Promise<void>
}
```

#### 1.2 Context Splitting Strategy
Split monolithic UserContext into focused contexts:
- **AuthContext** - Authentication state only
- **OrdersContext** - Order management
- **MessagesContext** - Chat/messaging
- **NotificationsContext** - Notification preferences

#### 1.3 Configuration Management
```typescript
// config/index.ts
export const AppConfig = {
  api: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  features: {
    enableRealtime: true,
    enablePushNotifications: Platform.OS !== 'web',
  },
  ui: {
    defaultTimeout: 5000,
    retryAttempts: 3,
  }
}
```

### Phase 2: Data Layer Modernization (Week 3-4)

#### 2.1 State Management with React Query
Replace manual state management with React Query for:
- Automatic caching
- Background refetching  
- Optimistic updates
- Loading states

#### 2.2 Real-time Subscription Manager
```typescript
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  
  subscribe(channelName: string, config: ChannelConfig): RealtimeChannel
  unsubscribe(channelName: string): void
  cleanup(): void
}
```

#### 2.3 Validation Layer
```typescript
// validation/schemas.ts
export const OrderSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  totalAmount: z.number().positive(),
  items: z.array(OrderItemSchema).min(1)
})
```

### Phase 3: Component Architecture (Week 5-6)

#### 3.1 Design System Foundation
- Centralized theme configuration
- Reusable component library
- Consistent spacing/typography system

#### 3.2 Error Boundary Implementation
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component {
  // Centralized error handling
  // Fallback UI components
  // Error reporting integration
}
```

#### 3.3 Platform-Specific Components
Consolidate platform-specific implementations:
```typescript
// components/Chat/index.ts
export { default } from './Chat.web'  // web
export { default } from './Chat.native' // native
```

### Phase 4: Developer Experience (Week 7-8)

#### 4.1 Testing Infrastructure
- Jest configuration
- Testing utilities
- Mock services
- Component testing patterns

#### 4.2 Documentation System
- API documentation
- Component storybook
- Development guides

#### 4.3 Code Quality Tools
- ESLint configuration
- Prettier setup
- TypeScript strict mode
- Pre-commit hooks

## Implementation Plan

### Week 1-2: Foundation
1. Create service interfaces and implementations
2. Split UserContext into focused contexts
3. Implement configuration management
4. Set up error boundaries

### Week 3-4: Data Layer
1. Integrate React Query
2. Implement RealtimeManager
3. Create validation schemas
4. Migrate existing data flows

### Week 5-6: Components
1. Build design system foundation
2. Refactor existing components
3. Consolidate platform-specific code
4. Implement consistent error handling

### Week 7-8: DX & Quality
1. Set up testing infrastructure
2. Create documentation
3. Configure code quality tools
4. Performance optimization

## Success Metrics

### Code Quality
- Reduce cyclomatic complexity by 50%
- Achieve 90%+ TypeScript strict mode compliance
- Eliminate code duplication (DRY score > 95%)

### Performance
- Reduce bundle size by 20%
- Improve app startup time by 30%
- Achieve 95%+ reliability in real-time features

### Developer Experience
- Reduce onboarding time for new developers
- 100% test coverage for core business logic
- Zero production errors from type issues

### Maintainability
- Single responsibility for all major components
- Clear separation of concerns
- Modular architecture enabling feature toggles

## Risk Mitigation

### Technical Risks
- **Breaking Changes**: Implement behind feature flags
- **Performance Regression**: Continuous performance monitoring
- **Data Loss**: Comprehensive backup strategy during migration

### Timeline Risks
- **Scope Creep**: Strict adherence to phases
- **Resource Constraints**: Parallel development where possible
- **Testing Delays**: Automated testing from day one

## File Structure (Proposed)

```
src/
├── services/           # Business logic services
│   ├── auth/
│   ├── orders/
│   ├── messages/
│   └── notifications/
├── contexts/           # Focused React contexts
│   ├── AuthContext.tsx
│   ├── OrdersContext.tsx
│   └── MessagesContext.tsx
├── components/         # Reusable UI components
│   ├── common/         # Basic components
│   ├── forms/          # Form components
│   └── feedback/       # Loading, error states
├── screens/            # Screen components
├── config/             # Configuration management
├── types/              # TypeScript definitions
├── utils/              # Pure utility functions
├── validation/         # Schema validation
├── hooks/              # Custom React hooks
└── __tests__/          # Test files
```

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] UserContext split into 4 focused contexts
- [ ] Service layer interfaces defined and implemented
- [ ] Configuration management centralized
- [ ] Error boundaries implemented

### Phase 2 Complete When:
- [ ] React Query integrated for all data fetching
- [ ] RealtimeManager handling all subscriptions
- [ ] Validation schemas covering all inputs
- [ ] No direct Supabase calls in components

### Phase 3 Complete When:
- [ ] Design system foundation established
- [ ] All components following consistent patterns
- [ ] Platform-specific code consolidated
- [ ] Error handling standardized

### Phase 4 Complete When:
- [ ] Testing infrastructure complete
- [ ] Documentation up to date
- [ ] Code quality tools configured
- [ ] Performance benchmarks met

## Conclusion

This refactoring will transform the current monolithic structure into a modular, maintainable platform that follows industry best practices. The phased approach ensures minimal disruption while delivering immediate value at each stage.

The end result will be a codebase that is:
- **Modular**: Clear separation of concerns
- **Testable**: Comprehensive test coverage
- **Maintainable**: Easy to understand and modify
- **Scalable**: Ready for future feature development
- **Reliable**: Robust error handling and recovery
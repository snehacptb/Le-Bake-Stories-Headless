# Guest Data Management

## Overview

This document explains how guest user data (cart and wishlist) is managed in the headless WordPress application.

## Guest Data Storage

Guest users' cart and wishlist data are stored in `localStorage` with the following keys:

- **Cart Token**: `cart-token-guest`
- **Cart Data**: `woocommerce-cart-guest`
- **Wishlist**: `headless-wordpress-wishlist-guest`

## Automatic Guest Data Clearing

Guest data is automatically cleared in the following scenarios:

### 1. On Logout
When a user logs out, all guest data is automatically cleared, including:
- Cart items and cart token
- Wishlist items
- Checkout form data
- Any other guest-specific localStorage data

### 2. Implementation

The clearing functionality is implemented in:

- **`src/lib/clear-guest-data.ts`**: Utility functions for clearing guest data
- **`src/contexts/auth-context.tsx`**: Calls `clearAllGuestData()` on logout
- **`src/lib/cart-persistence.ts`**: Provides `clearAllGuestData()` method
- **`src/lib/wishlist-persistence.ts`**: Provides `clearAllGuestData()` method

## Manual Guest Data Clearing

You can manually clear guest data by calling:

```typescript
import { clearAllGuestData } from '@/lib/clear-guest-data'

// Clear all guest data
clearAllGuestData()
```

## Checking if User is Guest

```typescript
import { isGuestUser } from '@/lib/clear-guest-data'

if (isGuestUser()) {
  console.log('User is not authenticated')
}
```

## User-Specific Data

When users are authenticated, their data is stored with user-specific keys:

- **Cart Token**: `cart-token-user-{userId}`
- **Cart Data**: `woocommerce-cart-user-{userId}`
- **Wishlist**: `headless-wordpress-wishlist-user-{userId}`

This ensures data isolation between different users and prevents data leakage.

## Data Migration

When a guest user logs in:
1. Guest cart and wishlist data can be migrated to the authenticated user's account
2. Guest data is then cleared to prevent conflicts

## Security Considerations

- Guest data is stored only in the browser's localStorage
- No sensitive information should be stored for guest users
- All guest data is cleared on logout to maintain privacy
- User-specific data is isolated by user ID

## Debugging

To debug cart and wishlist storage:

```typescript
import { cartPersistence } from '@/lib/cart-persistence'
import { wishlistPersistence } from '@/lib/wishlist-persistence'

// Debug cart storage
cartPersistence.debugCartStorage()

// Debug wishlist storage
wishlistPersistence.debugWishlistStorage()
```

## Best Practices

1. **Always clear guest data on logout** - This is handled automatically
2. **Use user-specific storage for authenticated users** - This is handled by the persistence utilities
3. **Don't store sensitive data for guests** - Keep guest data minimal
4. **Test data isolation** - Ensure switching between users doesn't leak data

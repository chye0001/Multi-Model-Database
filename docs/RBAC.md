## Role-Based Access Control (RBAC) Implementation

This document explains how to use the RBAC system to protect your routes.

### Roles

- **admin** — Full system access, can perform any operation
- **user** — Standard user access, can only manage their own resources

### Middleware Available

1. **`isAuthenticated`** — Ensures user is logged in
2. **`isAdmin`** — Ensures user has admin role
3. **`hasRole(allowedRoles[])`** — Ensures user has one of the specified roles
4. **`isResourceOwner`** — Ensures user owns the resource or is admin

### Usage Examples

#### Example 1: Admin-only route
```typescript
import { Router } from 'express';
import { isAdmin } from '../middleware/rbac.middleware.js';

router.delete('/users/:id', isAdmin, userController.deleteUser);
```

#### Example 2: Protect all routes (require authentication)
```typescript
import { isAuthenticated } from '../middleware/rbac.middleware.js';

// All routes below require authentication
router.use(isAuthenticated);

router.get('/:id', userController.getUserById);
router.put('/:id', isResourceOwner, userController.updateUser); // User can only update their own profile
```

#### Example 3: Full protected route
```typescript
import { isAuthenticated, isResourceOwner } from '../middleware/rbac.middleware.js';

router.post('/closets/:closetId/share',
  isAuthenticated,           // Must be logged in
  isResourceOwner,           // Must own the closet
  closetController.shareCloset
);
```

### Session Data

After login, the session contains:
- `req.session.userId` — The logged-in user's ID
- `req.session.userRole` — The user's role (`admin` or `user`)

### In Controllers/Services

You can also check roles programmatically:
```typescript
async checkPermission = (req: Request, res: Response) => {
  const isAdmin = req.session.userRole === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ error: 'Forbidden' });
  }
  // Proceed...
};
```

### Database Queries by Role

The repository provides role-aware queries:
```typescript
// Check if user is admin
const isAdmin = await authRepository.userHasRole(userId, 'admin');

// Get all admins
const admins = await authRepository.getUsersByRole('admin');
```


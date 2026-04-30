## Closet Security Model

This document describes the access control for closets and closet operations.

### Roles

The system now uses **two roles only**:
- **admin** — Unrestricted access to the entire system
- **user** — Can only manage their own resources

### Closet Access Rules

#### Viewing Closets

| Scenario | Allowed |
|----------|---------|
| Public closet + Anonymous | ✅ Yes |
| Public closet + Any user | ✅ Yes |
| Public closet + Admin | ✅ Yes |
| Private closet + Owner | ✅ Yes |
| Private closet + Shared user | ✅ Yes |
| Private closet + Admin | ✅ Yes |
| Private closet + Other user | ❌ No (403 Forbidden) |
| Private closet + Anonymous | ❌ No (401 Unauthorized) |

#### Modifying Closet Items (Add/Remove)

| Scenario | Allowed |
|----------|---------|
| Owner adds/removes items | ✅ Yes |
| Admin adds/removes items | ✅ Yes |
| Shared user adds/removes items | ✅ Yes (NEW: shared users can now modify items) |
| Other user adds/removes items | ❌ No (403 Forbidden) |
| Anonymous user adds/removes items | ❌ No (401 Unauthorized) |

#### Updating Closet Settings (Name, Description, Privacy)

| Scenario | Allowed |
|----------|---------|
| Owner updates settings | ✅ Yes |
| Admin updates any closet settings | ✅ Yes |
| Shared user updates settings | ❌ No (owner-only, cannot change privacy) |
| Other user updates settings | ❌ No (403 Forbidden) |
| Anonymous user updates settings | ❌ No (401 Unauthorized) |

#### Deleting Closets

| Scenario | Allowed |
|----------|---------|
| Owner deletes own closet | ✅ Yes |
| Admin deletes any closet | ✅ Yes |
| Shared user deletes closet | ❌ No (owner-only) |
| Other user deletes closet | ❌ No (403 Forbidden) |
| Anonymous user deletes closet | ❌ No (401 Unauthorized) |

#### Managing Closet Sharing

| Scenario | Allowed |
|----------|---------|
| Owner shares/unshares closet | ✅ Yes |
| Admin shares/unshares any closet | ✅ Yes |
| Shared user shares closet | ❌ No (owner-only) |
| Other user shares closet | ❌ No (403 Forbidden) |
| Anonymous user shares closet | ❌ No (401 Unauthorized) |

### API Endpoints & Security

```
GET /closets
  - Public endpoint (no authentication required)
  - Returns all public closets

GET /closets/:id
  - Middleware: canViewCloset
  - Public closets viewable by anyone
  - Private closets: owner/shared users/admin only

POST /closets
  - Middleware: isAuthenticated
  - Creates closet owned by logged-in user
  - User ID taken from session (cannot specify userId in body)

PATCH /closets/:id
  - Middleware: canUpdateClosetSettings
  - Only owner (or admin) can update name, description, privacy
  - Shared users CANNOT update closet settings

DELETE /closets/:id
  - Middleware: canDeleteCloset
  - Only owner (or admin) can delete
  - Shared users CANNOT delete

GET /closets/:id/items
  - Middleware: canViewCloset
  - Same rules as viewing the closet

POST /closets/:id/items
  - Middleware: canModifyClosetItems
  - Owner, admin, AND shared users can add items

DELETE /closets/:id/items/:itemId
  - Middleware: canModifyClosetItems
  - Owner, admin, AND shared users can remove items

GET /closets/:id/shares
  - Middleware: canManageCloset
  - Only owner (or admin) can view shares

POST /closets/:id/shares
  - Middleware: canManageCloset
  - Only owner (or admin) can share closet
  - Request body: { userId: string }

DELETE /closets/:id/shares/:userId
  - Middleware: canManageCloset
  - Only owner (or admin) can unshare

GET /closets/users/:userId/closets
  - Middleware: isAuthenticated, isResourceOwner
  - Users can only view their own closets
  - Admins can view any user's closets
```

### Middleware Details

#### `canViewCloset`
- Checks if user can view a specific closet
- Admin: ✅ Always allowed
- Owner: ✅ Always allowed
- Public closet: ✅ Anyone allowed (no auth required)
- Shared with user: ✅ Allowed
- Otherwise: ❌ 403 Forbidden (or 401 if not authenticated)

#### `canModifyClosetItems`
- Checks if user can modify closet items (add/remove)
- Admin: ✅ Always allowed
- Owner: ✅ Allowed
- **Shared user: ✅ NOW ALLOWED** (can add/remove items)
- Otherwise: ❌ 403 Forbidden (or 401 if not authenticated)

#### `canUpdateClosetSettings`
- Checks if user can update closet settings (name, description, isPublic)
- Admin: ✅ Always allowed
- Owner: ✅ Allowed
- Shared user: ❌ NOT allowed (owner-only)
- Otherwise: ❌ 403 Forbidden (or 401 if not authenticated)

#### `canDeleteCloset`
- Checks if user can delete a closet
- Admin: ✅ Always allowed
- Owner: ✅ Allowed
- Shared user: ❌ NOT allowed (owner-only)
- Otherwise: ❌ 403 Forbidden (or 401 if not authenticated)

#### `canManageCloset`
- Checks if user can manage sharing (share/unshare)
- Admin: ✅ Always allowed
- Owner: ✅ Allowed
- Shared user: ❌ NOT allowed (owner-only)
- Otherwise: ❌ 403 Forbidden (or 401 if not authenticated)

### Shared User Permissions Summary

Shared users can:
- ✅ View the closet
- ✅ View all items in the closet
- ✅ Add items to the closet
- ✅ Remove items from the closet

Shared users CANNOT:
- ❌ Update closet settings (name, description, privacy)
- ❌ Delete the closet
- ❌ Share/unshare the closet with other users
- ❌ Delete other shared users' access

### Example Scenarios

#### Scenario 1: User A views User B's Public Closet
```
GET /closets/123
- Closet 123 is public, owned by User B
- User A (or anyone) can view it
- ✅ 200 OK
```

#### Scenario 2: User A tries to view User B's Private Closet
```
GET /closets/456
- Closet 456 is private, owned by User B
- User A doesn't own it, not shared with them
- ❌ 403 Forbidden
```

#### Scenario 3: User A tries to view User B's Shared Private Closet
```
GET /closets/789
- Closet 789 is private, owned by User B
- User B shared it with User A
- ✅ 200 OK (can view)

POST /closets/789/items
- ✅ 201 OK (can add items - NEW!)

DELETE /closets/789/items/456
- ✅ 204 OK (can remove items - NEW!)

PATCH /closets/789
- ❌ 403 Forbidden (cannot update closet settings)

DELETE /closets/789
- ❌ 403 Forbidden (cannot delete the closet)

POST /closets/789/shares
- ❌ 403 Forbidden (cannot share with others)
```

#### Scenario 4: Admin modifies/deletes any closet
```
GET /closets/anything
- ✅ 200 OK (admin bypass)

PATCH /closets/anything
- ✅ 200 OK (admin can modify settings)

DELETE /closets/anything
- ✅ 200 OK (admin can delete)

POST /closets/anything/shares
- ✅ 200 OK (admin can share)
```

#### Scenario 5: User creates a closet
```
POST /closets
Body: { name: "My Closet", isPublic: false, description: "..." }

The closet is automatically created with userId = req.session.userId
(cannot be overridden in request body)
```


import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { UserService } from '../services/UserService.js';
import { userRepositoryFactory } from '../repositories/factories/UserRepositoryFactory.js';
import { isAuthenticated, isAdmin, isResourceOwner } from '../middleware/rbac.middleware.js';

const router = Router();

// 1. Dependency Injection Setup
const usersRepository = userRepositoryFactory();
const userService = new UserService(usersRepository);
const userController = new UserController(userService);

// 2. Route Definitions
router.get('/', isAdmin, userController.getAllUsers);
router.get('/:id', isAuthenticated, userController.getUserById);
// NOTE: User creation is only available via POST /auth/register
router.put('/:id', isResourceOwner, userController.updateUser);
router.delete('/:id', isResourceOwner, userController.deleteUser);

// 3. Sub-resource Routes
router.get('/:id/closets', isAuthenticated, isResourceOwner, userController.getUserClosets);
router.get('/:id/outfits', userController.getUserOutfits);
router.get('/:id/reviews', userController.getUserReviews);
router.get('/:id/shared-closets', isAuthenticated, isResourceOwner, userController.getSharedClosets);

export default router;
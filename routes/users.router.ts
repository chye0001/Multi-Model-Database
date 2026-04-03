import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { UserService } from '../services/UserService.js';
import { userRepositoryFactory } from '../repositories/factories/UserRepositoryFactory.js';

const router = Router();

// 1. Dependency Injection Setup
const usersRepository = userRepositoryFactory();
const userService = new UserService(usersRepository);
const userController = new UserController(userService);

// 2. Route Definitions
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// 3. Sub-resource Routes
router.get('/:id/closets', userController.getUserClosets);
router.get('/:id/outfits', userController.getUserOutfits);
router.get('/:id/reviews', userController.getUserReviews);
router.get('/:id/shared-closets', userController.getSharedClosets);

export default router;
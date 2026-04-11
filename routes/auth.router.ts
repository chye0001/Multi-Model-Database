import { Router } from 'express';
import { authRepositoryFactory } from '../repositories/factories/AuthRepositoryFactory.js';
import { AuthService } from '../services/AuthService.js';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

const authRepository = authRepositoryFactory();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

export default router;

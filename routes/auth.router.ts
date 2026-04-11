import { Router } from 'express';
import { PostgresAuthRepository } from '../repositories/postgres/PostgresAuthRepository.js';
import { AuthService } from '../services/AuthService.js';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

const authRepository = new PostgresAuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

export default router;

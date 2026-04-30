import { Router } from 'express';
import { categoryRepositoryFactory } from '../repositories/factories/CategoryRepositoryFactory.js';
import { CategoryService } from '../services/CategoryService.js';
import { CategoryController } from '../controllers/CategoryController.js';
import { hasRole } from '../middleware/rbac.middleware.ts';

const router = Router();

const categoryRepository = categoryRepositoryFactory();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', hasRole(["admin"]), categoryController.createCategory);
router.patch('/:id', hasRole(["admin"]), categoryController.updateCategory);
router.delete('/:id', hasRole(["admin"]), categoryController.deleteCategory);

router.get('/:id/items', categoryController.getCategoryItems);

export default router;

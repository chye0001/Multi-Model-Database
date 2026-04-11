import { Router } from 'express';
import { categoryRepositoryFactory } from '../repositories/factories/CategoryRepositoryFactory.js';
import { CategoryService } from '../services/CategoryService.js';
import { CategoryController } from '../controllers/CategoryController.js';

const router = Router();

const categoryRepository = categoryRepositoryFactory();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.patch('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

router.get('/:id/items', categoryController.getCategoryItems);

export default router;

import { Router } from 'express';
import { brandRepositoryFactory } from '../repositories/factories/BrandRepositoryFactory.js';
import { BrandService } from '../services/BrandService.js';
import { BrandController } from '../controllers/BrandController.js';
import { hasRole } from '../middleware/rbac.middleware.ts';

const router = Router();

const brandRepository = brandRepositoryFactory();
const brandService = new BrandService(brandRepository);
const brandController = new BrandController(brandService);

router.get('/', brandController.getAllBrands);
router.get('/:name', brandController.getBrandByName);
router.post('/', hasRole(["admin"]), brandController.createBrand);
router.patch('/:name', hasRole(["admin"]), brandController.updateBrand);
router.delete('/:name', hasRole(["admin"]), brandController.deleteBrand);

router.get('/:name/items', brandController.getBrandItems);

export default router;

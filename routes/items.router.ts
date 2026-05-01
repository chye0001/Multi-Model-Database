import { Router } from 'express';
import { itemRepositoryFactory } from '../repositories/factories/ItemRepositoryFactory.js';
import { ItemService } from '../services/ItemService.js';
import { ItemController } from '../controllers/ItemController.js';
import { isAdmin, isAuthenticated } from '../middleware/rbac.middleware.js';
import { canModifyItem } from '../middleware/item-auth.middleware.js';

const router = Router();
const itemController = new ItemController(new ItemService(itemRepositoryFactory()));

// Core CRUD — ?category=  ?brand=  ?minPrice=  ?maxPrice=
router.get('/',       itemController.getAllItems);
router.get('/:id',    itemController.getItemById);
router.post('/',      isAuthenticated, itemController.createItem);
router.patch('/:id',  canModifyItem, itemController.updateItem);
router.delete('/:id', canModifyItem, itemController.deleteItem);

// Images sub-resource
router.get('/:id/images',             itemController.getItemImages);
router.post('/:id/images',            canModifyItem, itemController.addImageToItem);
router.delete('/:id/images/:imageId', canModifyItem, itemController.removeImageFromItem);

// Brands sub-resource
router.get('/:id/brands',             itemController.getItemBrands);
router.post('/:id/brands',            canModifyItem, itemController.addBrandToItem);
router.delete('/:id/brands/:brandId', canModifyItem, itemController.removeBrandFromItem);

// show casing index performance
router.get('/price/gt/:price', itemController.getItemByPriceGreaterThan);


export default router;
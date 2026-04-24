import { Router } from 'express';
import { itemRepositoryFactory } from '../repositories/factories/ItemRepositoryFactory.js';
import { ItemService } from '../services/ItemService.js';
import { ItemController } from '../controllers/ItemController.js';

const router = Router();
const itemController = new ItemController(new ItemService(itemRepositoryFactory()));

// Core CRUD — ?category=  ?brand=  ?minPrice=  ?maxPrice=
router.get('/',    itemController.getAllItems);
router.get('/:id', itemController.getItemById);
router.post('/',   itemController.createItem);
router.patch('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

// Images sub-resource
router.get('/:id/images',             itemController.getItemImages);
router.post('/:id/images',            itemController.addImageToItem);
router.delete('/:id/images/:imageId', itemController.removeImageFromItem);

// Brands sub-resource
router.get('/:id/brands',             itemController.getItemBrands);
router.post('/:id/brands',            itemController.addBrandToItem);
router.delete('/:id/brands/:brandId', itemController.removeBrandFromItem);

// show casing index performance
router.get('/price/gt/:price', itemController.getItemByPriceGreaterThan);


export default router;
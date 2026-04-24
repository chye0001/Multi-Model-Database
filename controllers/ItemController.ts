import type { Request, Response } from 'express';
import type { ItemService } from '../services/ItemService.js';
import type { ItemFilters } from '../repositories/interfaces/IItemRepository.js';

export class ItemController {
  constructor(private itemService: ItemService) {}

  getAllItems = async (req: Request, res: Response) => {
    try {
      const filters: ItemFilters = {};
      if (req.query.category) filters.categoryId = Number(req.query.category);
      if (req.query.brand)    filters.brandId    = Number(req.query.brand);
      if (req.query.minPrice) filters.minPrice   = Number(req.query.minPrice);
      if (req.query.maxPrice) filters.maxPrice   = Number(req.query.maxPrice);
      res.send(await this.itemService.getAllItems(filters));
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };

  getItemById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send({ error: 'id must be a number' });
      const items = await this.itemService.getItemById(id);
      if (items.length === 0) return res.status(404).send({ error: 'Item not found' });
      res.send(items);
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };

  createItem = async (req: Request, res: Response) => {
    try {
      const { name, price, categoryId } = req.body;
      if (!name || !categoryId) return res.status(400).send({ error: 'name and categoryId are required' });
      res.status(201).send(await this.itemService.createItem({ name, price, categoryId: Number(categoryId) }));
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to create item' });
    }
  };

  updateItem = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send({ error: 'id must be a number' });
      const { name, price, categoryId } = req.body;
      const items = await this.itemService.updateItem(id, {
        ...(name       !== undefined && { name }),
        ...(price      !== undefined && { price: Number(price) }),
        ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
      });
      if (items.length === 0) return res.status(404).send({ error: 'Item not found' });
      res.send(items);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to update item' });
    }
  };

  deleteItem = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send({ error: 'id must be a number' });
      await this.itemService.deleteItem(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to delete item' });
    }
  };

  getItemImages = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send({ error: 'id must be a number' });
      res.send(await this.itemService.getItemImages(id));
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };

  addImageToItem = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send({ error: 'id must be a number' });
      const { url } = req.body;
      if (!url) return res.status(400).send({ error: 'url is required' });
      res.status(201).send(await this.itemService.addImageToItem(id, { url }));
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to add image' });
    }
  };

  removeImageFromItem = async (req: Request, res: Response) => {
    try {
      const id      = Number(req.params.id);
      const imageId = Number(req.params.imageId);
      if (isNaN(id) || isNaN(imageId)) return res.status(400).send({ error: 'id and imageId must be numbers' });
      await this.itemService.removeImageFromItem(id, imageId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to remove image' });
    }
  };

  getItemBrands = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send({ error: 'id must be a number' });
      res.send(await this.itemService.getItemBrands(id));
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };

  addBrandToItem = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send({ error: 'id must be a number' });
      const { brandId } = req.body;
      if (!brandId) return res.status(400).send({ error: 'brandId is required' });
      res.status(201).send(await this.itemService.addBrandToItem(id, Number(brandId)));
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to add brand' });
    }
  };

  removeBrandFromItem = async (req: Request, res: Response) => {
    try {
      const id      = Number(req.params.id);
      const brandId = Number(req.params.brandId);
      if (isNaN(id) || isNaN(brandId)) return res.status(400).send({ error: 'id and brandId must be numbers' });
      await this.itemService.removeBrandFromItem(id, brandId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to remove brand' });
    }
  };

  getItemByPriceGreaterThan = async (req: Request, res: Response) => {
    try {
      const price = Number(req.params.price);
      if (isNaN(price)) return res.status(400).send({ error: 'price must be a number' });
      
      const items = await this.itemService.getItemByPriceGreaterThan(price);
      if (items.length === 0) return res.status(404).send({ error: 'No items found with price greater than ' + price });
      res.send(items);

    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Failed to find items by price' });
    }
  }
}
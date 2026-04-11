import type { Request, Response } from 'express';
import type { CategoryService } from '../services/CategoryService.js';

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  getAllCategories = async (req: Request, res: Response) => {
    const categories = await this.categoryService.getAllCategories();
    res.send(categories);
  };

  getCategoryById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const categories = await this.categoryService.getCategoryById(id);
      if (categories.length === 0) return res.status(404).send({ error: 'Category not found' });
      res.send(categories);
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };

  createCategory = async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).send({ error: 'name is required' });
      const category = await this.categoryService.createCategory(name);
      res.status(201).send(category);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to create category' });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;
      if (!name) return res.status(400).send({ error: 'name is required' });
      const category = await this.categoryService.updateCategory(id, name);
      if (category.length === 0) return res.status(404).send({ error: 'Category not found' });
      res.send(category);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to update category' });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      await this.categoryService.deleteCategory(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to delete category' });
    }
  };

  getCategoryItems = async (req: Request, res: Response) => {
    const items = await this.categoryService.getCategoryItems(Number(req.params.id));
    res.send(items);
  };
}

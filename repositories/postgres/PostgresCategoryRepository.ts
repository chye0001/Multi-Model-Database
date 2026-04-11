import { prisma } from '../../database/postgres/prisma-client.js';
import { formatClothingItem } from '../../utils/repository_utils/ObjectFormatters.js';
import type { ICategoryRepository } from '../interfaces/ICategoryRepository.js';
import type { Category } from '../../dtos/categories/Category.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';

export class PostgresCategoryRepository implements ICategoryRepository {
  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany();
      return categories.map(c => ({ ...c, fromDatabase: 'postgresql' }));
    } catch (error) {
      console.error('Error fetching categories from PostgreSQL:', error);
      throw new Error('Failed to fetch categories from PostgreSQL');
    }
  }

  async getCategoryById(id: number): Promise<Category[]> {
    try {
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) return [];
      return [{ ...category, fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error(`Error fetching category ${id} from PostgreSQL:`, error);
      throw new Error('Failed to fetch category from PostgreSQL');
    }
  }

  async createCategory(name: string): Promise<Category[]> {
    try {
      const category = await prisma.category.create({ data: { name } });
      return [{ ...category, fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error('Error creating category in PostgreSQL:', error);
      throw new Error('Failed to create category in PostgreSQL');
    }
  }

  async updateCategory(id: number, name: string): Promise<Category[]> {
    try {
      const category = await prisma.category.update({ where: { id }, data: { name } });
      return [{ ...category, fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error(`Error updating category ${id} in PostgreSQL:`, error);
      throw new Error('Failed to update category in PostgreSQL');
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      await prisma.category.delete({ where: { id } });
    } catch (error) {
      console.error(`Error deleting category ${id} from PostgreSQL:`, error);
      throw new Error('Failed to delete category from PostgreSQL');
    }
  }

  async getCategoryItems(id: number): Promise<ClothingItem[]> {
    try {
      const items = await prisma.item.findMany({
        where: { categoryId: id },
        include: {
          category: true,
          itemBrands: { include: { brand: true } },
          images: true,
        },
      });
      return items.map(item => ({ ...formatClothingItem(item, 'postgresql'), fromDatabase: 'postgresql' }));
    } catch (error) {
      console.error(`Error fetching items for category ${id} from PostgreSQL:`, error);
      throw new Error('Failed to fetch category items from PostgreSQL');
    }
  }
}

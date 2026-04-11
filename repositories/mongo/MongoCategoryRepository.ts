import { Category, Item, Brand } from '../../database/mongo/models/index.js';
import { formatClothingItem } from '../../utils/repository_utils/ObjectFormatters.js';
import type { ICategoryRepository } from '../interfaces/ICategoryRepository.js';
import type { Category as CategoryDto } from '../../dtos/categories/Category.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';

export class MongoCategoryRepository implements ICategoryRepository {
  async getAllCategories(): Promise<CategoryDto[]> {
    try {
      const categories = await Category.find().lean().exec();
      return categories.map(c => ({ id: c.id, name: c.name, fromDatabase: 'mongodb' }));
    } catch (error) {
      console.error('Error fetching categories from MongoDB:', error);
      throw new Error('Failed to fetch categories from MongoDB');
    }
  }

  async getCategoryById(id: number): Promise<CategoryDto[]> {
    try {
      const category = await Category.findOne({ id }).lean().exec();
      if (!category) return [];
      return [{ id: category.id, name: category.name, fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error(`Error fetching category ${id} from MongoDB:`, error);
      throw new Error('Failed to fetch category from MongoDB');
    }
  }

  async createCategory(name: string): Promise<CategoryDto[]> {
    try {
      const max = await Category.findOne().sort({ id: -1 }).lean().exec();
      const nextId = max ? max.id + 1 : 1;
      const category = await Category.create({ id: nextId, name });
      return [{ id: category.id, name: category.name, fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error('Error creating category in MongoDB:', error);
      throw new Error('Failed to create category in MongoDB');
    }
  }

  async updateCategory(id: number, name: string): Promise<CategoryDto[]> {
    try {
      const category = await Category.findOneAndUpdate({ id }, { name }, { new: true }).lean().exec();
      if (!category) return [];
      return [{ id: category.id, name: category.name, fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error(`Error updating category ${id} in MongoDB:`, error);
      throw new Error('Failed to update category in MongoDB');
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      await Category.deleteOne({ id }).exec();
    } catch (error) {
      console.error(`Error deleting category ${id} from MongoDB:`, error);
      throw new Error('Failed to delete category from MongoDB');
    }
  }

  async getCategoryItems(id: number): Promise<ClothingItem[]> {
    try {
      const items = await Item.find({ 'category.id': id }).lean().exec();
      const withBrands = await Promise.all(
        items.map(async item => {
          const brands = await Promise.all(
            item.brandIds.map((brandId: any) =>
              Brand.findOne({ _id: brandId }).select('id name').lean().exec()
            )
          );
          return { ...item, brands };
        })
      );
      return withBrands.map(item => ({ ...formatClothingItem(item, 'mongodb'), fromDatabase: 'mongodb' }));
    } catch (error) {
      console.error(`Error fetching items for category ${id} from MongoDB:`, error);
      throw new Error('Failed to fetch category items from MongoDB');
    }
  }
}

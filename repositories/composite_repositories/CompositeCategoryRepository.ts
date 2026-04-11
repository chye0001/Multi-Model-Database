import { isRepositoriesEnabled } from '../../utils/repository_utils/ErrorHandling.js';
import type { ICategoryRepository } from '../interfaces/ICategoryRepository.js';
import type { Category } from '../../dtos/categories/Category.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';

export class CompositeCategoryRepository implements ICategoryRepository {
  constructor(private enabledRepos: ICategoryRepository[]) {}

  async getAllCategories(): Promise<Category[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getAllCategories()));
      return results.flat();
    } catch (error) {
      console.error('Error fetching categories from repositories:', error);
      throw error;
    }
  }

  async getCategoryById(id: number): Promise<Category[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getCategoryById(id)));
      return results.flat();
    } catch (error) {
      console.error(`Error fetching category ${id} from repositories:`, error);
      throw error;
    }
  }

  async createCategory(name: string): Promise<Category[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.createCategory(name)));
      return results.flat();
    } catch (error) {
      console.error('Error creating category in repositories:', error);
      throw error;
    }
  }

  async updateCategory(id: number, name: string): Promise<Category[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.updateCategory(id, name)));
      return results.flat();
    } catch (error) {
      console.error(`Error updating category ${id} in repositories:`, error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      await Promise.all(this.enabledRepos.map(repo => repo.deleteCategory(id)));
    } catch (error) {
      console.error(`Error deleting category ${id} from repositories:`, error);
      throw error;
    }
  }

  async getCategoryItems(id: number): Promise<ClothingItem[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getCategoryItems(id)));
      return results.flat();
    } catch (error) {
      console.error(`Error fetching items for category ${id} from repositories:`, error);
      throw error;
    }
  }
}

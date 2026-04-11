import type { ICategoryRepository } from '../repositories/interfaces/ICategoryRepository.js';
import type { Category } from '../dtos/categories/Category.dto.js';
import type { ClothingItem } from '../dtos/items/Item.dto.js';

export class CategoryService {
  constructor(private categoryRepository: ICategoryRepository) {}

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.getAllCategories();
  }

  async getCategoryById(id: number): Promise<Category[]> {
    return await this.categoryRepository.getCategoryById(id);
  }

  async createCategory(name: string): Promise<Category[]> {
    return await this.categoryRepository.createCategory(name);
  }

  async updateCategory(id: number, name: string): Promise<Category[]> {
    return await this.categoryRepository.updateCategory(id, name);
  }

  async deleteCategory(id: number): Promise<void> {
    await this.categoryRepository.deleteCategory(id);
  }

  async getCategoryItems(id: number): Promise<ClothingItem[]> {
    return await this.categoryRepository.getCategoryItems(id);
  }
}

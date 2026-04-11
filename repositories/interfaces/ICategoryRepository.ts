import type { Category } from '../../dtos/categories/Category.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';

export interface ICategoryRepository {
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category[]>;
  createCategory(name: string): Promise<Category[]>;
  updateCategory(id: number, name: string): Promise<Category[]>;
  deleteCategory(id: number): Promise<void>;

  getCategoryItems(id: number): Promise<ClothingItem[]>;
}

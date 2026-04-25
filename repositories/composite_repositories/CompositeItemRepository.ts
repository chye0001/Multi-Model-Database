import { isRepositoriesEnabled } from '../../utils/repository_utils/ErrorHandling.js';
import type { IItemRepository, ItemFilters } from '../interfaces/IItemRepository.js';
import type { ClothingItem, ItemImage } from '../../dtos/items/Item.dto.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';

export class CompositeItemRepository implements IItemRepository {
  constructor(private enabledRepos: IItemRepository[]) {}

  async getAllItems(filters?: ItemFilters): Promise<ClothingItem[]> {
    isRepositoriesEnabled(this.enabledRepos);
    const results = await Promise.all(this.enabledRepos.map(r => r.getAllItems(filters)));
    return results.flat();
  }
  async getItemById(id: number): Promise<ClothingItem[]> {
    isRepositoriesEnabled(this.enabledRepos);
    const results = await Promise.all(this.enabledRepos.map(r => r.getItemById(id)));
    return results.flat();
  }
  async createItem(data: { name: string; price?: number; categoryId: number }): Promise<ClothingItem[]> {
    isRepositoriesEnabled(this.enabledRepos);
    const results = await Promise.all(this.enabledRepos.map(r => r.createItem(data)));
    return results.flat();
  }
  async updateItem(id: number, data: Partial<{ name: string; price: number; categoryId: number }>): Promise<ClothingItem[]> {
    isRepositoriesEnabled(this.enabledRepos);
    const results = await Promise.all(this.enabledRepos.map(r => r.updateItem(id, data)));
    return results.flat();
  }
  async deleteItem(id: number): Promise<void> {
    isRepositoriesEnabled(this.enabledRepos);
    await Promise.all(this.enabledRepos.map(r => r.deleteItem(id)));
  }
  async getItemImages(id: number): Promise<ItemImage[]> {
    isRepositoriesEnabled(this.enabledRepos);
    const results = await Promise.all(this.enabledRepos.map(r => r.getItemImages(id)));
    return results.flat();
  }
  async addImageToItem(id: number, data: { url: string }): Promise<ItemImage[]> {
    isRepositoriesEnabled(this.enabledRepos);
    const results = await Promise.all(this.enabledRepos.map(r => r.addImageToItem(id, data)));
    return results.flat();
  }
  async removeImageFromItem(id: number, imageId: number): Promise<void> {
    isRepositoriesEnabled(this.enabledRepos);
    await Promise.all(this.enabledRepos.map(r => r.removeImageFromItem(id, imageId)));
  }
  async getItemBrands(id: number): Promise<Brand[]> {
    isRepositoriesEnabled(this.enabledRepos);
    const results = await Promise.all(this.enabledRepos.map(r => r.getItemBrands(id)));
    return results.flat();
  }
  async addBrandToItem(id: number, brandId: number): Promise<Brand[]> {
    isRepositoriesEnabled(this.enabledRepos);
    const results = await Promise.all(this.enabledRepos.map(r => r.addBrandToItem(id, brandId)));
    return results.flat();
  }
  async removeBrandFromItem(id: number, brandId: number): Promise<void> {
    isRepositoriesEnabled(this.enabledRepos);
    await Promise.all(this.enabledRepos.map(r => r.removeBrandFromItem(id, brandId)));
  }

  async getItemsByPriceGreaterThan(price: number): Promise<ClothingItem[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getItemsByPriceGreaterThan(price)));
      return results.flat();
      
    } catch(error) {
      throw error;
    }
  }
}
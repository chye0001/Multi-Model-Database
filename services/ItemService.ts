import type { IItemRepository, ItemFilters } from '../repositories/interfaces/IItemRepository.js';
import type { ClothingItem, ItemImage } from '../dtos/items/Item.dto.js';
import type { Brand } from '../dtos/brands/Brand.dto.js';

export class ItemService {
  constructor(private itemRepository: IItemRepository) {}

  async getAllItems(filters?: ItemFilters): Promise<ClothingItem[]> { return await this.itemRepository.getAllItems(filters); }
  async getItemById(id: number): Promise<ClothingItem[]> { return await this.itemRepository.getItemById(id); }
  async createItem(data: { name: string; price?: number; categoryId: number }): Promise<ClothingItem[]> { return await this.itemRepository.createItem(data); }
  async updateItem(id: number, data: Partial<{ name: string; price: number; categoryId: number }>): Promise<ClothingItem[]> { return await this.itemRepository.updateItem(id, data); }
  async deleteItem(id: number): Promise<void> { await this.itemRepository.deleteItem(id); }
  async getItemImages(id: number): Promise<ItemImage[]> { return await this.itemRepository.getItemImages(id); }
  async addImageToItem(id: number, data: { url: string }): Promise<ItemImage[]> { return await this.itemRepository.addImageToItem(id, data); }
  async removeImageFromItem(id: number, imageId: number): Promise<void> { await this.itemRepository.removeImageFromItem(id, imageId); }
  async getItemBrands(id: number): Promise<Brand[]> { return await this.itemRepository.getItemBrands(id); }
  async addBrandToItem(id: number, brandId: number): Promise<Brand[]> { return await this.itemRepository.addBrandToItem(id, brandId); }
  async removeBrandFromItem(id: number, brandId: number): Promise<void> { await this.itemRepository.removeBrandFromItem(id, brandId); }
}
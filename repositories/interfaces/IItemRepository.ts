import type { ClothingItem, ItemImage } from '../../dtos/items/Item.dto.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';

export interface ItemFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  brandId?: number;
}

export interface IItemRepository {
  getAllItems(filters?: ItemFilters): Promise<ClothingItem[]>;
  getItemById(id: number): Promise<ClothingItem[]>;
  createItem(data: { name: string; price?: number; categoryId: number }): Promise<ClothingItem[]>;
  updateItem(id: number, data: Partial<{ name: string; price: number; categoryId: number }>): Promise<ClothingItem[]>;
  deleteItem(id: number): Promise<void>;

  getItemImages(id: number): Promise<ItemImage[]>;
  addImageToItem(id: number, data: { url: string }): Promise<ItemImage[]>;
  removeImageFromItem(id: number, imageId: number): Promise<void>;

  getItemBrands(id: number): Promise<Brand[]>;
  addBrandToItem(id: number, brandId: number): Promise<Brand[]>;
  removeBrandFromItem(id: number, brandId: number): Promise<void>;

  // shows index in action
  getItemsByPriceGreaterThan(price: number): Promise<ClothingItem[]> 
}

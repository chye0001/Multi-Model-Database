import type { Brand } from '../../dtos/brands/Brand.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';

export interface IBrandRepository {
  getAllBrands(countryCode?: string): Promise<Brand[]>;
  getBrandByName(name: string): Promise<Brand[]>;
  createBrand(data: { name: string; countryCode: string }): Promise<Brand[]>;
  updateBrand(name: string, newName: string): Promise<Brand[]>;
  deleteBrand(name: string): Promise<void>;

  getBrandItems(name: string): Promise<ClothingItem[]>;
}

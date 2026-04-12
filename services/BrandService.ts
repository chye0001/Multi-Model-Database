import type { IBrandRepository } from '../repositories/interfaces/IBrandRepository.js';
import type { Brand } from '../dtos/brands/Brand.dto.js';
import type { ClothingItem } from '../dtos/items/Item.dto.js';

export class BrandService {
  constructor(private brandRepository: IBrandRepository) {}

  async getAllBrands(countryCode?: string): Promise<Brand[]> {
    return await this.brandRepository.getAllBrands(countryCode);
  }

  async getBrandByName(name: string): Promise<Brand[]> {
    return await this.brandRepository.getBrandByName(name);
  }

  async createBrand(data: { name: string; countryCode: string }): Promise<Brand[]> {
    return await this.brandRepository.createBrand(data);
  }

  async updateBrand(name: string, newName: string): Promise<Brand[]> {
    return await this.brandRepository.updateBrand(name, newName);
  }

  async deleteBrand(name: string): Promise<void> {
    await this.brandRepository.deleteBrand(name);
  }

  async getBrandItems(name: string): Promise<ClothingItem[]> {
    return await this.brandRepository.getBrandItems(name);
  }
}

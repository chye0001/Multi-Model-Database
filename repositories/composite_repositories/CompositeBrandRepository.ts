import { isRepositoriesEnabled } from '../../utils/repository_utils/ErrorHandling.js';
import type { IBrandRepository } from '../interfaces/IBrandRepository.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';

export class CompositeBrandRepository implements IBrandRepository {
  constructor(private enabledRepos: IBrandRepository[]) {}

  async getAllBrands(countryCode?: string): Promise<Brand[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getAllBrands(countryCode)));
      return results.flat();
    } catch (error) {
      console.error('Error fetching brands from repositories:', error);
      throw error;
    }
  }

  async getBrandByName(name: string): Promise<Brand[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getBrandByName(name)));
      return results.flat();
    } catch (error) {
      console.error(`Error fetching brand "${name}" from repositories:`, error);
      throw error;
    }
  }

  async createBrand(data: { name: string; countryCode: string }): Promise<Brand[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.createBrand(data)));
      return results.flat();
    } catch (error) {
      console.error('Error creating brand in repositories:', error);
      throw error;
    }
  }

  async updateBrand(name: string, newName: string): Promise<Brand[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.updateBrand(name, newName)));
      return results.flat();
    } catch (error) {
      console.error(`Error updating brand "${name}" in repositories:`, error);
      throw error;
    }
  }

  async deleteBrand(name: string): Promise<void> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      await Promise.all(this.enabledRepos.map(repo => repo.deleteBrand(name)));
    } catch (error) {
      console.error(`Error deleting brand "${name}" from repositories:`, error);
      throw error;
    }
  }

  async getBrandItems(name: string): Promise<ClothingItem[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getBrandItems(name)));
      return results.flat();
    } catch (error) {
      console.error(`Error fetching items for brand "${name}" from repositories:`, error);
      throw error;
    }
  }
}

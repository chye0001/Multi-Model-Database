import { isRepositoriesEnabled } from '../../utils/repository_utils/ErrorHandling.js';
import type { ICountryRepository } from '../interfaces/ICountryRepository.js';
import type { Country } from '../../dtos/countries/Country.dto.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';

export class CompositeCountryRepository implements ICountryRepository {
  constructor(private enabledRepos: ICountryRepository[]) {}

  async getAllCountries(): Promise<Country[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getAllCountries()));
      return results.flat();
    } catch (error) {
      console.error('Error fetching countries from repositories:', error);
      throw error;
    }
  }

  async getCountryByCode(code: string): Promise<Country[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getCountryByCode(code)));
      return results.flat();
    } catch (error) {
      console.error(`Error fetching country ${code} from repositories:`, error);
      throw error;
    }
  }

  async createCountry(data: { name: string; countryCode: string }): Promise<Country[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.createCountry(data)));
      return results.flat();
    } catch (error) {
      console.error('Error creating country in repositories:', error);
      throw error;
    }
  }

  async deleteCountry(code: string): Promise<void> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      await Promise.all(this.enabledRepos.map(repo => repo.deleteCountry(code)));
    } catch (error) {
      console.error(`Error deleting country ${code} from repositories:`, error);
      throw error;
    }
  }

  async getCountryBrands(code: string): Promise<Brand[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getCountryBrands(code)));
      return results.flat();
    } catch (error) {
      console.error(`Error fetching brands for country ${code} from repositories:`, error);
      throw error;
    }
  }
}

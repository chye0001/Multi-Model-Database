import type { ICountryRepository } from '../repositories/interfaces/ICountryRepository.js';
import type { Country } from '../dtos/countries/Country.dto.js';
import type { Brand } from '../dtos/brands/Brand.dto.js';

export class CountryService {
  constructor(private countryRepository: ICountryRepository) {}

  async getAllCountries(): Promise<Country[]> {
    return await this.countryRepository.getAllCountries();
  }

  async getCountryByCode(code: string): Promise<Country[]> {
    return await this.countryRepository.getCountryByCode(code);
  }

  async createCountry(data: { name: string; countryCode: string }): Promise<Country[]> {
    return await this.countryRepository.createCountry(data);
  }

  async deleteCountry(code: string): Promise<void> {
    await this.countryRepository.deleteCountry(code);
  }

  async getCountryBrands(code: string): Promise<Brand[]> {
    return await this.countryRepository.getCountryBrands(code);
  }
}

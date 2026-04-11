import { prisma } from '../../database/postgres/prisma-client.js';
import type { ICountryRepository } from '../interfaces/ICountryRepository.js';
import type { Country } from '../../dtos/countries/Country.dto.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';

export class PostgresCountryRepository implements ICountryRepository {
  async getAllCountries(): Promise<Country[]> {
    try {
      const countries = await prisma.country.findMany();
      return countries.map(c => ({ ...c, fromDatabase: 'postgresql' }));
    } catch (error) {
      console.error('Error fetching countries from PostgreSQL:', error);
      throw new Error('Failed to fetch countries from PostgreSQL');
    }
  }

  async getCountryByCode(code: string): Promise<Country[]> {
    try {
      const country = await prisma.country.findFirst({ where: { countryCode: code } });
      if (!country) return [];
      return [{ ...country, fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error(`Error fetching country ${code} from PostgreSQL:`, error);
      throw new Error('Failed to fetch country from PostgreSQL');
    }
  }

  async createCountry(data: { name: string; countryCode: string }): Promise<Country[]> {
    try {
      const country = await prisma.country.create({ data });
      return [{ ...country, fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error('Error creating country in PostgreSQL:', error);
      throw new Error('Failed to create country in PostgreSQL');
    }
  }

  async deleteCountry(code: string): Promise<void> {
    try {
      await prisma.country.deleteMany({ where: { countryCode: code } });
    } catch (error) {
      console.error(`Error deleting country ${code} from PostgreSQL:`, error);
      throw new Error('Failed to delete country from PostgreSQL');
    }
  }

  async getCountryBrands(code: string): Promise<Brand[]> {
    try {
      const country = await prisma.country.findFirst({
        where: { countryCode: code },
        include: { brands: true },
      });
      if (!country) return [];
      return country.brands.map(b => ({
        id: b.id,
        name: b.name,
        fromDatabase: 'postgresql',
      }));
    } catch (error) {
      console.error(`Error fetching brands for country ${code} from PostgreSQL:`, error);
      throw new Error('Failed to fetch country brands from PostgreSQL');
    }
  }
}

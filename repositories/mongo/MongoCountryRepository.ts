import { Country, Brand } from '../../database/mongo/models/index.js';
import type { ICountryRepository } from '../interfaces/ICountryRepository.js';
import type { Country as CountryDto } from '../../dtos/countries/Country.dto.js';
import type { Brand as BrandDto } from '../../dtos/brands/Brand.dto.js';

export class MongoCountryRepository implements ICountryRepository {

  async getAllCountries(): Promise<CountryDto[]> {
    try {
      const countries = await Country.find().lean().exec();
      return countries.map(c => ({ id: c.id, name: c.name, countryCode: c.countryCode, fromDatabase: 'mongodb' }));
    } catch (error) {
      console.error('Error fetching countries from MongoDB:', error);
      throw new Error('Failed to fetch countries from MongoDB');
    }
  }

  async getCountryByCode(code: string): Promise<CountryDto[]> {
    try {
      const country = await Country.findOne({ countryCode: code.toUpperCase() }).lean().exec();
      if (!country) return [];
      return [{ id: country.id, name: country.name, countryCode: country.countryCode, fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error(`Error fetching country ${code} from MongoDB:`, error);
      throw new Error('Failed to fetch country from MongoDB');
    }
  }

  async createCountry(data: { name: string; countryCode: string }): Promise<CountryDto[]> {
    try {
      const max = await Country.findOne().sort({ id: -1 }).lean().exec();
      const nextId = max ? max.id + 1 : 1;
      const country = await Country.create({ id: nextId, name: data.name, countryCode: data.countryCode });
      return [{ id: country.id, name: country.name, countryCode: country.countryCode, fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error('Error creating country in MongoDB:', error);
      throw new Error('Failed to create country in MongoDB');
    }
  }

  async deleteCountry(code: string): Promise<void> {
    try {
      await Country.deleteOne({ countryCode: code.toUpperCase() }).exec();
    } catch (error) {
      console.error(`Error deleting country ${code} from MongoDB:`, error);
      throw new Error('Failed to delete country from MongoDB');
    }
  }

  async getCountryBrands(code: string): Promise<BrandDto[]> {
    try {
      const country = await Country.findOne({ countryCode: code.toUpperCase() }).lean().exec();
      if (!country) return [];
      const brands = await Brand.find({ countryId: country._id }).lean().exec();
      return brands.map(b => ({ id: b.id, name: b.name, fromDatabase: 'mongodb' }));
    } catch (error) {
      console.error(`Error fetching brands for country ${code} from MongoDB:`, error);
      throw new Error('Failed to fetch country brands from MongoDB');
    }
  }
}

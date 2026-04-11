import { getCountryModel } from '../../database/neo4j/models/index.js';
import { neogma } from '../../database/neo4j/neogma-client.js';
import type { ICountryRepository } from '../interfaces/ICountryRepository.js';
import type { Country } from '../../dtos/countries/Country.dto.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';

export class Neo4jCountryRepository implements ICountryRepository {
  async getAllCountries(): Promise<Country[]> {
    try {
      const result = await neogma.queryRunner.run(`MATCH (c:Country) RETURN c`);
      return result.records.map(record => {
        const c = record.get('c').properties;
        return { id: c.id, name: c.name, countryCode: c.countryCode, fromDatabase: 'neo4j' };
      });
    } catch (error) {
      console.error('Error fetching countries from Neo4j:', error);
      throw new Error('Failed to fetch countries from Neo4j');
    }
  }

  async getCountryByCode(code: string): Promise<Country[]> {
    try {
      const result = await neogma.queryRunner.run(
        `MATCH (c:Country { countryCode: $code }) RETURN c`,
        { code }
      );
      return result.records.map(record => {
        const c = record.get('c').properties;
        return { id: c.id, name: c.name, countryCode: c.countryCode, fromDatabase: 'neo4j' };
      });
    } catch (error) {
      console.error(`Error fetching country ${code} from Neo4j:`, error);
      throw new Error('Failed to fetch country from Neo4j');
    }
  }

  async createCountry(data: { name: string; countryCode: string }): Promise<Country[]> {
    try {
      const result = await neogma.queryRunner.run(`MATCH (c:Country) RETURN max(c.id) AS maxId`);
      const maxId = result.records[0]?.get('maxId') ?? 0;
      const nextId = (maxId as number) + 1;

      const CountryModel = getCountryModel();
      await CountryModel.createOne({ id: nextId, name: data.name, countryCode: data.countryCode });
      return [{ id: nextId, name: data.name, countryCode: data.countryCode, fromDatabase: 'neo4j' }];
    } catch (error) {
      console.error('Error creating country in Neo4j:', error);
      throw new Error('Failed to create country in Neo4j');
    }
  }

  async deleteCountry(code: string): Promise<void> {
    try {
      await neogma.queryRunner.run(
        `MATCH (c:Country { countryCode: $code }) DETACH DELETE c`,
        { code }
      );
    } catch (error) {
      console.error(`Error deleting country ${code} from Neo4j:`, error);
      throw new Error('Failed to delete country from Neo4j');
    }
  }

  async getCountryBrands(code: string): Promise<Brand[]> {
    try {
      const result = await neogma.queryRunner.run(
        `MATCH (b:Brand)-[:IS_FROM]->(c:Country { countryCode: $code }) RETURN b`,
        { code }
      );
      return result.records.map(record => {
        const b = record.get('b').properties;
        return { id: b.id, name: b.name, fromDatabase: 'neo4j' };
      });
    } catch (error) {
      console.error(`Error fetching brands for country ${code} from Neo4j:`, error);
      throw new Error('Failed to fetch country brands from Neo4j');
    }
  }
}

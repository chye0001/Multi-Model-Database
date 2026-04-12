import { getBrandModel } from '../../database/neo4j/models/index.js';
import { neogma } from '../../database/neo4j/neogma-client.js';
import type { IBrandRepository } from '../interfaces/IBrandRepository.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';

function formatBrand(b: any, c: any): Brand {
  return {
    id: b.id,
    name: b.name,
    country: c ? { id: c.id, name: c.name, countryCode: c.countryCode } : undefined,
    fromDatabase: 'neo4j',
  };
}

export class Neo4jBrandRepository implements IBrandRepository {
  async getAllBrands(countryCode?: string): Promise<Brand[]> {
    try {
      const query = countryCode
        ? `MATCH (b:Brand)-[:IS_FROM]->(c:Country { countryCode: $countryCode }) RETURN b, c`
        : `MATCH (b:Brand) OPTIONAL MATCH (b)-[:IS_FROM]->(c:Country) RETURN b, c`;
      const result = await neogma.queryRunner.run(query, countryCode ? { countryCode } : {});
      return result.records.map(record => {
        const b = record.get('b').properties;
        const c = record.get('c')?.properties ?? null;
        return formatBrand(b, c);
      });
    } catch (error) {
      console.error('Error fetching brands from Neo4j:', error);
      throw new Error('Failed to fetch brands from Neo4j');
    }
  }

  async getBrandByName(name: string): Promise<Brand[]> {
    try {
      const result = await neogma.queryRunner.run(
        `MATCH (b:Brand { name: $name }) OPTIONAL MATCH (b)-[:IS_FROM]->(c:Country) RETURN b, c`,
        { name }
      );
      return result.records.map(record => {
        const b = record.get('b').properties;
        const c = record.get('c')?.properties ?? null;
        return formatBrand(b, c);
      });
    } catch (error) {
      console.error(`Error fetching brand "${name}" from Neo4j:`, error);
      throw new Error('Failed to fetch brand from Neo4j');
    }
  }

  async createBrand(data: { name: string; countryCode: string }): Promise<Brand[]> {
    try {
      const countryResult = await neogma.queryRunner.run(
        `MATCH (c:Country { countryCode: $countryCode }) RETURN c`,
        { countryCode: data.countryCode }
      );
      if (countryResult.records.length === 0) throw new Error(`Country "${data.countryCode}" not found`);
      const c = countryResult.records[0]!.get('c').properties;

      const maxResult = await neogma.queryRunner.run(`MATCH (b:Brand) RETURN max(b.id) AS maxId`);
      const maxId = maxResult.records[0]?.get('maxId') ?? 0;
      const nextId = (maxId as number) + 1;

      const BrandModel = getBrandModel();
      const brand = await BrandModel.createOne({ id: nextId, name: data.name });
      await brand.relateTo({ alias: 'country', where: { countryCode: data.countryCode } });

      return [formatBrand({ id: nextId, name: data.name }, c)];
    } catch (error) {
      console.error('Error creating brand in Neo4j:', error);
      throw new Error('Failed to create brand in Neo4j');
    }
  }

  async updateBrand(name: string, newName: string): Promise<Brand[]> {
    try {
      const result = await neogma.queryRunner.run(
        `MATCH (b:Brand { name: $name }) OPTIONAL MATCH (b)-[:IS_FROM]->(c:Country) SET b.name = $newName RETURN b, c`,
        { name, newName }
      );
      if (result.records.length === 0) return [];
      const b = result.records[0]!.get('b').properties;
      const c = result.records[0]!.get('c')?.properties ?? null;
      return [formatBrand(b, c)];
    } catch (error) {
      console.error(`Error updating brand "${name}" in Neo4j:`, error);
      throw new Error('Failed to update brand in Neo4j');
    }
  }

  async deleteBrand(name: string): Promise<void> {
    try {
      await neogma.queryRunner.run(
        `MATCH (b:Brand { name: $name }) DETACH DELETE b`,
        { name }
      );
    } catch (error) {
      console.error(`Error deleting brand "${name}" from Neo4j:`, error);
      throw new Error('Failed to delete brand from Neo4j');
    }
  }

  async getBrandItems(name: string): Promise<ClothingItem[]> {
    try {
      const result = await neogma.queryRunner.run(`
        MATCH (i:Item)-[:BELONGS_TO]->(b:Brand { name: $name })
        OPTIONAL MATCH (i)-[:BELONGS_TO]->(otherBrand:Brand)
        OPTIONAL MATCH (i)-[:HAS]->(img:Image)
        OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
        RETURN i,
               collect(DISTINCT otherBrand) AS brands,
               collect(DISTINCT img)        AS images,
               cat
      `, { name });

      return result.records.map(record => {
        const i = record.get('i').properties;
        const cat = record.get('cat')?.properties;
        const brands = record.get('brands')
          .filter((b: any) => b !== null)
          .map((b: any) => ({ id: b.properties.id, name: b.properties.name }));
        const images = record.get('images')
          .filter((img: any) => img !== null)
          .map((img: any) => ({ id: img.properties.id, url: img.properties.url }));

        return {
          id: Number(i.id),
          name: i.name,
          price: i.price ?? null,
          category: cat?.name ?? 'Unknown',
          brands,
          images,
          fromDatabase: 'neo4j',
        };
      });
    } catch (error) {
      console.error(`Error fetching items for brand "${name}" from Neo4j:`, error);
      throw new Error('Failed to fetch brand items from Neo4j');
    }
  }
}

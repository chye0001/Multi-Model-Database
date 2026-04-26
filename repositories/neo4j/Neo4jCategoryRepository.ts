import { getCategoryModel } from '../../database/neo4j/models/index.js';
import { neogma } from '../../database/neo4j/neogma-client.js';
import type { ICategoryRepository } from '../interfaces/ICategoryRepository.js';
import type { Category } from '../../dtos/categories/Category.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';

export class Neo4jCategoryRepository implements ICategoryRepository {
  async getAllCategories(): Promise<Category[]> {
    try {
      const result = await neogma.queryRunner.run(`MATCH (c:Category) RETURN c`);
      return result.records.map(record => {
        const c = record.get('c').properties;
        return { id: c.id, name: c.name, fromDatabase: 'neo4j' };
      });
    } catch (error) {
      console.error('Error fetching categories from Neo4j:', error);
      throw new Error('Failed to fetch categories from Neo4j');
    }
  }

  async getCategoryById(id: number): Promise<Category[]> {
    try {
      const result = await neogma.queryRunner.run(
        `MATCH (c:Category { id: $id }) RETURN c`,
        { id }
      );
      return result.records.map(record => {
        const c = record.get('c').properties;
        return { id: c.id, name: c.name, fromDatabase: 'neo4j' };
      });
    } catch (error) {
      console.error(`Error fetching category ${id} from Neo4j:`, error);
      throw new Error('Failed to fetch category from Neo4j');
    }
  }

  async createCategory(name: string): Promise<Category[]> {
    try {
      const result = await neogma.queryRunner.run(`MATCH (c:Category) RETURN max(c.id) AS maxId`);
      const maxId = result.records[0]?.get('maxId') ?? 0;
      const nextId = (maxId as number) + 1;

      const CategoryModel = getCategoryModel();
      await CategoryModel.createOne({ id: nextId, name });
      return [{ id: nextId, name, fromDatabase: 'neo4j' }];
    } catch (error) {
      console.error('Error creating category in Neo4j:', error);
      throw new Error('Failed to create category in Neo4j');
    }
  }

  async updateCategory(id: number, name: string): Promise<Category[]> {
    try {
      const result = await neogma.queryRunner.run(
        `MATCH (c:Category { id: $id }) SET c.name = $name RETURN c`,
        { id, name }
      );
      if (result.records.length === 0) return [];
      const c = result.records[0]!.get('c').properties;
      return [{ id: c.id, name: c.name, fromDatabase: 'neo4j' }];
    } catch (error) {
      console.error(`Error updating category ${id} in Neo4j:`, error);
      throw new Error('Failed to update category in Neo4j');
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      await neogma.queryRunner.run(
        `MATCH (c:Category { id: $id }) DETACH DELETE c`,
        { id }
      );
    } catch (error) {
      console.error(`Error deleting category ${id} from Neo4j:`, error);
      throw new Error('Failed to delete category from Neo4j');
    }
  }

  async getCategoryItems(id: number): Promise<ClothingItem[]> {
    try {
      const result = await neogma.queryRunner.run(
          `MATCH (i:Item)-[:BELONGS_TO]->(cat:Category { id: $id })
         OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
         OPTIONAL MATCH (i)-[:HAS]->(img:Image)
         RETURN i, cat, collect(DISTINCT b) AS brands, collect(DISTINCT img) AS images`,
          { id }
      );

      return result.records.map((record) => {
        const i = record.get("i").properties;
        const cat = record.get("cat")?.properties;

        const brands = (record.get("brands") ?? [])
            .filter((b: any) => b !== null)
            .map((b: any) => ({
              id: Number(b.properties.id),
              name: String(b.properties.name),
              country: { id: 0, name: "", countryCode: "" },
            }));

        const images = (record.get("images") ?? [])
            .filter((img: any) => img !== null)
            .map((img: any) => ({
              id: Number(img.properties.id),
              url: String(img.properties.url),
            }));

        return {
          id: Number(i.id),
          name: String(i.name),
          price: i.price ?? null,
          category: {
            categoryId: Number(cat?.id ?? id),
            name: String(cat?.name ?? "Unknown"),
          },
          brands,
          images,
          fromDatabase: "neo4j",
        };
      });
    } catch (error) {
      console.error(`Error fetching items for category ${id} from Neo4j:`, error);
      throw new Error("Failed to fetch category items from Neo4j");
    }
  }
}

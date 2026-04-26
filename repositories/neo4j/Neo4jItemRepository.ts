import { getItemModel, getImageModel } from '../../database/neo4j/models/index.js';
import { neogma } from '../../database/neo4j/neogma-client.js';
import type { IItemRepository, ItemFilters } from '../interfaces/IItemRepository.js';
import type { ClothingItem, ItemImage } from '../../dtos/items/Item.dto.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';
import { audit } from '../../utils/audit/AuditLogger.ts';
import { formatClothingItem } from '../../utils/repository_utils/ObjectFormatters.ts';

function formatItem(record: any): ClothingItem {
  const i = record.get('i').properties;
  const cat = record.get('cat')?.properties;
  const brands = (record.get('brands') ?? [])
      .filter((b: any) => b !== null)
      .map((b: any) => {
        const bp = b.properties;
        return { id: Number(bp.id), name: bp.name, country: { id: 0, name: '', countryCode: '' } };
      });
  const images = (record.get('images') ?? [])
      .filter((img: any) => img !== null)
      .map((img: any) => ({ id: Number(img.properties.id), url: img.properties.url }));
  return {
    id: Number(i.id),
    name: i.name,
    price: i.price ?? null,
    category: { categoryId: Number(cat?.id ?? 0), name: cat?.name ?? 'Unknown' },
    brands,
    images,
    fromDatabase: 'neo4j',
  };
}

const ITEM_QUERY = (where = '') => `
  MATCH (i:Item) ${where}
  OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
  OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
  OPTIONAL MATCH (i)-[:HAS]->(img:Image)
  WITH i, cat, collect(DISTINCT b) AS brands, collect(DISTINCT img) AS images
  RETURN i, cat, brands, images
`;

export class Neo4jItemRepository implements IItemRepository {
  async getAllItems(filters?: ItemFilters): Promise<ClothingItem[]> {
    try {
      const conditions: string[] = [];
      const params: Record<string, any> = {};
      if (filters?.categoryId !== undefined) { conditions.push('(i)-[:BELONGS_TO]->(:Category { id: $categoryId })'); params.categoryId = filters.categoryId; }
      if (filters?.brandId !== undefined) { conditions.push('(i)-[:MADE_BY]->(:Brand { id: $brandId })'); params.brandId = filters.brandId; }
      if (filters?.minPrice !== undefined) { conditions.push('i.price >= $minPrice'); params.minPrice = filters.minPrice; }
      if (filters?.maxPrice !== undefined) { conditions.push('i.price <= $maxPrice'); params.maxPrice = filters.maxPrice; }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const result = await neogma.queryRunner.run(ITEM_QUERY(where), params);
      return result.records.map(formatItem);
    } catch (error) {
      console.error('Error fetching items from Neo4j:', error);
      throw new Error('Failed to fetch items from Neo4j');
    }
  }

  async getItemById(id: number): Promise<ClothingItem[]> {
    try {
      const result = await neogma.queryRunner.run(ITEM_QUERY('WHERE i.id = $id'), { id });
      return result.records.map(formatItem);
    } catch (error) {
      console.error(`Error fetching item ${id} from Neo4j:`, error);
      throw new Error('Failed to fetch item from Neo4j');
    }
  }

  async createItem(data: { name: string; price?: number; categoryId: number }): Promise<ClothingItem[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'NODE_CREATE',
      label: 'Item',
      params: { name: data.name, categoryId: data.categoryId },
      source: 'Neo4jItemRepository.createItem',
    });
    const session = neogma.driver.session();
    try {
      const catCheck = await neogma.queryRunner.run(`MATCH (cat:Category { id: $id }) RETURN cat`, { id: data.categoryId });
      if (catCheck.records.length === 0) throw new Error(`Category ${data.categoryId} not found`);

      const maxResult = await neogma.queryRunner.run(`MATCH (i:Item) RETURN coalesce(max(i.id), 0) AS maxId`);
      const nextId = Number(maxResult.records[0]?.get('maxId') ?? 0) + 1;

      await session.executeWrite(async (tx) => {
        const ItemModel = getItemModel();
        const item = await ItemModel.createOne({ id: nextId, name: data.name, ...(data.price !== undefined && { price: data.price }) });
        await item.relateTo({ alias: 'category', where: { id: data.categoryId } });
      });

      return await this.getItemById(nextId);
    } catch (error) {
      console.error('Error creating item in Neo4j:', error);
      throw new Error('Failed to create item in Neo4j');
    } finally {
      await session.close();
    }
  }

  async updateItem(id: number, data: Partial<{ name: string; price: number; categoryId: number }>): Promise<ClothingItem[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'NODE_UPDATE',
      label: 'Item',
      params: { id, ...data },
      source: 'Neo4jItemRepository.updateItem',
    });
    try {
      const setParts: string[] = [];
      const params: Record<string, any> = { id };
      if (data.name !== undefined) { setParts.push('i.name = $name'); params.name = data.name; }
      if (data.price !== undefined) { setParts.push('i.price = $price'); params.price = data.price; }
      if (setParts.length > 0) {
        await neogma.queryRunner.run(`MATCH (i:Item { id: $id }) SET ${setParts.join(', ')}`, params);
      }
      if (data.categoryId !== undefined) {
        await neogma.queryRunner.run(`MATCH (i:Item { id: $id })-[r:BELONGS_TO]->(:Category) DELETE r`, { id });
        await neogma.queryRunner.run(`MATCH (i:Item { id: $id }), (cat:Category { id: $catId }) MERGE (i)-[:BELONGS_TO]->(cat)`, { id, catId: data.categoryId });
      }
      return await this.getItemById(id);
    } catch (error) {
      console.error(`Error updating item ${id} in Neo4j:`, error);
      throw new Error('Failed to update item in Neo4j');
    }
  }

  async deleteItem(id: number): Promise<void> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'NODE_DELETE',
      label: 'Item',
      params: { id },
      source: 'Neo4jItemRepository.deleteItem',
    });
    try {
      await neogma.queryRunner.run(`MATCH (i:Item { id: $id }) DETACH DELETE i`, { id });
    } catch (error) {
      console.error(`Error deleting item ${id} from Neo4j:`, error);
      throw new Error('Failed to delete item from Neo4j');
    }
  }

  async getItemImages(id: number): Promise<ItemImage[]> {
    try {
      const result = await neogma.queryRunner.run(
          `MATCH (i:Item { id: $id })-[:HAS]->(img:Image) RETURN img`, { id }
      );
      return result.records.map(r => {
        const p = r.get('img').properties;
        return { id: Number(p.id), url: p.url };
      });
    } catch (error) {
      console.error(`Error fetching images for item ${id} from Neo4j:`, error);
      throw new Error('Failed to fetch item images from Neo4j');
    }
  }

  async addImageToItem(id: number, data: { url: string }): Promise<ItemImage[]> {
    const session = neogma.driver.session();
    try {
      const maxResult = await neogma.queryRunner.run(`MATCH (img:Image) RETURN coalesce(max(img.id), 0) AS maxId`);
      const nextId = Number(maxResult.records[0]?.get('maxId') ?? 0) + 1;

      await session.executeWrite(async (tx) => {
        const ImageModel = getImageModel();
        await ImageModel.createOne({ id: nextId, url: data.url });
        await tx.run(
            `MATCH (i:Item { id: $itemId }), (img:Image { id: $imgId }) MERGE (i)-[:HAS]->(img)`,
            { itemId: id, imgId: nextId }
        );
      });

      return await this.getItemImages(id);
    } catch (error) {
      console.error(`Error adding image to item ${id} in Neo4j:`, error);
      throw new Error('Failed to add image to item in Neo4j');
    } finally {
      await session.close();
    }
  }

  async removeImageFromItem(id: number, imageId: number): Promise<void> {
    try {
      await neogma.queryRunner.run(
          `MATCH (i:Item { id: $id })-[r:HAS]->(img:Image { id: $imageId }) DELETE r`,
          { id, imageId }
      );
    } catch (error) {
      console.error(`Error removing image ${imageId} from item ${id} in Neo4j:`, error);
      throw new Error('Failed to remove image from item in Neo4j');
    }
  }

  async getItemBrands(id: number): Promise<Brand[]> {
    try {
      const result = await neogma.queryRunner.run(
          `MATCH (i:Item { id: $id })-[:MADE_BY]->(b:Brand) OPTIONAL MATCH (b)-[:IS_FROM]->(c:Country) RETURN b, c`,
          { id }
      );
      return result.records.map(r => {
        const b = r.get('b').properties;
        const c = r.get('c')?.properties;
        return { id: Number(b.id), name: b.name, country: c ? { id: Number(c.id), name: c.name, countryCode: c.countryCode } : { id: 0, name: '', countryCode: '' }, fromDatabase: 'neo4j' };
      });
    } catch (error) {
      console.error(`Error fetching brands for item ${id} from Neo4j:`, error);
      throw new Error('Failed to fetch item brands from Neo4j');
    }
  }

  async addBrandToItem(id: number, brandId: number): Promise<Brand[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'RELATIONSHIP_CREATE',
      label: 'Item-[:MADE_BY]->Brand',
      params: { itemId: id, brandId },
      source: 'Neo4jItemRepository.addBrandToItem',
    });
    const session = neogma.driver.session();
    try {
      const check = await neogma.queryRunner.run(`MATCH (b:Brand { id: $brandId }) RETURN b`, { brandId });
      if (check.records.length === 0) throw new Error(`Brand ${brandId} not found`);

      await session.executeWrite(async (tx) => {
        await tx.run(
            `MATCH (i:Item { id: $id }), (b:Brand { id: $brandId }) MERGE (i)-[:MADE_BY]->(b)`,
            { id, brandId }
        );
      });

      return await this.getItemBrands(id);
    } catch (error) {
      console.error(`Error adding brand ${brandId} to item ${id} in Neo4j:`, error);
      throw new Error('Failed to add brand to item in Neo4j');
    } finally {
      await session.close();
    }
  }

  async removeBrandFromItem(id: number, brandId: number): Promise<void> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'RELATIONSHIP_DELETE',
      label: 'Item-[:MADE_BY]->Brand',
      params: { itemId: id, brandId },
      source: 'Neo4jItemRepository.removeBrandFromItem',
    });
    try {
      await neogma.queryRunner.run(
          `MATCH (i:Item { id: $id })-[r:MADE_BY]->(b:Brand { id: $brandId }) DELETE r`,
          { id, brandId }
      );
    } catch (error) {
      console.error(`Error removing brand ${brandId} from item ${id} in Neo4j:`, error);
      throw new Error('Failed to remove brand from item in Neo4j');
    }
  }

  async getItemsByPriceGreaterThan(price: number): Promise<ClothingItem[]> {
    try {
      const result = await neogma.queryRunner.run(
          `MATCH (i:Item) WHERE i.price > $price
        OPTIONAL MATCH (i)-[:BELONGS_TO]->(c:Category)
        OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)-[:IS_FROM]->(co:Country)
        OPTIONAL MATCH (i)-[:HAS]->(img:Image)
        RETURN i, 
                c,
                collect(DISTINCT { id: b.id, name: b.name, country: { id: co.id, name: co.name, countryCode: co.countryCode } }) AS brands,
                collect(DISTINCT { id: img.id, url: img.url }) AS images`,
          { price }
      );

      return result.records.map(record => {
        const item = record.get('i').properties;
        const category = record.get('c').properties;
        const brands = record.get('brands');
        const images = record.get('images').filter((img: any) => img.url !== null);

        return formatClothingItem(
            {
              id: item.id,
              name: item.name,
              price: item.price != null ? item.price : null,
              category: { categoryId: category.id, name: category.name },
              brands,
              images,
            },
            "neo4j"
        );
      });

    } catch (error) {
      console.error(`Unexpected error when getting items with price greater than: ${price}`);
      console.error(error);
      throw error;
    }
  }
}

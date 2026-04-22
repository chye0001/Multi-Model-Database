import { prisma } from '../../database/postgres/prisma-client.js';
import { formatClothingItem } from '../../utils/repository_utils/ObjectFormatters.js';
import type { IItemRepository, ItemFilters } from '../interfaces/IItemRepository.js';
import type { ClothingItem, ItemImage } from '../../dtos/items/Item.dto.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';

const ITEM_INCLUDE = {
  category: true,
  itemBrands: { include: { brand: { include: { country: true } } } },
  images: true,
};

function formatBrand(b: any): Brand {
  return {
    id: Number(b.id),
    name: b.name,
    country: b.country ? { id: b.country.id, name: b.country.name, countryCode: b.country.countryCode } : { id: 0, name: '', countryCode: '' },
    fromDatabase: 'postgresql',
  };
}

export class PostgresItemRepository implements IItemRepository {
  async getAllItems(filters?: ItemFilters): Promise<ClothingItem[]> {
    try {
      const where: any = {};
      if (filters?.categoryId !== undefined) where.categoryId = filters.categoryId;
      if (filters?.brandId !== undefined) where.itemBrands = { some: { brandId: filters.brandId } };
      if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
      }
      const items = await prisma.item.findMany({ where, include: ITEM_INCLUDE });
      return items.map(item => ({ ...formatClothingItem(item, 'postgresql'), fromDatabase: 'postgresql' }));
    } catch (error) {
      console.error('Error fetching items from PostgreSQL:', error);
      throw new Error('Failed to fetch items from PostgreSQL');
    }
  }

  async getItemById(id: number): Promise<ClothingItem[]> {
    try {
      const item = await prisma.item.findUnique({ where: { id: BigInt(id) }, include: ITEM_INCLUDE });
      if (!item) return [];
      return [{ ...formatClothingItem(item, 'postgresql'), fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error(`Error fetching item ${id} from PostgreSQL:`, error);
      throw new Error('Failed to fetch item from PostgreSQL');
    }
  }

  async createItem(data: { name: string; price?: number; categoryId: number }): Promise<ClothingItem[]> {
    try {
      const item = await prisma.item.create({
        data: { name: data.name, price: data.price, categoryId: data.categoryId },
        include: ITEM_INCLUDE,
      });
      return [{ ...formatClothingItem(item, 'postgresql'), fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error('Error creating item in PostgreSQL:', error);
      throw new Error('Failed to create item in PostgreSQL');
    }
  }

  async updateItem(id: number, data: Partial<{ name: string; price: number; categoryId: number }>): Promise<ClothingItem[]> {
    try {
      const item = await prisma.item.update({
        where: { id: BigInt(id) },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        },
        include: ITEM_INCLUDE,
      });
      return [{ ...formatClothingItem(item, 'postgresql'), fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error(`Error updating item ${id} in PostgreSQL:`, error);
      throw new Error('Failed to update item in PostgreSQL');
    }
  }

  async deleteItem(id: number): Promise<void> {
    try {
      await prisma.item.delete({ where: { id: BigInt(id) } });
    } catch (error) {
      console.error(`Error deleting item ${id} from PostgreSQL:`, error);
      throw new Error('Failed to delete item from PostgreSQL');
    }
  }

  async getItemImages(id: number): Promise<ItemImage[]> {
    try {
      const images = await prisma.image.findMany({ where: { itemId: BigInt(id) } });
      return images.map(img => ({ id: Number(img.id), url: img.url }));
    } catch (error) {
      console.error(`Error fetching images for item ${id} from PostgreSQL:`, error);
      throw new Error('Failed to fetch item images from PostgreSQL');
    }
  }

  async addImageToItem(id: number, data: { url: string }): Promise<ItemImage[]> {
    try {
      await prisma.image.create({ data: { url: data.url, itemId: BigInt(id) } });
      return await this.getItemImages(id);
    } catch (error) {
      console.error(`Error adding image to item ${id} in PostgreSQL:`, error);
      throw new Error('Failed to add image to item in PostgreSQL');
    }
  }

  async removeImageFromItem(id: number, imageId: number): Promise<void> {
    try {
      await prisma.image.delete({ where: { id: BigInt(imageId) } });
    } catch (error) {
      console.error(`Error removing image ${imageId} from item ${id} in PostgreSQL:`, error);
      throw new Error('Failed to remove image from item in PostgreSQL');
    }
  }

  async getItemBrands(id: number): Promise<Brand[]> {
    try {
      const relations = await prisma.itemBrand.findMany({
        where: { itemId: BigInt(id) },
        include: { brand: { include: { country: true } } },
      });
      return relations.map(r => formatBrand(r.brand));
    } catch (error) {
      console.error(`Error fetching brands for item ${id} from PostgreSQL:`, error);
      throw new Error('Failed to fetch item brands from PostgreSQL');
    }
  }

  async addBrandToItem(id: number, brandId: number): Promise<Brand[]> {
    try {
      await prisma.itemBrand.upsert({
        where: { itemId_brandId: { itemId: BigInt(id), brandId } },
        create: { itemId: BigInt(id), brandId },
        update: {},
      });
      return await this.getItemBrands(id);
    } catch (error) {
      console.error(`Error adding brand ${brandId} to item ${id} in PostgreSQL:`, error);
      throw new Error('Failed to add brand to item in PostgreSQL');
    }
  }

  async removeBrandFromItem(id: number, brandId: number): Promise<void> {
    try {
      await prisma.itemBrand.delete({ where: { itemId_brandId: { itemId: BigInt(id), brandId } } });
    } catch (error) {
      console.error(`Error removing brand ${brandId} from item ${id} in PostgreSQL:`, error);
      throw new Error('Failed to remove brand from item in PostgreSQL');
    }
  }
}
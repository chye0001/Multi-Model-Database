import { Item, Brand, Category } from '../../database/mongo/models/index.js';
import { formatClothingItem } from '../../utils/repository_utils/ObjectFormatters.js';
import type { IItemRepository, ItemFilters } from '../interfaces/IItemRepository.js';
import type { ClothingItem, ItemImage } from '../../dtos/items/Item.dto.js';
import type { Brand as BrandDto } from '../../dtos/brands/Brand.dto.js';

export class MongoItemRepository implements IItemRepository {
  async getAllItems(filters?: ItemFilters): Promise<ClothingItem[]> {
    try {
      const query: any = {};
      if (filters?.categoryId !== undefined) query['category.categoryId'] = filters.categoryId;
      if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
        query.price = {};
        if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
      }
      let items = await Item.find(query).lean().exec() as any[];
      if (filters?.brandId !== undefined) {
        items = items.filter((item: any) => item.brands?.some((b: any) => Number(b.id) === filters.brandId));
      }
      return items.map((item: any) => ({ ...formatClothingItem(item, 'mongodb'), fromDatabase: 'mongodb' }));
    } catch (error) {
      console.error('Error fetching items from MongoDB:', error);
      throw new Error('Failed to fetch items from MongoDB');
    }
  }

  async getItemById(id: number): Promise<ClothingItem[]> {
    try {
      const item = await Item.findOne({ id }).lean().exec() as any;
      if (!item) return [];
      return [{ ...formatClothingItem(item, 'mongodb'), fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error(`Error fetching item ${id} from MongoDB:`, error);
      throw new Error('Failed to fetch item from MongoDB');
    }
  }

  async createItem(data: { name: string; price?: number; categoryId: number }): Promise<ClothingItem[]> {
    try {
      const category = await Category.findOne({ id: data.categoryId }).lean().exec() as any;
      if (!category) throw new Error(`Category ${data.categoryId} not found`);
      const last = await Item.findOne().sort({ id: -1 }).lean().exec() as any;
      const nextId = (last?.id ?? 0) + 1;
      const item = await Item.create({
        id: nextId,
        name: data.name,
        price: data.price ?? null,
        category: { categoryId: category.id, name: category.name },
        brands: [],
        images: [],
      });
      return [{ ...formatClothingItem(item.toObject(), 'mongodb'), fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error('Error creating item in MongoDB:', error);
      throw new Error('Failed to create item in MongoDB');
    }
  }

  async updateItem(id: number, data: Partial<{ name: string; price: number; categoryId: number }>): Promise<ClothingItem[]> {
    try {
      const patch: any = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.price !== undefined) patch.price = data.price;
      if (data.categoryId !== undefined) {
        const category = await Category.findOne({ id: data.categoryId }).lean().exec() as any;
        if (!category) throw new Error(`Category ${data.categoryId} not found`);
        patch.category = { categoryId: category.id, name: category.name };
      }
      const item = await Item.findOneAndUpdate({ id }, patch, { new: true }).lean().exec() as any;
      if (!item) return [];
      return [{ ...formatClothingItem(item, 'mongodb'), fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error(`Error updating item ${id} in MongoDB:`, error);
      throw new Error('Failed to update item in MongoDB');
    }
  }

  async deleteItem(id: number): Promise<void> {
    try {
      await Item.deleteOne({ id }).exec();
    } catch (error) {
      console.error(`Error deleting item ${id} from MongoDB:`, error);
      throw new Error('Failed to delete item from MongoDB');
    }
  }

  async getItemImages(id: number): Promise<ItemImage[]> {
    try {
      const item = await Item.findOne({ id }).lean().exec() as any;
      if (!item) return [];
      return (item.images ?? []).map((img: any) => ({ id: Number(img.id), url: img.url }));
    } catch (error) {
      console.error(`Error fetching images for item ${id} from MongoDB:`, error);
      throw new Error('Failed to fetch item images from MongoDB');
    }
  }

  async addImageToItem(id: number, data: { url: string }): Promise<ItemImage[]> {
    try {
      const allItems = await Item.find({ 'images.0': { $exists: true } }).lean().exec() as any[];
      const maxImgId = allItems.reduce((max: number, item: any) =>
        (item.images ?? []).reduce((m: number, img: any) => Math.max(m, Number(img.id)), max), 0);
      const nextId = maxImgId + 1;
      const item = await Item.findOneAndUpdate(
        { id },
        { $push: { images: { id: nextId, url: data.url } } },
        { new: true }
      ).lean().exec() as any;
      if (!item) throw new Error(`Item ${id} not found`);
      return (item.images ?? []).map((img: any) => ({ id: Number(img.id), url: img.url }));
    } catch (error) {
      console.error(`Error adding image to item ${id} in MongoDB:`, error);
      throw new Error('Failed to add image to item in MongoDB');
    }
  }

  async removeImageFromItem(id: number, imageId: number): Promise<void> {
    try {
      await Item.findOneAndUpdate({ id }, { $pull: { images: { id: imageId } } }).exec();
    } catch (error) {
      console.error(`Error removing image ${imageId} from item ${id} in MongoDB:`, error);
      throw new Error('Failed to remove image from item in MongoDB');
    }
  }

  async getItemBrands(id: number): Promise<BrandDto[]> {
    try {
      const item = await Item.findOne({ id }).lean().exec() as any;
      if (!item) return [];
      return (item.brands ?? []).map((b: any) => ({
        id: Number(b.id),
        name: b.name,
        country: b.country ?? { id: 0, name: '', countryCode: '' },
        fromDatabase: 'mongodb',
      }));
    } catch (error) {
      console.error(`Error fetching brands for item ${id} from MongoDB:`, error);
      throw new Error('Failed to fetch item brands from MongoDB');
    }
  }

  async addBrandToItem(id: number, brandId: number): Promise<BrandDto[]> {
    try {
      const brand = await Brand.findOne({ id: brandId }).lean().exec() as any;
      if (!brand) throw new Error(`Brand ${brandId} not found`);
      const existing = await Item.findOne({ id, 'brands.id': brandId }).lean().exec();
      if (!existing) {
        await Item.findOneAndUpdate(
          { id },
          { $push: { brands: { id: brand.id, name: brand.name, country: brand.country ?? { id: 0, name: '', countryCode: '' } } } }
        ).exec();
      }
      return await this.getItemBrands(id);
    } catch (error) {
      console.error(`Error adding brand ${brandId} to item ${id} in MongoDB:`, error);
      throw new Error('Failed to add brand to item in MongoDB');
    }
  }

  async removeBrandFromItem(id: number, brandId: number): Promise<void> {
    try {
      await Item.findOneAndUpdate({ id }, { $pull: { brands: { id: brandId } } }).exec();
    } catch (error) {
      console.error(`Error removing brand ${brandId} from item ${id} in MongoDB:`, error);
      throw new Error('Failed to remove brand from item in MongoDB');
    }
  }
}
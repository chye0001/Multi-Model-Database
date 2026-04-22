import { Brand, Country, Item } from '../../database/mongo/models/index.js';
import { formatClothingItem } from '../../utils/repository_utils/ObjectFormatters.js';
import type { IBrandRepository } from '../interfaces/IBrandRepository.js';
import type { Brand as BrandDto } from '../../dtos/brands/Brand.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';
import { audit } from '../../utils/audit/AuditLogger.ts';

function formatBrand(b: any, country?: any): BrandDto {
  return {
    id: b.id,
    name: b.name,
    country: country ? { id: country.id, name: country.name, countryCode: country.countryCode } : undefined,
    fromDatabase: 'mongodb',
  };
}

export class MongoBrandRepository implements IBrandRepository {
  async getAllBrands(countryCode?: string): Promise<BrandDto[]> {
    try {
      let brands;
      if (countryCode) {
        const country = await Country.findOne({ countryCode: countryCode.toUpperCase() }).lean().exec();
        if (!country) return [];
        brands = await Brand.find({ countryId: country._id }).lean().exec();
        return brands.map(b => formatBrand(b, country));
      }
      brands = await Brand.find().lean().exec();
      const withCountries = await Promise.all(
        brands.map(async b => {
          const country = await Country.findOne({ _id: b.countryId }).lean().exec();
          return formatBrand(b, country);
        })
      );
      return withCountries;
    } catch (error) {
      console.error('Error fetching brands from MongoDB:', error);
      throw new Error('Failed to fetch brands from MongoDB');
    }
  }

  async getBrandByName(name: string): Promise<BrandDto[]> {
    try {
      const brand = await Brand.findOne({ name }).lean().exec();
      if (!brand) return [];
      const country = await Country.findOne({ _id: brand.countryId }).lean().exec();
      return [formatBrand(brand, country)];
    } catch (error) {
      console.error(`Error fetching brand "${name}" from MongoDB:`, error);
      throw new Error('Failed to fetch brand from MongoDB');
    }
  }

  async createBrand(data: { name: string; countryCode: string }): Promise<BrandDto[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'DOCUMENT_CREATE',
      label: 'Brand',
      params: { name: data.name, countryCode: data.countryCode },
      source: 'MongoBrandRepository.createBrand',
    });

    try {
      const country = await Country.findOne({ countryCode: data.countryCode.toUpperCase() }).lean().exec();
      if (!country) throw new Error(`Country with code "${data.countryCode}" not found`);
      const max = await Brand.findOne().sort({ id: -1 }).lean().exec();
      const nextId = max ? max.id + 1 : 1;
      const brand = await Brand.create({ id: nextId, name: data.name, countryId: country._id });
      return [formatBrand(brand, country)];
    } catch (error) {
      console.error('Error creating brand in MongoDB:', error);
      throw new Error('Failed to create brand in MongoDB');
    }
  }

  async updateBrand(name: string, newName: string): Promise<BrandDto[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'DOCUMENT_UPDATE',
      label: 'Brand',
      params: { name, newName },
      source: 'MongoBrandRepository.updateBrand',
    });

    try {
      const brand = await Brand.findOneAndUpdate({ name }, { name: newName }, { new: true }).lean().exec();
      if (!brand) return [];
      const country = await Country.findOne({ _id: brand.countryId }).lean().exec();
      return [formatBrand(brand, country)];
    } catch (error) {
      console.error(`Error updating brand "${name}" in MongoDB:`, error);
      throw new Error('Failed to update brand in MongoDB');
    }
  }

  async deleteBrand(name: string): Promise<void> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'DOCUMENT_DELETE',
      label: 'Brand',
      params: { name },
      source: 'MongoBrandRepository.deleteBrand',
    });
    
    try {
      await Brand.deleteOne({ name }).exec();
    } catch (error) {
      console.error(`Error deleting brand "${name}" from MongoDB:`, error);
      throw new Error('Failed to delete brand from MongoDB');
    }
  }

  async getBrandItems(name: string): Promise<ClothingItem[]> {
    try {
      const brand = await Brand.findOne({ name }).lean().exec();
      if (!brand) return [];
      const items = await Item.find({ brandIds: brand._id }).lean().exec();
      const withBrands = await Promise.all(
        items.map(async item => {
          const brands = await Promise.all(
            item.brandIds.map((brandId: any) =>
              Brand.findOne({ _id: brandId }).select('id name').lean().exec()
            )
          );
          return { ...item, brands };
        })
      );
      return withBrands.map(item => ({ ...formatClothingItem(item, 'mongodb'), fromDatabase: 'mongodb' }));
    } catch (error) {
      console.error(`Error fetching items for brand "${name}" from MongoDB:`, error);
      throw new Error('Failed to fetch brand items from MongoDB');
    }
  }
}

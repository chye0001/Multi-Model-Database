import { prisma } from '../../database/postgres/prisma-client.js';
import { formatClothingItem } from '../../utils/repository_utils/ObjectFormatters.js';
import type { IBrandRepository } from '../interfaces/IBrandRepository.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';
import type { ClothingItem } from '../../dtos/items/Item.dto.js';
import { audit } from '../../utils/audit/AuditLogger.ts';

function formatBrand(b: any): Brand {
  return {
    id: b.id,
    name: b.name,
    country: b.country ? { id: b.country.id, name: b.country.name, countryCode: b.country.countryCode } : undefined,
    fromDatabase: 'postgresql',
  };
}

export class PostgresBrandRepository implements IBrandRepository {
  async getAllBrands(countryCode?: string): Promise<Brand[]> {
    try {
      const brands = await prisma.brand.findMany({
        where: countryCode ? { country: { countryCode } } : {},
        include: { country: true },
      });
      return brands.map(formatBrand);
    } catch (error) {
      console.error('Error fetching brands from PostgreSQL:', error);
      throw new Error('Failed to fetch brands from PostgreSQL');
    }
  }

  async getBrandByName(name: string): Promise<Brand[]> {
    try {
      const brand = await prisma.brand.findFirst({
        where: { name },
        include: { country: true },
      });
      if (!brand) return [];
      return [formatBrand(brand)];
    } catch (error) {
      console.error(`Error fetching brand "${name}" from PostgreSQL:`, error);
      throw new Error('Failed to fetch brand from PostgreSQL');
    }
  }

  async createBrand(data: { name: string; countryCode: string }): Promise<Brand[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'ROW_INSERT',
      label: 'brands',
      params: { name: data.name, countryCode: data.countryCode },
      source: 'PostgresBrandRepository.createBrand',
    });

    try {
      const country = await prisma.country.findFirst({ where: { countryCode: data.countryCode } });
      if (!country) throw new Error(`Country with code "${data.countryCode}" not found`);
      const brand = await prisma.brand.create({
        data: { name: data.name, countryId: country.id },
        include: { country: true },
      });
      return [formatBrand(brand)];
    } catch (error) {
      console.error('Error creating brand in PostgreSQL:', error);
      throw new Error('Failed to create brand in PostgreSQL');
    }
  }

  async updateBrand(name: string, newName: string): Promise<Brand[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'ROW_UPDATE',
      label: 'brands',
      params: { name, newName },
      source: 'PostgresBrandRepository.updateBrand',
    });

    try {
      const existing = await prisma.brand.findFirst({ where: { name } });
      if (!existing) return [];
      const brand = await prisma.brand.update({
        where: { id: existing.id },
        data: { name: newName },
        include: { country: true },
      });
      return [formatBrand(brand)];
    } catch (error) {
      console.error(`Error updating brand "${name}" in PostgreSQL:`, error);
      throw new Error('Failed to update brand in PostgreSQL');
    }
  }

  async deleteBrand(name: string): Promise<void> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'ROW_DELETE',
      label: 'brands',
      params: { name },
      source: 'PostgresBrandRepository.deleteBrand',
    });
    
    try {
      const existing = await prisma.brand.findFirst({ where: { name } });
      if (!existing) return;
      await prisma.brand.delete({ where: { id: existing.id } });
    } catch (error) {
      console.error(`Error deleting brand "${name}" from PostgreSQL:`, error);
      throw new Error('Failed to delete brand from PostgreSQL');
    }
  }

  async getBrandItems(name: string): Promise<ClothingItem[]> {
    try {
      const items = await prisma.item.findMany({
        where: { itemBrands: { some: { brand: { name } } } },
        include: {
          category: true,
          itemBrands: { include: { brand: true } },
          images: true,
        },
      });
      return items.map(item => ({ ...formatClothingItem(item, 'postgresql'), fromDatabase: 'postgresql' }));
    } catch (error) {
      console.error(`Error fetching items for brand "${name}" from PostgreSQL:`, error);
      throw new Error('Failed to fetch brand items from PostgreSQL');
    }
  }
}

import mongoose from "mongoose";
import { Brand, Country, Item } from "../../database/mongo/models/index.js";
import { formatClothingItem } from "../../utils/repository_utils/ObjectFormatters.js";
import type { IBrandRepository } from "../interfaces/IBrandRepository.js";
import type { Brand as BrandDto } from "../../dtos/brands/Brand.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import { audit } from "../../utils/audit/AuditLogger.ts";

function formatBrand(b: any): BrandDto {
  return {
    id: b.id,
    name: b.name,
    country: b.country
        ? { id: b.country.id, name: b.country.name, countryCode: b.country.countryCode }
        : { id: 0, name: "", countryCode: "" },
    fromDatabase: "mongodb",
  };
}

export class MongoBrandRepository implements IBrandRepository {
  async getAllBrands(countryCode?: string): Promise<BrandDto[]> {
    try {
      if (countryCode) {
        const normalizedCode = countryCode.toUpperCase();
        const country = await Country.findOne({ countryCode: normalizedCode }).lean().exec();
        if (!country) return [];

        const brands = await Brand.find({ "country.id": country.id }).lean().exec();
        return brands.map((b) => formatBrand(b));
      }

      const brands = await Brand.find().lean().exec();
      return brands.map((b) => formatBrand(b));
    } catch (error) {
      console.error("Error fetching brands from MongoDB:", error);
      throw new Error("Failed to fetch brands from MongoDB");
    }
  }

  async getBrandByName(name: string): Promise<BrandDto[]> {
    try {
      const brand = await Brand.findOne({ name }).lean().exec();
      if (!brand) return [];
      return [formatBrand(brand)];
    } catch (error) {
      console.error(`Error fetching brand "${name}" from MongoDB:`, error);
      throw new Error("Failed to fetch brand from MongoDB");
    }
  }

  async createBrand(data: { name: string; countryCode: string }): Promise<BrandDto[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: "DOCUMENT_CREATE",
      label: "Brand",
      params: { name: data.name, countryCode: data.countryCode },
      source: "MongoBrandRepository.createBrand",
    });

    const session = await mongoose.startSession();
    try {
      let created: any = null;

      await session.withTransaction(async () => {
        const countryDoc = await Country.findOne({
          countryCode: data.countryCode.toUpperCase(),
        })
            .session(session)
            .lean()
            .exec();

        if (!countryDoc) {
          throw new Error(`Country with code "${data.countryCode}" not found`);
        }

        const max = await Brand.findOne().sort({ id: -1 }).session(session).lean().exec();
        const nextId = max ? max.id + 1 : 1;

        await Brand.create(
            [
              {
                id: nextId,
                name: data.name,
                country: {
                  id: countryDoc.id,
                  name: countryDoc.name,
                  countryCode: countryDoc.countryCode,
                },
              },
            ],
            { session }
        );

        created = await Brand.findOne({ id: nextId }).session(session).lean().exec();
      });

      if (!created) return [];
      return [formatBrand(created)];
    } catch (error) {
      console.error("Error creating brand in MongoDB:", error);
      throw new Error("Failed to create brand in MongoDB");
    } finally {
      await session.endSession();
    }
  }

  async updateBrand(name: string, newName: string): Promise<BrandDto[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: "DOCUMENT_UPDATE",
      label: "Brand",
      params: { name, newName },
      source: "MongoBrandRepository.updateBrand",
    });

    try {
      const updated = await Brand.findOneAndUpdate(
          { name },
          { name: newName },
          { new: true }
      ).lean().exec();

      if (!updated) return [];
      return [formatBrand(updated)];
    } catch (error) {
      console.error(`Error updating brand "${name}" in MongoDB:`, error);
      throw new Error("Failed to update brand in MongoDB");
    }
  }

  async deleteBrand(name: string): Promise<void> {
    audit({
      timestamp: new Date().toISOString(),
      event: "DOCUMENT_DELETE",
      label: "Brand",
      params: { name },
      source: "MongoBrandRepository.deleteBrand",
    });

    try {
      await Brand.deleteOne({ name }).exec();
    } catch (error) {
      console.error(`Error deleting brand "${name}" from MongoDB:`, error);
      throw new Error("Failed to delete brand from MongoDB");
    }
  }

  async getBrandItems(name: string): Promise<ClothingItem[]> {
    try {
      const brand = await Brand.findOne({ name }).lean().exec();
      if (!brand) return [];

      const items = await Item.find({ "brands.id": brand.id }).lean().exec();
      return items.map((item) => ({
        ...formatClothingItem(item, "mongodb"),
        fromDatabase: "mongodb",
      }));
    } catch (error) {
      console.error(`Error fetching items for brand "${name}" from MongoDB:`, error);
      throw new Error("Failed to fetch brand items from MongoDB");
    }
  }
}

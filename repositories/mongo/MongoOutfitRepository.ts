import { Outfit, User, Item } from "../../database/mongo/models/index.js";
import { formatUserOutfit } from "../../utils/repository_utils/ObjectFormatters.js";

import type { Outfit as OutfitDto } from "../../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { IOutfitRepository } from "../interfaces/IOutfitRepository.js";
import type { OutfitOverview } from "../../dtos/outfits/OutfitOverview.dto.js";

type CreateOutfitRequest = {
    name: string;
    style: string;
    createdBy: string;
};

type UpdateOutfitRequest = Partial<{
    name: string;
    style: string;
}>;

export class MongoOutfitRepository implements IOutfitRepository {
    async getAllOutfits(style?: string): Promise<OutfitDto[]> {
        try {
            const query = style ? { style } : {};
            const outfits = await Outfit.find(query).lean().exec();
            return outfits.map((outfit) => formatUserOutfit(outfit, "mongodb"));
        } catch (error) {
            console.error("Error fetching outfits from MongoDB:", error);
            throw new Error("Failed to fetch outfits from MongoDB");
        }
    }

    async getOutfitById(id: string): Promise<OutfitDto[]> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");
            const outfit = await Outfit.findOne({ id: numericId }).lean().exec();
            if (!outfit) return [];
            return [formatUserOutfit(outfit, "mongodb")];
        } catch (error) {
            console.error(`Error fetching outfit ${id} from MongoDB:`, error);
            throw new Error("Failed to fetch outfit from MongoDB");
        }
    }

    async createOutfit(data: CreateOutfitRequest): Promise<OutfitDto[]> {
        try {
            const user = await User.findOne({ id: data.createdBy })
                .select("id firstName lastName email")
                .lean()
                .exec();

            if (!user) throw new Error(`User with id "${data.createdBy}" not found`);

            const max = await Outfit.findOne().sort({ id: -1 }).lean().exec();
            const nextId = max ? max.id + 1 : 1;

            await Outfit.create({
                id: nextId,
                name: data.name,
                style: data.style,
                createdBy: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                },
                items: [],
                reviews: [],
            });

            return await this.getOutfitById(String(nextId));
        } catch (error) {
            console.error("Error creating outfit in MongoDB:", error);
            throw new Error("Failed to create outfit in MongoDB");
        }
    }

    async updateOutfit(id: string, data: UpdateOutfitRequest): Promise<OutfitDto[]> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");
            const patch: UpdateOutfitRequest = {};

            if (typeof data.name === "string") patch.name = data.name;
            if (typeof data.style === "string") patch.style = data.style;

            const updated = await Outfit.findOneAndUpdate({ id: numericId }, patch, { new: true }).lean().exec();
            if (!updated) return [];

            return [formatUserOutfit(updated, "mongodb")];
        } catch (error) {
            console.error(`Error updating outfit ${id} in MongoDB:`, error);
            throw new Error("Failed to update outfit in MongoDB");
        }
    }

    async deleteOutfit(id: string): Promise<void> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");
            await Outfit.deleteOne({ id: numericId }).exec();
        } catch (error) {
            console.error(`Error deleting outfit ${id} from MongoDB:`, error);
            throw new Error("Failed to delete outfit from MongoDB");
        }
    }

    async getOutfitItems(id: string): Promise<ClothingItem[]> {
        try {
            const outfits = await this.getOutfitById(id);
            if (outfits.length === 0) return [];
            return outfits[0]?.items ?? [];
        } catch (error) {
            console.error(`Error fetching items for outfit ${id} from MongoDB:`, error);
            throw new Error("Failed to fetch outfit items from MongoDB");
        }
    }

    async addItemToOutfit(id: string, itemId: string): Promise<OutfitDto[]> {
        try {
            const numericOutfitId = this.parseNumericId(id, "outfit id");
            const numericItemId = this.parseNumericId(itemId, "item id");

            const item = await Item.findOne({ id: numericItemId }).lean().exec();
            if (!item) throw new Error(`Item with id "${itemId}" not found`);

            const embeddedItem = this.toEmbeddedItem(item);

            await Outfit.updateOne(
                { id: numericOutfitId, "items.id": { $ne: numericItemId } },
                { $push: { items: embeddedItem } }
            ).exec();

            return await this.getOutfitById(id);
        } catch (error) {
            console.error(`Error adding item ${itemId} to outfit ${id} in MongoDB:`, error);
            throw new Error("Failed to add item to outfit in MongoDB");
        }
    }

    async removeItemFromOutfit(id: string, itemId: string): Promise<OutfitDto[]> {
        try {
            const numericOutfitId = this.parseNumericId(id, "outfit id");
            const numericItemId = this.parseNumericId(itemId, "item id");

            await Outfit.updateOne(
                { id: numericOutfitId },
                { $pull: { items: { id: numericItemId } } }
            ).exec();

            return await this.getOutfitById(id);
        } catch (error) {
            console.error(`Error removing item ${itemId} from outfit ${id} in MongoDB:`, error);
            throw new Error("Failed to remove item from outfit in MongoDB");
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<OutfitDto[]> {
        try {
            const outfits = await Outfit.find({ "createdBy.id": userId }).lean().exec();
            return outfits.map((outfit) => formatUserOutfit(outfit, "mongodb"));
        } catch (error) {
            console.error(`Error fetching outfits for user ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch outfits by user from MongoDB");
        }
    }

    private parseNumericId(value: string, fieldName: string): number {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return parsed;
    }

    private toEmbeddedItem(item: any): any {
        return {
            id: Number(item.id),
            name: item.name,
            price: item.price ?? null,
            category: {
                categoryId: Number(item.category?.categoryId ?? 0),
                name: item.category?.name ?? "Uncategorized",
            },
            brands: Array.isArray(item.brands)
                ? item.brands.map((brand: any) => ({
                    id: Number(brand.id),
                    name: brand.name,
                    country: {
                        id: Number(brand.country?.id ?? 0),
                        name: brand.country?.name ?? "Unknown",
                        countryCode: brand.country?.countryCode ?? "",
                    },
                }))
                : [],
            images: Array.isArray(item.images)
                ? item.images.map((img: any) => ({
                    id: Number(img.id),
                    url: img.url,
                }))
                : [],
        };
    }
    async getOutfitOverview(style?: string): Promise<OutfitOverview[]> {
        try {
            const query = style ? { style } : {};
            const outfits = await Outfit.find(query).lean().exec();

            return outfits.map((o: any) => ({
                id: Number(o.id),
                name: o.name,
                style: o.style,
                dateAdded: o.dateAdded,
                firstName: o.createdBy?.firstName ?? "",
                lastName: o.createdBy?.lastName ?? "",
                itemCount: Array.isArray(o.items) ? o.items.length : 0,
                fromDatabase: "mongodb",
            }));
        } catch (error) {
            console.error("Error fetching outfit overview from MongoDB:", error);
            throw new Error("Failed to fetch outfit overview from MongoDB");
        }
    }
    async getOutfitPrice(id: string): Promise<number> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");

            const outfit = await Outfit.findOne({ id: numericId }).lean().exec();
            if (!outfit) return 0;

            return (outfit.items ?? []).reduce((sum: number, item: any) => {
                return sum + (Number(item.price) || 0);
            }, 0);
        } catch (error) {
            console.error(`Error calculating outfit price for outfit ${id} in MongoDB:`, error);
            throw new Error("Failed to calculate outfit price in MongoDB");
        }
    }

}

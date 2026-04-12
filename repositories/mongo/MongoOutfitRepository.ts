import { Outfit, User, Item, Brand } from "../../database/mongo/models/index.js";
import { formatUserOutfit, formatClothingItem } from "../../utils/repository_utils/ObjectFormatters.js";

import type { Outfit as OutfitDto } from "../../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type {IOutfitRepository} from "../interfaces/IOutfitRepository.js";

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
            const outfits = await Outfit.find(query).populate("createdBy").populate("itemIds").lean().exec();
            const hydrated = await this.hydrateOutfits(outfits);
            return hydrated.map((outfit) => formatUserOutfit(outfit, "mongodb"));
        } catch (error) {
            console.error("Error fetching outfits from MongoDB:", error);
            throw new Error("Failed to fetch outfits from MongoDB");
        }
    }

    async getOutfitById(id: string): Promise<OutfitDto[]> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");
            const outfit = await Outfit.findOne({ id: numericId }).populate("createdBy").populate("itemIds").lean().exec();

            if (!outfit) return [];

            const hydrated = await this.hydrateOutfits([outfit]);
            return hydrated.map((o) => formatUserOutfit(o, "mongodb"));
        } catch (error) {
            console.error(`Error fetching outfit ${id} from MongoDB:`, error);
            throw new Error("Failed to fetch outfit from MongoDB");
        }
    }

    async createOutfit(data: CreateOutfitRequest): Promise<OutfitDto[]> {
        try {
            const user = await User.findOne({ id: data.createdBy }).lean().exec();
            if (!user) throw new Error(`User with id "${data.createdBy}" not found`);

            const max = await Outfit.findOne().sort({ id: -1 }).lean().exec();
            const nextId = max ? max.id + 1 : 1;

            await Outfit.create({
                id: nextId,
                name: data.name,
                style: data.style,
                createdBy: user._id,
                itemIds: [],
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

            return await this.getOutfitById(id);
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

            const outfit = await Outfit.findOne({ id: numericOutfitId }).lean().exec();
            if (!outfit) return [];

            const item = await Item.findOne({ id: numericItemId }).lean().exec();
            if (!item) throw new Error(`Item with id "${itemId}" not found`);

            await Outfit.updateOne({ id: numericOutfitId }, { $addToSet: { itemIds: item._id } }).exec();

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

            const item = await Item.findOne({ id: numericItemId }).lean().exec();
            if (!item) throw new Error(`Item with id "${itemId}" not found`);

            await Outfit.updateOne({ id: numericOutfitId }, { $pull: { itemIds: item._id } }).exec();

            return await this.getOutfitById(id);
        } catch (error) {
            console.error(`Error removing item ${itemId} from outfit ${id} in MongoDB:`, error);
            throw new Error("Failed to remove item from outfit in MongoDB");
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<OutfitDto[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) return [];

            const outfits = await Outfit.find({ createdBy: foundUser._id }).populate("createdBy").populate("itemIds").lean().exec();
            const hydrated = await this.hydrateOutfits(outfits);

            return hydrated.map((outfit) => formatUserOutfit(outfit, "mongodb"));
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

    private async hydrateOutfits(outfits: any[]): Promise<any[]> {
        const withReviews = await this.populateReviews(outfits);

        return Promise.all(
            withReviews.map(async (outfit) => ({
                ...outfit,
                itemIds: await this.populateBrands(outfit.itemIds ?? []),
            }))
        );
    }

    private async populateBrands(items: any[]): Promise<any[]> {
        return Promise.all(
            items.map(async (item: any) => {
                const brandIds: any[] = Array.isArray(item.brandIds) ? item.brandIds : [];

                const brands = await Promise.all(
                    brandIds.map((brandId: any) => Brand.findOne({ _id: brandId }).select("id name").lean().exec())
                );

                return { ...item, brands: brands.filter(Boolean) };
            })
        );
    }

    private async resolveReviews(reviews: any[]): Promise<any[]> {
        const list = Array.isArray(reviews) ? reviews : [];

        return Promise.all(
            list.map(async (review: any) => {
                const writtenByDoc = await User.findOne({ _id: review.writtenBy }).select("id email firstName lastName").lean().exec();

                return {
                    ...review,
                    writtenBy: writtenByDoc ?? review.writtenBy,
                };
            })
        );
    }

    private async populateReviews(outfits: any[]): Promise<any[]> {
        return Promise.all(
            outfits.map(async (outfit: any) => ({
                ...outfit,
                reviews: await this.resolveReviews(outfit.reviews ?? []),
            }))
        );
    }
}

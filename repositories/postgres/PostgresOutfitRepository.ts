import { prisma } from "../../database/postgres/prisma-client.js";
import { formatUserOutfit, formatClothingItem } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IOutfitRepository } from "../interfaces/IOutfitRepository.js";
import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";

const outfitInclude = {
    outfitItems: {
        include: {
            closetItem: {
                include: {
                    item: {
                        include: {
                            category: true,
                            images: true,
                            itemBrands: {
                                include: {
                                    brand: {
                                        include: {
                                            country: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    reviews: true,
};

export class PostgresOutfitRepository implements IOutfitRepository {
    async getAllOutfits(style?: string): Promise<Outfit[]> {
        try {
            const outfits = await prisma.outfit.findMany({
                where: style ? { style } : {},
                include: outfitInclude,
            });
            return outfits.map((outfit) => formatUserOutfit(outfit, "postgresql"));
        } catch (error) {
            console.error("Error fetching outfits from PostgreSQL:", error);
            throw new Error("Failed to fetch outfits from PostgreSQL");
        }
    }

    async getOutfitById(id: string): Promise<Outfit[]> {
        try {
            const numericId = BigInt(id);
            const outfit = await prisma.outfit.findUnique({
                where: { id: numericId },
                include: outfitInclude,
            });
            if (!outfit) return [];
            return [formatUserOutfit(outfit, "postgresql")];
        } catch (error) {
            console.error(`Error fetching outfit ${id} from PostgreSQL:`, error);
            throw new Error("Failed to fetch outfit from PostgreSQL");
        }
    }

    async createOutfit(data: { name: string; style: string; createdBy: string }): Promise<Outfit[]> {
        try {
            const outfit = await prisma.outfit.create({
                data: {
                    name: data.name,
                    style: data.style,
                    createdBy: data.createdBy,
                },
                include: outfitInclude,
            });
            return [formatUserOutfit(outfit, "postgresql")];
        } catch (error) {
            console.error("Error creating outfit in PostgreSQL:", error);
            throw new Error("Failed to create outfit in PostgreSQL");
        }
    }

    async updateOutfit(id: string, data: Partial<{ name: string; style: string }>): Promise<Outfit[]> {
        try {
            const numericId = BigInt(id);
            const patch: Partial<{ name: string; style: string }> = {};

            if (typeof data.name === "string") patch.name = data.name;
            if (typeof data.style === "string") patch.style = data.style;

            const outfit = await prisma.outfit.update({
                where: { id: numericId },
                data: patch,
                include: outfitInclude,
            });
            return [formatUserOutfit(outfit, "postgresql")];
        } catch (error) {
            console.error(`Error updating outfit ${id} in PostgreSQL:`, error);
            throw new Error("Failed to update outfit in PostgreSQL");
        }
    }

    async deleteOutfit(id: string): Promise<void> {
        try {
            const numericId = BigInt(id);
            await prisma.outfit.delete({
                where: { id: numericId },
            });
        } catch (error) {
            console.error(`Error deleting outfit ${id} from PostgreSQL:`, error);
            throw new Error("Failed to delete outfit from PostgreSQL");
        }
    }

    async getOutfitItems(id: string): Promise<ClothingItem[]> {
        try {
            const outfits = await this.getOutfitById(id);
            if (outfits.length === 0) return [];
            return outfits[0]?.items ?? [];
        } catch (error) {
            console.error(`Error fetching items for outfit ${id} from PostgreSQL:`, error);
            throw new Error("Failed to fetch outfit items from PostgreSQL");
        }
    }

    async addItemToOutfit(id: string, itemId: string): Promise<Outfit[]> {
        try {
            const outfitId = BigInt(id);
            const numericItemId = BigInt(itemId);

            const item = await prisma.item.findUnique({
                where: { id: numericItemId },
            });
            if (!item) throw new Error(`Item with id "${itemId}" not found`);

            const closetItem = await prisma.closetItem.findFirst({
                where: { itemId: numericItemId },
            });
            if (!closetItem) throw new Error(`Item not found in any closet`);

            await prisma.outfitItem.create({
                data: {
                    outfitId,
                    closetItemId: closetItem.id,
                },
            });

            return await this.getOutfitById(id);
        } catch (error) {
            console.error(`Error adding item ${itemId} to outfit ${id} in PostgreSQL:`, error);
            throw new Error("Failed to add item to outfit in PostgreSQL");
        }
    }

    async removeItemFromOutfit(id: string, itemId: string): Promise<Outfit[]> {
        try {
            const outfitId = BigInt(id);
            const numericItemId = BigInt(itemId);

            const closetItem = await prisma.closetItem.findFirst({
                where: { itemId: numericItemId },
            });
            if (!closetItem) throw new Error(`Item not found in any closet`);

            await prisma.outfitItem.deleteMany({
                where: {
                    outfitId,
                    closetItemId: closetItem.id,
                },
            });

            return await this.getOutfitById(id);
        } catch (error) {
            console.error(`Error removing item ${itemId} from outfit ${id} in PostgreSQL:`, error);
            throw new Error("Failed to remove item from outfit in PostgreSQL");
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<Outfit[]> {
        try {
            const outfits = await prisma.outfit.findMany({
                where: { createdBy: userId },
                include: outfitInclude,
            });
            return outfits.map((outfit) => formatUserOutfit(outfit, "postgresql"));
        } catch (error) {
            console.error(`Error fetching outfits for user ${userId} from PostgreSQL:`, error);
            throw new Error("Failed to fetch outfits by user from PostgreSQL");
        }
    }
}

import { prisma } from "../../database/postgres/prisma-client.js";
import { formatUserCloset, formatClothingItem } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IClosetRepository } from "../interfaces/IClosetRepository.js";
import type { Closet } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";

const closetInclude = {
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
    user: true,
    sharedCloset: true,
};

export class PostgresClosetRepository implements IClosetRepository {
    async getAllClosets(): Promise<Closet[]> {
        try {
            const closets = await prisma.closet.findMany({
                where: { isPublic: true },
                include: closetInclude,
            });
            return closets.map((closet) => formatUserCloset(closet, "postgresql"));
        } catch (error) {
            console.error("Error fetching closets from PostgreSQL:", error);
            throw new Error("Failed to fetch closets from PostgreSQL");
        }
    }

    async getClosetById(id: string): Promise<Closet[]> {
        try {
            const numericId = BigInt(id);
            const closet = await prisma.closet.findUnique({
                where: { id: numericId },
                include: closetInclude,
            });
            if (!closet) return [];
            return [formatUserCloset(closet, "postgresql")];
        } catch (error) {
            console.error(`Error fetching closet ${id} from PostgreSQL:`, error);
            throw new Error("Failed to fetch closet from PostgreSQL");
        }
    }

    async createCloset(data: { name: string; description?: string; isPublic: boolean; userId: string }): Promise<Closet[]> {
        try {
            const closet = await prisma.closet.create({
                data: {
                    name: data.name,
                    description: data.description || null,
                    isPublic: data.isPublic,
                    userId: data.userId,
                },
                include: closetInclude,
            });
            return [formatUserCloset(closet, "postgresql")];
        } catch (error) {
            console.error("Error creating closet in PostgreSQL:", error);
            throw new Error("Failed to create closet in PostgreSQL");
        }
    }

    async updateCloset(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>): Promise<Closet[]> {
        try {
            const numericId = BigInt(id);
            const patch: Partial<{ name: string; description: string | null; isPublic: boolean }> = {};

            if (typeof data.name === "string") patch.name = data.name;
            if (typeof data.description === "string") patch.description = data.description;
            if (typeof data.isPublic === "boolean") patch.isPublic = data.isPublic;

            const closet = await prisma.closet.update({
                where: { id: numericId },
                data: patch,
                include: closetInclude,
            });
            return [formatUserCloset(closet, "postgresql")];
        } catch (error) {
            console.error(`Error updating closet ${id} in PostgreSQL:`, error);
            throw new Error("Failed to update closet in PostgreSQL");
        }
    }

    async deleteCloset(id: string): Promise<void> {
        try {
            const numericId = BigInt(id);
            await prisma.closet.delete({
                where: { id: numericId },
            });
        } catch (error) {
            console.error(`Error deleting closet ${id} from PostgreSQL:`, error);
            throw new Error("Failed to delete closet from PostgreSQL");
        }
    }

    async getClosetItems(id: string): Promise<ClothingItem[]> {
        try {
            const numericId = BigInt(id);
            const closetItems = await prisma.closetItem.findMany({
                where: { closetId: numericId },
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
            });
            return closetItems.map((ci) => formatClothingItem(ci.item, "postgresql"));
        } catch (error) {
            console.error(`Error fetching items for closet ${id} from PostgreSQL:`, error);
            throw new Error("Failed to fetch closet items from PostgreSQL");
        }
    }

    async addItemToCloset(closetId: string, itemId: string): Promise<Closet[]> {
        try {
            const numericClosetId = BigInt(closetId);
            const numericItemId = BigInt(itemId);

            // Check if item already in closet
            const existing = await prisma.closetItem.findUnique({
                where: {
                    itemId_closetId: {
                        itemId: numericItemId,
                        closetId: numericClosetId,
                    },
                },
            });

            if (!existing) {
                await prisma.closetItem.create({
                    data: {
                        itemId: numericItemId,
                        closetId: numericClosetId,
                    },
                });
            }

            const closet = await prisma.closet.findUnique({
                where: { id: numericClosetId },
                include: closetInclude,
            });

            if (!closet) return [];
            return [formatUserCloset(closet, "postgresql")];
        } catch (error) {
            console.error(`Error adding item ${itemId} to closet ${closetId} in PostgreSQL:`, error);
            throw new Error("Failed to add item to closet in PostgreSQL");
        }
    }

    async removeItemFromCloset(closetId: string, itemId: string): Promise<Closet[]> {
        try {
            const numericClosetId = BigInt(closetId);
            const numericItemId = BigInt(itemId);

            await prisma.closetItem.delete({
                where: {
                    itemId_closetId: {
                        itemId: numericItemId,
                        closetId: numericClosetId,
                    },
                },
            });

            const closet = await prisma.closet.findUnique({
                where: { id: numericClosetId },
                include: closetInclude,
            });

            if (!closet) return [];
            return [formatUserCloset(closet, "postgresql")];
        } catch (error) {
            console.error(`Error removing item ${itemId} from closet ${closetId} in PostgreSQL:`, error);
            throw new Error("Failed to remove item from closet in PostgreSQL");
        }
    }

    async getUserClosets(userId: string): Promise<Closet[]> {
        try {
            const closets = await prisma.closet.findMany({
                where: { userId },
                include: closetInclude,
            });
            return closets.map((closet) => formatUserCloset(closet, "postgresql"));
        } catch (error) {
            console.error(`Error fetching closets for user ${userId} from PostgreSQL:`, error);
            throw new Error("Failed to fetch user closets from PostgreSQL");
        }
    }
}

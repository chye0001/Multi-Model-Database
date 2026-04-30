import { prisma } from "../../database/postgres/prisma-client.js";
import { formatUserCloset, formatClothingItem } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IClosetRepository } from "../interfaces/IClosetRepository.js";
import type { Closet } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import { audit } from "../../utils/audit/AuditLogger.ts";
import type { EmbeddedUser } from "../../dtos/users/User.dto.js";


const closetInclude = {
    closetItem: {
        include: {
            item: {
                include: {
                    category: true,
                    images: true,
                    itemBrands: {
                        include: {
                            brand: { include: { country: true } },
                        },
                    },
                },
            },
        },
    },
    user: true,
    sharedCloset: {
        include: {
            user: true,
        },
    },
};

// Reusable select statement that explicitly includes userId
const closetSelect = {
    id: true,
    name: true,
    description: true,
    isPublic: true,
    createdAt: true,
    userId: true,  // Explicitly select userId to ensure it's always included
    closetItem: {
        include: {
            item: {
                include: {
                    category: true,
                    images: true,
                    itemBrands: {
                        include: {
                            brand: { include: { country: true } },
                        },
                    },
                },
            },
        },
    },
    user: true,
    sharedCloset: {
        include: {
            user: true,
        },
    },
};


export class PostgresClosetRepository implements IClosetRepository {
    async getAllClosets(): Promise<Closet[]> {
        try {
            const closets = await prisma.closet.findMany({
                where: { isPublic: true },
                select: closetSelect,
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
                select: closetSelect,
            });
            if (!closet) return [];
            return [formatUserCloset(closet, "postgresql")];
        } catch (error) {
            console.error(`Error fetching closet ${id} from PostgreSQL:`, error);
            throw new Error("Failed to fetch closet from PostgreSQL");
        }
    }

    async createCloset(data: { name: string; description?: string; isPublic: boolean; userId: string }): Promise<Closet[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_INSERT',
            label: 'closets',
            params: { name: data.name, isPublic: data.isPublic, userId: data.userId },
            source: 'PostgresClosetRepository.createCloset',
        });
        try {
            const closet = await prisma.closet.create({
                data: {
                    name: data.name,
                    description: data.description || null,
                    isPublic: data.isPublic,
                    userId: data.userId,
                },
                select: closetSelect,
            });
            return [formatUserCloset(closet, "postgresql")];
        } catch (error) {
            console.error("Error creating closet in PostgreSQL:", error);
            throw new Error("Failed to create closet in PostgreSQL");
        }
    }

    async updateCloset(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>): Promise<Closet[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_UPDATE',
            label: 'closets',
            params: { id, ...data },
            source: 'PostgresClosetRepository.updateCloset',
        });

        try {
            const numericId = BigInt(id);
            const patch: Partial<{ name: string; description: string | null; isPublic: boolean }> = {};

            if (typeof data.name === "string") patch.name = data.name;
            if (typeof data.description === "string") patch.description = data.description;
            if (typeof data.isPublic === "boolean") patch.isPublic = data.isPublic;

            const closet = await prisma.closet.update({
                where: { id: numericId },
                data: patch,
                select: closetSelect,
            });
            return [formatUserCloset(closet, "postgresql")];
        } catch (error) {
            console.error(`Error updating closet ${id} in PostgreSQL:`, error);
            throw new Error("Failed to update closet in PostgreSQL");
        }
    }

    async deleteCloset(id: string): Promise<void> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_DELETE',
            label: 'closets',
            params: { id },
            source: 'PostgresClosetRepository.deleteCloset',
        });

        try {
            const numericId = BigInt(id);
            await prisma.closet.delete({ where: { id: numericId } });
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
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_INSERT',
            label: 'closet_items',
            params: { closetId, itemId },
            source: 'PostgresClosetRepository.addItemToCloset',
        });

        try {
            const result = await prisma.$transaction(async (tx) => {
                const numericClosetId = BigInt(closetId);
                const numericItemId = BigInt(itemId);

                const existing = await tx.closetItem.findUnique({
                    where: { itemId_closetId: { itemId: numericItemId, closetId: numericClosetId } },
                });

                if (!existing) {
                    await tx.closetItem.create({
                        data: { itemId: numericItemId, closetId: numericClosetId },
                    });
                }

                const closet = await tx.closet.findUnique({
                    where: { id: numericClosetId },
                    select: closetSelect,
                });

                if (!closet) {
                    throw new Error(`Closet with id "${closetId}" not found after operation`);
                }

                return closet;
            });

            return [formatUserCloset(result, "postgresql")];
        } catch (error) {
            console.error(`Error adding item ${itemId} to closet ${closetId} in PostgreSQL:`, error);
            throw new Error("Failed to add item to closet in PostgreSQL");
        }
    }

    async removeItemFromCloset(closetId: string, itemId: string): Promise<Closet[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_DELETE',
            label: 'closet_items',
            params: { closetId, itemId },
            source: 'PostgresClosetRepository.removeItemFromCloset',
        });

        try {
            const result = await prisma.$transaction(async (tx) => {
                const numericClosetId = BigInt(closetId);
                const numericItemId = BigInt(itemId);

                await tx.closetItem.delete({
                    where: { itemId_closetId: { itemId: numericItemId, closetId: numericClosetId } },
                });

                const closet = await tx.closet.findUnique({
                    where: { id: numericClosetId },
                    select: closetSelect,
                });

                if (!closet) {
                    throw new Error(`Closet with id "${closetId}" not found after operation`);
                }

                return closet;
            });

            return [formatUserCloset(result, "postgresql")];
        } catch (error) {
            console.error(`Error removing item ${itemId} from closet ${closetId} in PostgreSQL:`, error);
            throw new Error("Failed to remove item from closet in PostgreSQL");
        }
    }

    async getUserClosets(userId: string): Promise<Closet[]> {
        try {
            const closets = await prisma.closet.findMany({
                where: { userId },
                select: closetSelect,
            });
            return closets.map((closet) => formatUserCloset(closet, "postgresql"));
        } catch (error) {
            console.error(`Error fetching closets for user ${userId} from PostgreSQL:`, error);
            throw new Error("Failed to fetch user closets from PostgreSQL");
        }
    }

    async getClosetShares(closetId: string): Promise<EmbeddedUser[]> {
        try {
            const numericId = BigInt(closetId);
            const rows = await prisma.sharedCloset.findMany({
                where: { closetId: numericId },
                include: { user: true },
            });
            return rows.map((r) => ({
                id: r.user.id,
                firstName: r.user.firstName,
                lastName: r.user.lastName,
                email: r.user.email,
            }));
        } catch (error) {
            console.error(`Error fetching shares for closet ${closetId} from PostgreSQL:`, error);
            throw new Error("Failed to fetch closet shares from PostgreSQL");
        }
    }

    async shareCloset(closetId: string, userId: string): Promise<EmbeddedUser[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_INSERT',
            label: 'shared_closets',
            params: { closetId, userId },
            source: 'PostgresClosetRepository.shareCloset'
        });

        try {
            const result = await prisma.$transaction(async (tx) => {
                const numericId = BigInt(closetId);

                await tx.sharedCloset.upsert({
                    where: { closetId_userId: { closetId: numericId, userId } },
                    create: { closetId: numericId, userId },
                    update: {},
                });

                const rows = await tx.sharedCloset.findMany({
                    where: { closetId: numericId },
                    include: { user: true },
                });

                return rows.map((r) => ({
                    id: r.user.id,
                    firstName: r.user.firstName,
                    lastName: r.user.lastName,
                    email: r.user.email,
                }));
            });

            return result;
        } catch (error) {
            console.error(`Error sharing closet ${closetId} with user ${userId} in PostgreSQL:`, error);
            throw new Error("Failed to share closet in PostgreSQL");
        }
    }

    async unshareCloset(closetId: string, userId: string): Promise<void> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_DELETE',
            label: 'shared_closets',
            params: { closetId, userId },
            source: 'PostgresClosetRepository.unshareCloset'
        });

        try {
            const numericId = BigInt(closetId);
            await prisma.sharedCloset.delete({
                where: { closetId_userId: { closetId: numericId, userId } },
            });
        } catch (error) {
            console.error(`Error unsharing closet ${closetId} from user ${userId} in PostgreSQL:`, error);
            throw new Error("Failed to unshare closet in PostgreSQL");
        }
    }
}

import { prisma } from "../../database/postgres/prisma-client.js";
import { formatUserOutfit } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IOutfitRepository } from "../interfaces/IOutfitRepository.js";
import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { OutfitOverview } from "../../dtos/outfits/OutfitOverview.dto.js";

const outfitInclude = {
    user: true,
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
    reviews: {
        include: {
            user: true,
        },
    },
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
            const numericId = this.parseBigIntId(id, "outfit id");
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
            type CreatedIdRow = { id: bigint };

            const created = await prisma.$transaction(async (tx) => {
                await tx.$executeRaw`
                CALL create_outfit(
                    ${data.name}::text,
                    ${data.style}::text,
                    ${data.createdBy}::uuid
                )
            `;

                const idRows = await tx.$queryRaw<CreatedIdRow[]>`
                SELECT currval(pg_get_serial_sequence('outfits', 'id'))::bigint AS id
            `;

                const createdId = idRows[0]?.id;
                if (!createdId) {
                    throw new Error("Could not resolve inserted outfit id after CALL create_outfit");
                }

                const outfit = await tx.outfit.findUnique({
                    where: { id: createdId },
                    include: outfitInclude,
                });

                if (!outfit) {
                    throw new Error(`Created outfit not found for id "${String(createdId)}"`);
                }

                return outfit;
            });

            return [formatUserOutfit(created, "postgresql")];
        } catch (error) {
            console.error("Error creating outfit in PostgreSQL via procedure:", error);
            throw new Error("Failed to create outfit in PostgreSQL");
        }
    }

    async updateOutfit(id: string, data: Partial<{ name: string; style: string }>): Promise<Outfit[]> {
        try {
            const numericId = this.parseBigIntId(id, "outfit id");
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
            const numericId = this.parseBigIntId(id, "outfit id");
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
            const result = await prisma.$transaction(async (tx) => {
                const outfitId = this.parseBigIntId(id, "outfit id");
                const numericItemId = this.parseBigIntId(itemId, "item id");

                const item = await tx.item.findUnique({
                    where: { id: numericItemId },
                });
                if (!item) throw new Error(`Item with id "${itemId}" not found`);

                const closetItem = await tx.closetItem.findFirst({
                    where: { itemId: numericItemId },
                });
                if (!closetItem) throw new Error(`Item with id "${itemId}" is not in any closet`);

                const existing = await tx.outfitItem.findFirst({
                    where: {
                        outfitId,
                        closetItemId: closetItem.id,
                    },
                });

                if (!existing) {
                    await tx.outfitItem.create({
                        data: {
                            outfitId,
                            closetItemId: closetItem.id,
                        },
                    });
                }

                const outfit = await tx.outfit.findUnique({
                    where: { id: outfitId },
                    include: outfitInclude,
                });

                if (!outfit) {
                    throw new Error(`Outfit with id "${id}" not found after operation`);
                }

                return outfit;
            });

            return [formatUserOutfit(result, "postgresql")];
        } catch (error) {
            console.error(`Error adding item ${itemId} to outfit ${id} in PostgreSQL:`, error);
            throw new Error("Failed to add item to outfit in PostgreSQL");
        }
    }

    async removeItemFromOutfit(id: string, itemId: string): Promise<Outfit[]> {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const outfitId = this.parseBigIntId(id, "outfit id");
                const numericItemId = this.parseBigIntId(itemId, "item id");

                const closetItem = await tx.closetItem.findFirst({
                    where: { itemId: numericItemId },
                });

                if (closetItem) {
                    await tx.outfitItem.deleteMany({
                        where: {
                            outfitId,
                            closetItemId: closetItem.id,
                        },
                    });
                }

                const outfit = await tx.outfit.findUnique({
                    where: { id: outfitId },
                    include: outfitInclude,
                });

                if (!outfit) {
                    throw new Error(`Outfit with id "${id}" not found after operation`);
                }

                return outfit;
            });

            return [formatUserOutfit(result, "postgresql")];
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

    private parseBigIntId(value: string, fieldName: string): bigint {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return BigInt(parsed);
    }

    async getOutfitOverview(style?: string): Promise<OutfitOverview[]> {
        try {
            type Row = {
                id: bigint;
                name: string;
                style: string;
                dateAdded: Date;
                firstName: string;
                lastName: string;
                itemCount: bigint;
            };

            const rows = await prisma.$queryRaw<Row[]>`
                SELECT
                    id,
                    name,
                    style,
                    "dateAdded" AS "dateAdded",
                    "firstName" AS "firstName",
                    "lastName" AS "lastName",
                    item_count::bigint AS "itemCount"
                FROM outfit_overview
                WHERE ${style ?? null}::text IS NULL OR style = ${style ?? null}
                ORDER BY "dateAdded" DESC
            `;

            return rows.map((r) => ({
                id: Number(r.id),
                name: r.name,
                style: r.style,
                dateAdded: r.dateAdded,
                firstName: r.firstName,
                lastName: r.lastName,
                itemCount: Number(r.itemCount),
                fromDatabase: "postgresql",
            }));
        } catch (error) {
            console.error("Error fetching outfit overview from PostgreSQL:", error);
            throw new Error("Failed to fetch outfit overview from PostgreSQL");
        }
    }

    async getOutfitPrice(id: string): Promise<number> {
        try {
            const numericId = this.parseBigIntId(id, "outfit id");

            type Row = { calculate_outfit_price: unknown };

            const result = await prisma.$queryRaw<Row[]>`
            SELECT calculate_outfit_price(${numericId}) AS calculate_outfit_price
        `;

            const raw = result[0]?.calculate_outfit_price;
            return typeof raw === "number" ? raw : Number(raw ?? 0);
        } catch (error) {
            console.error(`Error calculating outfit price ${id} in PostgreSQL:`, error);
            throw new Error("Failed to calculate outfit price in PostgreSQL");
        }
    }
}

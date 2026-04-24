import { neogma } from "../../database/neo4j/neogma-client.js";
import { formatUserOutfit } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IOutfitRepository } from "../interfaces/IOutfitRepository.js";
import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { OutfitOverview } from "../../dtos/outfits/OutfitOverview.dto.js";

export class Neo4jOutfitRepository implements IOutfitRepository {
    async getAllOutfits(style?: string): Promise<Outfit[]> {
        try {
            const result = await neogma.queryRunner.run(
                `MATCH (u:User)-[rel:CREATES]->(o:Outfit)
                 WHERE $style IS NULL OR o.style = $style
                 OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
                 OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
                 OPTIONAL MATCH (b)-[:IS_FROM]->(country:Country)
                 OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
                 OPTIONAL MATCH (i)-[:HAS]->(img:Image)
                 OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv:Review)-[:ABOUT]->(o)
                 WITH o, u, rel, i, b, country, cat, img, rv, reviewer, w
                 RETURN o,
                        {
                            id: u.id,
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.email
                        } AS createdBy,
                        coalesce(rel.dateAdded, o.dateAdded) AS dateAdded,
                        collect(DISTINCT CASE
                            WHEN i.id IS NOT NULL THEN {
                                id: i.id,
                                name: i.name,
                                price: i.price,
                                category: { categoryId: cat.id, name: cat.name }
                            }
                        END) AS rawItems,
                        collect(DISTINCT CASE
                            WHEN b.id IS NOT NULL AND i.id IS NOT NULL THEN {
                                itemId: i.id,
                                brandId: b.id,
                                brandName: b.name,
                                countryId: country.id,
                                countryName: country.name,
                                countryCode: country.countryCode
                            }
                        END) AS rawBrands,
                        collect(DISTINCT CASE
                            WHEN img.id IS NOT NULL AND i.id IS NOT NULL THEN {
                                itemId: i.id,
                                imageId: img.id,
                                imageUrl: img.url
                            }
                        END) AS rawImages,
                        collect(DISTINCT CASE
                            WHEN rv.id IS NOT NULL THEN {
                                id: rv.id,
                                score: rv.score,
                                text: rv.text,
                                dateWritten: w.dateWritten,
                                outfitId: o.id,
                                writtenBy: {
                                    id: reviewer.id,
                                    firstName: reviewer.firstName,
                                    lastName: reviewer.lastName,
                                    email: reviewer.email
                                }
                            }
                        END) AS rawReviews`,
                { style: style ?? null }
            );

            return result.records.map((record) => formatUserOutfit(record, "neo4j"));
        } catch (error) {
            console.error("Error fetching outfits from Neo4j:", error);
            throw new Error("Failed to fetch outfits from Neo4j");
        }
    }

    async getOutfitById(id: string): Promise<Outfit[]> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");
            const result = await neogma.queryRunner.run(
                `MATCH (u:User)-[rel:CREATES]->(o:Outfit { id: $id })
                 OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
                 OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
                 OPTIONAL MATCH (b)-[:IS_FROM]->(country:Country)
                 OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
                 OPTIONAL MATCH (i)-[:HAS]->(img:Image)
                 OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv:Review)-[:ABOUT]->(o)
                 WITH o, u, rel, i, b, country, cat, img, rv, reviewer, w
                 RETURN o,
                        {
                            id: u.id,
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.email
                        } AS createdBy,
                        coalesce(rel.dateAdded, o.dateAdded) AS dateAdded,
                        collect(DISTINCT CASE
                            WHEN i.id IS NOT NULL THEN {
                                id: i.id,
                                name: i.name,
                                price: i.price,
                                category: { categoryId: cat.id, name: cat.name }
                            }
                        END) AS rawItems,
                        collect(DISTINCT CASE
                            WHEN b.id IS NOT NULL AND i.id IS NOT NULL THEN {
                                itemId: i.id,
                                brandId: b.id,
                                brandName: b.name,
                                countryId: country.id,
                                countryName: country.name,
                                countryCode: country.countryCode
                            }
                        END) AS rawBrands,
                        collect(DISTINCT CASE
                            WHEN img.id IS NOT NULL AND i.id IS NOT NULL THEN {
                                itemId: i.id,
                                imageId: img.id,
                                imageUrl: img.url
                            }
                        END) AS rawImages,
                        collect(DISTINCT CASE
                            WHEN rv.id IS NOT NULL THEN {
                                id: rv.id,
                                score: rv.score,
                                text: rv.text,
                                dateWritten: w.dateWritten,
                                outfitId: o.id,
                                writtenBy: {
                                    id: reviewer.id,
                                    firstName: reviewer.firstName,
                                    lastName: reviewer.lastName,
                                    email: reviewer.email
                                }
                            }
                        END) AS rawReviews`,
                { id: numericId }
            );

            if (result.records.length === 0) return [];
            return result.records.map((record) => formatUserOutfit(record, "neo4j"));
        } catch (error) {
            console.error(`Error fetching outfit ${id} from Neo4j:`, error);
            throw new Error("Failed to fetch outfit from Neo4j");
        }
    }

    async createOutfit(data: { name: string; style: string; createdBy: string }): Promise<Outfit[]> {
        try {
            const maxResult = await neogma.queryRunner.run(
                `MATCH (o:Outfit) RETURN coalesce(max(o.id), 0) AS maxId`
            );

            const rawMax = maxResult.records[0]?.get("maxId");
            const nextId = this.toNumber(rawMax) + 1;
            const dateAdded = new Date().toISOString();

            await neogma.queryRunner.run(
                `MATCH (u:User { id: $userId })
                 CREATE (o:Outfit { id: $id, name: $name, style: $style, dateAdded: $dateAdded })
                 CREATE (u)-[:CREATES { dateAdded: $dateAdded }]->(o)`,
                {
                    id: nextId,
                    name: data.name,
                    style: data.style,
                    userId: data.createdBy,
                    dateAdded,
                }
            );

            return await this.getOutfitById(String(nextId));
        } catch (error) {
            console.error("Error creating outfit in Neo4j:", error);
            throw new Error("Failed to create outfit in Neo4j");
        }
    }

    async updateOutfit(id: string, data: Partial<{ name: string; style: string }>): Promise<Outfit[]> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");
            const patch: Partial<{ name: string; style: string }> = {};

            if (typeof data.name === "string") patch.name = data.name;
            if (typeof data.style === "string") patch.style = data.style;

            await neogma.queryRunner.run(
                `MATCH (o:Outfit { id: $id })
                 SET o += $patch`,
                { id: numericId, patch }
            );

            return await this.getOutfitById(id);
        } catch (error) {
            console.error(`Error updating outfit ${id} in Neo4j:`, error);
            throw new Error("Failed to update outfit in Neo4j");
        }
    }

    async deleteOutfit(id: string): Promise<void> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");
            await neogma.queryRunner.run(
                `MATCH (o:Outfit { id: $id })
                 DETACH DELETE o`,
                { id: numericId }
            );
        } catch (error) {
            console.error(`Error deleting outfit ${id} from Neo4j:`, error);
            throw new Error("Failed to delete outfit from Neo4j");
        }
    }

    async getOutfitItems(id: string): Promise<ClothingItem[]> {
        try {
            const outfits = await this.getOutfitById(id);
            if (outfits.length === 0) return [];
            return outfits[0]?.items ?? [];
        } catch (error) {
            console.error(`Error fetching items for outfit ${id} from Neo4j:`, error);
            throw new Error("Failed to fetch outfit items from Neo4j");
        }
    }

    async addItemToOutfit(id: string, itemId: string): Promise<Outfit[]> {
        try {
            const numericOutfitId = this.parseNumericId(id, "outfit id");
            const numericItemId = this.parseNumericId(itemId, "item id");

            await neogma.queryRunner.run(
                `MATCH (o:Outfit { id: $outfitId })
                 MATCH (i:Item { id: $itemId })
                 MERGE (o)-[:CONTAINS]->(i)`,
                { outfitId: numericOutfitId, itemId: numericItemId }
            );

            return await this.getOutfitById(id);
        } catch (error) {
            console.error(`Error adding item ${itemId} to outfit ${id} in Neo4j:`, error);
            throw new Error("Failed to add item to outfit in Neo4j");
        }
    }

    async removeItemFromOutfit(id: string, itemId: string): Promise<Outfit[]> {
        try {
            const numericOutfitId = this.parseNumericId(id, "outfit id");
            const numericItemId = this.parseNumericId(itemId, "item id");

            await neogma.queryRunner.run(
                `MATCH (o:Outfit { id: $outfitId })-[rel:CONTAINS]->(i:Item { id: $itemId })
                 DELETE rel`,
                { outfitId: numericOutfitId, itemId: numericItemId }
            );

            return await this.getOutfitById(id);
        } catch (error) {
            console.error(`Error removing item ${itemId} from outfit ${id} in Neo4j:`, error);
            throw new Error("Failed to remove item from outfit in Neo4j");
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<Outfit[]> {
        try {
            const result = await neogma.queryRunner.run(
                `MATCH (u:User { id: $userId })-[rel:CREATES]->(o:Outfit)
                 OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
                 OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
                 OPTIONAL MATCH (b)-[:IS_FROM]->(country:Country)
                 OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
                 OPTIONAL MATCH (i)-[:HAS]->(img:Image)
                 OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv:Review)-[:ABOUT]->(o)
                 WITH o, u, rel, i, b, country, cat, img, rv, reviewer, w
                 RETURN o,
                        {
                            id: u.id,
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.email
                        } AS createdBy,
                        coalesce(rel.dateAdded, o.dateAdded) AS dateAdded,
                        collect(DISTINCT CASE
                            WHEN i.id IS NOT NULL THEN {
                                id: i.id,
                                name: i.name,
                                price: i.price,
                                category: { categoryId: cat.id, name: cat.name }
                            }
                        END) AS rawItems,
                        collect(DISTINCT CASE
                            WHEN b.id IS NOT NULL AND i.id IS NOT NULL THEN {
                                itemId: i.id,
                                brandId: b.id,
                                brandName: b.name,
                                countryId: country.id,
                                countryName: country.name,
                                countryCode: country.countryCode
                            }
                        END) AS rawBrands,
                        collect(DISTINCT CASE
                            WHEN img.id IS NOT NULL AND i.id IS NOT NULL THEN {
                                itemId: i.id,
                                imageId: img.id,
                                imageUrl: img.url
                            }
                        END) AS rawImages,
                        collect(DISTINCT CASE
                            WHEN rv.id IS NOT NULL THEN {
                                id: rv.id,
                                score: rv.score,
                                text: rv.text,
                                dateWritten: w.dateWritten,
                                outfitId: o.id,
                                writtenBy: {
                                    id: reviewer.id,
                                    firstName: reviewer.firstName,
                                    lastName: reviewer.lastName,
                                    email: reviewer.email
                                }
                            }
                        END) AS rawReviews`,
                { userId }
            );

            if (result.records.length === 0) return [];
            return result.records.map((record) => formatUserOutfit(record, "neo4j"));
        } catch (error) {
            console.error(`Error fetching outfits for user ${userId} from Neo4j:`, error);
            throw new Error("Failed to fetch outfits by user from Neo4j");
        }
    }

    private parseNumericId(value: string, fieldName: string): number {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return parsed;
    }

    private toNumber(value: unknown): number {
        if (typeof value === "number") return value;
        if (typeof value === "bigint") return Number(value);
        if (value && typeof (value as { toNumber?: () => number }).toNumber === "function") {
            return (value as { toNumber: () => number }).toNumber();
        }
        const n = Number(value ?? 0);
        return Number.isFinite(n) ? n : 0;
    }

    async getOutfitOverview(style?: string): Promise<OutfitOverview[]> {
        try {
            const result = await neogma.queryRunner.run(
                `MATCH (u:User)-[rel:CREATES]->(o:Outfit)
       WHERE $style IS NULL OR o.style = $style
       OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
       RETURN o.id AS id,
              o.name AS name,
              o.style AS style,
              coalesce(rel.dateAdded, o.dateAdded) AS dateAdded,
              u.firstName AS firstName,
              u.lastName AS lastName,
              count(DISTINCT i) AS itemCount
       ORDER BY dateAdded DESC`,
                { style: style ?? null }
            );

            return result.records.map((record) => ({
                id: this.toNumber(record.get("id")),
                name: String(record.get("name") ?? ""),
                style: String(record.get("style") ?? ""),
                dateAdded: String(record.get("dateAdded") ?? ""),
                firstName: String(record.get("firstName") ?? ""),
                lastName: String(record.get("lastName") ?? ""),
                itemCount: this.toNumber(record.get("itemCount")),
                fromDatabase: "neo4j",
            }));
        } catch (error) {
            console.error("Error fetching outfit overview from Neo4j:", error);
            throw new Error("Failed to fetch outfit overview from Neo4j");
        }
    }

    async getOutfitPrice(id: string): Promise<number> {
        try {
            const numericId = this.parseNumericId(id, "outfit id");

            const result = await neogma.queryRunner.run(
                `MATCH (o:Outfit {id: $outfitId})-[:CONTAINS]->(i:Item)
             RETURN coalesce(sum(coalesce(i.price, 0)), 0) AS total_price`,
                { outfitId: numericId }
            );

            const totalPrice = result.records[0]?.get("total_price");
            return this.toNumber(totalPrice);
        } catch (error) {
            console.error(`Error calculating outfit price for outfit ${id} in Neo4j:`, error);
            throw new Error("Failed to calculate outfit price in Neo4j");
        }
    }

}

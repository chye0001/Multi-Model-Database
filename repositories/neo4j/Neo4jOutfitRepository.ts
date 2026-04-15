import { getOutfitModel } from "../../database/neo4j/models/index.js";
import { neogma } from "../../database/neo4j/neogma-client.js";
import { formatUserOutfit, formatClothingItem } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IOutfitRepository } from "../interfaces/IOutfitRepository.js";
import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";

export class Neo4jOutfitRepository implements IOutfitRepository {
    async getAllOutfits(style?: string): Promise<Outfit[]> {
        try {
            const query = style
                ? `MATCH (o:Outfit { style: $style })
           OPTIONAL MATCH (u:User)-[:CREATES]->(o)
           OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
           OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
           OPTIONAL MATCH (b)-[:IS_FROM]->(country:Country)
           OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
           OPTIONAL MATCH (i)-[:HAS]->(img:Image)
           OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv:Review)-[:ABOUT]->(o)
           WITH o, u, i, b, country, cat, img, rv, w, reviewer
           RETURN o,
               u.id AS createdBy,
               o.dateAdded AS dateAdded,
               collect(DISTINCT { id: i.id, name: i.name, price: i.price, category: cat.name }) AS rawItems,
               collect(DISTINCT { itemId: i.id, brandId: b.id, brandName: b.name, countryId: country.id, countryName: country.name, countryCode: country.countryCode }) AS rawBrands,
               collect(DISTINCT { itemId: i.id, imageId: img.id, imageUrl: img.url }) AS rawImages,
               collect(DISTINCT { id: rv.id, score: rv.score, text: rv.text, writtenBy: reviewer.id, dateWritten: w.dateWritten, outfitId: o.id }) AS rawReviews`
                : `MATCH (o:Outfit)
           OPTIONAL MATCH (u:User)-[:CREATES]->(o)
           OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
           OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
           OPTIONAL MATCH (b)-[:IS_FROM]->(country:Country)
           OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
           OPTIONAL MATCH (i)-[:HAS]->(img:Image)
           OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv:Review)-[:ABOUT]->(o)
           WITH o, u, i, b, country, cat, img, rv, w, reviewer
           RETURN o,
               u.id AS createdBy,
               o.dateAdded AS dateAdded,
               collect(DISTINCT { id: i.id, name: i.name, price: i.price, category: cat.name }) AS rawItems,
               collect(DISTINCT { itemId: i.id, brandId: b.id, brandName: b.name, countryId: country.id, countryName: country.name, countryCode: country.countryCode }) AS rawBrands,
               collect(DISTINCT { itemId: i.id, imageId: img.id, imageUrl: img.url }) AS rawImages,
               collect(DISTINCT { id: rv.id, score: rv.score, text: rv.text, writtenBy: reviewer.id, dateWritten: w.dateWritten, outfitId: o.id }) AS rawReviews`;

            const result = await neogma.queryRunner.run(query, style ? { style } : {});
            return result.records.map((record) => formatUserOutfit(record, "neo4j"));
        } catch (error) {
            console.error("Error fetching outfits from Neo4j:", error);
            throw new Error("Failed to fetch outfits from Neo4j");
        }
    }

    async getOutfitById(id: string): Promise<Outfit[]> {
        try {
            const numericId = Number(id);
            const result = await neogma.queryRunner.run(
                `MATCH (o:Outfit { id: $id })
         OPTIONAL MATCH (u:User)-[:CREATES]->(o)
         OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
         OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
         OPTIONAL MATCH (b)-[:IS_FROM]->(country:Country)
         OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
         OPTIONAL MATCH (i)-[:HAS]->(img:Image)
         OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv:Review)-[:ABOUT]->(o)
         WITH o, u, i, b, country, cat, img, rv, w, reviewer
         RETURN o,
             u.id AS createdBy,
             o.dateAdded AS dateAdded,
             collect(DISTINCT { id: i.id, name: i.name, price: i.price, category: cat.name }) AS rawItems,
             collect(DISTINCT { itemId: i.id, brandId: b.id, brandName: b.name, countryId: country.id, countryName: country.name, countryCode: country.countryCode }) AS rawBrands,
             collect(DISTINCT { itemId: i.id, imageId: img.id, imageUrl: img.url }) AS rawImages,
             collect(DISTINCT { id: rv.id, score: rv.score, text: rv.text, writtenBy: reviewer.id, dateWritten: w.dateWritten, outfitId: o.id }) AS rawReviews`,
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
            const maxResult = await neogma.queryRunner.run(`MATCH (o:Outfit) RETURN max(o.id) AS maxId`);
            const maxId = maxResult.records[0]?.get("maxId") ?? 0;
            const nextId = (maxId as number) + 1;

            await neogma.queryRunner.run(
                `MATCH (u:User { id: $userId })
         CREATE (o:Outfit { id: $id, name: $name, style: $style, dateAdded: $dateAdded })
         CREATE (u)-[:CREATES]->(o)
         RETURN o`,
                {
                    id: nextId,
                    name: data.name,
                    style: data.style,
                    userId: data.createdBy,
                    dateAdded: new Date().toISOString(),
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
            const numericId = Number(id);
            const patch: { name?: string; style?: string } = {};

            if (typeof data.name === "string") patch.name = data.name;
            if (typeof data.style === "string") patch.style = data.style;

            await neogma.queryRunner.run(
                `MATCH (o:Outfit { id: $id })
         SET o += $patch
         RETURN o`,
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
            const numericId = Number(id);
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
            const numericOutfitId = Number(id);
            const numericItemId = Number(itemId);

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
            const numericOutfitId = Number(id);
            const numericItemId = Number(itemId);

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
                `MATCH (u:User {id: $userId})-[rel:CREATES]->(o:Outfit)
         OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
         OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
         OPTIONAL MATCH (b)-[:IS_FROM]->(country:Country)
         OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
         OPTIONAL MATCH (i)-[:HAS]->(img:Image)
         OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv:Review)-[:ABOUT]->(o)
         WITH o, u, rel, i, b, country, cat, img, rv, w, reviewer
         RETURN o,
             u.id AS createdBy,
             rel.dateAdded AS dateAdded,
             collect(DISTINCT { id: i.id, name: i.name, price: i.price, category: cat.name }) AS rawItems,
             collect(DISTINCT { itemId: i.id, brandId: b.id, brandName: b.name, countryId: country.id, countryName: country.name, countryCode: country.countryCode }) AS rawBrands,
             collect(DISTINCT { itemId: i.id, imageId: img.id, imageUrl: img.url }) AS rawImages,
             collect(DISTINCT { id: rv.id, score: rv.score, text: rv.text, writtenBy: reviewer.id, dateWritten: w.dateWritten, outfitId: o.id }) AS rawReviews`,
                { userId }
            );

            if (result.records.length === 0) return [];
            return result.records.map((record) => formatUserOutfit(record, "neo4j"));
        } catch (error) {
            console.error(`Error fetching outfits for user ${userId} from Neo4j:`, error);
            throw new Error("Failed to fetch outfits by user from Neo4j");
        }
    }
}

import { neogma } from "../../database/neo4j/neogma-client.js";
import { formatUserCloset } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IClosetRepository } from "../interfaces/IClosetRepository.js";
import type { Closet as ClosetDTO } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";

export class Neo4jClosetRepository implements IClosetRepository {
    async getAllClosets(): Promise<ClosetDTO[]> {
        try {
            const result = await neogma.queryRunner.run(
                `MATCH (cl:Closet)
                 WHERE cl.isPublic = true
                 OPTIONAL MATCH (owner:User)-[has:HAS]->(cl)
                 OPTIONAL MATCH (cl)-[:STORES]->(i:Item)
                 OPTIONAL MATCH (sharedUser:User)-[:CO_CURATES]->(cl)
                 WITH cl, has,
                      collect(DISTINCT i.id) AS itemIds,
                      collect(DISTINCT sharedUser.id) AS sharedWith
                 RETURN cl, itemIds, sharedWith, coalesce(has.createdAt, cl.createdAt) AS createdAt`
            );

            return result.records.map((record) => formatUserCloset(record, "neo4j"));
        } catch (error) {
            console.error("Error fetching closets from Neo4j:", error);
            throw new Error("Failed to fetch closets from Neo4j");
        }
    }

    async getClosetById(id: string): Promise<ClosetDTO[]> {
        try {
            const numericId = this.parseNumericId(id, "closet id");

            const result = await neogma.queryRunner.run(
                `MATCH (cl:Closet { id: $id })
                 OPTIONAL MATCH (owner:User)-[has:HAS]->(cl)
                 OPTIONAL MATCH (cl)-[:STORES]->(i:Item)
                 OPTIONAL MATCH (sharedUser:User)-[:CO_CURATES]->(cl)
                 WITH cl, has,
                      collect(DISTINCT i.id) AS itemIds,
                      collect(DISTINCT sharedUser.id) AS sharedWith
                 RETURN cl, itemIds, sharedWith, coalesce(has.createdAt, cl.createdAt) AS createdAt`,
                { id: numericId }
            );

            if (result.records.length === 0) return [];
            return result.records.map((record) => formatUserCloset(record, "neo4j"));
        } catch (error) {
            console.error(`Error fetching closet ${id} from Neo4j:`, error);
            throw new Error("Failed to fetch closet from Neo4j");
        }
    }

    async createCloset(data: { name: string; description?: string; isPublic: boolean; userId: string }): Promise<ClosetDTO[]> {
        try {
            const maxResult = await neogma.queryRunner.run(
                `MATCH (cl:Closet) RETURN coalesce(max(cl.id), 0) AS maxId`
            );

            const rawMax = maxResult.records[0]?.get("maxId");
            const maxId = this.toNumber(rawMax);
            const nextId = maxId + 1;
            const createdAt = new Date().toISOString();

            await neogma.queryRunner.run(
                `MATCH (u:User { id: $userId })
                 CREATE (cl:Closet {
                   id: $id,
                   name: $name,
                   description: $description,
                   isPublic: $isPublic,
                   userId: $userId,
                   createdAt: $createdAt
                 })
                 CREATE (u)-[:HAS { createdAt: $createdAt }]->(cl)`,
                {
                    id: nextId,
                    name: data.name,
                    description: data.description ?? "",
                    isPublic: data.isPublic,
                    userId: data.userId,
                    createdAt,
                }
            );

            return await this.getClosetById(String(nextId));
        } catch (error) {
            console.error("Error creating closet in Neo4j:", error);
            throw new Error("Failed to create closet in Neo4j");
        }
    }

    async updateCloset(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>): Promise<ClosetDTO[]> {
        try {
            const numericId = this.parseNumericId(id, "closet id");
            const patch: Partial<{ name: string; description: string; isPublic: boolean }> = {};

            if (typeof data.name === "string") patch.name = data.name;
            if (typeof data.description === "string") patch.description = data.description;
            if (typeof data.isPublic === "boolean") patch.isPublic = data.isPublic;

            await neogma.queryRunner.run(
                `MATCH (cl:Closet { id: $id })
                 SET cl += $patch`,
                { id: numericId, patch }
            );

            return await this.getClosetById(id);
        } catch (error) {
            console.error(`Error updating closet ${id} in Neo4j:`, error);
            throw new Error("Failed to update closet in Neo4j");
        }
    }

    async deleteCloset(id: string): Promise<void> {
        try {
            const numericId = this.parseNumericId(id, "closet id");

            await neogma.queryRunner.run(
                `MATCH (cl:Closet { id: $id })
                 DETACH DELETE cl`,
                { id: numericId }
            );
        } catch (error) {
            console.error(`Error deleting closet ${id} from Neo4j:`, error);
            throw new Error("Failed to delete closet from Neo4j");
        }
    }

    async getClosetItems(id: string): Promise<ClothingItem[]> {
        try {
            const numericId = this.parseNumericId(id, "closet id");

            const result = await neogma.queryRunner.run(
                `MATCH (cl:Closet { id: $closetId })-[:STORES]->(i:Item)
                 OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
                 OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
                 OPTIONAL MATCH (i)-[:HAS]->(img:Image)
                 RETURN i,
                        cat.name AS category,
                        collect(DISTINCT { id: b.id, name: b.name }) AS brands,
                        collect(DISTINCT { id: img.id, url: img.url }) AS images`,
                { closetId: numericId }
            );

            return result.records.map((record) => {
                const itemNode = record.get("i");
                const props = itemNode.properties;

                const brands = (record.get("brands") as Array<{ id: number | null; name: string | null }>)
                    .filter((b) => b.id !== null && b.name !== null)
                    .map((b) => ({ id: Number(b.id), name: String(b.name) }));

                const images = (record.get("images") as Array<{ id: number | null; url: string | null }>)
                    .filter((img) => img.id !== null && img.url !== null)
                    .map((img) => ({ id: Number(img.id), url: String(img.url) }));

                return {
                    id: Number(props.id),
                    name: String(props.name),
                    price: props.price ?? null,
                    category: String(record.get("category") ?? "Unknown"),
                    brands,
                    images,
                    fromDatabase: "neo4j",
                };
            });
        } catch (error) {
            console.error(`Error fetching items for closet ${id} from Neo4j:`, error);
            throw new Error("Failed to fetch closet items from Neo4j");
        }
    }

    async addItemToCloset(closetId: string, itemId: string): Promise<ClosetDTO[]> {
        try {
            const numericClosetId = this.parseNumericId(closetId, "closet id");
            const numericItemId = this.parseNumericId(itemId, "item id");

            await neogma.queryRunner.run(
                `MATCH (cl:Closet { id: $closetId })
                 MATCH (i:Item { id: $itemId })
                 MERGE (cl)-[:STORES]->(i)`,
                { closetId: numericClosetId, itemId: numericItemId }
            );

            return await this.getClosetById(closetId);
        } catch (error) {
            console.error(`Error adding item ${itemId} to closet ${closetId} in Neo4j:`, error);
            throw new Error("Failed to add item to closet in Neo4j");
        }
    }

    async removeItemFromCloset(closetId: string, itemId: string): Promise<ClosetDTO[]> {
        try {
            const numericClosetId = this.parseNumericId(closetId, "closet id");
            const numericItemId = this.parseNumericId(itemId, "item id");

            await neogma.queryRunner.run(
                `MATCH (cl:Closet { id: $closetId })-[rel:STORES]->(i:Item { id: $itemId })
                 DELETE rel`,
                { closetId: numericClosetId, itemId: numericItemId }
            );

            return await this.getClosetById(closetId);
        } catch (error) {
            console.error(`Error removing item ${itemId} from closet ${closetId} in Neo4j:`, error);
            throw new Error("Failed to remove item from closet in Neo4j");
        }
    }

    async getUserClosets(userId: string): Promise<ClosetDTO[]> {
        try {
            const result = await neogma.queryRunner.run(
                `MATCH (u:User { id: $userId })-[has:HAS]->(cl:Closet)
                 OPTIONAL MATCH (cl)-[:STORES]->(i:Item)
                 OPTIONAL MATCH (sharedUser:User)-[:CO_CURATES]->(cl)
                 WITH cl, has,
                      collect(DISTINCT i.id) AS itemIds,
                      collect(DISTINCT sharedUser.id) AS sharedWith
                 RETURN cl, itemIds, sharedWith, coalesce(has.createdAt, cl.createdAt) AS createdAt`,
                { userId }
            );

            return result.records.map((record) => formatUserCloset(record, "neo4j"));
        } catch (error) {
            console.error(`Error fetching closets for user ${userId} from Neo4j:`, error);
            throw new Error("Failed to fetch user closets from Neo4j");
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
}

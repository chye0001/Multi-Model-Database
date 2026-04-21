import { neogma } from "../../database/neo4j/neogma-client.js";

import type { IImageRepository } from "../interfaces/IImageRepository.js";
import type { Image } from "../../dtos/images/Image.dto.js";

export class Neo4jImageRepository implements IImageRepository {
    async getImageById(id: string): Promise<Image[]> {
        const imageId = this.parseNumericId(id, "image id");

        const result = await neogma.queryRunner.run(
            `MATCH (i:Item)-[:HAS]->(img:Image { id: $id })
             RETURN img, i.id AS itemId
             LIMIT 1`,
            { id: imageId }
        );

        if (result.records.length === 0) return [];
        return [this.toImageDto(result.records[0])];
    }

    async uploadImage(data: { url: string; itemId: string }): Promise<Image[]> {
        const itemId = this.parseNumericId(data.itemId, "item id");

        const maxResult = await neogma.queryRunner.run(
            `MATCH (img:Image)
             RETURN coalesce(max(img.id), 0) AS maxId`
        );

        const rawMax = maxResult.records[0]?.get("maxId");
        const nextId = this.toNumber(rawMax) + 1;

        const created = await neogma.queryRunner.run(
            `MATCH (i:Item { id: $itemId })
             CREATE (img:Image { id: $id, url: $url })
             CREATE (i)-[:HAS]->(img)
             RETURN img, i.id AS itemId`,
            {
                id: nextId,
                url: data.url,
                itemId,
            }
        );

        if (created.records.length === 0) {
            throw new Error(`Item "${data.itemId}" not found`);
        }

        return created.records.map((record) => this.toImageDto(record));
    }

    async deleteImage(id: string): Promise<void> {
        const imageId = this.parseNumericId(id, "image id");

        await neogma.queryRunner.run(
            `MATCH (img:Image { id: $id })
             DETACH DELETE img`,
            { id: imageId }
        );
    }

    private toImageDto(record: any): Image {
        const img = record.get("img")?.properties ?? {};
        return {
            id: Number(img.id),
            url: String(img.url),
            itemId: Number(record.get("itemId")),
            fromDatabase: "neo4j",
        };
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

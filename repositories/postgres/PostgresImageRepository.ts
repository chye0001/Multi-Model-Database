import { prisma } from "../../database/postgres/prisma-client.js";

import type { IImageRepository } from "../interfaces/IImageRepository.js";
import type { Image } from "../../dtos/images/Image.dto.js";

export class PostgresImageRepository implements IImageRepository {
    async getImageById(id: string): Promise<Image[]> {
        const imageId = this.parseBigIntId(id, "image id");
        const image = await prisma.image.findUnique({
            where: { id: imageId },
        });

        if (!image) return [];
        return [this.toImageDto(image)];
    }

    async uploadImage(data: { url: string; itemId: string }): Promise<Image[]> {
        const itemId = this.parseBigIntId(data.itemId, "item id");

        const created = await prisma.image.create({
            data: {
                url: data.url,
                itemId,
            },
        });

        return [this.toImageDto(created)];
    }

    async deleteImage(id: string): Promise<void> {
        const imageId = this.parseBigIntId(id, "image id");
        await prisma.image.delete({
            where: { id: imageId },
        });
    }

    private toImageDto(image: { id: bigint; url: string; itemId: bigint }): Image {
        return {
            id: Number(image.id),
            url: image.url,
            itemId: Number(image.itemId),
            fromDatabase: "postgresql",
        };
    }

    private parseBigIntId(value: string, fieldName: string): bigint {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return BigInt(parsed);
    }
}

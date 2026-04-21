import { Item } from "../../database/mongo/models/index.js";

import type { IImageRepository } from "../interfaces/IImageRepository.js";
import type { Image } from "../../dtos/images/Image.dto.js";

export class MongoImageRepository implements IImageRepository {
    async getImageById(id: string): Promise<Image[]> {
        const imageId = this.parseNumericId(id, "image id");

        const item = await Item.findOne({ "images.id": imageId }).lean().exec();
        if (!item) return [];

        const image = (item.images ?? []).find((img: any) => Number(img.id) === imageId);
        if (!image) return [];

        return [{
            id: Number(image.id),
            url: image.url,
            itemId: Number(item.id),
            fromDatabase: "mongodb",
        }];
    }

    async uploadImage(data: { url: string; itemId: string }): Promise<Image[]> {
        const itemId = this.parseNumericId(data.itemId, "item id");

        const item = await Item.findOne({ id: itemId }).lean().exec();
        if (!item) throw new Error(`Item "${data.itemId}" not found`);

        const max = await Item.aggregate([
            { $unwind: "$images" },
            { $sort: { "images.id": -1 } },
            { $limit: 1 },
            { $project: { _id: 0, maxId: "$images.id" } },
        ]).exec();

        const nextId = Number(max[0]?.maxId ?? 0) + 1;

        await Item.updateOne(
            { id: itemId },
            { $push: { images: { id: nextId, url: data.url } } }
        ).exec();

        return [{
            id: nextId,
            url: data.url,
            itemId,
            fromDatabase: "mongodb",
        }];
    }

    async deleteImage(id: string): Promise<void> {
        const imageId = this.parseNumericId(id, "image id");
        await Item.updateMany(
            { "images.id": imageId },
            { $pull: { images: { id: imageId } } }
        ).exec();
    }

    private parseNumericId(value: string, fieldName: string): number {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return parsed;
    }
}

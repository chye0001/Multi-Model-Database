import { Closet } from "../../database/mongo/models/closets/Closet.model.js";
import { Item } from "../../database/mongo/models/clothings/Item.model.js";
import { User } from "../../database/mongo/models/users/User.model.js";
import { formatUserCloset, formatClothingItem } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IClosetRepository } from "../interfaces/IClosetRepository.js";
import type { Closet as ClosetDTO } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";

export class MongoClosetRepository implements IClosetRepository {
    async getAllClosets(): Promise<ClosetDTO[]> {
        try {
            const closets = await Closet.find({ isPublic: true })
                .populate("userId itemIds")
                .exec();

            return closets.map((closet) => formatUserCloset(closet, "mongodb"));
        } catch (error) {
            console.error("Error fetching closets from MongoDB:", error);
            throw new Error("Failed to fetch closets from MongoDB");
        }
    }

    async getClosetById(id: string): Promise<ClosetDTO[]> {
        try {
            const numericId = this.parseNumericId(id, "closet id");
            const closet = await Closet.findOne({ id: numericId })
                .populate("userId itemIds")
                .exec();

            if (!closet) return [];
            return [formatUserCloset(closet, "mongodb")];
        } catch (error) {
            console.error(`Error fetching closet ${id} from MongoDB:`, error);
            throw new Error("Failed to fetch closet from MongoDB");
        }
    }

    async createCloset(data: { name: string; description?: string; isPublic: boolean; userId: string }): Promise<ClosetDTO[]> {
        try {
            const owner = await User.findOne({ id: data.userId }).exec();
            if (!owner) {
                throw new Error(`User not found: ${data.userId}`);
            }

            const lastCloset = await Closet.findOne().sort({ id: -1 }).exec();
            const nextId = (lastCloset?.id ?? 0) + 1;

            const newCloset = new Closet({
                id: nextId,
                name: data.name,
                description: data.description ?? null,
                isPublic: data.isPublic,
                userId: owner._id, // store Mongo ref, formatter reads populated userId.id
                itemIds: [],
                sharedWith: [],
            });

            const savedCloset = await newCloset.save();
            const populated = await savedCloset.populate("userId itemIds");
            return [formatUserCloset(populated, "mongodb")];
        } catch (error) {
            console.error("Error creating closet in MongoDB:", error);
            throw new Error("Failed to create closet in MongoDB");
        }
    }

    async updateCloset(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>): Promise<ClosetDTO[]> {
        try {
            const numericId = this.parseNumericId(id, "closet id");
            const patch: Partial<{ name: string; description: string; isPublic: boolean }> = {};

            if (typeof data.name === "string") patch.name = data.name;
            if (typeof data.description === "string") patch.description = data.description;
            if (typeof data.isPublic === "boolean") patch.isPublic = data.isPublic;

            const closet = await Closet.findOneAndUpdate({ id: numericId }, patch, { new: true })
                .populate("userId itemIds")
                .exec();

            if (!closet) return [];
            return [formatUserCloset(closet, "mongodb")];
        } catch (error) {
            console.error(`Error updating closet ${id} in MongoDB:`, error);
            throw new Error("Failed to update closet in MongoDB");
        }
    }

    async deleteCloset(id: string): Promise<void> {
        try {
            const numericId = this.parseNumericId(id, "closet id");
            await Closet.deleteOne({ id: numericId }).exec();
        } catch (error) {
            console.error(`Error deleting closet ${id} from MongoDB:`, error);
            throw new Error("Failed to delete closet from MongoDB");
        }
    }

    async getClosetItems(id: string): Promise<ClothingItem[]> {
        try {
            const numericId = this.parseNumericId(id, "closet id");
            const closet = await Closet.findOne({ id: numericId }).exec();
            if (!closet) return [];

            const items = await Item.find({ _id: { $in: closet.itemIds } }).exec();
            return items.map((item) => formatClothingItem(item, "mongodb"));
        } catch (error) {
            console.error(`Error fetching items for closet ${id} from MongoDB:`, error);
            throw new Error("Failed to fetch closet items from MongoDB");
        }
    }

    async addItemToCloset(closetId: string, itemId: string): Promise<ClosetDTO[]> {
        try {
            const numericClosetId = this.parseNumericId(closetId, "closet id");
            const numericItemId = this.parseNumericId(itemId, "item id");

            const item = await Item.findOne({ id: numericItemId }).exec();
            if (!item) return [];

            const closet = await Closet.findOneAndUpdate(
                { id: numericClosetId },
                { $addToSet: { itemIds: item._id } },
                { new: true }
            )
                .populate("userId itemIds")
                .exec();

            if (!closet) return [];
            return [formatUserCloset(closet, "mongodb")];
        } catch (error) {
            console.error(`Error adding item ${itemId} to closet ${closetId} in MongoDB:`, error);
            throw new Error("Failed to add item to closet in MongoDB");
        }
    }

    async removeItemFromCloset(closetId: string, itemId: string): Promise<ClosetDTO[]> {
        try {
            const numericClosetId = this.parseNumericId(closetId, "closet id");
            const numericItemId = this.parseNumericId(itemId, "item id");

            const item = await Item.findOne({ id: numericItemId }).exec();
            if (!item) return [];

            const closet = await Closet.findOneAndUpdate(
                { id: numericClosetId },
                { $pull: { itemIds: item._id } },
                { new: true }
            )
                .populate("userId itemIds")
                .exec();

            if (!closet) return [];
            return [formatUserCloset(closet, "mongodb")];
        } catch (error) {
            console.error(`Error removing item ${itemId} from closet ${closetId} in MongoDB:`, error);
            throw new Error("Failed to remove item from closet in MongoDB");
        }
    }

    async getUserClosets(userId: string): Promise<ClosetDTO[]> {
        try {
            const owner = await User.findOne({ id: userId }).exec();
            if (!owner) return [];

            const closets = await Closet.find({ userId: owner._id })
                .populate("userId itemIds")
                .exec();

            return closets.map((closet) => formatUserCloset(closet, "mongodb"));
        } catch (error) {
            console.error(`Error fetching closets for user ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch user closets from MongoDB");
        }
    }

    private parseNumericId(value: string, fieldName: string): number {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return parsed;
    }
}

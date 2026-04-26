import mongoose from "mongoose";
import { Closet } from "../../database/mongo/models/closets/Closet.model.js";
import { Item } from "../../database/mongo/models/clothings/Item.model.js";
import { User } from "../../database/mongo/models/users/User.model.js";
import { formatUserCloset, formatClothingItem } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IClosetRepository } from "../interfaces/IClosetRepository.js";
import type { Closet as ClosetDTO } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import { audit } from "../../utils/audit/AuditLogger.ts";
import type { EmbeddedUser } from "../../dtos/users/User.dto.js";

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
        audit({
            timestamp: new Date().toISOString(),
            event: "DOCUMENT_CREATE",
            label: "Closet",
            params: { name: data.name, isPublic: data.isPublic, userId: data.userId },
            source: "MongoClosetRepository.createCloset",
        });

        const session = await mongoose.startSession();
        try {
            let created: any = null;

            await session.withTransaction(async () => {
                const owner = await User.findOne({ id: data.userId }).session(session).exec();
                if (!owner) throw new Error(`User not found: ${data.userId}`);

                const lastCloset = await Closet.findOne().sort({ id: -1 }).session(session).lean().exec();
                const nextId = (lastCloset?.id ?? 0) + 1;

                await Closet.create([{
                    id: nextId,
                    name: data.name,
                    description: data.description ?? null,
                    isPublic: data.isPublic,
                    userId: owner._id,
                    itemIds: [],
                    sharedWith: [],
                }], { session });

                created = await Closet.findOne({ id: nextId })
                    .session(session)
                    .populate("userId")
                    .populate("itemIds")
                    .exec();
            });

            if (!created) return [];
            return [formatUserCloset(created, "mongodb")];
        } catch (error) {
            console.error("Error creating closet in MongoDB:", error);
            throw new Error("Failed to create closet in MongoDB");
        } finally {
            await session.endSession();
        }
    }

    async updateCloset(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>): Promise<ClosetDTO[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: "DOCUMENT_UPDATE",
            label: "Closet",
            params: { id, ...data },
            source: "MongoClosetRepository.updateCloset",
        });

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
        audit({
            timestamp: new Date().toISOString(),
            event: "DOCUMENT_DELETE",
            label: "Closet",
            params: { id },
            source: "MongoClosetRepository.deleteCloset",
        });

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
        audit({
            timestamp: new Date().toISOString(),
            event: "DOCUMENT_UPDATE",
            label: "Closet.itemIds",
            params: { closetId, itemId, operation: "addToSet" },
            source: "MongoClosetRepository.addItemToCloset",
        });

        const session = await mongoose.startSession();
        try {
            let updated: any = null;

            await session.withTransaction(async () => {
                const numericClosetId = this.parseNumericId(closetId, "closet id");
                const numericItemId = this.parseNumericId(itemId, "item id");

                const item = await Item.findOne({ id: numericItemId }).session(session).exec();
                if (!item) {
                    updated = null;
                    return;
                }

                updated = await Closet.findOneAndUpdate(
                    { id: numericClosetId },
                    { $addToSet: { itemIds: item._id } },
                    { new: true, session }
                )
                    .populate("userId")
                    .populate("itemIds")
                    .exec();
            });

            if (!updated) return [];
            return [formatUserCloset(updated, "mongodb")];
        } catch (error) {
            console.error(`Error adding item ${itemId} to closet ${closetId} in MongoDB:`, error);
            throw new Error("Failed to add item to closet in MongoDB");
        } finally {
            await session.endSession();
        }
    }

    async removeItemFromCloset(closetId: string, itemId: string): Promise<ClosetDTO[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: "DOCUMENT_UPDATE",
            label: "Closet.itemIds",
            params: { closetId, itemId, operation: "pull" },
            source: "MongoClosetRepository.removeItemFromCloset",
        });

        const session = await mongoose.startSession();
        try {
            let updated: any = null;

            await session.withTransaction(async () => {
                const numericClosetId = this.parseNumericId(closetId, "closet id");
                const numericItemId = this.parseNumericId(itemId, "item id");

                const item = await Item.findOne({ id: numericItemId }).session(session).exec();
                if (!item) {
                    updated = null;
                    return;
                }

                updated = await Closet.findOneAndUpdate(
                    { id: numericClosetId },
                    { $pull: { itemIds: item._id } },
                    { new: true, session }
                )
                    .populate("userId")
                    .populate("itemIds")
                    .exec();
            });

            if (!updated) return [];
            return [formatUserCloset(updated, "mongodb")];
        } catch (error) {
            console.error(`Error removing item ${itemId} from closet ${closetId} in MongoDB:`, error);
            throw new Error("Failed to remove item from closet in MongoDB");
        } finally {
            await session.endSession();
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

    async getClosetShares(closetId: string): Promise<EmbeddedUser[]> {
        try {
            const numericId = this.parseNumericId(closetId, "closet id");
            const closet = await Closet.findOne({ id: numericId }).lean().exec() as any;
            if (!closet) return [];
            return (closet.sharedWith ?? []).map((u: any) => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
            }));
        } catch (error) {
            console.error(`Error fetching shares for closet ${closetId} from MongoDB:`, error);
            throw new Error("Failed to fetch closet shares from MongoDB");
        }
    }

    async shareCloset(closetId: string, userId: string): Promise<EmbeddedUser[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: "DOCUMENT_UPDATE",
            label: "Closet.sharedWith",
            params: { closetId, userId, operation: "addToSet" },
            source: "MongoClosetRepository.shareCloset",
        });

        const session = await mongoose.startSession();
        try {
            let shares: EmbeddedUser[] = [];

            await session.withTransaction(async () => {
                const numericId = this.parseNumericId(closetId, "closet id");

                const user = await User.findOne({ id: userId }).session(session).lean().exec() as any;
                if (!user) throw new Error(`User ${userId} not found`);

                const snapshot = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                };

                const already = await Closet.findOne({ id: numericId, "sharedWith.id": userId })
                    .session(session)
                    .lean()
                    .exec();

                if (!already) {
                    await Closet.findOneAndUpdate(
                        { id: numericId },
                        { $push: { sharedWith: snapshot } },
                        { session }
                    ).exec();
                }

                const closet = await Closet.findOne({ id: numericId }).session(session).lean().exec() as any;
                shares = (closet?.sharedWith ?? []).map((u: any) => ({
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                }));
            });

            return shares;
        } catch (error) {
            console.error(`Error sharing closet ${closetId} with user ${userId} in MongoDB:`, error);
            throw new Error("Failed to share closet in MongoDB");
        } finally {
            await session.endSession();
        }
    }

    async unshareCloset(closetId: string, userId: string): Promise<void> {
        audit({
            timestamp: new Date().toISOString(),
            event: "DOCUMENT_UPDATE",
            label: "Closet.sharedWith",
            params: { closetId, userId, operation: "pull" },
            source: "MongoClosetRepository.unshareCloset",
        });

        try {
            const numericId = this.parseNumericId(closetId, "closet id");
            await Closet.findOneAndUpdate({ id: numericId }, { $pull: { sharedWith: { id: userId } } }).exec();
        } catch (error) {
            console.error(`Error unsharing closet ${closetId} from user ${userId} in MongoDB:`, error);
            throw new Error("Failed to unshare closet in MongoDB");
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

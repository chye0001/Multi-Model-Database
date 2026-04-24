import { Closet } from "../models/index.js";

export async function deleteEmptyClosetsMongo(): Promise<number> {
    try {
        console.log("[mongo-cleanup] Deleting empty closets...");

        const result = await Closet.deleteMany({
            $or: [
                { itemIds: { $exists: false } },
                { "itemIds.0": { $exists: false } },
            ],
        });

        const deletedCount = result.deletedCount ?? 0;
        console.log(`[mongo-cleanup] Deleted ${deletedCount} empty closets`);
        return deletedCount;
    } catch (error) {
        console.error("[mongo-cleanup] Failed to delete empty closets:", error);
        throw error;
    }
}

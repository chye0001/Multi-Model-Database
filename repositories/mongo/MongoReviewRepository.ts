import { Outfit, User } from "../../database/mongo/models/index.js";
import { formatUserReview } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IReviewRepository } from "../interfaces/IReviewRepository.js";
import type { Review } from "../../dtos/reviews/Review.dto.js";

export class MongoReviewRepository implements IReviewRepository {
    async getAllReviews(): Promise<Review[]> {
        const outfits = await Outfit.find()
            .populate("reviews.writtenBy")
            .lean()
            .exec();

        return this.flattenReviews(outfits);
    }

    async getReviewById(id: string): Promise<Review[]> {
        const reviewId = this.parseNumericId(id, "review id");
        const outfit = await Outfit.findOne({ "reviews.id": reviewId })
            .populate("reviews.writtenBy")
            .lean()
            .exec();

        if (!outfit) return [];

        const review = (outfit.reviews ?? []).find((r: any) => r.id === reviewId);
        if (!review) return [];

        return [formatUserReview({ ...review, outfitId: outfit.id }, "mongodb")];
    }

    async createReview(data: { score: number; text: string; outfitId: string; writtenBy: string }): Promise<Review[]> {
        const outfitId = this.parseNumericId(data.outfitId, "outfit id");
        const user = await User.findOne({ id: data.writtenBy }).lean().exec();
        if (!user) throw new Error(`User "${data.writtenBy}" not found`);

        const outfit = await Outfit.findOne({ id: outfitId }).lean().exec();
        if (!outfit) throw new Error(`Outfit "${data.outfitId}" not found`);

        const max = await Outfit.aggregate([
            { $unwind: "$reviews" },
            { $sort: { "reviews.id": -1 } },
            { $limit: 1 },
            { $project: { _id: 0, maxId: "$reviews.id" } },
        ]).exec();

        const nextId = Number(max[0]?.maxId ?? 0) + 1;

        await Outfit.updateOne(
            { id: outfitId },
            {
                $push: {
                    reviews: {
                        id: nextId,
                        score: data.score,
                        text: data.text,
                        writtenBy: user._id,
                        dateWritten: new Date(),
                    },
                },
            }
        ).exec();

        return this.getReviewById(String(nextId));
    }

    async updateReview(id: string, data: Partial<{ score: number; text: string }>): Promise<Review[]> {
        const reviewId = this.parseNumericId(id, "review id");
        const setOps: Record<string, unknown> = {};

        if (typeof data.score === "number") setOps["reviews.$.score"] = data.score;
        if (typeof data.text === "string") setOps["reviews.$.text"] = data.text;

        if (Object.keys(setOps).length === 0) return this.getReviewById(id);

        await Outfit.updateOne({ "reviews.id": reviewId }, { $set: setOps }).exec();
        return this.getReviewById(id);
    }

    async deleteReview(id: string): Promise<void> {
        const reviewId = this.parseNumericId(id, "review id");
        await Outfit.updateOne(
            { "reviews.id": reviewId },
            { $pull: { reviews: { id: reviewId } } }
        ).exec();
    }

    async getOutfitReviews(outfitId: string): Promise<Review[]> {
        const numericOutfitId = this.parseNumericId(outfitId, "outfit id");
        const outfit = await Outfit.findOne({ id: numericOutfitId })
            .populate("reviews.writtenBy")
            .lean()
            .exec();

        if (!outfit) return [];
        const reviews = outfit.reviews ?? [];
        return reviews.map((r: any) => formatUserReview({ ...r, outfitId: outfit.id }, "mongodb"));
    }

    async getUserReviews(userId: string): Promise<Review[]> {
        const user = await User.findOne({ id: userId }).lean().exec();
        if (!user) return [];

        const outfits = await Outfit.find({ "reviews.writtenBy": user._id })
            .populate("reviews.writtenBy")
            .lean()
            .exec();

        const all = this.flattenReviews(outfits);
        return all.filter((r) => r.writtenBy === userId);
    }

    private flattenReviews(outfits: any[]): Review[] {
        const results: Review[] = [];

        for (const outfit of outfits) {
            const reviews = outfit.reviews ?? [];
            for (const review of reviews) {
                results.push(
                    formatUserReview({ ...review, outfitId: outfit.id }, "mongodb")
                );
            }
        }

        return results;
    }

    private parseNumericId(value: string, fieldName: string): number {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return parsed;
    }
}

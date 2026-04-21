import { prisma } from "../../database/postgres/prisma-client.js";
import { formatUserReview } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IReviewRepository } from "../interfaces/IReviewRepository.js";
import type { Review } from "../../dtos/reviews/Review.dto.js";

const reviewInclude = {
    user: true,
};

export class PostgresReviewRepository implements IReviewRepository {
    async getAllReviews(): Promise<Review[]> {
        const reviews = await prisma.review.findMany({ include: reviewInclude });
        return reviews.map((r) => formatUserReview(r, "postgresql"));
    }

    async getReviewById(id: string): Promise<Review[]> {
        const numericId = this.parseBigIntId(id, "review id");
        const review = await prisma.review.findUnique({
            where: { id: numericId },
            include: reviewInclude,
        });
        if (!review) return [];
        return [formatUserReview(review, "postgresql")];
    }

    async createReview(data: { score: number; text: string; outfitId: string; writtenBy: string }): Promise<Review[]> {
        const review = await prisma.review.create({
            data: {
                score: data.score,
                text: data.text,
                outfitId: this.parseBigIntId(data.outfitId, "outfit id"),
                writtenBy: data.writtenBy,
            },
            include: reviewInclude,
        });
        return [formatUserReview(review, "postgresql")];
    }

    async updateReview(id: string, data: Partial<{ score: number; text: string }>): Promise<Review[]> {
        const patch: Partial<{ score: number; text: string }> = {};
        if (typeof data.score === "number") patch.score = data.score;
        if (typeof data.text === "string") patch.text = data.text;

        const review = await prisma.review.update({
            where: { id: this.parseBigIntId(id, "review id") },
            data: patch,
            include: reviewInclude,
        });
        return [formatUserReview(review, "postgresql")];
    }

    async deleteReview(id: string): Promise<void> {
        await prisma.review.delete({ where: { id: this.parseBigIntId(id, "review id") } });
    }

    async getOutfitReviews(outfitId: string): Promise<Review[]> {
        const reviews = await prisma.review.findMany({
            where: { outfitId: this.parseBigIntId(outfitId, "outfit id") },
            include: reviewInclude,
        });
        return reviews.map((r) => formatUserReview(r, "postgresql"));
    }

    async getUserReviews(userId: string): Promise<Review[]> {
        const reviews = await prisma.review.findMany({
            where: { writtenBy: userId },
            include: reviewInclude,
        });
        return reviews.map((r) => formatUserReview(r, "postgresql"));
    }

    private parseBigIntId(value: string, fieldName: string): bigint {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return BigInt(parsed);
    }
}

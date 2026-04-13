import { prisma } from "../../database/postgres/prisma-client.js";
import { formatUserReview } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IReviewRepository } from "../interfaces/IReviewRepository.js";
import type { Review } from "../../dtos/reviews/Review.dto.js";

export class PostgresReviewRepository implements IReviewRepository {
    async getAllReviews(): Promise<Review[]> {
        const reviews = await prisma.review.findMany();
        return reviews.map((r) => formatUserReview(r, "postgresql"));
    }

    async getReviewById(id: string): Promise<Review[]> {
        const numericId = BigInt(id);
        const review = await prisma.review.findUnique({ where: { id: numericId } });
        if (!review) return [];
        return [formatUserReview(review, "postgresql")];
    }

    async createReview(data: { score: number; text: string; outfitId: string; writtenBy: string }): Promise<Review[]> {
        const review = await prisma.review.create({
            data: {
                score: data.score,
                text: data.text,
                outfitId: BigInt(data.outfitId),
                writtenBy: data.writtenBy,
            },
        });
        return [formatUserReview(review, "postgresql")];
    }

    async updateReview(id: string, data: Partial<{ score: number; text: string }>): Promise<Review[]> {
        const patch: Partial<{ score: number; text: string }> = {};
        if (typeof data.score === "number") patch.score = data.score;
        if (typeof data.text === "string") patch.text = data.text;

        const review = await prisma.review.update({
            where: { id: BigInt(id) },
            data: patch,
        });
        return [formatUserReview(review, "postgresql")];
    }

    async deleteReview(id: string): Promise<void> {
        await prisma.review.delete({ where: { id: BigInt(id) } });
    }

    async getOutfitReviews(outfitId: string): Promise<Review[]> {
        const reviews = await prisma.review.findMany({
            where: { outfitId: BigInt(outfitId) },
        });
        return reviews.map((r) => formatUserReview(r, "postgresql"));
    }

    async getUserReviews(userId: string): Promise<Review[]> {
        const reviews = await prisma.review.findMany({
            where: { writtenBy: userId },
        });
        return reviews.map((r) => formatUserReview(r, "postgresql"));
    }
}

import type { Review } from "../../dtos/reviews/Review.dto.js";

export interface IReviewRepository {
    getAllReviews(): Promise<Review[]>;
    getReviewById(id: string): Promise<Review[]>;
    createReview(data: { score: number; text: string; outfitId: string; writtenBy: string }): Promise<Review[]>;
    updateReview(id: string, data: Partial<{ score: number; text: string }>): Promise<Review[]>;
    deleteReview(id: string): Promise<void>;

    getOutfitReviews(outfitId: string): Promise<Review[]>;
    getUserReviews(userId: string): Promise<Review[]>;
}

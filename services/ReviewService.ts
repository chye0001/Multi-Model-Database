import type { Review } from "../dtos/reviews/Review.dto.js";
import type { IReviewRepository } from "../repositories/interfaces/IReviewRepository.js";

export class ReviewService {
    constructor(private reviewRepository: IReviewRepository) {}

    async getAllReviews(): Promise<Review[]> {
        return this.reviewRepository.getAllReviews();
    }

    async getReviewById(id: string): Promise<Review[]> {
        return this.reviewRepository.getReviewById(id);
    }

    async createReview(data: { score: number; text: string; outfitId: string; writtenBy: string }): Promise<Review[]> {
        return this.reviewRepository.createReview(data);
    }

    async updateReview(id: string, data: Partial<{ score: number; text: string }>): Promise<Review[]> {
        return this.reviewRepository.updateReview(id, data);
    }

    async deleteReview(id: string): Promise<void> {
        return this.reviewRepository.deleteReview(id);
    }

    async getOutfitReviews(outfitId: string): Promise<Review[]> {
        return this.reviewRepository.getOutfitReviews(outfitId);
    }

    async getUserReviews(userId: string): Promise<Review[]> {
        return this.reviewRepository.getUserReviews(userId);
    }
}

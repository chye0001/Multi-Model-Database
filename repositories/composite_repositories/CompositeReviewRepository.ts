import { isRepositoriesEnabled } from "../../utils/repository_utils/ErrorHandling.js";
import type { Review } from "../../dtos/reviews/Review.dto.js";
import type { IReviewRepository } from "../interfaces/IReviewRepository.js";

export class CompositeReviewRepository implements IReviewRepository {
    constructor(private enabledRepos: IReviewRepository[]) {}

    async getAllReviews(): Promise<Review[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(this.enabledRepos.map((repo) => repo.getAllReviews()));
        return results.flat();
    }

    async getReviewById(id: string): Promise<Review[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(this.enabledRepos.map((repo) => repo.getReviewById(id)));
        return results.flat();
    }

    async createReview(data: { score: number; text: string; outfitId: string; writtenBy: string }): Promise<Review[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(this.enabledRepos.map((repo) => repo.createReview(data)));
        return results.flat();
    }

    async updateReview(id: string, data: Partial<{ score: number; text: string }>): Promise<Review[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(this.enabledRepos.map((repo) => repo.updateReview(id, data)));
        return results.flat();
    }

    async deleteReview(id: string): Promise<void> {
        isRepositoriesEnabled(this.enabledRepos);
        await Promise.all(this.enabledRepos.map((repo) => repo.deleteReview(id)));
    }

    async getOutfitReviews(outfitId: string): Promise<Review[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(this.enabledRepos.map((repo) => repo.getOutfitReviews(outfitId)));
        return results.flat();
    }

    async getUserReviews(userId: string): Promise<Review[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(this.enabledRepos.map((repo) => repo.getUserReviews(userId)));
        return results.flat();
    }
}

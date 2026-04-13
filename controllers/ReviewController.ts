import type { Request, Response } from "express";
import type { ReviewService } from "../services/ReviewService.ts";

export class ReviewController {
    constructor(private reviewService: ReviewService) {}

    getAllReviews = async (_req: Request, res: Response) => {
        try {
            const reviews = await this.reviewService.getAllReviews();
            res.send(reviews);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    getReviewById = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            if (typeof id !== "string") {
                return res.status(400).send({ error: "Review ID is required" });
            }

            const review = await this.reviewService.getReviewById(id);
            if (review.length === 0) return res.status(404).send({ error: "Review not found" });

            res.send(review);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    createReview = async (req: Request, res: Response) => {
        try {
            const { score, text, outfitId, writtenBy } = req.body;
            if (typeof score !== "number" || !text || !outfitId || !writtenBy) {
                return res.status(400).send({ error: "score, text, outfitId, writtenBy are required" });
            }

            const created = await this.reviewService.createReview({ score, text, outfitId, writtenBy });
            res.status(201).send(created);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to create review" });
        }
    };

    updateReview = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            if (typeof id !== "string") {
                return res.status(400).send({ error: "Review ID is required" });
            }

            const { score, text } = req.body;
            if (score === undefined && text === undefined) {
                return res.status(400).send({ error: "At least one of score or text is required" });
            }

            const updated = await this.reviewService.updateReview(id, { score, text });
            if (updated.length === 0) return res.status(404).send({ error: "Review not found" });

            res.send(updated);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to update review" });
        }
    };

    deleteReview = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            if (typeof id !== "string") {
                return res.status(400).send({ error: "Review ID is required" });
            }

            await this.reviewService.deleteReview(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to delete review" });
        }
    };

    getReviewsByOutfitId = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            if (typeof id !== "string") {
                return res.status(400).send({ error: "Outfit ID is required" });
            }

            const reviews = await this.reviewService.getOutfitReviews(id);
            res.send(reviews);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    getReviewsByUserId = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            if (typeof id !== "string") {
                return res.status(400).send({ error: "User ID is required" });
            }

            const reviews = await this.reviewService.getUserReviews(id);
            res.send(reviews);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };
}

import { Router } from "express";
import { reviewRepositoryFactory } from "../repositories/factories/ReviewRepositoryFactory.js";
import { ReviewService } from "../services/ReviewService.js";  // ✅ FIX: .js not .ts
import { ReviewController } from "../controllers/ReviewController.js";

const router = Router();

const reviewRepository = reviewRepositoryFactory();
const reviewService = new ReviewService(reviewRepository);
const reviewController = new ReviewController(reviewService);

router.get("/", reviewController.getAllReviews);
router.get("/:id", reviewController.getReviewById);
router.post("/", reviewController.createReview);
router.patch("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

export default router;

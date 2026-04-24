import { Router } from "express";
import { outfitRepositoryFactory } from "../repositories/factories/OutfitRepositoryFactory.js";
import { OutfitService } from "../services/OutfitService.js";
import { OutfitController } from "../controllers/OutfitController.js";
import { reviewRepositoryFactory } from "../repositories/factories/ReviewRepositoryFactory.js";
import { ReviewService } from "../services/ReviewService.js";
import { ReviewController } from "../controllers/ReviewController.js";

const router = Router();

const outfitRepository = outfitRepositoryFactory();
const outfitService = new OutfitService(outfitRepository);
const outfitController = new OutfitController(outfitService);

const reviewRepository = reviewRepositoryFactory();
const reviewService = new ReviewService(reviewRepository);
const reviewController = new ReviewController(reviewService);

router.get("/overview", outfitController.getOutfitOverview);
router.get("/", outfitController.getAllOutfits);
router.get("/:id", outfitController.getOutfitById);
router.post("/", outfitController.createOutfit);
router.patch("/:id", outfitController.updateOutfit);
router.delete("/:id", outfitController.deleteOutfit);

router.get("/:id/items", outfitController.getOutfitItems);
router.post("/:id/items", outfitController.addItemToOutfit);
router.delete("/:id/items/:itemId", outfitController.removeItemFromOutfit);
router.get("/:id/price", outfitController.getOutfitPrice);

router.get("/:id/reviews", reviewController.getReviewsByOutfitId);

export default router;

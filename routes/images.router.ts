import { Router } from "express";
import { imageRepositoryFactory } from "../repositories/factories/ImageRepositoryFactory.js";
import { ImageService } from "../services/ImageService.js";
import { ImageController } from "../controllers/ImageController.js";
import { isAuthenticated } from "../middleware/rbac.middleware.ts";

const router = Router();

const imageRepository = imageRepositoryFactory();
const imageService = new ImageService(imageRepository);
const imageController = new ImageController(imageService);

router.get("/:id", imageController.getImageById);
router.post("/", isAuthenticated, imageController.uploadImage);
router.delete("/:id", isAuthenticated, imageController.deleteImage);

export default router;

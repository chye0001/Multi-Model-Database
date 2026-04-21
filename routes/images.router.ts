import { Router } from "express";
import { imageRepositoryFactory } from "../repositories/factories/ImageRepositoryFactory.js";
import { ImageService } from "../services/ImageService.js";
import { ImageController } from "../controllers/ImageController.js";

const router = Router();

const imageRepository = imageRepositoryFactory();
const imageService = new ImageService(imageRepository);
const imageController = new ImageController(imageService);

router.get("/:id", imageController.getImageById);
router.post("/", imageController.uploadImage);
router.delete("/:id", imageController.deleteImage);

export default router;

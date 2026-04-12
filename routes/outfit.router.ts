import { Router } from "express";
import { outfitRepositoryFactory } from "../repositories/factories/OutfitRepositoryFactory.js";
import { OutfitService } from "../services/OutfitService.js";
import { OutfitController } from "../controllers/OutfitController.js";

const router = Router();

const outfitRepository = outfitRepositoryFactory();
const outfitService = new OutfitService(outfitRepository);
const outfitController = new OutfitController(outfitService);

router.get("/", outfitController.getAllOutfits);
router.get("/:id", outfitController.getOutfitById);
router.post("/", outfitController.createOutfit);
router.patch("/:id", outfitController.updateOutfit);
router.delete("/:id", outfitController.deleteOutfit);

router.get("/:id/items", outfitController.getOutfitItems);
router.post("/:id/items", outfitController.addItemToOutfit);
router.delete("/:id/items/:itemId", outfitController.removeItemFromOutfit);

export default router;

import { Router } from "express";
import { closetRepositoryFactory } from "../repositories/factories/ClosetRepositoryFactory.js";
import { ClosetService } from "../services/ClosetService.js";
import { ClosetController } from "../controllers/ClosetController.js";

const router = Router();

const closetRepository = closetRepositoryFactory();
const closetService = new ClosetService(closetRepository);
const closetController = new ClosetController(closetService);

router.get("/", closetController.getAllClosets);
router.get("/:id", closetController.getClosetById);
router.post("/", closetController.createCloset);
router.patch("/:id", closetController.updateCloset);
router.delete("/:id", closetController.deleteCloset);

router.get("/:id/items", closetController.getClosetItems);
router.post("/:id/items", closetController.addItemToCloset);
router.delete("/:id/items/:itemId", closetController.removeItemFromCloset);

router.get("/users/:userId/closets", closetController.getUserClosets);

router.get("/:id/shares",             closetController.getClosetShares);
router.post("/:id/shares",            closetController.shareCloset);
router.delete("/:id/shares/:userId",  closetController.unshareCloset);

export default router;

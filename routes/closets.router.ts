import { Router } from "express";
import { closetRepositoryFactory } from "../repositories/factories/ClosetRepositoryFactory.js";
import { ClosetService } from "../services/ClosetService.js";
import { ClosetController } from "../controllers/ClosetController.js";
import { isAuthenticated, isResourceOwner } from "../middleware/rbac.middleware.js";
import { 
  canViewCloset, 
  filterViewableClosets,
  canModifyClosetItems, 
  canDeleteCloset,
  canUpdateClosetSettings,
  canManageCloset 
} from "../middleware/closet-auth.middleware.js";

const router = Router();

const closetRepository = closetRepositoryFactory();
const closetService = new ClosetService(closetRepository);
const closetController = new ClosetController(closetService);

// Public routes with filtering for array of closets
router.get("/", filterViewableClosets, closetController.getAllClosets);

// Routes requiring authentication
router.post("/", isAuthenticated, closetController.createCloset);

// Closet access with specific permissions
router.get("/:id", canViewCloset, closetController.getClosetById);
router.patch("/:id", canUpdateClosetSettings, closetController.updateCloset);
router.delete("/:id", canDeleteCloset, closetController.deleteCloset);

// Closet items with closet permissions
// Shared users can view AND modify items, but not delete the closet or change settings
router.get("/:id/items", canViewCloset, closetController.getClosetItems);
router.post("/:id/items", canModifyClosetItems, closetController.addItemToCloset);
router.delete("/:id/items/:itemId", canModifyClosetItems, closetController.removeItemFromCloset);

// User's own closets
router.get("/users/:userId/closets", isAuthenticated, isResourceOwner, closetController.getUserClosets);

// Closet sharing - owner only (not shared users)
router.get("/:id/shares", canManageCloset, closetController.getClosetShares);
router.post("/:id/shares", canManageCloset, closetController.shareCloset);
router.delete("/:id/shares/:userId", canManageCloset, closetController.unshareCloset);

export default router;

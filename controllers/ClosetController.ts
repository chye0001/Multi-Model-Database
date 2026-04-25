import type { Request, Response } from "express";
import type { ClosetService } from "../services/ClosetService.js";

export class ClosetController {
    constructor(private closetService: ClosetService) {}

    getAllClosets = async (req: Request, res: Response) => {
        try {
            const closets = await this.closetService.getAllClosets();
            res.send(closets);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    getClosetById = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Closet ID is required" });

            const closets = await this.closetService.getClosetById(id);
            if (closets.length === 0) return res.status(404).send({ error: "Closet not found" });

            res.send(closets);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    createCloset = async (req: Request, res: Response) => {
        try {
            const { name, description, isPublic, userId } = req.body;
            if (!name || typeof isPublic !== "boolean" || !userId) {
                return res.status(400).send({ error: "name, isPublic, and userId are required" });
            }

            const created = await this.closetService.createCloset({
                name,
                description,
                isPublic,
                userId,
            });
            res.status(201).send(created);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to create closet" });
        }
    };

    updateCloset = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Closet ID is required" });

            const { name, description, isPublic } = req.body;
            if (name === undefined && description === undefined && isPublic === undefined) {
                return res.status(400).send({ error: "At least one of name, description, or isPublic is required" });
            }

            const updated = await this.closetService.updateCloset(id, { name, description, isPublic });
            if (updated.length === 0) return res.status(404).send({ error: "Closet not found" });

            res.send(updated);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to update closet" });
        }
    };

    deleteCloset = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Closet ID is required" });

            await this.closetService.deleteCloset(id);
            res.send({ message: "Closet deleted successfully" });
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to delete closet" });
        }
    };

    getClosetItems = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Closet ID is required" });

            const items = await this.closetService.getClosetItems(id);
            res.send(items);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    addItemToCloset = async (req: Request, res: Response) => {
        try {
            const closetId = req.params.id as string;
            const { itemId } = req.body;

            if (!closetId || !itemId) {
                return res.status(400).send({ error: "Closet ID and item ID are required" });
            }

            const updated = await this.closetService.addItemToCloset(closetId, itemId);
            res.send(updated);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to add item to closet" });
        }
    };

    removeItemFromCloset = async (req: Request, res: Response) => {
        try {
            const { id, itemId } = req.params;

            if (typeof id !== "string" || typeof itemId !== "string") {
                return res.status(400).send({ error: "Closet ID and item ID must be strings" });
            }

            const updated = await this.closetService.removeItemFromCloset(id, itemId);
            res.send(updated);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to remove item from closet" });
        }
    };


    getUserClosets = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId as string;
            if (!userId) return res.status(400).send({ error: "User ID is required" });

            const closets = await this.closetService.getUserClosets(userId);
            res.send(closets);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    getClosetShares = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Closet ID is required" });
            res.send(await this.closetService.getClosetShares(id));
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    shareCloset = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Closet ID is required" });
            const { userId } = req.body;
            if (!userId) return res.status(400).send({ error: "userId is required" });
            res.status(201).send(await this.closetService.shareCloset(id, userId));
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to share closet" });
        }
    };

    unshareCloset = async (req: Request, res: Response) => {
        try {
            const { id, userId } = req.params;
            if (!id || !userId) return res.status(400).send({ error: "Closet ID and userId are required" });
            await this.closetService.unshareCloset(id, userId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to unshare closet" });
        }
    };
}

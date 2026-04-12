import type { Request, Response } from "express";
import type { OutfitService } from "../services/OutfitService.js";

export class OutfitController {
    constructor(private outfitService: OutfitService) {}

    getAllOutfits = async (req: Request, res: Response) => {
        try {
            const style = req.query.style as string | undefined;
            const outfits = await this.outfitService.getAllOutfits(style);
            res.send(outfits);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    getOutfitById = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Outfit ID is required" });

            const outfits = await this.outfitService.getOutfitById(id);
            if (outfits.length === 0) return res.status(404).send({ error: "Outfit not found" });

            res.send(outfits);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    createOutfit = async (req: Request, res: Response) => {
        try {
            const { name, style, createdBy } = req.body;
            if (!name || !style || !createdBy) {
                return res.status(400).send({ error: "name, style, and createdBy are required" });
            }

            const created = await this.outfitService.createOutfit({ name, style, createdBy });
            res.status(201).send(created);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to create outfit" });
        }
    };

    updateOutfit = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Outfit ID is required" });

            const { name, style } = req.body;
            if (name === undefined && style === undefined) {
                return res.status(400).send({ error: "At least one of name or style is required" });
            }

            const updated = await this.outfitService.updateOutfit(id, { name, style });
            if (updated.length === 0) return res.status(404).send({ error: "Outfit not found" });

            res.send(updated);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to update outfit" });
        }
    };

    deleteOutfit = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Outfit ID is required" });

            await this.outfitService.deleteOutfit(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to delete outfit" });
        }
    };

    getOutfitItems = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).send({ error: "Outfit ID is required" });

            const items = await this.outfitService.getOutfitItems(id);
            res.send(items);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    addItemToOutfit = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const { itemId } = req.body;

            if (!id) return res.status(400).send({ error: "Outfit ID is required" });
            if (!itemId) return res.status(400).send({ error: "itemId is required" });

            const updated = await this.outfitService.addItemToOutfit(id, String(itemId));
            if (updated.length === 0) return res.status(404).send({ error: "Outfit not found" });

            res.send(updated);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to add item to outfit" });
        }
    };

    removeItemFromOutfit = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const itemId = req.params.itemId as string;

            if (!id) return res.status(400).send({ error: "Outfit ID is required" });
            if (!itemId) return res.status(400).send({ error: "itemId is required" });

            const updated = await this.outfitService.removeItemFromOutfit(id, itemId);
            if (updated.length === 0) return res.status(404).send({ error: "Outfit not found" });

            res.send(updated);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to remove item from outfit" });
        }
    };

    getUserOutfits = async (req: Request, res: Response) => {
        try {
            const userId = req.params.id as string;
            if (!userId) return res.status(400).send({ error: "User ID is required" });

            const outfits = await this.outfitService.getAllOutfitsByUserId(userId);
            res.send(outfits);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };
}

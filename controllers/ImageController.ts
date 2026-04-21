import type { Request, Response } from "express";
import type { ImageService } from "../services/ImageService.js";

export class ImageController {
    constructor(private imageService: ImageService) {}

    getImageById = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            if (typeof id !== "string") {
                return res.status(400).send({ error: "Image ID is required" });
            }

            const image = await this.imageService.getImageById(id);
            if (image.length === 0) return res.status(404).send({ error: "Image not found" });

            res.send(image);
        } catch (error: any) {
            res.status(500).send({ error: error?.message ?? "Internal Server Error" });
        }
    };

    uploadImage = async (req: Request, res: Response) => {
        try {
            const { url, itemId } = req.body;
            if (!url || !itemId) {
                return res.status(400).send({ error: "url and itemId are required" });
            }

            const created = await this.imageService.uploadImage({ url, itemId: String(itemId) });
            res.status(201).send(created);
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to upload image" });
        }
    };

    deleteImage = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            if (typeof id !== "string") {
                return res.status(400).send({ error: "Image ID is required" });
            }

            await this.imageService.deleteImage(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).send({ error: error?.message ?? "Failed to delete image" });
        }
    };
}

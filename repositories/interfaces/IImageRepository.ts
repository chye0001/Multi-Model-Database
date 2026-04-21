import type { Image } from "../../dtos/images/Image.dto.js";

export interface IImageRepository {
    getImageById(id: string): Promise<Image[]>;
    uploadImage(data: { url: string; itemId: string }): Promise<Image[]>;
    deleteImage(id: string): Promise<void>;
}

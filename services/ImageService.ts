import type { Image } from "../dtos/images/Image.dto.js";
import type { IImageRepository } from "../repositories/interfaces/IImageRepository.js";

export class ImageService {
    constructor(private imageRepository: IImageRepository) {}

    async getImageById(id: string): Promise<Image[]> {
        return this.imageRepository.getImageById(id);
    }

    async uploadImage(data: { url: string; itemId: string }): Promise<Image[]> {
        return this.imageRepository.uploadImage(data);
    }

    async deleteImage(id: string): Promise<void> {
        return this.imageRepository.deleteImage(id);
    }
}

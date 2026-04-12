import type { IOutfitRepository } from "../repositories/interfaces/IOutfitRepository.js";
import type { Outfit } from "../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../dtos/items/Item.dto.js";

export class OutfitService {
    constructor(private outfitRepository: IOutfitRepository) {}

    async getAllOutfits(style?: string): Promise<Outfit[]> {
        return await this.outfitRepository.getAllOutfits(style);
    }

    async getOutfitById(id: string): Promise<Outfit[]> {
        return await this.outfitRepository.getOutfitById(id);
    }

    async createOutfit(data: { name: string; style: string; createdBy: string }): Promise<Outfit[]> {
        return await this.outfitRepository.createOutfit(data);
    }

    async updateOutfit(id: string, data: Partial<{ name: string; style: string }>): Promise<Outfit[]> {
        return await this.outfitRepository.updateOutfit(id, data);
    }

    async deleteOutfit(id: string): Promise<void> {
        await this.outfitRepository.deleteOutfit(id);
    }

    async getOutfitItems(id: string): Promise<ClothingItem[]> {
        return await this.outfitRepository.getOutfitItems(id);
    }

    async addItemToOutfit(id: string, itemId: string): Promise<Outfit[]> {
        return await this.outfitRepository.addItemToOutfit(id, itemId);
    }

    async removeItemFromOutfit(id: string, itemId: string): Promise<Outfit[]> {
        return await this.outfitRepository.removeItemFromOutfit(id, itemId);
    }

    async getAllOutfitsByUserId(userId: string): Promise<Outfit[]> {
        return await this.outfitRepository.getAllOutfitsByUserId(userId);
    }
}

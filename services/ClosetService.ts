import type { IClosetRepository } from "../repositories/interfaces/IClosetRepository.js";
import type { Closet } from "../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../dtos/items/Item.dto.js";

export class ClosetService {
    constructor(private closetRepository: IClosetRepository) {}

    async getAllClosets(): Promise<Closet[]> {
        return await this.closetRepository.getAllClosets();
    }

    async getClosetById(id: string): Promise<Closet[]> {
        return await this.closetRepository.getClosetById(id);
    }

    async createCloset(data: { name: string; description?: string; isPublic: boolean; userId: string }): Promise<Closet[]> {
        return await this.closetRepository.createCloset(data);
    }

    async updateCloset(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>): Promise<Closet[]> {
        return await this.closetRepository.updateCloset(id, data);
    }

    async deleteCloset(id: string): Promise<void> {
        await this.closetRepository.deleteCloset(id);
    }

    async getClosetItems(id: string): Promise<ClothingItem[]> {
        return await this.closetRepository.getClosetItems(id);
    }

    async addItemToCloset(closetId: string, itemId: string): Promise<Closet[]> {
        return await this.closetRepository.addItemToCloset(closetId, itemId);
    }

    async removeItemFromCloset(closetId: string, itemId: string): Promise<Closet[]> {
        return await this.closetRepository.removeItemFromCloset(closetId, itemId);
    }

    async getUserClosets(userId: string): Promise<Closet[]> {
        return await this.closetRepository.getUserClosets(userId);
    }
}

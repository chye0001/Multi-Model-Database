import type { IClosetRepository } from "../interfaces/IClosetRepository.js";
import type { Closet } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";

export class CompositeClosetRepository implements IClosetRepository {
    constructor(private repositories: IClosetRepository[]) {}

    async getAllClosets(): Promise<Closet[]> {
        const results = await Promise.all(
            this.repositories.map((repo) => repo.getAllClosets().catch(() => []))
        );
        return results.flat();
    }

    async getClosetById(id: string): Promise<Closet[]> {
        const results = await Promise.all(
            this.repositories.map((repo) => repo.getClosetById(id).catch(() => []))
        );
        return results.flat();
    }

    async createCloset(data: { name: string; description?: string; isPublic: boolean; userId: string }): Promise<Closet[]> {
        try {
            const results = await Promise.all(
            this.repositories.map((repo) => repo.createCloset(data))
        );
        return results.flat();
    }catch (error) {
        throw error;
    }
    }

    async updateCloset(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>): Promise<Closet[]> {
        const results = await Promise.all(
            this.repositories.map((repo) => repo.updateCloset(id, data).catch(() => []))
        );
        return results.flat();
    }

    async deleteCloset(id: string): Promise<void> {
        await Promise.all(
            this.repositories.map((repo) => repo.deleteCloset(id).catch(() => {}))
        );
    }

    async getClosetItems(id: string): Promise<ClothingItem[]> {
        const results = await Promise.all(
            this.repositories.map((repo) => repo.getClosetItems(id).catch(() => []))
        );
        return results.flat();
    }

    async addItemToCloset(closetId: string, itemId: string): Promise<Closet[]> {
        const results = await Promise.all(
            this.repositories.map((repo) => repo.addItemToCloset(closetId, itemId).catch(() => []))
        );
        return results.flat();
    }

    async removeItemFromCloset(closetId: string, itemId: string): Promise<Closet[]> {
        const results = await Promise.all(
            this.repositories.map((repo) => repo.removeItemFromCloset(closetId, itemId).catch(() => []))
        );
        return results.flat();
    }

    async getUserClosets(userId: string): Promise<Closet[]> {
        const results = await Promise.all(
            this.repositories.map((repo) => repo.getUserClosets(userId).catch(() => []))
        );
        return results.flat();
    }
}

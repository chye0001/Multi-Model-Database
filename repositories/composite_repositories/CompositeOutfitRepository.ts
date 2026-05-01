import { isRepositoriesEnabled } from "../../utils/repository_utils/ErrorHandling.js";
import type { IOutfitRepository } from "../interfaces/IOutfitRepository.js";
import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { OutfitOverview } from "../../dtos/outfits/OutfitOverview.dto.js";

export class CompositeOutfitRepository implements IOutfitRepository {
    constructor(private enabledRepos: IOutfitRepository[]) {}

    async getAllOutfits(style?: string): Promise<Outfit[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.getAllOutfits(style)));
            return results.flat();
        } catch (error) {
            console.error("Error fetching outfits from repositories:", error);
            throw error;
        }
    }

    async getOutfitById(id: string): Promise<Outfit[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.getOutfitById(id)));
            return results.flat();
        } catch (error) {
            console.error(`Error fetching outfit ${id} from repositories:`, error);
            throw error;
        }
    }

    async createOutfit(data: { name: string; style: string; createdBy: string }): Promise<Outfit[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.createOutfit(data)));
            return results.flat();
        } catch (error) {
            console.error("Error creating outfit in repositories:", error);
            throw error;
        }
    }

    async updateOutfit(id: string, data: Partial<{ name: string; style: string }>): Promise<Outfit[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.updateOutfit(id, data)));
            return results.flat();
        } catch (error) {
            console.error(`Error updating outfit ${id} in repositories:`, error);
            throw error;
        }
    }

    async deleteOutfit(id: string): Promise<void> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            await Promise.all(this.enabledRepos.map((repo) => repo.deleteOutfit(id)));
        } catch (error) {
            console.error(`Error deleting outfit ${id} from repositories:`, error);
            throw error;
        }
    }

    async getOutfitItems(id: string): Promise<ClothingItem[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.getOutfitItems(id)));
            return results.flat();
        } catch (error) {
            console.error(`Error fetching items for outfit ${id} from repositories:`, error);
            throw error;
        }
    }

    async addItemToOutfit(id: string, itemId: string): Promise<Outfit[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.addItemToOutfit(id, itemId)));
            return results.flat();
        } catch (error) {
            console.error(`Error adding item ${itemId} to outfit ${id} in repositories:`, error);
            throw error;
        }
    }

    async removeItemFromOutfit(id: string, itemId: string): Promise<Outfit[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.removeItemFromOutfit(id, itemId)));
            return results.flat();
        } catch (error) {
            console.error(`Error removing item ${itemId} from outfit ${id} in repositories:`, error);
            throw error;
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<Outfit[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.getAllOutfitsByUserId(userId)));
            return results.flat();
        } catch (error) {
            console.error(`Error fetching outfits for user ${userId} from repositories:`, error);
            throw error;
        }
    }
    async getOutfitOverview(style?: string): Promise<OutfitOverview[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(
            this.enabledRepos.map((repo) => repo.getOutfitOverview(style))
        );
        return results.flat();
    }

    async getOutfitPrice(id: string): Promise<number> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.getOutfitPrice(id)));
            return results.find((price) => price > 0) ?? 0;
        } catch (error) {
            console.error(`Error calculating outfit price ${id} from repositories:`, error);
            throw error;
        }
    }
  
    async updateAiSummary(id: string, aiSummary: string): Promise<Outfit[]> {
        try {
            isRepositoriesEnabled(this.enabledRepos);
            const results = await Promise.all(this.enabledRepos.map((repo) => repo.updateAiSummary(id, aiSummary)));
            return results.flat();
        } catch (error) {
            console.error(`Error updating AI summary for outfit ${id} in repositories:`, error);
            throw error;
        }
    }

}

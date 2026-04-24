import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { OutfitOverview } from "../../dtos/outfits/OutfitOverview.dto.js";

export interface IOutfitRepository {
    getAllOutfits(style?: string): Promise<Outfit[]>;
    getOutfitById(id: string): Promise<Outfit[]>;
    createOutfit(data: { name: string; style: string; createdBy: string }): Promise<Outfit[]>;
    updateOutfit(id: string, data: Partial<{ name: string; style: string }>): Promise<Outfit[]>;
    deleteOutfit(id: string): Promise<void>;

    getOutfitItems(id: string): Promise<ClothingItem[]>;
    addItemToOutfit(id: string, itemId: string): Promise<Outfit[]>;
    removeItemFromOutfit(id: string, itemId: string): Promise<Outfit[]>;

    getAllOutfitsByUserId(userId: string): Promise<Outfit[]>;
    getOutfitOverview(style?: string): Promise<OutfitOverview[]>;
    getOutfitPrice(id: string): Promise<number>;

}

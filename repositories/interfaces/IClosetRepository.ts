import type { Closet } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { EmbeddedUser } from "../../dtos/users/User.dto.js";

export interface IClosetRepository {
    getAllClosets(): Promise<Closet[]>;
    getClosetById(id: string): Promise<Closet[]>;
    createCloset(data: { name: string; description?: string; isPublic: boolean; userId: string }): Promise<Closet[]>;
    updateCloset(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>): Promise<Closet[]>;
    deleteCloset(id: string): Promise<void>;

    getClosetItems(id: string): Promise<ClothingItem[]>;
    addItemToCloset(closetId: string, itemId: string): Promise<Closet[]>;
    removeItemFromCloset(closetId: string, itemId: string): Promise<Closet[]>;

    getUserClosets(userId: string): Promise<Closet[]>;

    getClosetShares(closetId: string): Promise<EmbeddedUser[]>;
    shareCloset(closetId: string, userId: string): Promise<EmbeddedUser[]>;
    unshareCloset(closetId: string, userId: string): Promise<void>;
}

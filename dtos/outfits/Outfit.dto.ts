import type { ClothingItem } from "../items/Item.dto.js";
import type { Review } from "../reviews/Review.dto.js";
import type { EmbeddedUser } from "../users/User.dto.ts";



export type Outfit = {
  id: number;
  name: string;
  style: string;
  aiSummary?: string;
  dateAdded: Date;
  createdBy: EmbeddedUser;   // was string (userId), now a user snapshot
  items: ClothingItem[];
  reviews: Review[];
  fromDatabase?: string;
}

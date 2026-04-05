import type { ClothingItem } from "../items/Item.dto.js";
import type { Review } from "../reviews/Review.dto.js";



export type Outfit = {
  id: number;
  name: string;
  style: string;
  datedAdded: Date;
  createdBy: string; // userId
  items: ClothingItem[];
  reviews: Review[];
  fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
}

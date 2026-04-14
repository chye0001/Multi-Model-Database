import type { Brand } from "../brands/Brand.dto.js";
import type { EmbeddedCategory } from "../categories/Category.dto.ts";

export type ClothingItem = {
  id: number;
  name: string;
  price?: number | null;
  category: EmbeddedCategory;
  brands: Brand[];
  images: ItemImage[];
  fromDatabase?: string;
}

export type ItemImage = {
  id: number;
  url: string;
}
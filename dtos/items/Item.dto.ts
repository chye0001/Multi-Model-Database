import type { Brand } from "../brands/Brand.dto.js";



export type ClothingItem = {
  id: number;
  name: string;
  price?: number | null;
  category: string;
  brand: Brand;
  images: ItemImage[];
}

export type ItemImage = {
  id: number;
  url: string;
}